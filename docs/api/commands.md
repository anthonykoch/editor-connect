# commands

Commands are just plain objects. They should be sent through the `run` method of a editor instance. This allows the `task` property of the command to be suffixed with an ID unique to the gulpfile running. 

## properties

### name

Type: String

The name of the command.

### task

Type: String

The name of a gulp task to associate with the command. The resulting task name is appended with an ID before it is sent so that other gulpfiles running with the same task names don't clash. 

### views

Type: Array|String

The views, which are open tabs in the editor, that the command may operate on. This property may be an array of absolute file names, or the string `<all>`, which means all views. 

```javascript
var command = {
	name: 'ShowError',
	views: [err.file],
	task: taskName,
	data: {
		error: error,
		originalError: originalError
	}
};
```

### data

Type: Object

Custom data to be sent along with the command. 

## Example 

```javascript
var command = {
	name: 'SetStatus',
	taskName: 'sass',
	views: '<all>',
	data: {
		id: 'sass',
		'message': 'Sass compiled!'
	}
};
```