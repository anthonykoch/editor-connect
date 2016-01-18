'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var utils = require('../lib/utils');
var normalizeError = utils.normalizeError;
var parser = utils.parser;
var logger = utils.logger;

var END_OF_MESSAGE = '\n';

describe('normalizeError', function () {
	it('should be defined as function', function() {
		expect(normalizeError).to.be.a.function;
	});

	it('should not throw an error when passed an empty object', function () {
		expect(normalizeError).to.not.throw;
	});

	it('should normalize line and number properties', function () {
		var line = 123;
		var column = 22;
		var expected = { line: line, column: column };

		expect(normalizeError({
			line: 123,
			col: 32
		})).to.include.keys(['line', 'column']);

		expect(normalizeError({
			lineNumber: 123,
			column: 32
		})).to.include.keys(['line', 'column']);

		expect(normalizeError({
			loc: {
				line: line,
				column: column
			}
		})).to.include.keys(['line', 'column']);
	});
});

describe('logger', function () {
	it('should be defined as an function', function() {
		expect(logger).to.be.a.object;
	});

	it('should throw an error when no argument is passed', function () {
		expect(logger).to.throw;
	});

	it('should return an object', function () {
		expect(logger({ name: 'peanuts' })).to.be.a.object;
	});

	it('should default with a logging level of info', function () {
		expect(logger({ name: 'peanuts' }).getLevel()).equal('info');
	});
});

describe('parser', function () {
	it('should be defined as an object', function() {
		expect(parser).to.be.a.function;
	});

	it('should return an object', function() {
		expect(parser()).to.be.a.function;
	});

	describe('#encode', function () {
		it('should encode the value as JSON with the END_OF_MESSAGE appended onto the end', function () {
			var parse = parser();
			expect(parse.encode(123)).to.equal(JSON.stringify(123) + END_OF_MESSAGE);
			expect(parse.encode(true)).to.equal(JSON.stringify(true) + END_OF_MESSAGE);
			expect(parse.encode(false)).to.equal(JSON.stringify(false) + END_OF_MESSAGE);
			expect(parse.encode([1,2,3])).to.eql(JSON.stringify([1,2,3]) + END_OF_MESSAGE);
			expect(parse.encode('peanuts')).to.equal(JSON.stringify('peanuts') + END_OF_MESSAGE);
			expect(parse.encode({ peanut: 'butter' })).to.deep.equal(JSON.stringify({ peanut: 'butter' }) + END_OF_MESSAGE);
			expect(parse.encode('peanuts').slice(-1)).to.equal(END_OF_MESSAGE);
		});
	});

	describe('#decode', function () {
		it('should return the JSON passed as a JavaScript object', function () {
			var parse = parser();
			expect(parse.decode(JSON.stringify(123) + END_OF_MESSAGE)).to.eql([123]);
			expect(parse.decode(JSON.stringify(true) + END_OF_MESSAGE)).to.eql([true]);
			expect(parse.decode(JSON.stringify(false) + END_OF_MESSAGE)).to.eql([false]);
			expect(parse.decode(JSON.stringify([1,2,3]) + END_OF_MESSAGE)).to.eql([[1,2,3]]);
			expect(parse.decode(JSON.stringify('peanuts') + END_OF_MESSAGE)).to.eql(['peanuts']);
			expect(parse.decode(JSON.stringify({ peanut: 'butter' }) + END_OF_MESSAGE)).to.deep.eql([{ peanut: 'butter' }]);
		});
	});
});