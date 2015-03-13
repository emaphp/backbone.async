var FIXTURES = FIXTURES || {};

/*
 * CONTACTS
 */

FIXTURES.Contact = Backbone.Async.Model.extend({
    urlRoot: '/contacts',
    defaults: {
        name: 'emaphp'
    }
});

FIXTURES.Contacts = Backbone.Async.Collection.extend({
    url: '/contacts'
});

/**
 * NOTES
 */

FIXTURES.Note = Backbone.Async.Model.extend({
    urlRoot: '/notes'
});

FIXTURES.Notes = Backbone.Async.Collection.extend({
    url: '/notes'
});