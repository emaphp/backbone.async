# Backbone.Async
Backbone meets Promises

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
Browsers not supporting Promises should use a polyfill. This library uses [promise-polyfill](https://github.com/taylorhakes/promise-polyfill "") along with *PhantomJS* for testing.

<br/>
###Backbone.Async.Model

<br/>
When invoking the methods *fetch*, *save* or *destroy* a new *Promise* instance is returned. Resolve and rejection callbacks receive a single argument containing the following properties:

 * model: The model instance that invokes the synchronization method.
 * response: On success, a JSON object with the values received. On error, an XHR instance.
 * options: Options used for this request.

<br/>
**Fetching a model**

```javascript
var Contact = Backbone.Async.Model.extend({
    urlRoot: '/contacts'
});

var contact = new Contact({id: 1});

// Fetch by id
contact.fetch({foo: 'bar'})
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

<br/>
**Saving a model**

```javascript
// Obtain model
var contact = collection.get(1);

// Change  attributes
contact.set('name', 'emaphp');

// Save changes
contact.save(null, {foo: 'bar'})
.then(function(data) {
    var model = data.model,
        response = data.response,
        options = data.options;
        
    console.log('Model with ID', model.id, 'saved');
})
.catch(function(data) {
    if (_.isError(data)) {
        console.error(data)
    } else {
        console.log('Failed to save contact:', data.response.statusText);
    }
});
```

<br/>
**Deleting a model**

```javascript
// Obtain model
var contact = collection.get(1);

// Destroy model
contact.destroy({foo: 'bar'})
.then(function(data) {
    var model = data.model,
        response = data.response,
        options = data.options;
        
    console.log('Model with ID', model.id, 'deleted');
})
.catch(function(data) {
    if (_.isError(data)) {
        console.error(data)
    } else {
        console.log('Failed to delete contact:', data.response.statusText);
    }
});
```


<br/>
###Backbone.Async.Collection

<br/>
When invoking the methods *fetch*, *create*, *update* or *delete* a new *Promise* instance is returned. Resolve and rejection callbacks receive a single argument containing the following properties:

 * model / collection: The model / collection instance that invokes the synchronization method.
 * response: On success, a JSON object with the values received. On error, an XHR instance.
 * options: Options used for this request.

<br/>
The *update* and *delete* methods are just wrappers for *Async.Model::save* and *Async.Model::destroy* respectively. Callbacks for *fetch* receive a collection instance, while *create*, *update* and *delete* callbacks receive the corresponding model.

<br/>
**Fetching a collection**
```javascript
var Contacts = Backbone.Async.Collection.extend({
    url: '/contacts'
});

var contacts = new Contacts();

// Fetch a collection
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
**Creating models**

```javascript
// Values to save
var values = {title: 'Hi', message: 'Hello World'};

// Collection class
var Notes = Backbone.Async.Collection.extend({
    url: '/notes'
});

var notes = new Notes();

// Create new model
notes.create(values, {
    foo: 'bar',
    wait: true
})
.then(function (data) {
    var model = data.model,
        response = data.response,
        options = data.options;
        
    console.log('Model ID:', model.id);
    console.log('Response:', JSON.stringify(response));
    console.log('Options used:'. JSON.stringify(options));
})
.catch(function (data) {
    if (_.isError(data)) {
        console.error(data);
    } else {
        console.log('Failed to create model:', data.response.statusText);
    }
});
```

<br/>
**Updating models**
```javascript
// Get contact by ID
contact = contacts.get(1);

// Update attributes
contact.set('name', 'emaphp');

// Send request
contacts.update(contact, {
    foo: 'bar'
})
.then(function (data) {
    var model = data.model,
        response = data.response,
        options = data.options;
        
    console.log('Contact has been updated!');
})
.catch(function (data) {
    if (_.isError(data)) {
        console.error(data);
    } else {
        console.log('Failed to create model:', data.response.statusText);
    }
});
```

<br/>
**Deleting models**
```javascript
// Get contact by ID
contact = contacts.get(1);

contacts.delete(contact, {
    foo: 'bar'
})
.then(function (data) {
    var model = data.model,
        response = data.response,
        options = data.options;
    
    console.log('Model with ID', model.id, 'has been deleted');
})
.catch(function (data) {
    if (_.isError(data)) {
        console.error(data);
    } else {
        console.log('Failed to delete model:', data.response.statusText);
    }
});
```

<br/>
###Events

<br/>
*Backbone.Async* adds additional before/after events when synchronizing a Model or Collection.

#####Async Model events

<br/>
```javascript
var Contact = Backbone.Async.Contact.extend({
    urlRoot: '/contacts'
});

var contact = new Contact({id: 1});

contact.on('before:fetch', function(model, options) {
    console.log('Contact is being fetched...');
});

// Fetch contact
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

<br/>
```javascript
var Contacts = Backbone.Async.Collection.extend({
    url: '/contacts'
});

var contacts = new Contacts();

contacts.on('after:fetch', function(collection, response, options, success) {
    if (!success) {
        console.log('Error:', _.isError(collection) ? collection : response.statusText);
    }
});

// Fetch contacts
contacts.fetch()
.then(function(data) {
    //render collection
})
.catch(function(data) {
    console.log('Something went wrong');
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

<br/>
**before:update**
> Arguments: *Async.Model* ***model***, *object* ***options***

<br/>
**after:update**
> Arguments: *Async.Model* ***model***, *object* ***response***, *object* ***options***, *boolean* ***success***

<br/>
**before:delete**
> Arguments: *Async.Model* ***model***, *object* ***options***

<br/>
**after:delete**
> Arguments: *Async.Model* ***model***, *object* ***response***, *object* ***options***, *boolean* ***success***

<br/>
#####Event callbacks order

<br/>
Event callbacks are evaluated in the following order:

 * before:*event*
 * success / error
 * after:*event*
 * complete
 * then / catch

<br/>
Wrapper methods like *Async.Collection::update* and *Async.Collection::delete* behave as expected.  For example, when removing a model through *Async.Collection::delete* callbacks are invoked in the following order:

 * before:delete
 * before:destroy (Model)
 * success / error
 * after:destroy (Model)
 * after:delete
 * complete
 * then / catch

<br/>
###Store

<br/>
The *Async.Store* class provides an additional wrapper for Model and Collection classes.

```javascript
var Note = Backbone.Async.Model.extend({
    urlRoot: '/notes'
});

var Notes = Backbone.Async.Collection.extend({
    url: '/notes',
    model: Note
});

var NotesStore = Backbone.Async.Store.extend({
    modelClass: Note,
    collectionClass: Notes
});

var store = new NotesStore();
```

<br/>
**Fetch model by ID**
```javascript
// Fetchs a model by its ID
store.fetchById(1, {foo: 'var'})
.then(function(data) {
    // 'fetchById' returns a resolved promise if the model was alreay loaded
    var note = store.get(1); //storage.collection.get(1)
    
    // The 'response' property will only be available when a request is made
    if (!data.response) {
        console.log('No request was made');
    }
})
.catch(function(data) {
    if (_.isError(data)) {
        console.error(data);
    } else {
        console.log('Error:', data.response.statusText);
    }
});
```

<br/>
**Fetch collection**

```javascript
// Fetch all models
store.fetchAll({foo: 'var'})
.then(function(data) {
    storage.loaded; //returns true
    
    // Get collection
    var collection = store.collection; //or data.collection
    
    // Count models
    console.log('Models loaded:', store.length());
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
Addtional proxy methods: *reset*, *get*, *add*, *remove*, *shift*, *pop*, *push*, *unshift*, *where*, *findWhere*, *toJSON*, *sort*, *create*, *update*, *delete*.

<br/>
###License

This library is distributed under the terms of the MIT license.