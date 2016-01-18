'use strict';

import { EventEmitter } from 'events';
import { Editor, EditorManager } from './lib/editor';
import { createUID } from './lib/utils';
import config from './lib/config';

const {
	PLUGIN_NAME,
	PLUGIN_DISPLAY_NAME,
	PLUGIN_ID
} = config;

/**
 * Currently on Sublime Text 3 is supported as a preset
 * @type {String}
 */
var presets = (function () {
	var sublime = {
		name: 'subl',
		host: '127.0.0.1',
		port: 35048,
		autoConnect: false,
		reconnection: true,
	};

	return {
		sublime,
	};
}());

/**
 * A wrapper for the Editor object creator
 * @type {Object}
 */
var EditorConnect = {
	sublime: Editor.create(presets.sublime),

	/**
	 * Returns an editor object on which you can send and receive messages
	 * from the text editor.
	 * @param  {Object} options      May be a custom object that contains a host and port, or a preset
	 * @param  {Object} options.port Specifies the port to connect to. This option is required.
	 * @param  {Object} options.host The host to connect on. Defaults to localhost.
	 * @return {Object}
	 */
	create(options) {
		var host;
		var port;
		var name;

		if ( ! options || typeof options !== 'object') {
			throw new Error(`${PLUGIN_NAME}: options is not of type object`);
		}

		({ host='127.0.0.1', port, name='' } = options);

		if ( ! Number.isFinite(port)) {
			err = new Error(`${PLUGIN_NAME}: invalid port specified, got ${port}`);
			throw err;
		}

		var result = Object.create(Editor);
		result.init({
			port,
			host,
			name,
			autoConnect: true,
			reconnection: true,
		});
		return result;
	},
};

module.exports = EditorConnect;