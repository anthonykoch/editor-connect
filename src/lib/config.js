'use strict';

import { createUID } from './utils';

const PLUGIN_NAME = 'editor-connect';
const PLUGIN_DISPLAY_NAME = 'Editor';
const PLUGIN_ID = createUID();

export default Object.freeze({
	PLUGIN_NAME,
	PLUGIN_DISPLAY_NAME,
	PLUGIN_ID
});