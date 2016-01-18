# EditorConnect

The module return from `require('editor-connect')`.

## create(options)

Creates an [Editor](./api/Editor.md) object instance.  

### options.port

Type: Number

The port to connect on.

### options.host

Type: String

The host to connect on.

### options.name

Type: String

The name of the Editor, used for logging purposes. 

## sublime

An instance of [Editor](./api/Editor.md). Connect to must be called manually to start the connection. 

