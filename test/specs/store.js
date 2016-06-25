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

            var storage = new FIXTURES.ContactsStore();
            storage.fetchById(1, {test: true, silent: false})
            .then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');
                expect(data.model.attributes).to.deep.equal(value);
                expect(storage.collection.models.length).to.equal(1);

                var model = storage.get(1);
                expect(model.attributes).to.deep.equal(value);
                expect(storage.loaded).to.be.false;
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

            var storage = new FIXTURES.ContactsStore();
            storage.fetchById(2)
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

            var storage = new FIXTURES.ContactsStore();

            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();

            storage.fetchById(3, {
                test: true,
                silent:false,
                success: successCallback,
                complete: completeCallback
            })
            .then(function(data) {
                expect(successCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;

                expect(successCallback.calledBefore(completeCallback)).to.be.true;

                var successModel = successCallback.args[0][0];
                expect(successModel.attributes).to.deep.equal(value);
                var successResponse = successCallback.args[0][1];
                expect(successResponse).to.deep.equal(value);
                var successOptions = successCallback.args[0][2];
                expect(successOptions.test).to.be.true;
                expect(successOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(200);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('success');

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

            var storage = new FIXTURES.ContactsStore();
            storage.fetchById(5)
            .then(function(data) {
                server.respondWith(
                    'GET',
                    '/contacts/5',
                    [
                        500,
                        null,
                        ''
                    ]
                );

                storage.fetchById(5, {test: true, silent: false})
                .then(function(data) {
                    expect(data).to.be.a('object');
                    expect(data).to.have.property('model');
                    expect(data).to.not.have.property('response');
                    expect(data).to.have.property('options');

                    expect(storage.length()).to.equal(1);

                    var model = storage.get(5);
                    expect(model.attributes).to.deep.equal(value);
                    expect(storage.loaded).to.be.false;

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

            var storage = new FIXTURES.ContactsStore();
            storage.fetchAll({test: true, silent:false})
            .then(function(data) {
                expect(data).to.be.a('object');

                expect(data).to.have.property('collection');
                expect(data).to.have.property('options');

                expect(data.collection.models.length).to.equal(3);
                var model = data.collection.get(1);
                expect(model.attributes).to.deep.equal({id: 1, name: 'Curly'});

                expect(storage.length()).to.equal(3);
                var model = storage.get(1);
                expect(model.attributes).to.deep.equal({id: 1, name: 'Curly'});
                expect(storage.loaded).to.be.true;

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

            var storage = new FIXTURES.ContactsStore();
            storage.fetchAll({test: true, silent:false})
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

            var storage = new FIXTURES.ContactsStore();

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();

            storage.collection.on('before:fetch', beforeCallback);
            storage.collection.on('after:fetch', afterCallback);

            storage.fetchAll({
                test: true,
                silent:false,
                success: successCallback,
                complete: completeCallback
            })
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(successCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(successCallback)).to.be.true;
                expect(successCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeCollection = beforeCallback.args[0][0];
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeCollection).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterCollection = afterCallback.args[0][0];
                var response = afterCallback.args[0][1];
                var afterOptions = afterCallback.args[0][2];
                expect(afterCollection).to.be.a('object');
                expect(response).to.be.a('array');
                expect(afterOptions).to.be.a('object');
                expect(afterCollection).to.be.deep.equal(storage.collection);
                expect(afterCollection.length).to.equal(3);
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;
                expect(response).to.be.deep.equal(values);

                var success = afterCallback.args[0][3];
                expect(success).to.be.true;

                var successCollection = successCallback.args[0][0];
                expect(successCollection).to.deep.equal(storage.collection);
                var successResponse = successCallback.args[0][1];
                expect(successResponse).to.deep.equal(values);
                var successOptions = successCallback.args[0][2];
                expect(successOptions.test).to.be.true;
                expect(successOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(200);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('success');

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

            var storage = new FIXTURES.ContactsStore();

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();

            storage.collection.on('before:fetch', beforeCallback);
            storage.collection.on('after:fetch', afterCallback);

            storage.fetchAll({
                test: true,
                silent:true,
                complete: completeCallback,
                success: successCallback
            })
            .then(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;

                expect(successCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;

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

            var storage = new FIXTURES.ContactsStore();
            storage.fetchAll()
            .then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('collection');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                var beforeCallback = sinon.spy();
                var afterCallback = sinon.spy();
                storage.collection.on('before:fetch', beforeCallback);
                storage.collection.on('after:fetch', afterCallback);

                storage.fetchAll({test: true, silent:false})
                .then(function(data) {
                    expect(data).to.be.a('object');
                    expect(data).to.have.property('collection');
                    expect(data).to.not.have.property('response');
                    expect(data).to.have.property('options');

                    expect(beforeCallback.called).to.be.false;
                    expect(afterCallback.called).to.be.false;

                    expect(data.collection).to.deep.equal(storage.collection);
                    expect(storage.loaded).to.be.true;

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

            var storage = new FIXTURES.NotesStore();
            storage.fetchById(1, {test: true, silent: false})
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

                expect(storage.loaded).to.be.false;
                done();
            })
            .catch(function(err){done(err)});

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

            var storage = new FIXTURES.NotesStore();

            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();

            storage.fetchById(2, {
                test: true,
                silent: false,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function() {})
            .catch(function(data) {
                expect(errorCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;

                expect(errorCallback.calledBefore(completeCallback)).to.be.true;

                var errorModel = errorCallback.args[0][0];
                expect(errorModel.attributes).to.deep.equal({id: 2});
                var errorRespose = errorCallback.args[0][1];
                expect(errorRespose.status).to.equal(500);
                var errorOptions = errorCallback.args[0][2];
                expect(errorOptions.test).to.be.true;
                expect(errorOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(500);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('error');

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

            var storage = new FIXTURES.NotesStore();
            storage.fetchById(4)
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

            var storage = new FIXTURES.NotesStore();

            storage.fetchAll({test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(data).to.be.a('object');

                expect(data).to.have.property('collection');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(storage.loaded).to.be.false;
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

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();

            var storage = new FIXTURES.NotesStore();

            storage.collection.on('before:fetch', beforeCallback);
            storage.collection.on('after:fetch', afterCallback);

            storage.fetchAll({
                test: true,
                silent: false,
                complete: completeCallback,
                error: errorCallback
            })
            .then(function() {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(errorCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(errorCallback)).to.be.true;
                expect(errorCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeCollection = beforeCallback.args[0][0];
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeCollection).to.be.a('object');
                expect(beforeOptions).to.be.a('object');
                expect(beforeCollection.length).to.be.equal(0);
                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterCollection = afterCallback.args[0][0];
                var response = afterCallback.args[0][1];
                var afterOptions = afterCallback.args[0][2];
                expect(afterCollection).to.be.a('object');
                expect(response).to.be.a('object');
                expect(afterOptions).to.be.a('object');
                expect(afterCollection.length).to.be.equal(0);
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;
                expect(response.status).to.equal(500);
                expect(response.statusText).to.equal("Internal Server Error");

                var success = afterCallback.args[0][3];
                expect(success).to.be.false;

                var errorCollection = errorCallback.args[0][0];
                expect(errorCollection).to.deep.equal(storage.collection);
                var errorResponse = errorCallback.args[0][1];
                expect(errorResponse.status).to.equal(500);
                var errorOptions = errorCallback.args[0][2];
                expect(errorOptions.test).to.be.true;
                expect(errorOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(500);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('error');

                expect(storage.collection.length).to.equal(0);
                expect(storage.loaded).to.be.false;
                done();
            })
            .catch(function(err){done(err)});

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

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();

            var storage = new FIXTURES.NotesStore();
            storage.on('before:fetch', beforeCallback);
            storage.on('after:fetch', afterCallback);

            storage.fetchAll({
                test: false,
                silent: true,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function() {})
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                expect(errorCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;
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

            var storage = new FIXTURES.NotesStore();

            storage.fetchAll()
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

            var storage = new FIXTURES.ContactsStore();

            storage.fetchById(1)
            .then(function(data) {
                expect(storage.length()).to.equal(1);

                var contact = storage.get(1);
                expect(contact.id).to.equal(1);

                storage.delete(contact)
                .then(function(data) {
                    expect(storage.length()).to.equal(0);

                    var contact = storage.get(1);
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

    describe('Update tests', function() {
        it('must update attributes', function(done) {
            var value = JSON.stringify({id: 1, name: 'Emmanuel', surname: 'Antico'});

            server.respondWith(
                'GET',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    value
                ]
            );

            server.respondWith(
                'PUT',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    value.replace('Emmanuel', 'emaphp')
                ]
            );

            var storage = new FIXTURES.ContactsStore();

            storage.fetchById(1)
            .then(function(data) {
                var model = data.model;
                model.set('name', 'emaphp');
                expect(storage.get(1).get('name')).to.equal('emaphp');

                storage.update(model)
                .then(function(data) {
                    expect(storage.get(1).get('name')).to.equal('emaphp');
                    done();
                })
                .catch(function(err) {
                    done(err);
                });

                server.respond();
            })
            .catch(function(err) {
                done(err);
            });

            server.respond();
        });
    });

    describe('Create tests', function() {
        it('must call then', function(done) {
            var value = {name: "Emmanuel", surname: "Antico"};

            server.respondWith(
                'POST',
                '/contacts',
                [
                    200,
                    {'Content-type': 'application/json'},
                    JSON.stringify(_.extend({id: 1}, value))
                ]
            );

            var storage = new FIXTURES.ContactsStore();

            storage.create(value, {test: true, silent: false})
            .then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.response).to.deep.equal(_.extend({id: 1}, value));
                expect(data.model.attributes).to.deep.equal(data.response);
                expect(data.model.id).to.equal(1);

                expect(data.options).to.have.property('test');
                expect(data.options).to.have.property('silent');
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                expect(storage.length()).to.equal(1);
                done();
            })
            .catch(function(err){done(err)});

            server.respond();
        });

        it('must call event handlers', function(done) {
            var value = { name: "Emmanuel", surname: "Antico"};

            server.respondWith(
                'POST',
                '/contacts',
                [
                    200,
                    {'Content-type': 'application/json'},
                    JSON.stringify(_.extend({id: 1}, value))
                ]
            );

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();

            var storage = new FIXTURES.ContactsStore();
            storage.collection.on('before:create', beforeCallback);
            storage.collection.on('after:create', afterCallback);

            storage.create(value, {
                test: true,
                silent: false,
                success: successCallback,
                complete: completeCallback
            })
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(successCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(successCallback)).to.be.true;
                expect(successCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeCollection = beforeCallback.args[0][0];
                var beforeAttrs = beforeCallback.args[0][1];
                var beforeOptions = beforeCallback.args[0][2];

                expect(beforeCollection).to.be.a('object');
                expect(beforeAttrs).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeCollection.length).to.equal(1);
                expect(beforeAttrs).to.deep.equal(value);
                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterModel = afterCallback.args[0][0];
                var response = afterCallback.args[0][1];
                var afterOptions = afterCallback.args[0][2];

                expect(afterModel).to.be.a('object');
                expect(response).to.be.a('object');
                expect(afterOptions).to.be.a('object');

                expect(afterModel.attributes).to.deep.equal(_.extend({id: 1}, value));
                expect(response).to.deep.equal(afterModel.attributes);
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.true;

                var successModel = successCallback.args[0][0]
                expect(successModel).to.deep.equal(data.model);
                var successResponse = successCallback.args[0][1];
                expect(successResponse).to.deep.equal(_.extend({id: 1}, value));
                var successOptions = successCallback.args[0][2];
                expect(successOptions.test).to.be.true;
                expect(successOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(200);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('success');

                var model = storage.get(1);
                expect(model.attributes).to.deep.equal(response);

                done();
            })
            .catch(function(err){done(err)});

            server.respond();
        });

        it('must not call event handlers', function(done) {
            var value = { name: "Emmanuel", surname: "Antico"};

            server.respondWith(
                'POST',
                '/contacts',
                [
                    200,
                    {'Content-type': 'application/json'},
                    JSON.stringify(_.extend({id: 1}, value))
                ]
            );

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();

            var storage = new FIXTURES.ContactsStore();
            storage.collection.on('before:create', beforeCallback);
            storage.collection.on('after:create', afterCallback);

            storage.create(value, {
                test: false,
                silent: true,
                success: successCallback,
                complete: completeCallback
            })
            .then(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                expect(successCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;
                done();
            })
            .catch(function(err){ done(err); });

            server.respond();
        });
    });

    describe('Create fail tests', function() {
        it('must call cath', function(done) {
            server.respondWith(
                'POST',
                '/notes',
                [
                    400,
                    null,
                    ''
                ]
            );

            var storage = new FIXTURES.NotesStore();

            storage.create({message: 'Hello World'}, {test: true, silent: false})
            .then(function(data){})
            .catch(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.response).to.be.a('object');
                expect(data.response.status).to.equal(400);
                expect(data.response.statusText).to.equal('Bad Request');

                expect(data.options).to.be.a('object');
                expect(data.options).to.have.property('test');
                expect(data.options).to.have.property('silent');
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                expect(storage.length()).to.equal(1);
                expect(data.model.attributes).to.deep.equal({message: 'Hello World'});
                expect(data.model.id).to.be.undefined;

                done();
            });

            server.respond();
        });

        it('must not call add', function(done) {
            server.respondWith(
                'POST',
                '/notes',
                [
                    400,
                    null,
                    ''
                ]
            );

            var storage = new FIXTURES.NotesStore();

            storage.create({message: 'Hello World'}, {wait: true})
            .then(function(data){})
            .catch(function(data) {
                expect(storage.length()).to.equal(0);
                done();
            });

            server.respond();
        });

        it('must call event handlers', function(done) {
            var value = {message: 'Hello World'};

            server.respondWith(
                'POST',
                '/notes',
                [
                    400,
                    null,
                    ''
                ]
            );

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();

            var storage = new FIXTURES.NotesStore();
            storage.collection.on('before:create', beforeCallback);
            storage.collection.on('after:create', afterCallback);

            storage.create(value, {
                test: true,
                silent: false,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function(data){})
            .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(errorCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(errorCallback)).to.be.true;
                expect(errorCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeCollection = beforeCallback.args[0][0];
                var beforeAttrs = beforeCallback.args[0][1];
                var beforeOptions = beforeCallback.args[0][2];

                expect(beforeCollection).to.be.a('object');
                expect(beforeAttrs).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeCollection.length).to.equal(1);
                expect(beforeAttrs).to.deep.equal(value);
                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterModel = afterCallback.args[0][0];
                var response = afterCallback.args[0][1];
                var afterOptions = afterCallback.args[0][2];

                expect(afterModel).to.be.a('object');
                expect(response).to.be.a('object');
                expect(afterOptions).to.be.a('object');

                expect(afterModel.attributes).to.deep.equal(value);
                expect(afterModel.id).to.be.undefined;
                expect(response.status).to.equal(400);
                expect(response.statusText).to.equal('Bad Request');
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.false;

                var errorModel = errorCallback.args[0][0];
                expect(errorModel).to.deep.equal(data.model);
                var errorResponse = errorCallback.args[0][1];
                expect(errorResponse.status).to.equal(400);
                var errorOptions = errorCallback.args[0][2];
                expect(errorOptions.test).to.be.true;
                expect(errorOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(400);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('error');

                done();
            })
            .catch(function(err){done(err)});

            server.respond();
        });

        it('must not call event handlers', function(done) {
            var value = {message: "Hello World"};

            server.respondWith(
                'POST',
                '/notes',
                [
                    400,
                    null,
                    ''
                ]
            );

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();

            var storage = new FIXTURES.NotesStore();
            storage.collection.on('before:create', beforeCallback);
            storage.collection.on('after:create', afterCallback);

            storage.create(value, {
                test: false,
                silent: true,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function(data){})
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                expect(errorCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;
                done();
            });

            server.respond();
        });

        it('must throw error', function(done) {
            var value = {message: "Hello World"};

            server.respondWith(
                'POST',
                '/notes',
                [
                    200,
                    {'Content-type': 'application/json'},
                    JSON.stringify(_.extend({id:1}, value))
                ]
            );

            var storage = new FIXTURES.NotesStore();

            storage.create(value)
            .then(function() {
                throw new Error();
            })
            .catch(function(data) {
                expect(_.isError(data)).to.be.true;
                done();
            });

            server.respond();
        });
    });

    describe('Underscore.js methods tests', function() {
        it('must implement collection methods', function(done) {
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

            var storage = new FIXTURES.ContactsStore();
            storage.fetchAll({test: true, silent:false})
            .then(function(data) {
                // forEach
                expect(storage.forEach).to.exists;
                expect(typeof storage.forEach).to.equal('function');
                var result = [];
                storage.forEach(function(model) {
                    result.push(model.get('name'));
                });
                expect(result.length).to.equal(3);
                expect(result[0]).to.equal('Curly');
                expect(result[1]).to.equal('Larry');
                expect(result[2]).to.equal('Moe');

                // each
                expect(storage.each).to.exists;
                expect(typeof storage.each).to.equal('function');
                var eachCallback = sinon.spy();
                storage.each(eachCallback);
                expect(eachCallback.calledThrice).to.be.true;
                expect(eachCallback.getCall(0).args[0]).to.equal(storage.collection.models[0]);
                expect(eachCallback.getCall(1).args[0]).to.equal(storage.collection.models[1]);
                expect(eachCallback.getCall(2).args[0]).to.equal(storage.collection.models[2]);

                // map
                expect(storage.map).to.exists;
                expect(typeof storage.map).to.equal('function');
                var object = { method: function (model) { return model.get('name') } };
                var mapCallback = sinon.spy(object,  'method');
                var result = storage.map(mapCallback);
                expect(mapCallback.calledThrice).to.be.true;
                expect(result.length).to.equal(3);
                expect(result[0]).to.equal('Curly');
                expect(result[1]).to.equal('Larry');
                expect(result[2]).to.equal('Moe');

                // collect (alias of map)
                expect(storage.collect).to.exists;
                expect(typeof storage.collect).to.equal('function');
                var object = { method: function (model) { return model.get('name') } };
                var collectCallback = sinon.spy(object,  'method');
                var result = storage.collect(collectCallback);
                expect(collectCallback.calledThrice).to.be.true;
                expect(result.length).to.equal(3);
                expect(result[0]).to.equal('Curly');
                expect(result[1]).to.equal('Larry');
                expect(result[2]).to.equal('Moe');

                // reduce
                expect(storage.reduce).to.exists;
                expect(typeof storage.reduce).to.equal('function');
                var object = { method: function (memo, model) { return memo + model.get('name'); }};
                var reduceCallback = sinon.spy(object, 'method');
                var result = storage.reduce(reduceCallback, '');
                expect(reduceCallback.calledThrice).to.be.true;
                expect(result).to.equal('CurlyLarryMoe');

                // foldl (alias of reduce)
                expect(storage.foldl).to.exists;
                expect(typeof storage.foldl).to.equal('function');
                var object = { method: function (memo, model) { return memo + model.get('name'); }};
                var foldlCallback = sinon.spy(object, 'method');
                var result = storage.foldl(foldlCallback, '');
                expect(foldlCallback.calledThrice).to.be.true;
                expect(result).to.equal('CurlyLarryMoe');

                // inject (alias of reduce)
                expect(storage.inject).to.exists;
                expect(typeof storage.inject).to.equal('function');
                var object = { method: function (memo, model) { return memo + model.get('name'); }};
                var injectCallback = sinon.spy(object, 'method');
                var result = storage.inject(injectCallback, '');
                expect(injectCallback.calledThrice).to.be.true;
                expect(result).to.equal('CurlyLarryMoe');

                // reduceRight
                expect(storage.reduceRight).to.exists;
                expect(typeof storage.reduceRight).to.equal('function');
                var object = { method: function (memo, model) { return memo + model.get('name'); }};
                var reduceRightCallback = sinon.spy(object, 'method');
                var result = storage.reduceRight(reduceRightCallback, '');
                expect(reduceRightCallback.calledThrice).to.be.true;
                expect(result).to.equal('MoeLarryCurly');

                // foldr (alias of reduceRight)
                expect(storage.foldr).to.exists;
                expect(typeof storage.foldr).to.equal('function');
                var object = { method: function (memo, model) { return memo + model.get('name'); }};
                var foldrCallback = sinon.spy(object, 'method');
                var result = storage.foldr(foldrCallback, '');
                expect(foldrCallback.calledThrice).to.be.true;
                expect(result).to.equal('MoeLarryCurly');

                // find
                expect(storage.find).to.exists;
                expect(typeof storage.find).to.equal('function');
                var result = storage.find(function(model) {
                    return model.get('name') == 'Larry';
                });
                expect(result).to.equal(storage.collection.models[1]);

                // detect (alias of find)
                expect(storage.detect).to.exists;
                expect(typeof storage.detect).to.equal('function');
                var result = storage.detect(function(model) {
                    return model.get('name') == 'Larry';
                });
                expect(result).to.equal(storage.collection.models[1]);

                // filter
                expect(storage.filter).to.exists;
                expect(typeof storage.filter).to.equal('function');
                var result = storage.filter(function(model) {
                    return model.get('name').length == 5;
                });
                expect(result.length).to.equal(2);
                expect(result[0]).to.equal(storage.collection.models[0]);
                expect(result[1]).to.equal(storage.collection.models[1]);

                // select (alias of filter)
                expect(storage.select).to.exists;
                expect(typeof storage.select).to.equal('function');
                var result = storage.select(function(model) {
                    return model.get('name').length == 5;
                });
                expect(result.length).to.equal(2);
                expect(result[0]).to.equal(storage.collection.models[0]);
                expect(result[1]).to.equal(storage.collection.models[1]);

                // reject
                expect(storage.reject).to.exists;
                expect(typeof storage.reject).to.equal('function');
                var result = storage.reject(function(model) {
                    return model.get('name').length == 5;
                });
                expect(result.length).to.equal(1);
                expect(result[0]).to.equal(storage.collection.models[2]);

                // every
                expect(storage.every).to.exists;
                expect(typeof storage.every).to.equal('function');
                var result = storage.every(function(model) {
                    return model.get('id') < 4;
                });
                expect(result).to.be.true;

                // all (alias of every)
                expect(storage.all).to.exists;
                expect(typeof storage.all).to.equal('function');
                var result = storage.all(function(model) {
                    return model.get('id') < 4;
                });
                expect(result).to.be.true;

                // some
                expect(storage.some).to.exists;
                expect(typeof storage.some).to.equal('function');
                var result = storage.some(function (model) {
                    return model.get('name') == 'Shemp';
                });
                expect(result).to.be.false;

                // any (alias of some)
                expect(storage.any).to.exists;
                expect(typeof storage.any).to.equal('function');
                var result = storage.any(function (model) {
                    return model.get('name') == 'Shemp';
                });
                expect(result).to.be.false;

                // contains
                expect(storage.contains).to.exists;
                expect(typeof storage.contains).to.equal('function');
                var result = storage.contains(storage.collection.models[0]);
                expect(result).to.be.true;

                // include (alias of contains)
                expect(storage.include).to.exists;
                expect(typeof storage.include).to.equal('function');
                var result = storage.include(storage.collection.models[0]);
                expect(result).to.be.true;

                // includes (alias of contains)
                expect(storage.includes).to.exists;
                expect(typeof storage.includes).to.equal('function');
                var result = storage.includes(storage.collection.models[0]);
                expect(result).to.be.true;

                // invoke
                expect(storage.invoke).to.exists;
                expect(typeof storage.invoke).to.equal('function');
                var result = storage.invoke('pick', 'id');
                expect(result.length).to.equal(3);
                expect(typeof result[0]).to.equal('object');
                expect(result[0].id).to.equal(1);
                expect(typeof result[1]).to.equal('object');
                expect(result[1].id).to.equal(2);
                expect(typeof result[2]).to.equal('object');
                expect(result[2].id).to.equal(3);

                // max
                expect(storage.max).to.exists;
                expect(typeof storage.max).to.equal('function');
                var result = storage.max(function (model) {
                    return model.get('id');
                });
                expect(result.get('id')).to.equal(3);

                // min
                expect(storage.min).to.exists;
                expect(typeof storage.min).to.equal('function');
                var result = storage.min(function (model) {
                    return model.get('id');
                });
                expect(result.get('id')).to.equal(1);

                // size
                expect(storage.size).to.exists;
                expect(typeof storage.size).to.equal('function');
                expect(storage.size()).to.equal(3);

                // first
                expect(storage.first).to.exists;
                expect(typeof storage.first).to.equal('function');
                var result = storage.first();
                expect(result.get('id')).to.equal(1);

                // head (alias of first)
                expect(storage.head).to.exists;
                expect(typeof storage.head).to.equal('function');
                var result = storage.head();
                expect(result.get('id')).to.equal(1);

                // take
                expect(storage.take).to.exists;
                expect(typeof storage.take).to.equal('function');
                var result = storage.take();
                expect(result.get('id')).to.equal(1);

                // initial
                expect(storage.initial).to.exists;
                expect(typeof storage.initial).to.equal('function');
                var result = storage.initial();
                expect(result.length).to.equal(2);
                expect(result[0]).to.equal(storage.collection.models[0]);
                expect(result[1]).to.equal(storage.collection.models[1]);

                // rest
                expect(storage.rest).to.exists;
                expect(typeof storage.rest).to.equal('function');
                var result = storage.rest();
                expect(result.length).to.equal(2);
                expect(result[0]).to.equal(storage.collection.models[1]);
                expect(result[1]).to.equal(storage.collection.models[2]);

                // tail (alias of rest)
                expect(storage.tail).to.exists;
                expect(typeof storage.tail).to.equal('function');
                var result = storage.tail();
                expect(result.length).to.equal(2);
                expect(result[0]).to.equal(storage.collection.models[1]);
                expect(result[1]).to.equal(storage.collection.models[2]);

                // drop
                expect(storage.drop).to.exists;
                expect(typeof storage.drop).to.equal('function');
                var result = storage.drop();
                expect(result.length).to.equal(2);
                expect(result[0]).to.equal(storage.collection.models[1]);
                expect(result[1]).to.equal(storage.collection.models[2]);

                // last
                expect(storage.last).to.exists;
                expect(typeof storage.last).to.equal('function');
                var result = storage.last();
                expect(result.get('id')).to.equal(3);

                // without
                expect(storage.without).to.exists;
                expect(typeof storage.without).to.equal('function');
                var result = storage.without(storage.collection.models[1]);
                expect(result.length).to.equal(2);

                // difference
                expect(storage.difference).to.exists;
                expect(typeof storage.difference).to.equal('function');
                var result = storage.difference([storage.collection.models[1]]);
                expect(result.length).to.equal(2);

                // indexOf
                expect(storage.indexOf).to.exists;
                expect(typeof storage.indexOf).to.equal('function');
                expect(storage.indexOf(storage.collection.models[1])).to.equal(1);

                // shuffle
                expect(storage.shuffle).to.exists;
                expect(typeof storage.shuffle).to.equal('function');

                // lastIndexOf
                expect(storage.lastIndexOf).to.exists;
                expect(typeof storage.lastIndexOf).to.equal('function');
                expect(storage.lastIndexOf(storage.collection.models[1])).to.equal(1);

                // isEmpty
                expect(storage.isEmpty).to.exists;
                expect(typeof storage.isEmpty).to.equal('function');
                expect(storage.isEmpty()).to.be.false;

                // chain
                expect(storage.chain).to.exists;
                expect(typeof storage.chain).to.equal('function');
                var result = storage.chain().map(function(model) {
                    return model.get('name');
                }).first().value();
                expect(result).to.equal('Curly');

                // sample
                expect(storage.sample).to.exists;
                expect(typeof storage.sample).to.equal('function');

                // partition
                expect(storage.partition).to.exists;
                expect(typeof storage.partition).to.equal('function');
                var result = storage.partition(function(model) {
                    return model.get('name').length == 5;
                });
                expect(result.length).to.equal(2);

                // groupBy
                expect(storage.groupBy).to.exists;
                expect(typeof storage.groupBy).to.equal('function');
                var result = storage.groupBy(function(model) {
                    return model.get('name').length;
                });
                expect(result[3]).to.exists;
                expect(result[5]).to.exists;
                expect(result[3][0]).to.equal(storage.collection.models[2]);
                expect(result[5][0]).to.equal(storage.collection.models[0]);
                expect(result[5][1]).to.equal(storage.collection.models[1]);

                // countBy
                expect(storage.countBy).to.exists;
                expect(typeof storage.countBy).to.equal('function');
                var result = storage.countBy(function(model) {
                    return model.get('name').length;
                });
                expect(result[3]).to.exists;
                expect(result[5]).to.exists;
                expect(result[3]).to.equal(1);
                expect(result[5]).to.equal(2);

                // sortBy
                expect(storage.sortBy).to.exists;
                expect(typeof storage.sortBy).to.equal('function');
                var result = storage.sortBy(function(model) {
                    return model.get('name').substring(1);
                });
                expect(result[0].get('name')).to.equal('Larry');
                expect(result[1].get('name')).to.equal('Moe');
                expect(result[2].get('name')).to.equal('Curly');

                // indexBy
                expect(storage.indexBy).to.exists;
                expect(typeof storage.indexBy).to.equal('function');
                var result = storage.indexBy(function(model) {
                    return model.get('name');
                });
                expect(result['Curly']).to.equal(storage.collection.models[0]);
                expect(result['Larry']).to.equal(storage.collection.models[1]);
                expect(result['Moe']).to.equal(storage.collection.models[2]);

                // findIndex
                expect(storage.findIndex).to.exists;
                expect(typeof storage.findIndex).to.equal('function');
                var result = storage.findIndex(function(model) {
                    return model.get('name') == 'Moe';
                });
                expect(result).to.equal(2);

                // findLastIndex
                expect(storage.findLastIndex).to.exists;
                expect(typeof storage.findLastIndex).to.equal('function');
                var result = storage.findLastIndex(function(model) {
                    return model.get('name').length == 5;
                });
                expect(result).to.equal(1);

                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });
    })
});
