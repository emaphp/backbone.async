describe("ASync.Model tests", function() {
    var server = sinon.fakeServer.create();

    after(function() {
        server.restore();
    });

    describe('Fetch test', function() {
        it('must equal attributes', function() {
            server.respondWith(
                'GET',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify({ id: 1, name: "Emmanuel", surname: "Antico"})
                ]
            );

            var contact = new FIXTURES.Contact({id: 1});
            contact.fetch();
            server.respond();

            expect(contact.get('id')).to.equal(1);
            expect(contact.get('name')).to.equal('Emmanuel');
            expect(contact.get('surname')).to.equal('Antico');
        });

        it('must call then', function(done) {
            server.respondWith(
                'GET',
                '/contacts/2',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify({ id: 2, name: "Emmanuel", surname: "Antico"})
                ]
            );

            var contact = new FIXTURES.Contact({id: 2});

            contact.fetch().
            then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');
                expect(data.model).to.be.deep.equal(contact);

                var attrs = data.model.attributes;
                expect(attrs).to.have.property('id');
                expect(attrs).to.have.property('name');
                expect(attrs).to.have.property('surname');

                var response = data.response;
                expect(response).to.be.deep.equal({ id: 2, name: "Emmanuel", surname: "Antico"});
                expect(response).to.be.deep.equal(data.model.attributes);

                done();
            })
            .catch(function() {});
            server.respond();
        });

        it('must match options', function(done) {
            server.respondWith(
                'GET',
                '/contacts/3',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify({ id: 3, name: "Emmanuel", surname: "Antico"})
                ]
            );

            var contact = new FIXTURES.Contact({id: 3});

            contact.fetch({test: true, silent:false}).
            then(function(data) {
                var options = data.options;
                expect(options).to.be.a('object');
                expect(options).to.have.property('test');
                expect(options).to.have.property('silent');

                expect(options.test).to.be.true;
                expect(options.silent).to.be.false;

                done();
            })
            .catch(function() {});
            server.respond();
        });

        it('must call callbacks in order', function(done) {
            server.respondWith(
                'GET',
                '/contacts/4',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify({ id: 4, name: "Emmanuel", surname: "Antico"})
                ]
            );

            var contact = new FIXTURES.Contact({id: 4});
            var callback1 = sinon.spy();
            var callback2 = sinon.spy();

            contact.fetch()
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
            .catch(function() {});

            server.respond();
        });
    });

    describe('Fetch fail test', function() {
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

            var note = new FIXTURES.Note({id: 1});
            note.fetch()
            .then(function() {
            })
            .catch(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');
                expect(data.model).to.be.deep.equal(note);
                expect(data.response).to.be.a('object');
                expect(data.response.status).to.equal(404)
                expect(data.response.statusText).to.equal("Not Found");
                done();
            });

            server.respond();
        });

        it('must receive options', function(done) {
            server.respondWith(
                'GET',
                '/notes/2',
                [
                    404,
                    null,
                    ''
                ]
            );

            var note = new FIXTURES.Note({id: 2});
            note.fetch({test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
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
                '/notes/3',
                [
                    500,
                    null,
                    ''
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var note = new FIXTURES.Note({id: 3});
            obj.listenTo(note, 'before:fetch', beforeCallback);
            obj.listenTo(note, 'after:fetch', afterCallback);

            note.fetch({test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                expect(beforeCallback.calledBefore(afterCallback)).to.be.true;

                var dataArg = beforeCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('model');
                expect(dataArg).to.have.property('options');
                expect(dataArg.model).to.be.deep.equal(note);
                expect(dataArg.options).to.have.property('test');
                expect(dataArg.options).to.have.property('silent');
                expect(dataArg.options.test).to.be.true;
                expect(dataArg.options.silent).to.be.false;

                var dataArg = afterCallback.args[0][0];
                expect(dataArg).to.be.a('object');
                expect(dataArg).to.have.property('model');
                expect(dataArg).to.have.property('options');
                expect(dataArg).to.have.property('response');
                expect(dataArg.model).to.be.deep.equal(note);
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
                '/notes/4',
                [
                    500,
                    null,
                    ''
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var note = new FIXTURES.Note({id: 4});
            obj.listenTo(note, 'before:fetch', beforeCallback);
            obj.listenTo(note, 'after:fetch', afterCallback);

            note.fetch({test: false, silent: true})
            .then(function() {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            });

            server.respond();
        });
    });
});