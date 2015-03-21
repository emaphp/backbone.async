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

                var dataArg = beforeCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('collection');
                expect(dataArg).to.have.property('options');
                expect(dataArg.collection).to.be.deep.equal(contacts);
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;

                dataArg = afterCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('collection');
                expect(dataArg).to.have.property('options');
                expect(dataArg).to.have.property('response');
                expect(dataArg.collection).to.be.deep.equal(contacts);
                expect(dataArg.collection.length).to.equal(3);
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;
                expect(dataArg.response).to.be.a('array');
                expect(dataArg.response.length).to.equal(3);

                var success = afterCallback.args[0][1];
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

                var dataArg = beforeCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('collection');
                expect(dataArg).to.have.property('options');
                expect(dataArg.collection).to.be.deep.equal(notes);
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;

                dataArg = afterCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('collection');
                expect(dataArg).to.have.property('options');
                expect(dataArg).to.have.property('response');
                expect(dataArg.collection).to.be.deep.equal(notes);
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
});