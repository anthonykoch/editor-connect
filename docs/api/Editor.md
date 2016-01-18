# Editor

The module return from `require('editor-connect')` is not the same as Editor. See [EditorConnect](../editorconnect.md). 


## create(options)

Creates an editor instance that is used to send and receive messages to the text editor.

```
// Creates a custom connection
var subl = Editor.create({
	port: 1234, 
});
```

### options.port

Type: Number

The port to connect on.

### options.host

Type: String

The host to connect on.

### options.name

Type: String

The name of the Editor, used for logging purposes. 

### options.loggingLevel

Type: String

Sets the logging level. Current supported levels are `'silent'`, `'info'`, `'debug'`, `'warn'`, and `'error'`. 

### options.autoConnect

Type: Boolean

Whether or not to automatically connect when the editor object is created. 

### options.reconnection

Type: Boolean

Whether or not to try to reconnect when the socket connection closes. 

## editor.connector

The connector object, which manages the socket connection. See [Connector](connector.md).

## configure(options)

Configures the editor object. To configure the options pertaining to the socket connection, see [Connector](connector.md)

#### options.gulp

Type: Object

The gulp object. This must be passed in if using to show errors with GulpJS.

#### options.loggingLevel

Type: String

## run(command)

Sends a command to the text editor. This makes it possible to extend an editor object with your own commands, assuming your text editor's EditorConnect api is designed to handle the data.

See the necessary data in a command [here.](commands.md)

```javascript
var sublime = Editor.sublime;
Object.assign(sublime, {
	// Show a message in the status bar of the text editor 
	setStatus: function (taskName, message) {
		var command = {
			name: 'SetStatus',
			data: {
				message: message
			}
		};
		this.run(command);
	}
});

gulp.task('sass', function () {
	gulp.src(config.sass.src)
		.pipe(sass())
		.on('error', function () {
			sublime.setStatus('sass', 'Sass error');
		})
		.dest(config.sass.dest);
});
```

## showError(pluginError, taskName)

Sends a `ShowError` command to the text editor. 

__Note:__

The resulting error object sent to the text editor is normalized because plugins seem emit errors with different properties that point to the line number, file, etc. The error object sent is not guaranteed to have a line number, file name or message. The data contained within the error is entirely dependent on the plugin that emits the error.

## connect()

Creates a socket connection to the text editor's server. 

## close()

Closes the socket connection to the text editor's server. 

### data

Type: *

Sends the data through to the text editor's server. The data is encoded by the connector's parser. 


## Events

### connect

Emitted when the socket of the editor object is connected to the text editor. 

### close

Emitted when the socket of the editor object has been closed.

### error

Emitted when the socket of the editor object encounters an error. The close event fires after the error. 

### message

Emitted when the connector receives a message from the text editor. The incoming message is emitted with the event.

### reconnect_attempt

Emitted when the connector is attempting to reconnect.

