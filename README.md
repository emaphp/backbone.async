# Backbone.Async
Backbone Models meet Promises

<br/>
###About

<br/>
Backbone.Async introduces a Model and a Collection class that wrap their sync methods into a Promise.

<br/>
###Acknowledgement

<br/>
Backbone.Async is based on @jsantell's [Backbone-Promised](https://github.com/jsantell/backbone-promised "").

<br/>
###Installation

<br/>
> Bower

    bower install backbone.async --save

<br/>
> Node

    npm install backbone.async --save


<br/>
###Polyfill

<br/>
Browsers not supporting Promises should use a polyfill. You can find one [here](https://github.com/taylorhakes/promise-polyfill "").

<br/>
###Examples

<br/>
**Backbone.Async.Collection**
```javascript
var Contacts = Backbone.Async.Collection.extend({
    url: 'http://example.com/contacts'
});

var contacts = new Contacts();

//fetching a collection
contacts.fetch()
.then(function(data) {
    console.log('Collection fetched correctly');
})
.catch(function(data) {
    console.log('Failed to fetch collection');
});
```

Callbacks used with *Collection::fetch* will receive an object containing the following properties:

 * collection: The collection instance.
 * response: On success, a JSON object with the values received. On error, an XHR instance.
 * options: Options used for this request.


<br/>
**Backbone.Async.Model**
```javascript
var Contact = Backbone.Async.Model.extend({
    urlRoot: 'http://example.com/contacts'
});

var contact = new Contact({id: 1});

//fetch by id
contact.fetch()
.then(function(data) {
    console.log('Contact fetched correctly');    
})
.catch(function(data) {
    console.log('Failed to fetch contact');
});
```

Callbacks used with *Model::fetch/save/destroy* will receive an object containing the following properties:

 * model: The model instance.
 * response: On success, a JSON object with the values received. On error, an XHR instance.
 * options: Options used for this request.


<br/>
###Events

<br/>
Backbone.Async adds additional events when synchronizing a Model or Collection.

<br/>
**Backbone.Async.Collection**

```javascript
var Contacts = Backbone.Async.Collection.extend({
    url: 'http://example.com/contacts'
});

var contacts = new Contacts();

//setup event listener
var obj = {
    beforeFetch: function(data) {
        console.log('Contacts are being fetched...');
    },
    afterFetch: function(data, success) {
        if (!success) console.log("Contacts couldn't be fetched...");
    }    
};

_.extend(obj, Backbone.Events);
obj.listenTo(contacts, 'before:fetch', obj.beforeFetch);
obj.listenTo(contacts, 'after:fetch', obj.afterFetch);

//fetch contacts
contacts.fetch()
.then(function(data) {
    console.log('Contacts fetched correctly');
})
.catch(function(data) {
    console.log('Something went wrong');
});
```

The *before:fetch* handler will receive an object containing the following properties:

 * collection: The collection instance.
 * options: The options provided.


The *after:fetch* event handler receives the exact same object provided to the fulfilled and rejection callbacks plus an additional argument indicating if *fetch* was succesfull or not.

<br/>
**Backbone.Async.Model**

```javascript
var Contact = Backbone.Async.Contact.extend({
    urlRoot: 'http://example.com/contacts'
});

var contact = new Contact({id: 1});

//setup event listener
var object = {
    beforeFetch: function(data) {
        console.log('Contact is being fetched...');
    },
    
    beforeSave: function(data) {
        console.log('Contact is being saved...');
    }
};

_.extend(object, Backbone.Events);
object.listenTo(contact, 'before:fetch', object.beforeFetch);
object.listenTo(contact, 'before:save', object.beforeSave);

//fetch contact
contact.fetch()
.then(function(data) {
    console.log('Contact fetched correctly');
    
    //update values and save
    contact.set({name: 'emaphp', email: 'emaphp@github.com'});
    contact.save()
    .then(function(data) {
        console.log('Contact saved');
    })
    .catch(function(data) {
        console.log('Something went wrong');
    });
})
.catch(function(data) {
    console.log('Something went wrong');
});
```

The *before:fetch* and *before:destroy* event handlers will receive an object containing the following properties:

 * model: The model instance.
 * options: The options provided.

The *before:save* event handler also includes an additional property named *attrs* with the attributes being saved. All *after:event* handlers receive the exact same object provided to the fulfilled and rejection callbacks plus a *success* argument.

<br/>
###License

This library is distributed under the terms of the MIT license.