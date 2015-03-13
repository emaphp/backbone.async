describe("ASync.Model tests", function() {
    var server = sinon.fakeServer.create();

    describe('Default values', function() {
        it('attributes should be equal', function() {
            var contact = new FIXTURES.Contact({id: 1});
            expect(contact.get('id')).to.equal(1);
            expect(contact.get('name')).to.equal('emaphp');
        });
    });

    describe('Fetch test', function() {
        it('must equal', function() {
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
    });

    describe('Then test', function() {
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
    });

    describe('Options test', function() {
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
    });

    describe('Cascade test', function() {
        it('must call thenable', function(done) {
            server.respondWith(
                'GET',
                '/contacts/4',
                [
                    200,
                    {"Content-Type": "application/json"},
                    JSON.stringify({ id: 4, name: "Emmanuel", surname: "Antico"})
                ]
            );

            var contact = new FIXTURES.Contact({id: 1});
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
                done();
            })
            .catch(function() {});

            server.respond();
        });        
    });
});