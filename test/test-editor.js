'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var net = require('net');
var Editor = require('../lib/editor').Editor;
var utils = require('../lib/utils');
var parser = utils.parser();

utils.logger.disableAll();

const HOST = '';
const PORT = 34552;
const UNOCCUPIED_PORT = 34553;
const HANDSHAKE_RESPONSE = {
	handshake: true,
};
const INVALID_HANDSHAKE_RESPONSE = {};

describe('Editor', function () {
	beforeEach(function (done) {
		setTimeout(done, 100);
	});

	describe('#create', function () {
		it('should be a function', function () {
			expect(Editor.create).to.be.a.function;
		});

		it('should error when passed no port option', function () {
			function create() {
				Editor.create({});
			}
			expect(create).to.throw(/port/);
		});

		it('should return an object', function () {
			var editor = Editor.create({
				port: PORT,
				autoConnect: false,
			});
			expect(editor).to.be.a.object;
		});
	});

	it('should emit a invalid_handshake event when the handshake fails', function (done) {
		var server = net.createServer(function (s) {
			s.write(parser.encode(INVALID_HANDSHAKE_RESPONSE));
		}).listen(PORT, 'localhost');

		var editor = Editor.create({
			port: PORT,
			reconnection: false
		});

		editor.on('invalid_handshake', function () {
			server.close(function () {
				done();
			});
		});
	});

	it('should remain connected when the handshake response from the server is valid', function (done) {
		this.timeout(5000);
		var server = net.createServer(function (s) {
			s.write(parser.encode(HANDSHAKE_RESPONSE));
			setTimeout(function () {
				s.end(parser.encode({}))
				server.close(function () {
					done();
				});
			}, 2000);
		}).listen(PORT, 'localhost');

		var editor = Editor.create({
			port: PORT,
			reconnection: false,
		});

		editor.on('invalid_handshake', function (data) {
			expect.fail();
		});
	});

	it('should emit a connect event after the socket has connected', function (done) {
		var server = net.createServer(function (s) {
			s.write(parser.encode(HANDSHAKE_RESPONSE));
		}).listen(PORT, 'localhost');
		var editor = Editor.create({
			port: PORT,
			reconnection: false,
		});
		editor.on('connect', function () {
			editor.close();
			server.close(function () {
				done();
			});
		});
	});

	it('should emit a close event after the underlying socket has disconnected', function (done) {
		var editor = Editor.create({
			port: UNOCCUPIED_PORT,
			reconnection: false,
		});
		editor.on('close', function () {
			done();
		});
	});

	describe('#configure', function () {
		it('should be a function', function () {
			var editor = Editor.create({
				port: PORT,
				reconnection: false,
				autoConnect: false,
			})
			expect(editor.configure).to.be.a.function;
		});
		it('should accept and set a gulp object', function () {
			var editor = Editor.create({
				port: PORT,
				reconnection: false,
				autoConnect: false,
			})
		});
	});

	describe('#run', function () {
		it('should be a function', function () {
			var editor = Editor.create({
				port: PORT,
				reconnection: false,
				autoConnect: false,
			})
			expect(editor.run).to.be.a.function;
		});

		it('should not throw an error when not connected', function () {
			var editor = Editor.create({
				port: PORT,
				reconnection: false,
				autoConnect: false,
			});
			expect(editor.run).to.not.throw;
		});
	});
});