/*
 * Backbone.Async v1.2.0
 * Copyright 2015 Emmanuel Antico
 * This library is distributed under the terms of the MIT license.
 */
(function(global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'underscore'], function(Backbone, _) {
            return factory(global, Backbone, _);
        });
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(global, require('backbone'), require('underscore'));
    } else {
        factory(global, global.Backbone, global._);
    }
}(this, function(global, Backbone, _) {
    var overrideCallback = function(callback, resolver, cbOptions) {
        return function(model, response, options) {
            if (callback) {
                callback.apply(model, arguments);
            }

            var data = {
                response: response,
                options: options
            };

            //populate data object correctly and invoke resolver
            data[cbOptions.collection ? 'collection' : 'model'] = model;
            resolver(data);

            //triggers an after:method event
            if (typeof(options.silent) === 'undefined' || !options.silent) {
                model.trigger('after:' + cbOptions.method, model, response, options, cbOptions._success);
            }
        };
    };

    var parseArgs = function(method, key, value, _options) {
        var attrs, options;

        if (method === 'save') {
            if (key === null || typeof key === 'object') {
                attrs = key;
                options = value;
            } else if (key) {
                (attrs = {})[key] = value;
                options = _options;
            }
        } else {
            options = key;
        }

        options = options ? _.extend({}, options) : {};
        return { attrs: attrs, options: options };
    };

    var wrapMethod = function(proto) {
        return function(agg, method) {
            agg[method] = function(key, value, _options) {
                var model = this,
                    parsed = parseArgs(method, key, value, _options),
                    options = parsed.options,
                    attrs = parsed.attrs,
                    success = options.success,
                    error = options.error,
                    cbOptions = {method: method, collection: proto === Backbone.Collection.prototype};

                return new Promise(function(resolve, reject) {
                    options.success = overrideCallback(success, resolve, _.extend({_success: true}, cbOptions));
                    options.error = overrideCallback(error, reject, _.extend({_success: false}, cbOptions));

                    if (cbOptions.collection) {
                        //if not silent, trigger a before event
                        if (typeof(options.silent) === 'undefined' || !options.silent) {
                            model.trigger('before:' + method, model, options);
                        }

                        proto[method].call(model, options);
                    }
                    else {
                        //if not silent, trigger a before event
                        if (typeof(options.silent) === 'undefined' || !options.silent) {
                            if (method === 'save') {
                                model.trigger('before:save', model, attrs, options);
                            } else {
                                model.trigger('before:' + method, model, options);
                            }
                        }

                        proto[method].apply(model, method === 'save' ? [attrs, options] : [options]);
                    }
                });
            };

            return agg;
        };
    };

    var buildPrototype = function(Base, methods) {
        return methods.reduce(wrapMethod(Base.prototype), {});
    };

    //create namespace
    var Async = Backbone.Async = Backbone.Async || {};
    Async.VERSION = '1.2.0';

    //extend Model and Collection prototypes
    Async.Model = Backbone.Model.extend(
        buildPrototype(Backbone.Model, ['fetch', 'save', 'destroy'])
    );

    Async.Collection = Backbone.Collection.extend(
        buildPrototype(Backbone.Collection, ['fetch', 'create'])
    );

    //Storage class
    var Storage = Async.Storage = function(options) {
        if (options) {
            if (options.Collection) {
                this.Collection = options.Collection;
            }
            
            if (options.Model) {
                this.Model = options.Model;
            } else if (options.Collection && options.Collection.model) {
                this.Model = options.Collection.model;
            }
        }
        
        this.loaded = false;
        this.initialize.apply(this, arguments);
    };

    //include Backbone.Events in Storage class prototype
    _.extend(Storage.prototype, Backbone.Events, {
        initialize: function(){},

        //fetchs a collection
        fetchAll: function(options) {
            if (this.loaded) {
                return Promise.resolve({
                    collection: this.collection,
                    options: options
                });
            }

            this._initCollection();
            options = options || {};
            var self = this,
                mustTrigger = (typeof(options.silent) === 'undefined') || !options.silent;

            return new Promise(function(resolve, reject) {
                if (mustTrigger) {
                    self.trigger('before:fetchAll', self.collection, options);
                }

                self.collection.fetch(options)
                .then(function(data) {
                    if (mustTrigger) {
                        self.trigger('after:fetchAll', data.collection, data.response, data.options, true);
                    }

                    self.loaded = true;
                    resolve(data);
                })
                .catch(function(data) {
                    if (mustTrigger) {
                        if (_.isError(data)) {
                            self.trigger('after:fetchAll', data, undefined, undefined, false);
                        } else {
                            self.trigger('after:fetchAll', data.collection, data.response, data.options, false);
                        }
                    }

                    reject(data);
                });
            });
        },

        //fetchs a model
        fetch: function(id, options) {
            if (this.collection) {
                var stored = this.collection.get(id);
                if (stored) {
                    return Promise.resolve({
                        model: stored,
                        options: options
                    });
                }
            }

            if (!this.Model) {
                throw new Error('No Model class defined');
            }

            this._initCollection();
            options = options || {};
            var self = this,
                mustTrigger = (typeof(options.silent) === 'undefined') || !options.silent;

            return new Promise(function(resolve, reject) {
                var model = new self.Model();
                model.set(self.Model.idAttribute || 'id', id);

                if (mustTrigger) {
                    self.trigger('before:fetch', model, options);
                }

                model.fetch(options)
                .then(function(data) {
                    if (mustTrigger) {
                        self.trigger('after:fetch', data.model, data.response, data.options, true);
                    }

                    self.collection.push(model);
                    self.listenTo(model, 'after:destroy', function(model, options, success) {
                        if (success) {
                            self.collection.remove(model, _.extend({silent: true}, options));
                        }
                    });
                    resolve(data);
                })
                .catch(function(data) {
                    if (mustTrigger) {
                        if (_.isError(data)) {
                            self.trigger('after:fetch', data, undefined, undefined, false);
                        } else {
                            self.trigger('after:fetch', data.model, data.response, data.options, false);
                        }
                    }

                    reject(data);
                });
            });
        },

        //stores a model
        store: function(model) {
            this._initCollection();
            this.collection.push(model);
            this.listenTo(model, 'after:destroy', function(model, response, options, success) {
                if (success) {
                    this.collection.remove(model, _.extend({silent: true}, options));
                }
            });
        },

        //obtains a model by id
        get: function(id) {
            this._initCollection();
            return this.collection.get(id);
        },

        //wrapper for Collection.create
        create: function() {
            this._initCollection();
            return this.collection.create.apply(this.collection, arguments);
        },

        //initializes a collection instance
        _initCollection: function() {
            if (!this.Collection) {
                throw new Error('No Collection class defined');
            }

            if (!this.collection) {
                this.collection = new this.Collection();
            }
        }
    });

    //make Storage class extendable
    Storage.extend = Backbone.Model.extend;

    return Async;
}));
