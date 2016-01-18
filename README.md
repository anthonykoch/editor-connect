# Editor Connect

A package that can be used to send error messages from [GulpJS](https://github.com/gulpjs/gulp/) error messages to a text editor. A package must be installed for the text editor for this to work. Currently only Sublime Text 3 is supported with the [EditorConnect](https://github.com/anthonykoch/editorconnect-sublime) package installed (not currently available).

__Note:__ The package doesn't have to be used with gulp. It will still work and connect if run normally in a NodeJS file. 

## Features

- Displays an error message in the status bar showing the file, line number, and plugin that caused the error. 
- Scrolls to the line where the error occured if the file is open 
- Shows a gutter icon next to the line where the error occured 
- Shows a popup message (ST3 version must be greater than 3083)

## Plugin compatibility 

It works with any plugin that emits an error with a filename and line number. There are is a quirk with Sass though, in which the "scroll to error" and "gutter icon" features don't work for entry files (non-partials). 

## Example usage with Gulp 

```Javascript
var gulp    = require('gulp');
var sass    = require('gulp-sass');
var react   = require('gulp-babel');
var plumber = require('gulp-plumber');

// Pass in gulp! 
var Editor = require('editor-connect');
var sublime = Editor.sublime
	.configure({ gulp: gulp })
	.connect();

var handleError = function (taskName) {
	return { 
		errorHandler: function (err) {
			// Pass the error object and the task name 
			sublime.showError(err, taskName);
			// Keep gulp.watch going with the below line
			this.emit('end');
		} 
	};
};

gulp.task('sass', function() {
	return gulp.src(config.src)
		.pipe(plumber(handleError('sass')))
		.pipe(sass())
		.pipe(gulp.dest(config.dest));
});

gulp.task('javascript', function() {
	return gulp.src(config.src)
		.pipe(plumber(handleError('javascript')))
		.pipe(babel())
		.pipe(gulp.dest(config.dest))
});
```

Without plumber, it's basically the same thing, except a function is returned instead of an object. 

```javascript
var errorHandler = function(taskName) {
	return function(err) {
		sublime.showError(err, taskName);
		this.emit('end');
	};
};

gulp.task('javascript', function() {
	return gulp.src(config.src)
		.pipe(babel())
		.on('error', errorHandler('javascript'));
});
```

It's pretty simple. Just pass the error and task name to `sublime.showError` in the error handler of a gulp task. It's important that the name passed to showError is the exact same as the task name. Also, the gulp object must be passed through the `configure` function in order to properly erase error messages. 

![react error example](https://github.com/anthonykoch/editor-connect/blob/master/images/jsx.png)

## Todo

- more and better tests
- Emit an event for max reconnect attempt reached
- add a linter