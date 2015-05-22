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
    url: '/contacts',
    model: FIXTURES.Contact
});

FIXTURES.ContactsStore = Backbone.Async.Store.extend({
    collectionClass: FIXTURES.Contacts
});

/**
 * NOTES
 */

FIXTURES.Note = Backbone.Async.Model.extend({
    urlRoot: '/notes'
});

FIXTURES.Notes = Backbone.Async.Collection.extend({
    url: '/notes',
    model: FIXTURES.Note
});

FIXTURES.NotesStore = Backbone.Async.Store.extend({
    collectionClass: FIXTURES.Notes
});