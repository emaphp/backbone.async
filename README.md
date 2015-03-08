# Backbone.Async
Backbone Models meet Promises

<br/>
###About

Backbone.Async introduces a Model and a Collection class that wrap their sync methods into a Promise.

<br/>
###Acknowledgement

Backbone.Async is based on @jsantell's [Backbone-Promised](https://github.com/jsantell/backbone-promised "").

<br/>
###Installation

<br/>
> Bower

    bower install backbone.async

<br/>
> Node

    npm install backbone.async


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
.then(function(response) {
    console.log('Collection fetched correctly');
}, function(response) {
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
var Contact = Backbone.Async.Collection.extend({
    urlRoot: 'http://example.com/contacts'
});

var contact = new Contact({id: 1});

//fetch by id
contact.fetch()
.then(function(response) {
    console.log('Contact fetched correctly');    
}, function(response) {
    console.log('Failed to fetch contact');
});
```

Callbacks used with *Model::fetch/save/destroy* will receive an object containing the following properties:

 * model: The model instance.
 * response: On success, a JSON object with the values received. On error, an XHR instance.
 * options: Options used for this request.


<br/>
###License

Licensed under the MIT license.