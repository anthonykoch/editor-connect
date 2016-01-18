'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _utils = require('./utils');

var PLUGIN_NAME = 'editor-connect';
var PLUGIN_DISPLAY_NAME = 'Editor';
var PLUGIN_ID = (0, _utils.createUID)();

exports.default = Object.freeze({
	PLUGIN_NAME: PLUGIN_NAME,
	PLUGIN_DISPLAY_NAME: PLUGIN_DISPLAY_NAME,
	PLUGIN_ID: PLUGIN_ID
});