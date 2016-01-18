import Connector from './connector';
import { EventEmitter } from 'events';
import { normalizeError, createUID, logger } from './utils';
import config from './config';

const {
	PLUGIN_NAME,
	PLUGIN_DISPLAY_NAME,
	PLUGIN_ID
} = config;

const HANDSHAKE = {
	name: 'editor-connect',
	handshake: true,
	pluginId: PLUGIN_ID,
	data: {}
};

export var Editor = {
	...EventEmitter.prototype,

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
	create(options) {
		var result = Object.create(this);
		result.init(options);
		return result;
	},

	init({ host='', port, name='', loggingLevel='info', autoConnect=true, reconnection=true }) {
		var connector;
		var log;
		var loggingName;

		if (typeof name === 'string' && name !== '') {
			loggingName = `:${name}`;
		}

		log = logger({
			name: `${PLUGIN_DISPLAY_NAME}${loggingName}`,
			loggingLevel
		});

		connector = Object.create(Connector);
		connector.init({
			host,
			port,
			reconnection,
			autoConnect,
			log,
		});

		connector.on('connect', onSocketConnect.bind(this));
		connector.on('close',   onSocketClose.bind(this));
		connector.on('error',   onSocketError.bind(this));
		connector.on('data',    onSocketData.bind(this));
		connector.on('reconnect_attempt', onSocketReconnectAttempt.bind(this));

		this._onGulpTaskStart = onGulpTaskStart.bind(this);
		this.id = createUID();
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
	configure(options) {
		var gulp;
		var loggingLevel;

		if ( ! options || typeof options !== 'object') {
			return;
		}

		({
			gulp,
			loggingLevel
		} = options);

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
	connect() {
		this.connector.connect();
		return this;
	},

	/**
	 * Closes the connector's socket
	 * @return {this}
	 */
	close() {
		this.connector.close();
		return this;
	},

	/**
	 * Sends data through to the connector
	 * @return {this}
	 */
	send(data) {
		this.connector.send(data);
		return this;
	},

	/**
	 * Send a command to the editor.
	 * @param  {Object} command
	 * @return {this}
	 */
	run(command) {
		/**
		 * Task names must be prefixed so that gulp files with the same
		 * task names don't clash.
		 */
		if ('task' in command) {
			command.task = `${command.task}#${PLUGIN_ID}`
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
	showError(err, taskName) {
		var error;
		var command;

		if (typeof taskName !== 'string') {
			this.log.error(`The task name provided is not of type String, got ${taskName}`);
		}

		error = normalizeError(err, taskName);
		command = {
			name: 'ShowError',
			task: taskName,
			views: [error.file],
			data: {
				error,
				originalError: err
			},
		};
		this.run(command);

		return this;
	},

	/**
	 * Removes the error messages shown by showError
	 * @param  {String} taskName The name of the GulpJS task
	 * @return {this}
	 */
	eraseError(taskName) {
		var command;

		if (typeof taskName !== 'string') {
			this.log.error(`The task name provided is not of type String, got ${taskName}`);
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
	isHandshakeValid(message) {
		return message && message.handshake === true;
	},
};

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

	if ( ! this._isHandshakeComplete) {
		message = messages[0];
		handshake = {
			...HANDSHAKE,
			editorId: this.id,
		};

		if ( ! this.isHandshakeValid(message)) {
			this.emit('invalid_handshake', { message });
			this.connector.close();
			this.log.info('Invalid handshake');
		} else {
			this._isHandshakeComplete = true;
		}
	} else {
		messages.forEach(function (message) {
			setTimeout(() => {
				this.emit('message', { message });
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