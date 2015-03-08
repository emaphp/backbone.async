/*
 * Backbone.Async v0.1.1
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
    var overrideCallback = function(callback, resolver, agg) {
        return function(model, response, options) {
            if (callback)
                callback.apply(model, arguments);

            if (agg._collection)
                return resolver({
                    collection: model,
                    response: response,
                    options: options
                });
            
            resolver({
                model: model,
                response: response,
                options: options
            });
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

                return new Promise(function(resolve, reject) {
                    options.success = overrideCallback(success, resolve, agg);
                    options.error = overrideCallback(error, reject, agg);
                    proto[method].apply(model, method === 'save' ? [attrs, options] : [options]);
                });
            };

            return agg;
        };
    };

    var buildPrototype = function(Base, methods) {
        return methods.reduce(wrapMethod(Base.prototype), {_collection: Base === Backbone.Collection});
    };

    Backbone.Async = Backbone.Async || {};
    Backbone.Async.VERSION = '0.1.1';

    Backbone.Async.Model = Backbone.Model.extend(
        buildPrototype(Backbone.Model, ['fetch', 'save', 'destroy'])
    );

    Backbone.Async.Collection = Backbone.Collection.extend(
        buildPrototype(Backbone.Collection, ['fetch'])
    );
}));