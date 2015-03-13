/*
 * Backbone.Async v0.3.0
 * Copyright 2015 Emmanuel Antico
 * This library is distributed under the terms of the MIT license.
 */
(function(global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'underscore'], function(Backbone, _) {
            return factory(global, Backbone, _);
        });
    }
    else if (typeof exports !== 'undefined')
        module.exports = factory(global, require('backbone'), require('underscore'));
    else
        factory(global, global.Backbone, global._);
}(this, function(global, Backbone, _) {
    var overrideCallback = function(callback, resolver, cb_options) {
        return function(model, response, options) {
            if (callback)
                callback.apply(model, arguments);

            var data = {
                response: response,
                options: options
            };

            //populate data object correctly and invoke resolver
            data[cb_options.collection ? 'collection' : 'model'] = model;
            resolver(data);

            //triggers an after:method event
            if (typeof(options.silent) === 'undefined' || !options.silent)
                model.trigger('after:' + cb_options.method, data, cb_options.success);
        };
    };

    var parseArgs = function(method, key, value, _options) {
        var attrs, options;

        if (method === 'save') {
            if (key === null || typeof key === 'object') {
                attrs = key;
                options = value;
            }
            else if (key) {
                (attrs = {})[key] = value;
                options = _options;
            }
        }
        else
            options = key;

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
                var cb_options = {method: method, collection: proto === Backbone.Collection.prototype};

                return new Promise(function(resolve, reject) {
                    options.success = overrideCallback(success, resolve, _.extend({success: true}, cb_options));
                    options.error = overrideCallback(error, reject, _.extend({success: false}, cb_options));

                    if (cb_options.collection) {
                        //if not silent, trigger a before event
                        if (typeof(options.silent) === 'undefined' || !options.silent)
                            model.trigger('before:' + method,  {collection: model, options: options});
                        proto[method].call(model, options);
                    }
                    else {
                        //if not silent, trigger a before event
                        if (typeof(options.silent) === 'undefined' || !options.silent)
                            model.trigger('before:' + method,  method === 'save' ? {model: model, options: options, attrs: attrs} : {model: model, options: options});
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

    var Async = Backbone.Async = Backbone.Async || {};
    Async.VERSION = '0.3.0';

    Async.Model = Backbone.Model.extend(
        buildPrototype(Backbone.Model, ['fetch', 'save', 'destroy'])
    );

    Async.Collection = Backbone.Collection.extend(
        buildPrototype(Backbone.Collection, ['fetch'])
    );

    return Async;
}));