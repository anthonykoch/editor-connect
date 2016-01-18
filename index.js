'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _events = require('events');

var _editor = require('./lib/editor');

var _utils = require('./lib/utils');

var _config = require('./lib/config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PLUGIN_NAME = _config2.default.PLUGIN_NAME;
var PLUGIN_DISPLAY_NAME = _config2.default.PLUGIN_DISPLAY_NAME;
var PLUGIN_ID = _config2.default.PLUGIN_ID;

/**
 * Currently on Sublime Text 3 is supported as a preset
 * @type {String}
 */

var presets = function () {
	var sublime = {
		name: 'subl',
		host: '127.0.0.1',
		port: 35048,
		autoConnect: false,
		reconnection: true
	};

	return {
		sublime: sublime
	};
}();

/**
 * A wrapper for the Editor object creator
 * @type {Object}
 */
var EditorConnect = {
	sublime: _editor.Editor.create(presets.sublime),

	/**
  * Returns an editor object on which you can send and receive messages
  * from the text editor.
  * @param  {Object} options      May be a custom object that contains a host and port, or a preset
  * @param  {Object} options.port Specifies the port to connect to. This option is required.
  * @param  {Object} options.host The host to connect on. Defaults to localhost.
  * @return {Object}
  */
	create: function create(options) {
		var host;
		var port;
		var name;

		if (!options || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
			throw new Error(PLUGIN_NAME + ': options is not of type object');
		}

		var _options$host = options.host;
		host = _options$host === undefined ? '127.0.0.1' : _options$host;
		port = options.port;
		var _options$name = options.name;
		name = _options$name === undefined ? '' : _options$name;

		if (!Number.isFinite(port)) {
			err = new Error(PLUGIN_NAME + ': invalid port specified, got ' + port);
			throw err;
		}

		var result = Object.create(_editor.Editor);
		result.init({
			port: port,
			host: host,
			name: name,
			autoConnect: true,
			reconnection: true
		});
		return result;
	}
};

module.exports = EditorConnect;