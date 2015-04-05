# Backbone.Async
Backbone Models meet Promises

<br/>
###About

<br/>
*Backbone.Async* is a *Backbone.js* extension that introduces a Model and a Collection class using [Promises](http://www.html5rocks.com/en/tutorials/es6/promises/ "") as a return value for its syncronization methods.

<br/>
###Acknowledgement

<br/>
*Backbone.Async* is based on @jsantell's [Backbone-Promised](https://github.com/jsantell/backbone-promised "").

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
Browsers not supporting Promises should use a polyfill. This library uses [promise-polyfill](https://github.com/taylorhakes/promise-polyfill "") for testing.

<br/>
###Usage

<br/>
**Backbone.Async.Collection**
```javascript
var Contacts = Backbone.Async.Collection.extend({
    url: '/contacts'
});

var contacts = new Contacts();

//fetching a collection
contacts.fetch({foo: 'bar'})
.then(function(data) {
    var collection = data.collection,
        response = data.response,
        options = data.options;

    console.log('Collection has a total of', collection.length, 'models');
    console.log('Response:', JSON.stringify(response);
    console.log('Options used:' JSON.stringify(options));
})
.catch(function(data) {
    if (_.isError(data)) {
        console.error(data);
    } else {
        console.log('Failed to fetch collection:', data.response.statusText);
    }
});
```

<br/>
**Backbone.Async.Model**
```javascript
var Contact = Backbone.Async.Model.extend({
    urlRoot: '/contacts'
});

var contact = new Contact({id: 1});

//fetch by id
contact.fetch()
.then(function(data) {
    var model = data.model,
        response = data.response,
        options = data.options;

    console.log('Model Id:', model.id);
    console.log('Response:', JSON.stringify(response);
    console.log('Options used:' JSON.stringify(options));
})
.catch(function(data) {
    if (_.isError(data)) {
        console.error(data)
    } else {
        console.log('Failed to fetch contact:', data.response.statusText);
    }
});
```

Resolve and rejection callbacks receive a single argument containing the following properties:

 * model / collection: The model or collection instance that invokes the synchronization method.
 * response: On success, a JSON object with the values received. On error, an XHR instance.
 * options: Options used for this request.

<br/>
*Async.Collection.create* is a special case being that its resolver does receive a model instead of a collection.


<br/>
###Events

<br/>
*Backbone.Async* adds additional before/after events when synchronizing a Model or Collection.

#####Async Model events

```javascript
var Contact = Backbone.Async.Contact.extend({
    urlRoot: '/contacts'
});

var contact = new Contact({id: 1});

contact.on('before:fetch', function(model, options) {
    console.log('Contact is being fetched...');
});

//fetch contact
contact.fetch()
.then(function(data) {
    console.log('Contact fetched correctly');
})
.catch(function(data) {
    console.log('Something went wrong');
});
```

<br/>
**before:fetch**
> Arguments: *Async.Model* ***model***, *object* ***options***

<br/>
**after:fetch**
> Arguments: *Async.Model* ***model***, *object* ***response***, *object* ***options***, *boolean* ***success***

<br/>
**before:save**
> Arguments: *Async.Model* ***model***, *object* ***attributes***, *object* ***options***

<br/>
**after:save**
> Arguments: *Async.Model* ***model***, *object* ***response***, *object* ***options***, *boolean* ***success***

<br/>
**before:destroy**
> Arguments: *Async.Model* ***model***, *object* ***options***

<br/>
**after:destroy**
> Arguments: *Async.Model* ***model***, *object* ***response***, *object* ***options***, *boolean* ***success***

<br/>
#####Async Collection events

```javascript
var Contacts = Backbone.Async.Collection.extend({
    url: '/contacts'
});

var contacts = new Contacts();

contacts.on('after:fetch', function(collection, response, options, success) {
    if (!success) {
        console.log('Error:' + _.isError(collection) ? collection : response.statusText);
    }
});

//fetch contacts
contacts.fetch()
.then(function(data) {
    //render collection
})
.catch(function(data) {
    //handle error
});
```

<br/>
**before:fetch**
> Arguments: *Async.Collection* ***collection***, *object* ***options***

<br/>
**after:fetch**
> Arguments: *Async.Collection* ***collection***, *object* ***response***, *object* options, *boolean* ***success***

<br/>
**before:create**
> Arguments: *Async.Collection* ***collection***, *object* ***attributes***, *object* ***options***

<br/>
**after:create**
> Arguments: *Async.Model* ***model***, *object* ***response***, *object* ***options***, *boolean* ***success***

As a general rule, if an error is thrown during the execution of a method the event handler will call the *after* callback providing the error as first argument.

<br/>
###Storage

<br/>
The *Async.Storage* class provides an additional wrapper for Model and Collection classes.

```javascript
var Note = Backbone.Async.Model.extend({
    urlRoot: '/notes'
});

var Notes = Backbone.Async.Collection.extend({
    url: '/notes',
    model: Note
});

//extend the Storage class
var NotesStore = Backbone.Async.Storage.extend({
    Model: Note,
    Collection: Notes
});

var storage = new NotesStore();
```

<br/>
**Fetch model**
```javascript
//obtain model with ID 1
storage.fetch(1, {foo: 'var'})
.then(function(data) {
    var note = storage.get(1); //storage.collection.get(1)
    
    //if model was already loaded then 'fetch' returns a resolved promise
    //if a request was made then the property 'response' is available
    if (data.response) {
        console.log('A request has been made');
    }
})
.catch(function(data) {
    if (_.isError(data_or_err)) {
        console.error(data);
    } else {
        console.log('Error:', data.response.statusText);
    }
});
```

<br/>
**Fetch collection**

```javascript
//fetch all models
storage.fetchAll({foo: 'var'})
.then(function(data) {
    storage.loaded; //returns true
    
    //get collection
    var collection = storage.collection; //or data.collection
    
    //same response rule applies to 'fetchAll'    
    if (data.response) {
        console.log('A request has been made');
    }
})
.catch(function(data) {
    if (_.isError(data)) {
        console.error(data);
    } else {
        console.log(data.response.statusText);
    }
});
```

<br/>
**Storing models**
```javascript
var note = new Note({message: 'Hello'});

//save model
note.save()
.then(function(data) {
    storage.store(model);
})
.catch(function(data) {
    if (_.isError(data)) {
        console.error(data);
    } else {
        console.log('Failed to save model:', data.response.statusText);
    }
});
```

<br/>
**Creating models**
```javascript
var model = {name: 'emaphp', email: 'emaphp@github.com'};

storage.create(model, {foo: 'bar'})
.then(function(data) {
    //...
})
.catch(function(data) {
    if (_.isError(data)) {
    } else {
        console.log('Failed to save model:', data.response.statusText);
    }
});
```

<br/>
#####Storage events

<br/>
**before:fetch**
> Arguments: *Async.Model* ***model***, *object* ***options***

<br/>
**after:fetch**
> Arguments: *Async.Model* ***model***, *object* ***response***, *object* ***options***, *boolean* ***success***

<br/>
**before:fetchAll**
> Arguments: *Async.Collection* ***collection***, *object* ***options***

<br/>
**after:fetchAll**
> Arguments: *Async.Collection* ***collection***, *object* ***response***, *object* ***options***, *boolean* ***success***

<br/>
**before:create**
> Arguments: *Async.Collection* ***collection***, *object* ***attributes***, *object* ***options***

<br/>
**after:create**
> Arguments: *Async.Model* ***model***, *object* ***response***, *object* ***options***, *boolean* ***success***

<br/>
###License

This library is distributed under the terms of the MIT license.