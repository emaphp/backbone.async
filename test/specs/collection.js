describe("ASync.Collection tests", function() {
    before(function() {
        server = sinon.fakeServer.create();
    });

    after(function() {
        server.restore();
    });

    describe('Fetch tests', function() {
        it('must match elements', function() {
            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify([{id: 1}, {id: 2}, {id: 3}])
                ]
            );

            var contacts = new FIXTURES.Contacts();
            contacts.fetch();
            server.respond();
            expect(contacts.length).to.equal(3);

            var contact = contacts.get(1);
            expect(contact.get('id')).to.equal(1);
        });

        it('must call then', function(done) {
            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify([{id: 1}, {id: 2}, {id: 3}])
                ]
            );

            var contacts = new FIXTURES.Contacts();
            contacts.fetch({test: true, silent:false})
            .then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('collection');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');
                expect(data.collection).to.be.deep.equal(contacts);
                expect(data.collection.length).to.equal(3);

                expect(data.response).to.be.a('array');
                expect(data.response.length).to.equal(3);

                expect(data.options).is.a('object');
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must call callbacks in order', function(done) {
            var values = [{id: 1}, {id: 2}, {id: 3}];

            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(values)
                ]
            );

            var contacts = new FIXTURES.Contacts();
            var callback1 = sinon.spy();
            var callback2 = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();

            contacts.fetch({
                success: successCallback,
                complete: completeCallback
            })
            .then(callback1)
            .then(callback2)
            .then(function(data) {
                expect(callback1.called).to.be.true;
                expect(callback1.calledOnce).to.be.true;
                expect(callback2.called).to.be.true;
                expect(callback2.calledOnce).to.be.true;
                expect(callback1.calledBefore(callback2)).to.be.true;

                expect(successCallback.called).to.be.true;
                expect(successCallback.calledOnce).to.be.true;
                expect(completeCallback.called).to.be.true;
                expect(completeCallback.calledOnce).to.be.true;
                expect(successCallback.calledBefore(completeCallback)).to.be.true;

                expect(successCallback.calledBefore(completeCallback)).to.be.true;
                expect(completeCallback.calledBefore(callback1)).to.be.true;

                var firstArg = successCallback.args[0][0];
                expect(firstArg).to.deep.equal(contacts);
                var secondArg = successCallback.args[0][1];
                expect(secondArg).to.deep.equal(values);

                var firstArg = completeCallback.args[0][0];
                expect(firstArg.status).to.equal(200);
                var secondArg = completeCallback.args[0][1];
                expect(secondArg).to.equal('success');

                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must call event handlers', function(done) {
            var values = [{id: 1}, {id: 2}, {id: 3}];

            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(values)
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var contacts = new FIXTURES.Contacts();
            obj.listenTo(contacts, 'before:fetch', beforeCallback);
            obj.listenTo(contacts, 'after:fetch', afterCallback);

            contacts.fetch({
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

                expect(beforeCollection).to.be.deep.equal(contacts);
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

                expect(afterCollection).to.be.deep.equal(contacts);
                expect(afterCollection.length).to.equal(3);
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;
                expect(response.length).to.equal(3);

                var success = afterCallback.args[0][3];
                expect(success).to.be.true;

                var successCollection = successCallback.args[0][0];
                expect(successCollection).to.deep.equal(contacts);
                var successValues = successCallback.args[0][1];
                expect(successValues).to.deep.equal(values);
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
            server.respondWith(
                'GET',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify([{id: 1}, {id: 2}, {id: 3}])
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var contacts = new FIXTURES.Contacts();
            obj.listenTo(contacts, 'before:fetch', beforeCallback);
            obj.listenTo(contacts, 'after:fetch', afterCallback);

            contacts.fetch({
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
                expect(successCallback.calledBefore(completeCallback)).to.be.true;

                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });
    });

    describe('Fetch fail tests', function() {
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

            var notes = new FIXTURES.Notes();

            notes.fetch({test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(data).to.be.a('object');

                expect(data).to.have.property('collection');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.collection).to.be.deep.equal(notes);
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
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var notes = new FIXTURES.Notes();
            obj.listenTo(notes, 'before:fetch', beforeCallback);
            obj.listenTo(notes, 'after:fetch', afterCallback);

            notes.fetch({
                test: true,
                silent: false,
                error: errorCallback,
                complete: completeCallback
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
                expect(beforeCollection).to.be.deep.equal(notes);
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
                expect(afterCollection).to.be.deep.equal(notes);
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;
                expect(response.status).to.equal(500);
                expect(response.statusText).to.equal("Internal Server Error");

                var success = afterCallback.args[0][3];
                expect(success).to.be.false;

                var errorCollection = errorCallback.args[0][0];
                expect(errorCollection).to.deep.equal(notes);
                var errorResponse = errorCallback.args[0][1];
                expect(errorResponse.status).to.equal(500);
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
            var notes = new FIXTURES.Notes();
            obj.listenTo(notes, 'before:fetch', beforeCallback);
            obj.listenTo(notes, 'after:fetch', afterCallback);

            notes.fetch({test: false, silent: true})
            .then(function() {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            });

            server.respond();
        });

        it('must throw error', function(done) {
            server.respondWith(
                'GET',
                '/notes',
                [
                    200,
                    null,
                    JSON.stringify([{id: 1}, {id: 2}, {id: 3}])
                ]
            );

            var notes = new FIXTURES.Notes();

            notes.fetch()
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

    describe('Create tests', function() {
        it('must save model', function(done) {
            var value = {name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'POST',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(_.extend({id: 1}, value))
                ]
            );

            var collection = new FIXTURES.Contacts();

            collection.create(value, {test: true, silent: false})
            .then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.not.have.property('collection');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');
                expect(data.model).to.be.a('object');
                expect(data.model.attributes).to.deep.equal(data.response);
                expect(collection.length).to.equal(1);
                expect(data.response).to.deep.equal((_.extend({id: 1}, value)));
                expect(data.options).to.be.a('object');
                expect(data.options).to.have.property('test');
                expect(data.options).to.have.property('silent');
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;
                done();
            })
            .catch(function(err) {
                done(err);
            });

            server.respond();
        });

        it('must call event handlers', function(done) {
            var value = {name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'POST',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(_.extend({id: 1}, value))
                ]
            );

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var contacts = new FIXTURES.Contacts();

            contacts.on('before:create', beforeCallback);
            contacts.on('after:create', afterCallback);

            contacts.create(value, {
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
                var beforeAttributes = beforeCallback.args[0][1];
                var beforeOptions = beforeCallback.args[0][2];
                expect(beforeCollection).to.be.a('object');
                expect(beforeAttributes).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeCollection.length).to.equal(1);
                expect(beforeAttributes).to.deep.equal(value);
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

                expect(afterModel.attributes).to.deep.equal(_.extend({id:1}, value));
                expect(response).to.deep.equal(_.extend({id:1}, value));
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.true;

                var successModel = successCallback.args[0][0];
                expect(successModel.attributes).to.deep.equal((_.extend({id: 1}, value)));
                var successResponse = successCallback.args[0][1];
                expect(successResponse).to.deep.equal(_.extend({id:1}, value));
                var successOptions = successCallback.args[0][2];
                expect(successOptions.test).to.be.true;
                expect(successOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(200);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('success');

                done();
            })
            .catch(function(err) {
                done(err);
            });

            server.respond();
        });

        it('must not call event handlers', function(done) {
            var value = {name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'POST',
                '/contacts',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(_.extend({id: 1}, value))
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var contacts = new FIXTURES.Contacts();
            obj.listenTo(contacts, 'before:create', beforeCallback);
            obj.listenTo(contacts, 'after:create', afterCallback);

            contacts.create(value, {test: false, silent: true})
            .then(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            })
            .catch(function(err) {
                done(err);
            });

            server.respond();
        });
    });

    describe('Create fail tests', function() {
        it('must call catch', function(done) {
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

            var notes = new FIXTURES.Notes();

            notes.create(value, {test: true, silent: false})
            .then(function(data){})
            .catch(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                var response = data.response;
                var options = data.options;

                expect(response.status).to.equal(400);
                expect(response.statusText).to.equal('Bad Request');

                expect(options).to.be.a('object');
                expect(options).to.have.property('test');
                expect(options).to.have.property('silent');
                expect(options.test).to.be.true;
                expect(options.silent).to.be.false;

                expect(notes.length).to.equal(1); //'add' before 'request' (use {wait: true})

                done();
            })
            .catch(function(err) {done(err);});

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
            var notes = new FIXTURES.Notes();
            notes.on('before:create', beforeCallback);
            notes.on('after:create', afterCallback);

             notes.create(value, {
                test: true,
                silent: false,
                error: errorCallback,
                complete: completeCallback
            })
             .then(function(data){})
             .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;

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

                expect(response.status).to.equal(400);
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.false;

                var errorModel = errorCallback.args[0][0];
                expect(errorModel.attributes).to.deep.equal(value);

                var errorResponse = errorCallback.args[0][1];
                expect(errorResponse.status).to.equal(400);

                var errorOptions = errorCallback.args[0][2];
                expect(errorOptions.test).to.be.true;
                expect(errorOptions.silent).to.be.false;

                done();
             })
             .catch(function(err) {done(err);});
            server.respond();
        });

        it('must not call event handlers', function(done) {
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

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var notes = new FIXTURES.Notes();
            obj.listenTo(notes, 'before:create', beforeCallback);
            obj.listenTo(notes, 'after:create', afterCallback);

            notes.create(value, {test: false, silent: true})
            .then(function(data){})
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            })
            .catch(function(err) {done(err);});
            server.respond();
        });
    });

    describe('Update tests', function () {
        it('must call then', function (done) {
            var value = {id: 1, name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'PUT',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var contacts = new FIXTURES.Contacts();
            var contact = new FIXTURES.Contact(value);

            contacts.update(contact, {
                test: true,
                silent: false
            })
            .then(function (data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.model.attributes).to.deep.equal(value);
                expect(data.response).to.deep.equal(value);
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                done();
            })
            .catch(function(err) {done(err);});


            server.respond();
        });

        it('must call event handlers', function (done) {
            var value = {id: 1, name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'PUT',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var contacts = new FIXTURES.Contacts();

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var beforeSaveCallback = sinon.spy();
            var afterSaveCallback = sinon.spy();

            contacts.on('before:update', beforeCallback);
            contacts.on('after:update', afterCallback);

            var contact = new FIXTURES.Contact(value);
            contact.on('before:save', beforeSaveCallback);
            contact.on('after:save', afterSaveCallback);

            contacts.update(contact, {
                test: true,
                silent: false,
                success: successCallback,
                complete: completeCallback
            })
            .then(function (data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(successCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;
                expect(beforeSaveCallback.called).to.be.true;
                expect(afterSaveCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(beforeSaveCallback)).to.be.true;
                expect(beforeSaveCallback.calledBefore(successCallback)).to.be.true;
                expect(successCallback.calledBefore(afterSaveCallback)).to.be.true;
                expect(afterSaveCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                expect(beforeModel.attributes).to.deep.equal(value);
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterModel = afterCallback.args[0][0];
                expect(afterModel.attributes).to.deep.equal(value);
                var afterResponse = afterCallback.args[0][1];
                expect(afterResponse).to.deep.equal(value);
                var afterOptions = afterCallback.args[0][2];
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

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

                var beforeSaveModel = beforeSaveCallback.args[0][0];
                expect(beforeSaveModel).to.deep.equal(contact);
                var beforeSaveAttributes = beforeSaveCallback.args[0][1];
                expect(beforeSaveAttributes).to.equal(null);
                var beforeSaveOptions = beforeSaveCallback.args[0][2];
                expect(beforeSaveOptions.test).to.be.true;
                expect(beforeSaveOptions.silent).to.be.false;

                var afterSaveModel = afterSaveCallback.args[0][0];
                expect(afterSaveModel).to.deep.equal(contact);
                var afterSaveResponse = afterSaveCallback.args[0][1];
                expect(afterSaveResponse).to.deep.equal(value);
                var afterSaveOptions = afterSaveCallback.args[0][2];
                expect(afterSaveOptions.test).to.be.true;
                expect(afterSaveOptions.silent).to.be.false;
                var afterSaveStatus = afterSaveCallback.args[0][3];
                expect(afterSaveStatus).to.be.true;

                done();
            })
            .catch(function(err) {console.log(err); done(err);});


            server.respond();
        });

        it('must not call event handlers', function (done) {
            var value = {id: 1, name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'PUT',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var contacts = new FIXTURES.Contacts();

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var beforeSaveCallback = sinon.spy();
            var afterSaveCallback = sinon.spy();

            contacts.on('before:update', beforeCallback);
            contacts.on('after:update', afterCallback);

            var contact = new FIXTURES.Contact(value);
            contact.on('before:save', beforeSaveCallback);
            contact.on('after:save', afterSaveCallback);

            contacts.update(contact, {
                test: false,
                silent: true
            })
            .then(function (data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                expect(beforeSaveCallback.called).to.be.false;
                expect(afterSaveCallback.called).to.be.false;

                done();
            })
            .catch(function(err) {done(err);});

            server.respond();
        });
    });

    describe('Update fail tests', function () {
        it('must call catch', function (done) {
            var value = {id: 1, message: 'Hello World'};

            server.respondWith(
                'PUT',
                '/notes/1',
                [
                    500,
                    null,
                    ''
                ]
            );

            var notes = new FIXTURES.Notes();
            var note = new FIXTURES.Note(value);
            notes.add(note);

            notes.update(note, {
                test: true,
                silent: false
            })
            .then(function(){})
            .catch(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.model).to.deep.equal(note);
                expect(data.response.status).to.equal(500);
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                done();
            })
            .catch(function(err){ done(err) });

            server.respond();
        });

        it('must call event handlers', function (done) {
            var value = {id: 1, message: 'Hello World'};

            server.respondWith(
                'PUT',
                '/notes/1',
                [
                    500,
                    null,
                    ''
                ]
            );

            var notes = new FIXTURES.Notes();

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var beforeSaveCallback = sinon.spy();
            var afterSaveCallback = sinon.spy();

            notes.on('before:update', beforeCallback);
            notes.on('after:update', afterCallback);

            var note = new FIXTURES.Note(value);
            note.on('before:save', beforeSaveCallback);
            note.on('after:save', afterSaveCallback);

            notes.update(note, {
                test: true,
                silent: false,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function() {})
            .catch (function() {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(errorCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;
                expect(beforeSaveCallback.called).to.be.true;
                expect(beforeSaveCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(beforeSaveCallback)).to.be.true;
                expect(beforeSaveCallback.calledBefore(errorCallback)).to.be.true;
                expect(errorCallback.calledBefore(afterSaveCallback)).to.be.true;
                expect(afterSaveCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                expect(beforeModel.attributes).to.deep.equal(value);
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterModel = afterCallback.args[0][0];
                expect(afterModel.attributes).to.deep.equal(value);
                var afterResponse = afterCallback.args[0][1];
                expect(afterResponse.status).to.equal(500);
                var afterOptions = afterCallback.args[0][2];
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var errorModel = errorCallback.args[0][0];
                expect(errorModel.attributes).to.deep.equal(value);
                var errorResponse = errorCallback.args[0][1];
                expect(errorResponse.status).to.equal(500);
                var errorOptions = errorCallback.args[0][2];
                expect(errorOptions.test).to.be.true;
                expect(errorOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(500);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('error');

                var beforeSaveModel = beforeSaveCallback.args[0][0];
                expect(beforeSaveModel).to.deep.equal(note);
                var beforeSaveAttributes = beforeSaveCallback.args[0][1];
                expect(beforeSaveAttributes).to.equal(null);
                var beforeSaveOptions = beforeSaveCallback.args[0][2];
                expect(beforeSaveOptions.test).to.be.true;
                expect(beforeSaveOptions.silent).to.be.false;

                var afterSaveModel = afterSaveCallback.args[0][0];
                expect(afterSaveModel).to.deep.equal(note);
                var afterSaveResponse = afterSaveCallback.args[0][1];
                expect(afterSaveResponse.status).to.equal(500);
                var afterSaveOptions = afterSaveCallback.args[0][2];
                expect(afterSaveOptions.test).to.be.true;
                expect(afterSaveOptions.silent).to.be.false;
                var afterSaveStatus = afterSaveCallback.args[0][3];
                expect(afterSaveStatus).to.be.false;

                done();
            })
            .catch (function(error) { done(error); } );

            server.respond();
        });

        it('must not call event handlers', function (done) {
            var value = {message: 'Hello World'};

            server.respondWith(
                'PUT',
                'notes/1',
                [
                    500,
                    null,
                    ''
                ]
            );

            var notes = new FIXTURES.Notes();

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var beforeSaveCallback = sinon.spy();
            var afterSaveCallback = sinon.spy();

            notes.on('before:update', beforeCallback);
            notes.on('after:update', afterCallback);

            var note = new FIXTURES.Note(value);
            note.on('before:save', beforeSaveCallback);
            note.on('after:save', afterSaveCallback);

            notes.update(note, {
                test: false,
                silent: true
            })
            .then(function(){})
            .catch(function() {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                expect(beforeSaveCallback.called).to.be.false;
                expect(afterSaveCallback.called).to.be.false;

                done();
            })
            .catch(function(error){done(error)});

            server.respond();
        });
    });

    describe('Delete tests', function () {
        it('must call then', function(done) {
            var value = {id: 1, name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'DELETE',
                '/contacts/1',
                [
                    204,
                    null,
                    ''
                ]
            );

            var contacts = new FIXTURES.Contacts();
            var contact = new FIXTURES.Contact();
            contacts.add(contact);
            expect(contacts.length).to.equal(1);

            contacts.delete(contact, {
                test: true,
                silent: false
            })
            .then(function (data) {
                expect(contacts.length).to.equal(0);
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');
                expect(data.model).to.deep.equal(contact);
                expect(data.response).to.be.undefined;
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;
                done();
            })
            .catch(function(error){ done(error); });

            server.respond();
        });

        it('must call event handlers', function(done) {
            var value = {id: 1, name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'DELETE',
                '/contacts/1',
                [
                    204,
                    null,
                    ''
                ]
            );

            var contacts = new FIXTURES.Contacts();

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var beforeDestroyCallback = sinon.spy();
            var afterDestroyCallback = sinon.spy();

            contacts.on('before:delete', beforeCallback);
            contacts.on('after:delete', afterCallback);

            var contact = new FIXTURES.Contact(value);
            contact.on('before:destroy', beforeDestroyCallback);
            contact.on('after:destroy', afterDestroyCallback);
            contacts.add(contact);
            expect(contacts.length).to.equal(1);

            contacts.delete(contact, {
                test: true,
                silent: false,
                success: successCallback,
                complete: completeCallback
            })
            .then(function() {
                expect(contacts.length).to.equal(0);
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(successCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;
                expect(beforeDestroyCallback.called).to.be.true;
                expect(afterDestroyCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(beforeDestroyCallback)).to.be.true;
                expect(beforeDestroyCallback.calledBefore(successCallback)).to.be.true;
                expect(successCallback.calledBefore(afterDestroyCallback)).to.be.true;
                expect(afterDestroyCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                expect(beforeModel).to.deep.equal(contact);
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterModel = afterCallback.args[0][0];
                expect(afterModel).to.deep.equal(contact);
                var afterResponse = afterCallback.args[0][1];
                expect(afterResponse).to.be.undefined;
                var afterOptions = afterCallback.args[0][2];
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;
                var afterStatus = afterCallback.args[0][3];
                expect(afterStatus).to.be.true;

                var successModel = successCallback.args[0][0];
                expect(successModel).to.deep.equal(contact);
                var successResponse = successCallback.args[0][1];
                expect(successResponse).to.be.undefined;
                var successOptions = successCallback.args[0][2];
                expect(successOptions.test).to.be.true;
                expect(successOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(204);

                var beforeDestroyModel = beforeDestroyCallback.args[0][0];
                expect(beforeDestroyModel).to.deep.equal(contact);
                var beforeDestroyOptions = beforeDestroyCallback.args[0][1];
                expect(beforeDestroyOptions.test).to.be.true;
                expect(beforeDestroyOptions.silent).to.be.false;

                var afterDestroyModel = afterDestroyCallback.args[0][0];
                expect(afterDestroyModel).to.deep.equal(contact);
                var afterDestroyResponse = afterDestroyCallback.args[0][1];
                expect(afterDestroyResponse).to.be.undefined;
                var afterDestroyOptions = afterDestroyCallback.args[0][2];
                expect(afterDestroyOptions.test).to.be.true;
                expect(afterDestroyOptions.silent).to.be.false;
                var afterDestroyStatus = afterDestroyCallback.args[0][3];
                expect(afterDestroyStatus).to.be.true;

                done();
            })
            .catch(function(error){done(error);});

            server.respond();
        });

        it('must not call event handlers', function(done) {
            var value = {id: 1, name: 'emaphp', email: 'emaphp@github.com'};

            server.respondWith(
                'DELETE',
                '/contacts/1',
                [
                    204,
                    null,
                    ''
                ]
            );

            var contacts = new FIXTURES.Contacts();

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();

            contacts.on('before:udpate', beforeCallback);
            contacts.on('after:update', afterCallback);

            var contact = new FIXTURES.Contact(value);
            contacts.add(contact);

            contacts.delete(contact, {
                test: false,
                silent: true
            })
            .then(function() {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            })
            .catch(function(error){done(error)});

            server.respond();
        });
    });

    describe('Delete fail tests', function () {
        it('must call catch', function (done) {
            var value = {id: 1, message: 'Hello World'};

            server.respondWith(
                'DELETE',
                '/notes/1',
                [
                    500,
                    null,
                    ''
                ]
            );

            var notes = new FIXTURES.Notes();
            var note = new FIXTURES.Note(value);
            notes.add(note);

            notes.delete(note, {
                test: true,
                silent: false
            })
            .then(function () {})
            .catch(function (data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.model).to.deep.equal(note);
                expect(data.response.status).to.equal(500);
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                done();
            })
            .catch(function(error) { done(error); });

            server.respond();
        });

        it('must call event handlers', function (done) {
            var value = {id: 1, message: 'Hello World'};

            server.respondWith(
                'DELETE',
                '/notes/1',
                [
                    500,
                    null,
                    ''
                ]
            );

            var notes = new FIXTURES.Notes();
            var note = new FIXTURES.Note(value);
            notes.add(note);

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var beforeDestroyCallback = sinon.spy();
            var afterDestroyCallback = sinon.spy();

            notes.on('before:delete', beforeCallback);
            notes.on('after:delete', afterCallback);
            note.on('before:destroy', beforeDestroyCallback);
            note.on('after:destroy', afterDestroyCallback);

            notes.delete(note, {
                test: true,
                silent: false,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function(){})
            .catch(function() {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(errorCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;
                expect(beforeDestroyCallback.called).to.be.true;
                expect(afterDestroyCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(beforeDestroyCallback)).to.be.true;
                expect(beforeDestroyCallback.calledBefore(errorCallback)).to.be.true;
                expect(errorCallback.calledBefore(afterDestroyCallback)).to.be.true;
                expect(afterDestroyCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                expect(beforeModel).to.deep.equal(note);
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterModel = afterCallback.args[0][0];
                expect(afterModel).to.deep.equal(note);
                var afterResponse = afterCallback.args[0][1];
                expect(afterResponse.status).to.equal(500);
                var afterOptions = afterCallback.args[0][2];
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;
                var afterStatus = afterCallback.args[0][3];
                expect(afterStatus).to.be.false;

                var errorModel = errorCallback.args[0][0];
                expect(errorModel).to.deep.equal(note);
                var errorResponse = errorCallback.args[0][1];
                expect(errorResponse.status).to.equal(500);
                var errorOptions = errorCallback.args[0][2];
                expect(errorOptions.test).to.be.true;
                expect(errorOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(500);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('error');

                var beforeDestroyModel = beforeDestroyCallback.args[0][0];
                expect(beforeDestroyModel).to.deep.equal(note);
                var beforeDestroyOptions = beforeDestroyCallback.args[0][1];
                expect(beforeDestroyOptions.test).to.be.true;
                expect(beforeDestroyOptions.silent).to.be.false;

                var afterDestroyModel = afterDestroyCallback.args[0][0];
                expect(afterDestroyModel).to.deep.equal(note);
                var afterDestroyResponse = afterDestroyCallback.args[0][1];
                expect(afterDestroyResponse.status).to.equal(500);
                var afterDestroyOptions = afterDestroyCallback.args[0][2];
                expect(afterDestroyOptions.test).to.be.true;
                expect(afterDestroyOptions.silent).to.be.false;
                var afterDestroyStatus = afterDestroyCallback.args[0][3];
                expect(afterDestroyStatus).to.be.false;

                done();
            })
            .catch(function(error){done(error);});

            server.respond();
        });

        it('must not call event handlers', function (done) {
            var value = {id: 1, message: 'Hello World'};

            server.respondWith(
                'DELETE',
                '/notes/1',
                [
                    500,
                    null,
                    ''
                ]
            );

            var notes = new FIXTURES.Notes();
            var note = new FIXTURES.Note(value);
            notes.add(note);

            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var beforeDestroyCallback = sinon.spy();
            var afterDestroyCallback = sinon.spy();
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();

            notes.on('before:delete', beforeCallback);
            notes.on('after:delete', afterCallback);
            note.on('before:destroy', beforeDestroyCallback);
            note.on('after:destroy', afterDestroyCallback);

            notes.delete(note, {
                test: false,
                silent: true,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function(){})
            .catch(function() {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                expect(errorCallback.called).to.be.true;
                expect(completeCallback.called).to.be.true;
                expect(beforeDestroyCallback.called).to.be.false;
                expect(afterDestroyCallback.called).to.be.false;

                done();
            })
            .catch(function(error){done(error);});

            server.respond();
        });
    });
});
