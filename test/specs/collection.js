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
            var callback1 = sinon.spy();
            var callback2 = sinon.spy();

            contacts.fetch()
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
            var contacts = new FIXTURES.Contacts();
            obj.listenTo(contacts, 'before:fetch', beforeCallback);
            obj.listenTo(contacts, 'after:fetch', afterCallback);

            contacts.fetch({test: true, silent:false})
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

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
            var contacts = new FIXTURES.Contacts();
            obj.listenTo(contacts, 'before:fetch', beforeCallback);
            obj.listenTo(contacts, 'after:fetch', afterCallback);

            contacts.fetch({test: false, silent: true})
            .then(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
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
            var notes = new FIXTURES.Notes();
            obj.listenTo(notes, 'before:fetch', beforeCallback);
            obj.listenTo(notes, 'after:fetch', afterCallback);

            notes.fetch({test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

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

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var contacts = new FIXTURES.Contacts();
            obj.listenTo(contacts, 'before:create', beforeCallback);
            obj.listenTo(contacts, 'after:create', afterCallback);

            contacts.create(value, {test: true, silent: false})
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

                var beforeCollection = beforeCallback.args[0][0];
                var beforeAttrs = beforeCallback.args[0][1];
                var beforeOptions = beforeCallback.args[0][2];
                expect(beforeCollection).to.be.a('object');
                expect(beforeAttrs).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeCollection.length).to.equal(1);//'add' is triggered before 'request' (use {wait: true})
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

                expect(afterModel.attributes).to.be.deep.equal(_.extend({id:1}, beforeAttrs));
                expect(response).to.deep.equal(afterModel.attributes);
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.true;
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

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var notes = new FIXTURES.Notes();
            obj.listenTo(notes, 'before:create', beforeCallback);
            obj.listenTo(notes, 'after:create', afterCallback);

             notes.create(value, {test: true, silent: false})
             .then(function(data){})
             .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

                var beforeCollection = beforeCallback.args[0][0];
                var beforeAttrs = beforeCallback.args[0][1];
                var beforeOptions = beforeCallback.args[0][2];
                expect(beforeCollection).to.be.a('object');
                expect(beforeAttrs).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeCollection.length).to.equal(1);//'add' is triggered before 'request' (use {wait: true})
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
});
