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
});
