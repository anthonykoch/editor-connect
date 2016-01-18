'use strict';

import { EventEmitter } from 'events';
import gutil from 'gulp-util';
import path from 'path';

/**
 * Normalizes an error object's line, column, file
 * properties and adds some others.
 *
 * FIXME: this function in general needs refactoring, such as the gulp-sass quirk check
 * @param  {Error}  err
 * @param  {String} id
 * @return {Object}
 */
function normalizeError(err, id) {
	var pluginName = err.plugin || id;
	var { loc } = err;

	var line    = (err.line || err.lineNumber);
	var column  = (err.column || err.col);
	var file    = err.file || err.fileName;
	var message = err.message;

	// Babeljs, why you do dis??
	if (loc && typeof loc === 'object') {
		line = loc.line;
		column = loc.column;
	}

	line    = (typeof line === 'number')    ? line : null;
	column  = (typeof column === 'number')  ? column : null;
	message = (typeof message === 'string') ? message : null;

	// Just in case any error message (such as autoprefixer) produce an
	// extremely long error message
	if (message && message.length > 2000) {
		message = message.substring(0, 2000);
	}

	// Fix the case where the error occurred in gulp-sass and the file
	// being processed is an entry file
	if (file === 'stdin' && pluginName === 'gulp-sass') {
		file = err.message.split('\n')[0];
	}

	file = (typeof file !== 'string') ? '' : file;

	var basename = path.basename(file);
	var dirname  = path.dirname(file);
	var ext      = path.extname(file);
	var rootName = path.basename(file, ext);

	// FIXME: Set undefined properties as empty strings
	var error = {
		hasFile: typeof file === 'string',
		plugin_name: pluginName,
		file_path: dirname,       // The directory path (excludes the basename)
		file_name: basename,      // The root name of the file with the extension
		file_base_name: rootName, // The root name of the file (without the extension)
		file_extension: ext,      // The file extension
		file,                     // The absolute file path
		line,
		column,
		message,                  // The error message the plugin gave
	};

	return error;
};

/**
 * Creates a uid
 * @return {String}
 */
function createUID() {
	var i, random;
	var uuid = '';

	for (i = 0; i < 32; i++) {
		random = Math.random() * 16 | 0;
		if (i === 8 || i === 12 || i === 16 || i === 20) {
			uuid += '-';
		}
		uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random))
			.toString(16);
	}

	return uuid;
};

/**
 * A simple logger. A name can be passed to prefix the message.
 * The log is prefixed with the specified name.
 * FIXME: This needs to be changed to eazy-logger or something
 * @param  {String} name The name to prefix the log with
 * @return {void}
 */
var logger = (function () {
	var loggingLevels = ['debug', 'error', 'warn', 'info'];
	var loggingEnabled = true;

	var Logger = {
		debug(...args) {
			this._log('debug', args);
		},
		error(...args) {
			this._log('error', args);
		},
		warn(...args) {
			this._log('warn', args);
		},
		info(...args) {
			this._log('info', args);
		},
		getLevel() {
			return this._loggingLevel;
		},
		setLevel(level) {
			this._loggingLevel = level;
		},

		/**
		 * Logs the output to the console. If the level of the logger is set
		 * to 'silent', or the logging is set to disabled, nothing will log.
		 *
		 * @param  {String} level
		 * @param  {Array}  args
		 * @return {void}
		 */
		_log(level, args) {
			if (this._loggingLevel === 'silent' || ! loggingEnabled) {
				return;
			} else if (level === this._loggingLevel) {
				args.unshift(gutil.colors.white('[') + gutil.colors.cyan(this._name) + gutil.colors.white(']'));
				console.log.apply(console, args);
			}
		},
	};

	var ret = function ({ name, loggingLevel='info' }) {
		var log = Object.create(Logger);
		Object.assign(log, {
			_loggingLevel: loggingLevel,
			_name: name
		});
		return log;
	};

	function disableAll() {
		loggingEnabled = false;
	}
	function enableAll() {
		loggingEnabled = true;
	}

	ret.enableAll = enableAll;
	ret.disableAll = disableAll;

	return ret;
}());

/**
 * The default parser for the socket's messages. The encode is for
 * outgoing messages and decode for incoming messages.
 * @type {Object}
 */
var parser = (function () {
	/**
	 * The character that signifies the end of the JSON message.
	 * @type {String}
	 */
	var END_OF_MESSAGE = '\n';
	var parser = {

		/**
		 * Prepares data to be sent to the socket
		 * @param  {*}      data
		 * @return {String}
		 */
		encode: function (data) {
			return JSON.stringify(data) + END_OF_MESSAGE;
		},

		/**
		 * Parses the incoming message fromt the socket. The result will
		 * be emitted from the socket manager in the receive event.
		 * @param  {Buffer}         data
		 * @return {Array.<String>}
		 */
		decode: function (data) {
			return data.toString()
				.split(END_OF_MESSAGE)
				.filter(str => str)
				.map(str => JSON.parse(str));
		}
	};

	return function () {
		return Object.create(parser);
	};
}());

export {
	createUID,
	normalizeError,
	logger,
	parser,
};