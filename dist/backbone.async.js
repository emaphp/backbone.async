//
// Backbone.Async v1.3.0
// Copyright 2015 Emmanuel Antico
// This library is distributed under the terms of the MIT license.
//
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
    
    //
    // Helpers
    // -------

    var overrideCallback = function(callback, resolver, callbackOpts) {
        return function(model, response, options) {
            if (callback) {
                callback.apply(model, arguments);
            }

            var data = {
                response: response,
                options: options
            };

            // Populate data object and invoke resolver
            data[callbackOpts.collection ? 'collection' : 'model'] = model;
            resolver(data);

            // Triggers an after:method event
            if (!options.silent) {
                model.trigger('after:' + callbackOpts.method, model, response, options, callbackOpts.success);
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
                var model = this;
                var parsed = parseArgs(method, key, value, _options);
                var options = parsed.options;
                var attrs = parsed.attrs;
                var success = options.success;
                var error = options.error;
                
                var buildOptions = function (success) {
                    return {
                        method: method,
                        collection: proto === Backbone.Collection.prototype,
                        success: success
                    };
                };

                return new Promise(function(resolve, reject) {
                    options.success = overrideCallback(success, resolve, buildOptions(true));
                    options.error = overrideCallback(error, reject, buildOptions(false));

                    if (proto === Backbone.Collection.prototype) {
                        // If not silent, trigger a before event
                        if (!options.silent) {
                            model.trigger('before:' + method, model, options);
                        }

                        proto[method].call(model, options);
                    }
                    else {
                        // If not silent, trigger a before event
                        if (!options.silent) {
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

    var buildPrototype = function(proto, methods) {
        return methods.reduce(wrapMethod(proto), {});
    };

    //
    // Namespace
    // ---------

    var Async = Backbone.Async = Backbone.Async || {};
    Async.VERSION = '1.3.0';
    Async.extend = Backbone.Model.extend;

    //
    // Async.Model
    // -----------

    Async.Model = Backbone.Model.extend(
        buildPrototype(Backbone.Model.prototype, ['fetch', 'save', 'destroy'])
    );

    //
    // Async.Collection
    // ----------------

    Async.Collection = Backbone.Collection.extend(
        buildPrototype(Backbone.Collection.prototype, ['fetch'])
    );

    _.extend(Async.Collection.prototype, {
        create: function(model, options) {
            options = options ? _.clone(options) : {};

            if (!options.silent) {
                this.trigger('before:create', this, model, options);
            }
            
            if (!(model = this._prepareModel(model, options))) {
                return false;
            }

            if (!options.wait) {
                this.add(model, options);
            }

            var collection = this;
            var success = options.success;
            var error = options.error;

            options.success = function(model, response) {
                if (options.wait) {
                    collection.add(model, options);
                }

                if (success) {
                    success(model, response, options);
                }

                if (!options.silent) {
                    collection.trigger('after:create', model, response, options, true);
                }
            };

            options.error = function (model, response) {
                if (error) {
                    error(model, response, options);
                }

                if (!options.silent) {
                    collection.trigger('after:create', model, response, options, false);
                }
            };

            return model.save(null, options);
        },

        update: function (model, options) {
            options = options ? _.clone(options) : {};

            if (!options.silent) {
                this.trigger('before:update', model, options);
            }

            var collection = this;
            var error = options.error;
            var success = options.success;
            var complete = options.complete;
            var afterArguments = ['after:update'];

            options.success = function (model, response, options) {
                collection.add(model, _.extend({merge: true}, options));

                if (success) {
                    success(model, response, options);
                }

                afterArguments = afterArguments.concat(_.toArray(arguments), [true]);
            };

            options.error = function (model, response, options) {
                if (error) {
                    error(model, response, options);
                }

                afterArguments = afterArguments.concat(_.toArray(arguments), [false]);
            };

            options.complete = function (response, status) {
                var options = afterArguments[3];

                if (!options.silent) {
                    collection.trigger.apply(collection, afterArguments);
                }

                if (complete) {
                    complete(response, status);
                }
            };

            return model.save(null, options);
        },

        delete: function (model, options) {
            options = options ? _.clone(options) : {};

            if (!options.silent) {
                this.trigger('before:delete', model, options);
            }

            var collection = this;
            var error = options.error;
            var success = options.success;
            var complete = options.complete;
            var afterArguments = ['after:delete'];
            
            options.success = function (model, response, options) {
                if (success) {
                    success(model, response, options);
                }

                afterArguments = afterArguments.concat(_.toArray(arguments), [true]);
            };

            options.error = function (model, response, options) {
                if (error) {
                    error(model, response, options);
                }

                afterArguments = afterArguments.concat(_.toArray(arguments), [false]);
            };

            options.complete = function (response, status) {
                var options = afterArguments[3];

                if (!options.silent) {
                    collection.trigger.apply(collection, afterArguments);
                }

                if (complete) {
                    complete(response, status);    
                }
            };

            return model.destroy(options);
        }
    });

    //
    // Async.Storage
    // -------------

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

    // Include Backbone.Events in Storage class prototype
    _.extend(Storage.prototype, Backbone.Events, {
        initialize: function(){},

        // Fetchs a collection
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
                mustTrigger = !options.silent;

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

        // Fetchs a model
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
                mustTrigger = !options.silent;

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

                    self.collection.add(model);
                    self.listenToOnce(model, 'after:destroy', function(model, options, success) {
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

        // Stores a model
        store: function(model) {
            this._initCollection();
            this.collection.push(model);
            this.listenToOnce(model, 'after:destroy', function(model, response, options, success) {
                if (success) {
                    this.collection.remove(model, _.extend({silent: true}, options));
                }
            });
        },

        // Obtains a model by id
        get: function(id) {
            this._initCollection();
            return this.collection.get(id);
        },

        // Wrapper for Async.Collection.create
        create: function(attributes, options) {
            if (!this.Model) {
                throw new Error('No Model class defined');
            }

            this._initCollection();
            options = options || {};
            var self = this,
                mustTrigger = !options.silent;

            return new Promise(function(resolve, reject) {
                if (mustTrigger) {
                    self.trigger('before:create', self.collection, attributes, options);
                }

                self.collection.create(attributes, options)
                .then(function(data) {
                    if (mustTrigger) {
                        self.trigger('after:create', data.model, data.response, data.options, true);
                    }

                    self.listenToOnce(data.model, 'after:destroy', function(model, options, success) {
                        if (success) {
                            self.collection.remove(model, _.extend({silent: true}, options));
                        }
                    });
                    resolve(data);
                })
                .catch(function(data) {
                    if (mustTrigger) {
                        if (_.isError(data)) {
                            self.trigger('after:create', data, undefined, undefined, false);
                        } else {
                            self.trigger('after:create', data.model, data.response, data.options, false);
                        }
                    }
                    reject(data);
                });
            });
        },

        // Initializes the internal collection instance
        _initCollection: function() {
            if (!this.Collection) {
                throw new Error('No Collection class defined');
            }

            if (!this.collection) {
                this.collection = new this.Collection();
            }
        }
    });

    // Make Storage class extendable
    Storage.extend = Backbone.Model.extend;

    return Async;
}));
