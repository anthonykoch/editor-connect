'use strict';

import net from 'net';
import { EventEmitter } from 'events';
import { parser } from './utils';

const STATE_CONNECTING    = 'connecting';
const STATE_CONNECTED     = 'connected';
const STATE_DISCONNECTING = 'disconnecting';
const STATE_DISCONNECTED  = 'disconnected';
const STATE_RECONNECTING  = 'reconnecting';
const STATE_RECONNECTED   = 'reconnected';

/**
 * TODO: ping/pong
 */

/**
 * The amount of time to delay before reconnecting
 * @type {Number}
 */
const RECONNECTION_DELAY    = 2000;

/**
 * The number of times the connector will to try to reconnect
 * @type {Number}
 */
const RECONNECTION_ATTEMPTS = 10;

/**
 * Default parser for the socket's messages
 */
var defaultParser = parser();

/**
 * Manages a socket connections so that it automatically connects before restarting.
 * @type {Object}
 */
var Connector = {
	...EventEmitter.prototype,

	_parser: defaultParser,
	_socket: null,
	_attempts: 0,
	_shouldReconnect: false,

	readyState: STATE_DISCONNECTED,

	/**
	 * Initiates a connector object.
	 * @param  {Object} options
	 * @param  {Object} options.log                    The logger to log with
	 * @param  {Object} options.port                   The port to connect on
	 * @param  {Object} [options.host]                 The host to connect on, which defaults to localhost
	 * @param  {Object} [options.autoConnect]          Whether or not to call connect after the object is returned
	 * @param  {Object} [options.reconnect]            Whether or not to reconnect after the server ends connection
	 * @param  {Object} [options.reconnectionDelay]    The amount of time to delay before reconnecting
	 * @param  {Object} [options.reconnectionAttempts] The amount of times to try reconnecting
	 * @return {Connector}
	 */
	init(options) {
		var {
			port,
			host,
			log,
			reconnection=false,
			autoConnect=true,
			parser=defaultParser,
			reconnectionDelay=RECONNECTION_DELAY,
			reconnectionAttempts=RECONNECTION_ATTEMPTS
		} = options

		if ( ! Number.isFinite(port)) {
			throw new Error('Invalid port');
		}

		if (! log && typeof log !== object) {
			throw new Error('Logger was not passed');
		}

		this.readyState            = STATE_DISCONNECTED;
		this.log                   = log;
		this._attempts             = 0;
		this._port                 = port;
		this._host                 = host;
		this._parser               = parser;
		this._shouldReconnect      = false;
		this._reconnection         = reconnection;
		this._reconnectionDelay    = reconnectionDelay;
		this._reconnectionAttempts = reconnectionAttempts;

		if (autoConnect) {
			// Allows options to be set before connecting
			setTimeout(this.connect.bind(this), 0);
		}

		return this;
	},

	/**
	 * Creates a socket connection. Does nothing if not in disconnected state.
	 * @return {void}
	 */
	connect() {
		// The current number times we've tried reconnecting
		var socket;
		var connector;
		var _reconnectionDelay;
		var _reconnectionAttempts;
		var _reconnection;

		// Disallow connecting if we are anything but connected
		if (this.readyState !== STATE_DISCONNECTED) {
			return;
		}

		socket = net.createConnection(this._port, this._host);
		socket.setEncoding('utf8');

		({
			_reconnection,
			_reconnectionDelay,
			_reconnectionAttempts,
		} = this);

		this._socket = socket;
		this._shouldReconnect = true;
		this.readyState = STATE_CONNECTING;
		connector = this;

		socket.once('close', function onSocketClose(closeWasCausedByError) {
			this.destroy();
			connector.readyState = STATE_DISCONNECTED;
			connector.emit('close', closeWasCausedByError);

			// if the close was caused by an abrupt close,
			if (connector._shouldReconnect) {
				connector.reconnect();
			}

			this.removeAllListeners('data');
			this.removeAllListeners('error');
		});

		socket.once('error', function onSocketError() {
			this.destroy();
		});

		socket.once('connect', function onSocketConnect() {
			connector.readyState = STATE_CONNECTED;
			connector.emit('connect');
			connector._attempts = 0;
		});

		// FIXME: Should be doing a recv_all type call here
		socket.on('data', function onSocketConnect(data) {
			var message = connector._parser.decode(data);
			connector.emit('data', message);
		});
	},

	/**
	 * Closes the socket. If the socket is already disconnected or disconnecting,
	 * the call is ignored
	 * @return {void}
	 */
	close() {
		this._shouldReconnect = false;

		if (this.readyState === STATE_DISCONNECTED
			|| this.readyState === STATE_DISCONNECTING) {
			return;
		}

		this._socket.destroy();
		this.readyState = STATE_DISCONNECTING;
	},

	/**
	 * Attempts to reconnect to the server, assuming _reconnection is set to true,
	 * and we have not exceeded the maximum number of reconnect attempts.
	 *
	 * FIXME: Figure out if we should force reconnecting if already connected
	 * @return {void}
	 */
	reconnect() {
		var { _reconnection, _reconnectionAttempts, _reconnectionDelay } = this;

		if (_reconnection && this._attempts < _reconnectionAttempts) {
			setTimeout(() => {
				this._attempts++;
				this.emit('reconnect_attempt', this._attempts);
				this.connect();
			}, _reconnectionDelay);
		} else if (_reconnection && this._attempts === _reconnectionAttempts) {
			// We log disconnected here, rather than in a close event
			this.log.info('Disconnected');
		}
	},

	/**
	 * Sends data through the underlying socket, if connected.
	 * If not connected, the call is ignored
	 * @param  {*}    data
	 * @return {void}
	 */
	send(data) {
		// Only write if we're connected
		if (this.readyState === STATE_CONNECTED) {
			this._socket.write(this._parser.encode(data));
		}

		return this;
	},

	/**
	 * Returns the connector's current underlying socket
	 * @return {Socket}
	 */
	getSocket() {
		return this._socket;
	},

	/**
	 * Returns the connector's reconnection option
	 * @return {Number}
	 */
	getReconnection() {
		return this._reconnection;
	},

	/**
	 * Returns the connector's reconnection delay
	 * @return {Number}
	 */
	getReconnectionDelay() {
		return this._reconnectionDelay;
	},

	/**
	 * Returns the connect's max reconnection attempts
	 * @return {Number}
	 */
	getReconnectionAttempts() {
		return this._reconnectionAttempts;
	},

	/**
	 * Returns a copy of the connector's parser
	 * @return {Object}
	 */
	getParser() {
		return this._parser;
	},

	/**
	 * Sets the connector's reconnection delay
	 * @param  {Number} delay
	 * @return {this}
	 */
	setReconnectionDelay(delay) {
		this._reconnectionDelay = delay;
		return this;
	},

	/**
	 * Sets the connectors's max reconnection attempts
	 * @param  {Number} attempts
	 * @return {this}
	 */
	setReconnectionAttempts(attempts) {
		this._reconnectionAttempts = attempts;
		return this;
	},

	/**
	 * Sets the connector's reconnection option
	 * @param {Boolean} reconnection
	 */
	setReconnection(reconnection) {
		this._reconnection = reconnection;
	},

	/**
	 * Sets the sockets parser for incoming and outgoing messages.
	 * @param {Object} parser
	 * @param {Function} parser.encode
	 * @param {Function} parser.decode
	 */
	setParser(parser) {
		this._parser = parser;
		return this;
	},

	STATE_CONNECTING,
	STATE_CONNECTED,
	STATE_DISCONNECTING,
	STATE_DISCONNECTED,
	STATE_RECONNECTING,
	STATE_RECONNECTED,
};

export default Connector;