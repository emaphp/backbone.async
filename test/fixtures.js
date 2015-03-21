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

FIXTURES.ContactsStorage = Backbone.Async.Storage.extend({
    Model: FIXTURES.Contact,
    Collection: FIXTURES.Contacts
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

FIXTURES.NotesStorage = Backbone.Async.Storage.extend({
    Model: FIXTURES.Note,
    Collection: FIXTURES.Notes
});