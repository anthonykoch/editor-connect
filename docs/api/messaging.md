# messaging API

## Sending and Receiving messages

Messages are sent and received in JSON format. Each individual stringified JSON message has a END_OF_MESSAGE appended onto the end. The END_OF_MESSAGE is a newline character `\n`. 

## Queuing

Sockets may queue up messages and send them in bulk, and if the receiving buffer size isn't large enough, messages may be not be received in in full. As a result, it is necessary to keep accumulating the message until a END_OF_MESSAGE is received as being the last character of the accumulated message. 

## Parsing messages

Assuming the message is in string format, and the last character is a END_OF_MESSAGE character (a newline), split the message by the END_OF_MESSAGE, filter the array/list so that it contains no empty strings, and map JSON.parse (or the equivalent function in the text editor's language) over each item in the array. 

```javascript
// NodeJS example
function parse(message) {
	var commands = message
		.split('\n')
		.filter(str => str !== '')
		.map(str => JSON.parse(str))
}
```

## Overriding 

The default parser for the connector of an editor object may be overriden by the setParser method on the editor's connector. The parser should provide `encode` and `decode` functions. It is required that the `encode` function returns a string. 

```javascript
var editor = Editor.create({
	port
});

editor.connector.setParser({
	encode: function () {
		// return a string
	},
	decode: function (data) {
		// return anything you want
	},
});
```