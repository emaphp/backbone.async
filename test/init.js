var expect = chai.expect;
mocha.setup("bdd");
window.onload = function () {
    (window.mochaPhantomJS || mocha).run();
};

var server;