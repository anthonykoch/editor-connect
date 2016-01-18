'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Editor = undefined;

var _connector = require('./connector');

var _connector2 = _interopRequireDefault(_connector);

var _events = require('events');

var _utils = require('./utils');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PLUGIN_NAME = _config2.default.PLUGIN_NAME;
var PLUGIN_DISPLAY_NAME = _config2.default.PLUGIN_DISPLAY_NAME;
var PLUGIN_ID = _config2.default.PLUGIN_ID;

var HANDSHAKE = {
	name: 'editor-connect',
	handshake: true,
	pluginId: PLUGIN_ID,
	data: {}
};

var Editor = exports.Editor = _extends({}, _events.EventEmitter.prototype, {

	_gulp: null,

	/**
  * Whether or not the handshake has completed.
  * @type {Boolean}
  */
	_isHandshakeComplete: false,

	/**
  * Creates and returns an editor object
  * @param  {Object} options
  * @param  {Number} options.port   The port to connect to
  * @param  {String} [options.host] The host to connect to
  * @param  {String} [options.name] The name of the editor
  * @return {Object}
  */
	create: function create(options) {
		var result = Object.create(this);
		result.init(options);
		return result;
	},
	init: function init(_ref) {
		var _ref$host = _ref.host;
		var host = _ref$host === undefined ? '' : _ref$host;
		var port = _ref.port;
		var _ref$name = _ref.name;
		var name = _ref$name === undefined ? '' : _ref$name;
		var _ref$loggingLevel = _ref.loggingLevel;
		var loggingLevel = _ref$loggingLevel === undefined ? 'info' : _ref$loggingLevel;
		var _ref$autoConnect = _ref.autoConnect;
		var autoConnect = _ref$autoConnect === undefined ? true : _ref$autoConnect;
		var _ref$reconnection = _ref.reconnection;
		var reconnection = _ref$reconnection === undefined ? true : _ref$reconnection;

		var connector;
		var log;
		var loggingName;

		if (typeof name === 'string' && name !== '') {
			loggingName = ':' + name;
		}

		log = (0, _utils.logger)({
			name: '' + PLUGIN_DISPLAY_NAME + loggingName,
			loggingLevel: loggingLevel
		});

		connector = Object.create(_connector2.default);
		connector.init({
			host: host,
			port: port,
			reconnection: reconnection,
			autoConnect: autoConnect,
			log: log
		});

		connector.on('connect', onSocketConnect.bind(this));
		connector.on('close', onSocketClose.bind(this));
		connector.on('error', onSocketError.bind(this));
		connector.on('data', onSocketData.bind(this));
		connector.on('reconnect_attempt', onSocketReconnectAttempt.bind(this));

		this._onGulpTaskStart = onGulpTaskStart.bind(this);
		this.id = (0, _utils.createUID)();
		this.log = log;
		this.connector = connector;
		this.name = name;

		return this;
	},

	/**
  * Configures the options for the editor object
  * @param  {Object}         options
  * @param  {Boolean|String} options.disableLogging Whether or not to disable logging
  * @param  {Object}         options.gulp The gulp object, required if using with GulpJS
  * @return {this}
  */
	configure: function configure(options) {
		var gulp;
		var loggingLevel;

		if (!options || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
			return;
		}

		gulp = options.gulp;
		loggingLevel = options.loggingLevel;

		if (gulp !== undefined) {
			gulp.removeListener('task_start', this._onGulpTaskStart);
			gulp.on('task_start', this._onGulpTaskStart);
			this._gulp = gulp;
		}

		if (typeof loggingLevel === 'string') {
			this.log.setLevel(loggingLevel);
		}

		return this;
	},

	/**
  * Connects the connector
  * @return {this}
  */
	connect: function connect() {
		this.connector.connect();
		return this;
	},

	/**
  * Closes the connector's socket
  * @return {this}
  */
	close: function close() {
		this.connector.close();
		return this;
	},

	/**
  * Sends data through to the connector
  * @return {this}
  */
	send: function send(data) {
		this.connector.send(data);
		return this;
	},

	/**
  * Send a command to the editor.
  * @param  {Object} command
  * @return {this}
  */
	run: function run(command) {
		/**
   * Task names must be prefixed so that gulp files with the same
   * task names don't clash.
   */
		if ('task' in command) {
			command.task = command.task + '#' + PLUGIN_ID;
		}

		command.pluginId = PLUGIN_ID;
		command.editorId = this.id;
		this.connector.send(command);
		this.emit('run');
		return this;
	},

	/**
  * Runs the command "ShowError" in the text editor.
  * @param  {String} taskName The task name to associate the error
  * @param  {Error}  err      The gulp error object
  * @return {this}
  */
	showError: function showError(err, taskName) {
		var error;
		var command;

		if (typeof taskName !== 'string') {
			this.log.error('The task name provided is not of type String, got ' + taskName);
		}

		error = (0, _utils.normalizeError)(err, taskName);
		command = {
			name: 'ShowError',
			task: taskName,
			views: [error.file],
			data: {
				error: error,
				originalError: err
			}
		};
		this.run(command);

		return this;
	},

	/**
  * Removes the error messages shown by showError
  * @param  {String} taskName The name of the GulpJS task
  * @return {this}
  */
	eraseError: function eraseError(taskName) {
		var command;

		if (typeof taskName !== 'string') {
			this.log.error('The task name provided is not of type String, got ' + taskName);
			return;
		}

		command = {
			name: 'EraseError',
			views: '<all>',
			task: taskName,
			data: {}
		};
		this.run(command);
		return this;
	},

	/**
  * Returns whether the handshake is valid.
  * If the message object has a property "handshake" that equals true,
  * the handshake is considered valid.
  * May be overriden.
  * @param  {Object}  message
  * @return {Boolean}
  */
	isHandshakeValid: function isHandshakeValid(message) {
		return message && message.handshake === true;
	}
});

/**
 * Removes the errors associated with the task each time
 * the task starts.
 * @param  {Object} task
 * @param  {String} task.task The task name
 * @return {void}
 */
function onGulpTaskStart(task) {
	this.eraseError(task.task);
};

/**
 * These event handlers have their "this" value bound
 * to the editor object.
 */

/**
 * Sends the handshake message
 */
function onSocketConnect() {
	this.connector.send(HANDSHAKE);
	this.log.info('Connected');
	this.emit('connect');
}

/**
 * Emit a close event on the editor object
 * @param  {Boolean} closeWasCausedByError Whether or not the socket closed because of an error
 * @return {void}
 */
function onSocketClose(closeWasCausedByError) {
	this._isHandshakeComplete = false;
	this.log.debug('Disconnected');
	this.emit('close', closeWasCausedByError);
}

/**
 * Checks that the first message is a valid handshake response.
 * If it is, the rest of the messages received are emitted on
 * the editor object. If the handshake response is invalid, the
 * connection is closed.
 * @param  {Array.<String>} message
 * @return {void}
 */
function onSocketData(messages) {
	var handshake;
	var message;

	this.log.debug('Messages:', messages);

	if (!this._isHandshakeComplete) {
		message = messages[0];
		handshake = _extends({}, HANDSHAKE, {
			editorId: this.id
		});

		if (!this.isHandshakeValid(message)) {
			this.emit('invalid_handshake', { message: message });
			this.connector.close();
			this.log.info('Invalid handshake');
		} else {
			this._isHandshakeComplete = true;
		}
	} else {
		messages.forEach(function (message) {
			var _this = this;

			setTimeout(function () {
				_this.emit('message', { message: message });
			});
		}, this);
	}
}

function onSocketError() {
	//
}

function onSocketReconnectAttempt(attempt) {
	this.log.debug('Reconnection attempt: %s', attempt);
	this.emit('reconnect_attempt', attempt);
}