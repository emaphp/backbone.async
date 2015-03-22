describe("ASync.Storage tests", function() {
    before(function() {
        server = sinon.fakeServer.create();
    });

    after(function() {
        server.restore();
    });

    describe('Fetch by ID tests', function() {
        it('must fetch by id', function(done) {
            var value = { id: 1, name: "Emmanuel", surname: "Antico"};
            server.respondWith(
                'GET',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var storage = new FIXTURES.ContactsStorage();
            storage.get(1, {test: true, silent:false})
            .then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.model.attributes).to.deep.equal(value);

                expect(storage.collection.models.length).to.equal(1);
                var model = storage.collection.get(1);
                expect(model.attributes).to.deep.equal(value);
                expect(storage.isLoaded).to.be.false;

                expect(data.response).to.deep.equal(value);

                expect(data.options).to.be.a('object');
                expect(data.options).to.have.property('test');
                expect(data.options).to.have.property('silent');

                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must invoke callbacks in order', function(done) {
            var value = { id: 2, name: "Emmanuel", surname: "Antico"};
            server.respondWith(
                'GET',
                '/contacts/2',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var callback1 = sinon.spy();
            var callback2 = sinon.spy();

            var storage = new FIXTURES.ContactsStorage();
            storage.get(2)
            .then(callback1)
            .then(callback2)
            .then(function(data) {
                expect(callback1.called).to.be.true;
                expect(callback1.calledOnce).to.be.true;
                expect(callback2.called).to.be.true;
                expect(callback2.calledOnce).to.be.true;
                expect(callback1.calledBefore(callback2)).to.be.true;
                
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must call event handlers', function(done) {
            var value = { id: 3, name: "Emmanuel", surname: "Antico"};
            server.respondWith(
                'GET',
                '/contacts/3',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var storage = new FIXTURES.ContactsStorage();
            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            obj.listenTo(storage, 'before:get', beforeCallback);
            obj.listenTo(storage, 'after:get', afterCallback);

            storage.get(3, {test: true, silent:false})
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

                var dataArg = beforeCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('model');
                expect(dataArg).to.have.property('options');
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;

                dataArg = afterCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('model');
                expect(dataArg).to.have.property('options');
                expect(dataArg).to.have.property('response');
                expect(dataArg.response).to.deep.equal(value);
                expect(dataArg.model.attributes).to.be.deep.equal(value);
                
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;
                
                var success = afterCallback.args[0][1];
                expect(success).to.be.true;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must not call event handlers', function(done) {
            var value = { id: 4, name: "Emmanuel", surname: "Antico"};
            server.respondWith(
                'GET',
                '/contacts/4',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var storage = new FIXTURES.ContactsStorage();
            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            obj.listenTo(storage, 'before:get', beforeCallback);
            obj.listenTo(storage, 'after:get', afterCallback);

            storage.get(4, {test: false, silent: true})
            .then(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must return previous object', function(done) {
            var value = { id: 5, name: "Emmanuel", surname: "Antico"};
            server.respondWith(
                'GET',
                '/contacts/5',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var storage = new FIXTURES.ContactsStorage();
            storage.get(5)
            .then(function(data) {
                var obj = _.extend({}, Backbone.Events);
                var beforeCallback = sinon.spy();
                var afterCallback = sinon.spy();
                obj.listenTo(storage, 'before:get', beforeCallback);
                obj.listenTo(storage, 'after:get', afterCallback);

                storage.get(5, {test: true, silent: false})
                .then(function(data) {
                    expect(data).to.be.a('object');
                    expect(data).to.have.property('model');
                    expect(data).to.not.have.property('response');
                    expect(data).to.have.property('options');

                    expect(beforeCallback.called).to.be.false;
                    expect(afterCallback.called).to.be.false;

                    expect(storage.collection.models.length).to.equal(1);
                    var model = storage.collection.get(5);
                    expect(model.attributes).to.deep.equal(value);
                    expect(storage.isLoaded).to.be.false;

                    expect(data.options).to.be.a('object');
                    expect(data.options).to.have.property('test');
                    expect(data.options).to.have.property('silent');

                    expect(data.options.test).to.be.true;
                    expect(data.options.silent).to.be.false;

                    done();
                })
                .catch(function(err) { done(err); });
            })
            .catch(function(err) { done(err); });

            server.respond();
        });
    });

    describe('Fetch all tests', function() {
        it('must fetch collection', function(done) {
            var values = [
                {id: 1, name: 'Curly'},
                {id: 2, name: 'Larry'},
                {id: 3, name: 'Moe'}
            ];

            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(values)
                ]
            );

            var storage = new FIXTURES.ContactsStorage();
            storage.fetch({test: true, silent:false})
            .then(function(data) {
                expect(data).to.be.a('object');
                
                expect(data).to.have.property('collection');
                expect(data).to.have.property('options');

                expect(data.collection.models.length).to.equal(3);
                var model = data.collection.get(1);
                expect(model.attributes).to.deep.equal({id: 1, name: 'Curly'});

                expect(storage.collection.models.length).to.equal(3);
                var model = storage.collection.get(1);
                expect(model.attributes).to.deep.equal({id: 1, name: 'Curly'});
                expect(storage.isLoaded).to.be.true;

                var options = data.options;
                expect(options).to.have.property('test');
                expect(options).to.have.property('silent');
                expect(options.test).to.be.true;
                expect(options.silent).to.be.false;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must call callbacks in order', function(done) {
            var values = [
                {id: 1, name: 'Curly'},
                {id: 2, name: 'Larry'},
                {id: 3, name: 'Moe'}
            ];

            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(values)
                ]
            );

            var callback1 = sinon.spy();
            var callback2 = sinon.spy();

            var storage = new FIXTURES.ContactsStorage();
            storage.fetch({test: true, silent:false})
            .then(callback1)
            .then(callback2)
            .then(function(data) {
                expect(callback1.called).to.be.true;
                expect(callback1.calledOnce).to.be.true;
                expect(callback2.called).to.be.true;
                expect(callback2.calledOnce).to.be.true;
                expect(callback1.calledBefore(callback2)).to.be.true;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must call event handlers', function(done) {
            var values = [
                {id: 1, name: 'Curly'},
                {id: 2, name: 'Larry'},
                {id: 3, name: 'Moe'}
            ];

            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(values)
                ]
            );

            var storage = new FIXTURES.ContactsStorage();
            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            obj.listenTo(storage, 'before:fetch', beforeCallback);
            obj.listenTo(storage, 'after:fetch', afterCallback);

            storage.fetch({test: true, silent:false})
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

                var dataArg = beforeCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('collection');
                expect(dataArg).to.have.property('options');
                
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;

                dataArg = afterCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('collection');
                expect(dataArg).to.have.property('options');
                expect(dataArg).to.have.property('response');
                expect(dataArg.collection).to.be.deep.equal(storage.collection);
                expect(dataArg.collection.length).to.equal(3);
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;
                expect(dataArg.response).to.be.deep.equal(values);

                var success = afterCallback.args[0][1];
                expect(success).to.be.true;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must not call event handlers', function(done) {
            var values = [
                {id: 1, name: 'Curly'},
                {id: 2, name: 'Larry'},
                {id: 3, name: 'Moe'}
            ];

            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(values)
                ]
            );

            var storage = new FIXTURES.ContactsStorage();
            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            obj.listenTo(storage, 'before:fetch', beforeCallback);
            obj.listenTo(storage, 'after:fetch', afterCallback);

            storage.fetch({test: true, silent:true})
            .then(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must return previous object', function(done) {
            var values = [
                {id: 1, name: 'Curly'},
                {id: 2, name: 'Larry'},
                {id: 3, name: 'Moe'}
            ];

            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(values)
                ]
            );

            var storage = new FIXTURES.ContactsStorage();
            storage.fetch()
            .then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('collection');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                var obj = _.extend({}, Backbone.Events);
                var beforeCallback = sinon.spy();
                var afterCallback = sinon.spy();
                obj.listenTo(storage, 'before:fetch', beforeCallback);
                obj.listenTo(storage, 'after:fetch', afterCallback);

                storage.fetch({test: true, silent:false})
                .then(function(data) {
                    expect(data).to.be.a('object');
                    expect(data).to.have.property('collection');
                    expect(data).to.not.have.property('response');
                    expect(data).to.have.property('options');

                    expect(beforeCallback.called).to.be.false;
                    expect(afterCallback.called).to.be.false;

                    expect(data.collection).to.deep.equal(storage.collection);
                    expect(storage.isLoaded).to.be.true;

                    expect(data.options).to.have.property('test');
                    expect(data.options).to.have.property('silent');
                    expect(data.options.test).to.be.true;
                    expect(data.options.silent).to.be.false;

                    done();
                })
                .catch(function(err) { done(err); });
            })
            .catch(function(err) { done(err); });

            server.respond();
        });
    });

    describe('Fetch by ID fail tests', function() {
        it('must call catch', function(done) {
            server.respondWith(
                'GET',
                '/notes/1',
                [
                    404,
                    null,
                    ''
                ]
            );

            var storage = new FIXTURES.NotesStorage();
            storage.get(1, {test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(data).to.be.a('object');
                
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.response).to.be.a('object');
                expect(data.response.status).to.equal(404);
                expect(data.response.statusText).to.equal("Not Found");

                expect(data.options).to.have.property('test');
                expect(data.options).to.have.property('silent');
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                expect(storage.isLoaded).to.be.false;
                expect(storage.collection).to.be.undefined;
                done();
            });

            server.respond();
        });

        it('must call event handlers', function(done) {
            server.respondWith(
                'GET',
                '/notes/2',
                [
                    500,
                    null,
                    ''
                ]
            );

            var storage = new FIXTURES.NotesStorage();
            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            obj.listenTo(storage, 'before:get', beforeCallback);
            obj.listenTo(storage, 'after:get', afterCallback);

            storage.get(2, {test: true, silent: false})
            .then(function() {})
            .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

                var dataArg = beforeCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('model');
                expect(dataArg).to.have.property('options');
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;

                dataArg = afterCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('model');
                expect(dataArg).to.have.property('options');
                expect(dataArg).to.have.property('response');
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;
                expect(dataArg.response.status).to.equal(500);
                expect(dataArg.response.statusText).to.equal("Internal Server Error");

                var success = afterCallback.args[0][1];
                expect(success).to.be.false;

                done();
            });

            server.respond();
        });

        it('must not call event handlers', function(done) {
            server.respondWith(
                'GET',
                '/notes/3',
                [
                    500,
                    null,
                    ''
                ]
            );

            var storage = new FIXTURES.NotesStorage();
            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            obj.listenTo(storage, 'before:get', beforeCallback);
            obj.listenTo(storage, 'after:get', afterCallback);

            storage.get(3, {test: false, silent: true})
            .then(function() {})
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;

                expect(data.options).to.have.property('test');
                expect(data.options).to.have.property('silent');
                expect(data.options.test).to.be.false;
                expect(data.options.silent).to.be.true;

                done();
            });

            server.respond();
        });

        it('must throw error', function(done) {
            var value = {id: 4, message: 'Hello World'};
            server.respondWith(
                'GET',
                '/notes/4',
                [
                    200,
                    null,
                    JSON.stringify(value)
                ]
            );

            var storage = new FIXTURES.NotesStorage();
            storage.get(4)
            .then(function(data) {
                throw new Error();
            })
            .catch(function(err) {
                expect(_.isError(err)).to.be.true;
                done();
            })

            server.respond();
        });
    });

    describe('Fetch all fail tests', function() {
        it('must call catch', function(done) {
            server.respondWith(
                'GET',
                '/notes',
                [
                    404,
                    null,
                    ''
                ]
            );

            var storage = new FIXTURES.NotesStorage();

            storage.fetch({test: true, silent: false})
            .then(function() {

            })
            .catch(function(data) {
                expect(data).to.be.a('object');
                
                expect(data).to.have.property('collection');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(storage.isLoaded).to.be.false;
                expect(storage.collection.length).to.equal(0);
                expect(data.response).to.be.a('object');
                expect(data.response.status).to.equal(404);
                expect(data.response.statusText).to.equal("Not Found");

                var options = data.options;
                expect(options).to.have.property('test');
                expect(options).to.have.property('silent');
                expect(options.test).to.be.true;
                expect(options.silent).to.be.false;

                done();
            });

            server.respond();
        });

        it('must call event handlers', function(done) {
            server.respondWith(
                'GET',
                '/notes',
                [
                    500,
                    null,
                    ''
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var storage = new FIXTURES.NotesStorage();
            obj.listenTo(storage, 'before:fetch', beforeCallback);
            obj.listenTo(storage, 'after:fetch', afterCallback);

            storage.fetch({test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

                var dataArg = beforeCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('collection');
                expect(dataArg).to.have.property('options');
                expect(dataArg.collection.length).to.be.equal(0);
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;

                dataArg = afterCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('collection');
                expect(dataArg).to.have.property('options');
                expect(dataArg).to.have.property('response');
                expect(dataArg.collection.length).to.be.equal(0);
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;
                expect(dataArg.response.status).to.equal(500);
                expect(dataArg.response.statusText).to.equal("Internal Server Error");

                var success = afterCallback.args[0][1];
                expect(success).to.be.false;

                expect(storage.collection.length).to.equal(0);
                expect(storage.isLoaded).to.be.false;
                done();
            });

            server.respond();
        });

        it('must not call event handlers', function(done) {
            server.respondWith(
                'GET',
                '/notes',
                [
                    500,
                    null,
                    ''
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var storage = new FIXTURES.NotesStorage();
            obj.listenTo(storage, 'before:fetch', beforeCallback);
            obj.listenTo(storage, 'after:fetch', afterCallback);

            storage.fetch({test: false, silent: true})
            .then(function() {})
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            });

            server.respond();
        });

        it('must throw error', function(done) {
            var values = [
                {id: 1, message: 'Hola'},
                {id: 2, message: 'Hello'},
                {id: 3, message: 'Ciao'}
            ];

            server.respondWith(
                'GET',
                '/notes',
                [
                    200,
                    null,
                    JSON.stringify(values)
                ]
            );

            var storage = new FIXTURES.NotesStorage();

            storage.fetch()
            .then(function(data) {
                throw new Error();
            })
            .catch(function(err) {
                expect(_.isError(err)).to.be.true;
                done();
            });

            server.respond();
        });
    });

    describe('Delete tests', function() {
        it('must remove model', function(done) {
            var value = { id: 1, name: "Emmanuel", surname: "Antico"};
            server.respondWith(
                'GET',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            server.respondWith(
                'DELETE',
                '/contacts/1',
                [
                    204,
                    {"Content-Type": "application/json"},
                    ''
                ]
            );

            var storage = new FIXTURES.ContactsStorage();

            storage.get(1)
            .then(function(data) {
                expect(storage.collection.length).to.equal(1);
                var contact = storage.collection.get(1);
                expect(contact.id).to.equal(1);

                contact.destroy()
                .then(function(data) {
                    expect(storage.collection.length).to.equal(0);
                    var contact = storage.collection.get(1);
                    expect(contact).to.be.undefined;
                    done();
                })
                .catch(function(err) { done(err); });

                server.respond();
            })
            .catch(function(err) { done(err); });

            server.respond();
        })
    });
});