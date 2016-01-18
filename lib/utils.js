'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.parser = exports.logger = exports.normalizeError = exports.createUID = undefined;

var _events = require('events');

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
	var loc = err.loc;

	var line = err.line || err.lineNumber;
	var column = err.column || err.col;
	var file = err.file || err.fileName;
	var message = err.message;

	// Babeljs, why you do dis??
	if (loc && (typeof loc === 'undefined' ? 'undefined' : _typeof(loc)) === 'object') {
		line = loc.line;
		column = loc.column;
	}

	line = typeof line === 'number' ? line : null;
	column = typeof column === 'number' ? column : null;
	message = typeof message === 'string' ? message : null;

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

	file = typeof file !== 'string' ? '' : file;

	var basename = _path2.default.basename(file);
	var dirname = _path2.default.dirname(file);
	var ext = _path2.default.extname(file);
	var rootName = _path2.default.basename(file, ext);

	// FIXME: Set undefined properties as empty strings
	var error = {
		hasFile: typeof file === 'string',
		plugin_name: pluginName,
		file_path: dirname, // The directory path (excludes the basename)
		file_name: basename, // The root name of the file with the extension
		file_base_name: rootName, // The root name of the file (without the extension)
		file_extension: ext, // The file extension
		file: file, // The absolute file path
		line: line,
		column: column,
		message: message };

	// The error message the plugin gave
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
		uuid += (i === 12 ? 4 : i === 16 ? random & 3 | 8 : random).toString(16);
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
var logger = function () {
	var loggingLevels = ['debug', 'error', 'warn', 'info'];
	var loggingEnabled = true;

	var Logger = {
		debug: function debug() {
			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			this._log('debug', args);
		},
		error: function error() {
			for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
				args[_key2] = arguments[_key2];
			}

			this._log('error', args);
		},
		warn: function warn() {
			for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
				args[_key3] = arguments[_key3];
			}

			this._log('warn', args);
		},
		info: function info() {
			for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
				args[_key4] = arguments[_key4];
			}

			this._log('info', args);
		},
		getLevel: function getLevel() {
			return this._loggingLevel;
		},
		setLevel: function setLevel(level) {
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
		_log: function _log(level, args) {
			if (this._loggingLevel === 'silent' || !loggingEnabled) {
				return;
			} else if (level === this._loggingLevel) {
				args.unshift(_gulpUtil2.default.colors.white('[') + _gulpUtil2.default.colors.cyan(this._name) + _gulpUtil2.default.colors.white(']'));
				console.log.apply(console, args);
			}
		}
	};

	var ret = function ret(_ref) {
		var name = _ref.name;
		var _ref$loggingLevel = _ref.loggingLevel;
		var loggingLevel = _ref$loggingLevel === undefined ? 'info' : _ref$loggingLevel;

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
}();

/**
 * The default parser for the socket's messages. The encode is for
 * outgoing messages and decode for incoming messages.
 * @type {Object}
 */
var parser = function () {
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
		encode: function encode(data) {
			return JSON.stringify(data) + END_OF_MESSAGE;
		},

		/**
   * Parses the incoming message fromt the socket. The result will
   * be emitted from the socket manager in the receive event.
   * @param  {Buffer}         data
   * @return {Array.<String>}
   */
		decode: function decode(data) {
			return data.toString().split(END_OF_MESSAGE).filter(function (str) {
				return str;
			}).map(function (str) {
				return JSON.parse(str);
			});
		}
	};

	return function () {
		return Object.create(parser);
	};
}();

exports.createUID = createUID;
exports.normalizeError = normalizeError;
exports.logger = logger;
exports.parser = parser;