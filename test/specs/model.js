describe("ASync.Model tests", function() {
    before(function() {
        server = sinon.fakeServer.create();
    });

    after(function() {
        server.restore();
    });

    /*describe('Fetch test', function() {
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

            contact.fetch({test: true, silent:false}).
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
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must call event handlers', function(done) {
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

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var contact = new FIXTURES.Contact({id: 5});
            obj.listenTo(contact, 'before:fetch', beforeCallback);
            obj.listenTo(contact, 'after:fetch', afterCallback);

            contact.fetch({
                test: true,
                silent:false,
                success: successCallback,
                complete: completeCallback
            })
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                
                expect(beforeCallback.calledBefore(successCallback)).to.be.true;
                expect(successCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeModel).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeModel).to.be.deep.equal(contact);
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

                expect(afterModel).to.be.deep.equal(contact);
                expect(response).to.be.deep.equal(afterModel.attributes);

                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.true;

                var successModel = successCallback.args[0][0];
                expect(successModel).to.deep.equal(contact);
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

        it('must not call event handlers', function(done) {
            server.respondWith(
                'GET',
                '/contacts/6',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify({ id: 6, name: "Emmanuel", surname: "Antico"})
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var contact = new FIXTURES.Contact({id: 6});
            obj.listenTo(contact, 'before:fetch', beforeCallback);
            obj.listenTo(contact, 'after:fetch', afterCallback);

            contact.fetch({test: false, silent: true})
            .then(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            })
            .catch(function(err) { done(err); });

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
            note.fetch({test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');
                expect(data.model).to.be.deep.equal(note);
                expect(data.response).to.be.a('object');
                expect(data.response.status).to.equal(404);
                expect(data.response.statusText).to.equal("Not Found");

                expect(data.options).to.have.property('test');
                expect(data.options).to.have.property('silent');
                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;
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
            var errorCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var note = new FIXTURES.Note({id: 3});
            obj.listenTo(note, 'before:fetch', beforeCallback);
            obj.listenTo(note, 'after:fetch', afterCallback);

            note.fetch({
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

                expect(beforeCallback.calledBefore(errorCallback)).to.be.true;
                expect(errorCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeModel).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeModel).to.be.deep.equal(note);
                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterModel = afterCallback.args[0][0];
                var response = afterCallback.args[0][1];
                var afterOptions = afterCallback.args[0][2]
                expect(afterModel).to.be.a('object');
                expect(response).to.be.a('object');
                expect(afterOptions).to.be.a('object');

                expect(beforeModel).to.be.deep.equal(note);
                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;
                expect(response.status).to.equal(500);
                expect(response.statusText).to.equal("Internal Server Error");

                var success = afterCallback.args[0][3];
                expect(success).to.be.false;

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

        it('must throw error', function(done) {
            server.respondWith(
                'GET',
                '/notes/5',
                [
                    200,
                    null,
                    JSON.stringify({id: 5, name: 'Emmanuel', surname: 'Antico'})
                ]
            );

            var note = new FIXTURES.Note({id: 5});
            
            note.fetch()
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

    describe('Save tests', function() {
        it('must call then', function(done) {
            var value = {id: 1, name: 'Emmanuel', surname: 'Antico'};
            server.respondWith(
                'PUT',
                '/contacts/1',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var contact = new FIXTURES.Contact(value);

            contact.save(null, {test: true, silent: false})
            .then(function(data) {
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
                expect(response).to.be.deep.equal(value);
                expect(response).to.be.deep.equal(data.model.attributes);

                expect(data.options).to.be.a('object');
                expect(data.options).to.have.property('test');
                expect(data.options).to.have.property('silent');

                expect(data.options.test).to.be.true;
                expect(data.options.silent).to.be.false;

                done();
            })
            .catch(function(err){done(err);});

            server.respond();
        });

        it('must call callbacks in order', function(done) {
            var value = {id: 2, name: 'Emmanuel', surname: 'Antico'};
            server.respondWith(
                'PUT',
                '/contacts/2',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var contact = new FIXTURES.Contact(value);
            var callback1 = sinon.spy();
            var callback2 = sinon.spy();

            contact.save()
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
            var value = {id: 3, name: 'Emmanuel', surname: 'Antico'};
            server.respondWith(
                'PUT',
                '/contacts/3',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var contact = new FIXTURES.Contact(value);
            obj.listenTo(contact, 'before:save', beforeCallback);
            obj.listenTo(contact, 'after:save', afterCallback);

            contact.save(value, {
                test: true,
                silent:false,
                success: successCallback,
                complete: completeCallback
            })
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(successCallback)).to.be.true;
                expect(successCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                var beforeAttrs = beforeCallback.args[0][1];
                var beforeOptions = beforeCallback.args[0][2];
                expect(beforeModel).to.be.a('object');
                expect(beforeAttrs).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeModel).to.be.deep.equal(contact);
                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;
                expect(beforeAttrs).to.be.deep.equal(value);

                var afterModel = afterCallback.args[0][0];
                var response = afterCallback.args[0][1];
                var afterOptions = afterCallback.args[0][2];
                expect(afterModel).to.be.a('object');
                expect(response).to.be.a('object');
                expect(afterOptions).to.be.a('object');
                expect(afterModel).to.be.deep.equal(contact);
                expect(response).to.be.deep.equal(afterModel.attributes);
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.true;

                var successModel = successCallback.args[0][0];
                expect(successModel).to.deep.equal(contact);
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

        it('must match attrs', function(done) {
            var value = {id: 4, name: 'Emmanuel', surname: 'Antico'};
            server.respondWith(
                'PUT',
                '/contacts/4',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var contact = new FIXTURES.Contact(value);
            obj.listenTo(contact, 'before:save', beforeCallback);

            contact.save()
            .then(function(data) {
                var attrs = beforeCallback.args[0][1];
                expect(attrs).to.be.undefined;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();   
        });

        it('must not call event handlers', function(done) {
            var value = {id: 5, name: 'Emmanuel', surname: 'Antico'};
            server.respondWith(
                'PUT',
                '/contacts/5',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var contact = new FIXTURES.Contact(value);
            obj.listenTo(contact, 'before:save', beforeCallback);
            obj.listenTo(contact, 'after:save', afterCallback);

            contact.save(value, {test: false, silent: true})
            .then(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });
    });

    describe('Save fail tests', function() {
        it('must call catch', function(done) {
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

            var note = new FIXTURES.Note(value);

            note.save(note.attributes, {test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(data).to.be.a('object');
                
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.model).to.be.deep.equal(note);
                expect(data.response).to.be.a('object');
                expect(data.response).to.have.property('status');
                expect(data.response).to.have.property('statusText');
                expect(data.response.status).to.equal(500);
                expect(data.response.statusText).to.equal('Internal Server Error');

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
            var value = {id: 2, message: 'Hello World'};
            server.respondWith(
                'PUT',
                '/notes/2',
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
            var note = new FIXTURES.Note(value);
            obj.listenTo(note, 'before:save', beforeCallback);
            obj.listenTo(note, 'after:save', afterCallback);

            note.save(value, {
                test: true,
                silent:false,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function(data) {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(errorCallback)).to.be.true;
                expect(errorCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                var attrs = beforeCallback.args[0][1];
                var beforeOptions = beforeCallback.args[0][2];
                expect(beforeModel).to.be.a('object');
                expect(attrs).to.be.a('object');
                expect(beforeOptions).to.be.a('object');

                expect(beforeModel).to.be.deep.equal(note);
                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;
                expect(attrs).to.be.deep.equal(value);

                var afterModel = afterCallback.args[0][0];
                var response = afterCallback.args[0][1];
                var afterOptions = afterCallback.args[0][2];
                expect(afterModel).to.be.a('object');
                expect(response).to.be.a('object');
                expect(afterOptions).to.be.a('object');

                expect(afterModel).to.be.deep.equal(note);
                expect(response).to.be.a('object');
                expect(response).to.have.property('status');
                expect(response).to.have.property('statusText');
                expect(response.status).to.equal(500);
                expect(response.statusText).to.equal('Internal Server Error');

                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.false;
                
                var errorModel = errorCallback.args[0][0];
                expect(errorModel).to.deep.equal(note);
                var errorResponse = errorCallback.args[0][1];
                expect(errorResponse.status).to.equal(500);
                var errorOptions = errorCallback.args[0][2];
                expect(errorOptions.test).to.be.true;

                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(500);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('error');

                done();
            });

            server.respond();
        });

        it('must not call event handlers', function(done) {
            var value = {id: 3, message: 'Hello World'};
            server.respondWith(
                'PUT',
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
            var note = new FIXTURES.Note(value);
            obj.listenTo(note, 'before:save', beforeCallback);
            obj.listenTo(note, 'after:save', afterCallback);

            note.save(value, {test: false, silent:true})
            .then(function(data) {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            });

            server.respond();
        });

        it('must throw error', function(done) {
            var value = {id: 4, message: 'Hello World'};
            server.respondWith(
                'PUT',
                '/notes/4',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify(value)
                ]
            );

            var note = new FIXTURES.Note(value);
            note.save()
            .then(function(data) {
                throw new Error();
            })
            .catch(function(err) {
                expect(_.isError(err)).to.be.true;
                done();
            });

            server.respond();
        });
    });*/

    describe('Delete tests', function() {
        /*it('must call then', function(done) {
            server.respondWith(
                'DELETE',
                '/contacts/1',
                [
                    204,
                    null,
                    ''
                ]
            );

            var contact = new FIXTURES.Contact({id: 1});

            contact.destroy({test: true, silent:false})
            .then(function(data) {
                expect(data).to.be.a('object');
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');
                expect(data.model).to.be.deep.equal(contact);

                var attrs = data.model.attributes;
                expect(attrs).to.have.property('id');

                var response = data.response;
                expect(response).to.be.undefined;

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

        it('must call callbacks in order', function(done) {
            server.respondWith(
                'DELETE',
                '/contacts/2',
                [
                    204,
                    null,
                    ''
                ]
            );

            var contact = new FIXTURES.Contact({id: 2});
            var callback1 = sinon.spy();
            var callback2 = sinon.spy();

            contact.destroy()
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
        });*/

        it('must call event handlers', function(done) {
            server.respondWith(
                'DELETE',
                '/contacts/3',
                [
                    204,
                    null,
                    ''
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var successCallback = sinon.spy();
            var completeCallback = sinon.spy();
            var contact = new FIXTURES.Contact({id: 3});
            obj.listenTo(contact, 'before:destroy', beforeCallback);
            obj.listenTo(contact, 'after:destroy', afterCallback);

            contact.destroy({
                test: true,
                silent:false,
                success: successCallback,
                complete: completeCallback
            })
            .then(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;
                
                expect(beforeCallback.calledBefore(successCallback)).to.be.true;
                expect(successCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeModel).to.be.a('object');
                expect(beforeOptions).to.be.a('object');
                expect(beforeModel).to.be.deep.equal(contact);
                expect(beforeOptions).to.have.property('test');
                expect(beforeOptions).to.have.property('silent');
                expect(beforeOptions.test).to.be.true;
                expect(beforeOptions.silent).to.be.false;

                var afterModel = afterCallback.args[0][0];
                var response = afterCallback.args[0][1];
                var afterOptions = afterCallback.args[0][2];
                expect(afterModel).to.be.a('object');
                expect(afterOptions).to.be.a('object');
                expect(afterModel).to.be.deep.equal(contact);
                expect(response).to.be.undefined;
                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.true;

                var successModel = successCallback.args[0][0];
                expect(successModel).to.deep.equal(contact);
                var successResponse = successCallback.args[0][1];
                expect(successResponse).to.be.undefined;
                var successOptions = successCallback.args[0][2];
                expect(successOptions.test).to.be.true;
                expect(successOptions.silent).to.be.false;
                
                var completeResponse = completeCallback.args[0][0];
                expect(completeResponse.status).to.equal(204);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('nocontent');

                done();
            })
            .catch(function(err) { done(err); });

            server.respond();   
        });

        /*it('must not call event handlers', function(done) {
            server.respondWith(
                'DELETE',
                '/contacts/4',
                [
                    204,
                    null,
                    ''
                ]
            );

            var obj = _.extend({}, Backbone.Events);
            var beforeCallback = sinon.spy();
            var afterCallback = sinon.spy();
            var contact = new FIXTURES.Contact({id: 4});
            obj.listenTo(contact, 'before:destroy', beforeCallback);
            obj.listenTo(contact, 'after:destroy', afterCallback);

            contact.destroy({test: false, silent: true})
            .then(function() {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            })
            .catch(function(err) { done(err); });

            server.respond();
        });

        it('must throw error', function(done) {
            server.respondWith(
                'DELETE',
                '/contacts/5',
                [
                    204,
                    null,
                    ''
                ]
            );

            var contact = new FIXTURES.Contact({id: 5});
            
            contact.destroy()
            .then(function(data) {
                throw new Error();
            })
            .catch(function(err) {
                expect(_.isError(err)).to.be.true;
                done();
            });

            server.respond();
        });*/
    });

    /*describe('Delete fail tests', function() {
        it('must call catch', function(done) {
            server.respondWith(
                'DELETE',
                '/notes/1',
                [
                    500,
                    null,
                    ''
                ]
            );

            var note = new FIXTURES.Note({id: 1});

            note.destroy({test: true, silent: false})
            .then(function() {
            })
            .catch(function(data) {
                expect(data).to.be.a('object');
                
                expect(data).to.have.property('model');
                expect(data).to.have.property('response');
                expect(data).to.have.property('options');

                expect(data.model).to.be.deep.equal(note);
                expect(data.response).to.be.a('object');
                expect(data.response).to.have.property('status');
                expect(data.response).to.have.property('statusText');
                expect(data.response.status).to.equal(500);
                expect(data.response.statusText).to.equal('Internal Server Error');

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
                'DELETE',
                '/notes/2',
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
            var note = new FIXTURES.Note({id: 2});
            obj.listenTo(note, 'before:destroy', beforeCallback);
            obj.listenTo(note, 'after:destroy', afterCallback);

            note.destroy({
                test: true,
                silent: false,
                error: errorCallback,
                complete: completeCallback
            })
            .then(function(data) {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.true;
                expect(afterCallback.called).to.be.true;

                expect(beforeCallback.calledBefore(errorCallback)).to.be.true;
                expect(errorCallback.calledBefore(afterCallback)).to.be.true;
                expect(afterCallback.calledBefore(completeCallback)).to.be.true;

                var beforeModel = beforeCallback.args[0][0];
                var beforeOptions = beforeCallback.args[0][1];
                expect(beforeModel).to.be.a('object');
                expect(beforeOptions).to.be.a('object');
                expect(beforeModel).to.be.deep.equal(note);
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

                expect(afterModel).to.be.deep.equal(note);
                expect(response).to.be.a('object');
                expect(response).to.have.property('status');
                expect(response).to.have.property('statusText');
                expect(response.status).to.equal(500);
                expect(response.statusText).to.equal('Internal Server Error');

                expect(afterOptions).to.have.property('test');
                expect(afterOptions).to.have.property('silent');
                expect(afterOptions.test).to.be.true;
                expect(afterOptions.silent).to.be.false;

                var success = afterCallback.args[0][3];
                expect(success).to.be.false;
                
                var errorModel = errorCallback.args[0][0];
                expect(errorModel).to.deep.equal(note);
                var errorResponse = errorCallback.args[0][1];
                expect(errorResponse.status).to.equal(500);
                var errorOptions = errorCallback.args[0][2];
                expect(errorOptions.test).to.be.true;
                expect(errorOptions.silent).to.be.false;

                var completeResponse = completeCallback.args[0][0]
                expect(completeResponse.status).to.equal(500);
                var completeStatus = completeCallback.args[0][1];
                expect(completeStatus).to.equal('error');

                done();
            })
            .catch(function(error) { done(error); });

            server.respond();
        });

        it('must not call event handlers', function(done) {
            server.respondWith(
                'DELETE',
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
            obj.listenTo(note, 'before:save', beforeCallback);
            obj.listenTo(note, 'after:save', afterCallback);

            note.destroy({test: false, silent:true})
            .then(function(data) {
            })
            .catch(function(data) {
                expect(beforeCallback.called).to.be.false;
                expect(afterCallback.called).to.be.false;
                done();
            });

            server.respond();
        });
    });*/
});
