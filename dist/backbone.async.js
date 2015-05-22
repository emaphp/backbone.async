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
    // Async.Store
    // -----------

    var Store = Async.Store = function(options) {
        this.options = options ? _.clone(options) : {};
        this.loaded = false;

        if (!this.modelClass) {
            throw new Error('No Model class defined');
        }

        if (!this.collectionClass) {
            throw new Error('No Collection class defined');
        }

        this.collection = new this.collectionClass();
        this.collection.model = this.modelClass;
        this.initialize.apply(this, arguments);
    };

    // Returns an options object that overrides success event handler
    var overrideSuccessCallback = function (store, options, onSuccess) {
        var success = options.success;

        return _.extend(options, {
            success: function (collection, response, options) {
                if (onSuccess) {
                    onSuccess.apply(store, arguments);
                }

                if (success) {
                    success(collection, response, options);
                }
            }
        });
    };

    // Include Backbone.Events in Store class prototype
    _.extend(Store.prototype, Backbone.Events, {
        initialize: function(){},

        // Fetch a collection
        fetchAll: function(options) {
            options = options || {};
            force = !!options.force;

            // Return a resolved promise if already loaded
            if (this.loaded && !force) {
                return Promise.resolve({
                    collection: this.collection,
                    options: options
                });
            }

            var onSuccess = function() {
                this.loaded = true;
            };

            return this.collection.fetch(overrideSuccessCallback(this, options, onSuccess));
        },

        // Fetchs a model by ID
        fetchById: function(id, options) {
            options = options || {};

            var model = this.collection.get(id);
            if (model) {
                return Promise.resolve({
                    model: model,
                    options: options
                });
            }

            // Create model instance
            var model = new this.modelClass();
            model.set(this.modelClass.idAttribute || 'id', id);

            var onSuccess = function() {
                this.add(model);
            };

            return model.fetch(overrideSuccessCallback(this, options, onSuccess));
        },

        length: function () {
            if (this.collection) {
                return this.collection.length;
            }
        }
    });

    // Add proxy methods
    var methods = ['reset', 'get', 'add', 'remove',
        'shift', 'pop', 'push', 'unshift',
        'where', 'findWhere', 'toJSON', 'sort',
        'create', 'update', 'delete'];

    _.each(methods, function (method) {
        Store.prototype[method] = function () {
            return this.collection[method].apply(this.collection, arguments);
        };
    });

    // Make Store class extendable
    Store.extend = Backbone.Model.extend;

    return Async;
}));
