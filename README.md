# Backbone.Async
Backbone Models meet Promises

<br/>
###About

<br/>
Backbone.Async introduces a Model and a Collection class that wrap their syncronization methods using [Promises](http://www.html5rocks.com/en/tutorials/es6/promises/ "").

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
    url: '/contacts'
});

var contacts = new Contacts();

//fetching a collection
contacts.fetch()
.then(function(data) {
    console.log('Collection fetched correctly');
})
.catch(function(data) {
    if (_.isError(data))
        console.error(data)
    else
        console.log('Failed to fetch collection:', data.response.statusText);
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
    if (_.isError(data))
        console.error(data)
    else
        console.log('Failed to fetch contact:', data.response.statusText);
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
    url: '/contacts'
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
    urlRoot: '/contacts'
});

var contact = new Contact({id: 1});

//setup event listener
var obj = {
    beforeFetch: function(data) {
        console.log('Contact is being fetched...');
    },
    
    beforeSave: function(data) {
        console.log('Contact is being saved...');
    }
};

_.extend(obj, Backbone.Events);
obj.listenTo(contact, 'before:fetch', obj.beforeFetch);
obj.listenTo(contact, 'before:save', obj.beforeSave);

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

The *before:save* event handler argument also includes an additional property named *attrs* with the attributes being saved. All *after:[event]* handlers receive the exact same object provided to the fulfilled and rejection callbacks plus a *success* argument.

<br/>
###Storage

<br/>
The Storage class provides an additional wrapper for Model and Collection classes.

```javascript
var Note = Backbone.Async.Model.extend({
    //...
});

var Notes = Backbone.Async.Collection.extend({
    //...
});

//extend the Storage class
var NotesStore = Backbone.Async.Storage.extend({
    Model: Note,
    Collection: Notes
});

var storage = new NotesStore();
```

<br/>
**Storing models**
```javascript
var note = new Note({message: 'Hello'});

note.save()
.then(function(data) {
    storage.store(model);
    console.log('Model saved');
})
.catch(function(data) {
    console.log('Failed to save model:', data.response.statusText);
});
```

<br/>
**Get model**
```javascript
//obtain model with ID 1
storage.get(1, {option: 'value'})
.then(function(data) {
    var note = storage.collection.get(1); //returns model
    
    //the 'get' method can be called more than once
    //the returned model will be stored internally
    //the 'response' property will not be set if the object was alreasy loaded
    if (data.response) {
        console.log('A request has been made');
    }
})
.catch(function(data_or_err) {
    if (_.isError(data_or_err))
        console.error(err);
    else
        console.log(data.statusText);
});
```

<br/>
**Get collection**

```javascript
//fetch all models
storage.fetch({option: 'value'})
.then(function(data) {
    storage.isLoaded === true; //returns true

    //same response rule applies to 'fetch'    
    if (data.response) {
        console.log('A request has been made');
    }
})
.catch(function(data_or_err) {
    if (_.isError(data_or_err))
        console.error(err);
    else
        console.log(data.statusText);
});
```

The Storage class also triggers before/after events when *get* and *fetch* are called.

<br/>
###License

This library is distributed under the terms of the MIT license.