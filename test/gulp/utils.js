'use strict';

var gulp    = require('gulp');
var Editor  = require('../../index');
var sublime = Editor.sublime
	.configure({ gulp: gulp })
	.connect();

sublime.on('close', function () {
	console.log('closed');
});

sublime.on('connect', function () {
	console.log('connected');
});

function handleError(taskName) {
	if (typeof taskName !== 'string') {
		var err = new Error('No task name was specified for the error handler');
		throw err;
	}

	var plumberErrorHandler = {
		errorHandler: function (err) {
			sublime.showError(err, taskName);
			console.log(err);
			this.emit('end');
		}
	};

	return plumberErrorHandler;
};

module.exports.handleError = handleError;