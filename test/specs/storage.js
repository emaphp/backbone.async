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
    });
});