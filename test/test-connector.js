'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var net    = require('net');
var Connector = require('../lib/connector').default;

const HOST = '';
const PORT = 34552;
const UNOCCUPIED_PORT = 34553;

function logger() {}

describe('Connector', function () {
	beforeEach(function (done) {
		setTimeout(done, 100);
	});

	it('should be an object', function () {
		expect(Connector).to.be.a.object;
	});

	it('should accept and set the parser, reconnect attempts, and delay from the init options', function () {
		var EXPECTED_PARSER = { decode: function () {}, encode: function () {} };
		var EXPECTED_DELAY = 100;
		var EXPECTED_ATTEMPTS = 5;
		var connector = Object.create(Connector);
		connector.init({
			log: logger,
			port: UNOCCUPIED_PORT,
			parser: EXPECTED_PARSER,
			reconnectionDelay: EXPECTED_DELAY,
			reconnectionAttempts: EXPECTED_ATTEMPTS,
		});
		expect(connector.getParser()).to.deep.equal(EXPECTED_PARSER);
		expect(connector.getReconnectionDelay()).to.equal(EXPECTED_DELAY);
		expect(connector.getReconnectionAttempts()).to.equal(EXPECTED_ATTEMPTS);
	});

	it('should allow the options to be set through setter functions', function () {
		var EXPECTED_PARSER = { decode: function () {}, encode: function () {} };
		var EXPECTED_DELAY = 100;
		var EXPECTED_ATTEMPTS = 5;
		var EXPECTED_PARSER = {};
		var connector = Object.create(Connector);
		connector.init({
			log: logger,
			port: UNOCCUPIED_PORT,
		});

		connector.setParser(EXPECTED_PARSER);
		connector.setReconnectionDelay(EXPECTED_DELAY);
		connector.setReconnectionAttempts(EXPECTED_ATTEMPTS);

		expect(connector.getParser()).to.deep.equal(EXPECTED_PARSER);
		expect(connector.getReconnectionDelay()).to.equal(EXPECTED_DELAY);
		expect(connector.getReconnectionAttempts()).to.equal(EXPECTED_ATTEMPTS);
	});

	it('should not reconnect by default', function (done) {
		var connector = Object.create(Connector);
		connector.init({
			log: logger,
			port: UNOCCUPIED_PORT,
			reconnectionDelay: 100,
		});

		connector.on('reconnect_attempt', function () {
			expect.fail();
		});

		setTimeout(function () {
			done();
		}, 1000);
	});

	it('should reconnect when the reconnect option is enabled', function (done) {
		var connector = Object.create(Connector);
		connector.init({
			log: logger,
			port: UNOCCUPIED_PORT,
			reconnectionDelay: 100,
			reconnection: true,
		});

		connector.once('reconnect_attempt', function () {
			connector.close();
			done();
		});
	});

	it('should try to reconnect the number of attempts passed', function (done) {
		this.timeout(10000);
		var EXPECTED_ATTEMPTS = 5;
		var connector = Object.create(Connector);
		connector.init({
			log: logger,
			port: UNOCCUPIED_PORT,
			reconnectionDelay: 10,
			reconnectionAttempts: EXPECTED_ATTEMPTS,
			reconnection: true,
		});

		var attempts = 0;
		connector.on('reconnect_attempt', function (attempt) {
			attempts++;
			expect(attempts).to.equal(attempt);

			if (attempts === EXPECTED_ATTEMPTS) {
				connector.close();
				done();
			}
		});
	});

	it('should emit connect and close events', function (done) {
		var server = net.createServer(function (s) {
			s.end(JSON.stringify('bye') + '\n');
		}).listen(PORT, 'localhost');
		var connector = Object.create(Connector);
		connector.init({
			log: logger,
			port: PORT,
		});
		connector.on('connect', function () {
			connector.on('close', function () {
				server.close(function () {
					done();
				});
			});
		});
	});

	it('should emit a data event when the server sends data', function (done) {
		var EXPECTED = ['peanuts'];
		var server = net.createServer(function (s) {
			s.end(JSON.stringify('peanuts') + '\n');
		}).listen(PORT, 'localhost');
		var connector = Object.create(Connector);
		connector.init({
			log: logger,
			port: PORT,
		});
		connector.on('connect', function () {
			connector.on('data', function (data) {
				expect(data).to.deep.eql(EXPECTED);
				server.close(function () {
					done();
				});
			});
		});
	});

	it('should create a socket connection on the port specified in the options', function (done) {
		var server = net.createServer(function (s) {
			s.end(JSON.stringify('bye') + '\n');
			server.close(function () {
				done();
			});
		}).listen(PORT, 'localhost');

		var connector = Object.create(Connector);
		connector.init({
			log: logger,
			port: PORT,
		});
	});

	describe('#send', function () {
		it('should send a message in JSON format to the server', function (done) {
			var EXPECTED = 'peanuts';
			var server = net.createServer(function (s) {
				s.on('data', function (data) {
					var actual = JSON.parse(data.toString());
					expect(actual).to.equal(EXPECTED);
					s.end(JSON.stringify('bye') + '\n');
					server.close(function () {
						connector.close();
						done();
					});
				});
			}).listen(PORT, 'localhost');
			var connector = Object.create(Connector);
			connector.init({
				log: logger,
				port: PORT,
			});
			connector.on('connect', function () {
				connector.send(EXPECTED);
			});
		});
	});

	describe('#close', function () {
		it('should close the underlying socket of the connector', function (done) {
			var server = net.createServer(function (s) {
			}).listen(PORT, 'localhost');
			var connector = Object.create(Connector);

			connector.init({
				log: logger,
				port: PORT,
			});
			connector.on('connect', function () {
				connector.close();
			});
			connector.on('close', function () {
				server.close(function () {
					done();
				});
			});
		});
	});
});
