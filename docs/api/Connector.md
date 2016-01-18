# Connector

The connector is used to manage the connecting, disconnecting, and reconnecting of an editor object. 

## init(options)

### options.port

Type: Number

The port to connect on.

### options.host

Type: String

The host to connect on.

### options.autoConnect

Whether or not to initiate the connection when the connector is created. 

### options.log

The logger used to log.

### options.reconnection

Type: Boolean

Default: false

Whether or not to try to reconnect if the socket can't connect the server, or the server closes the connection.

### options.reconnectionDelay 

Type: Number

Default: 2000

The amount of time to delay before reconnecting in milliseconds.

### options.reconnectionAttempts

Type: Number

Default: 10

The amount of time to attempt reconnecting.

### options.parser

Sets the parser for incoming and outgoing messages. 

## connect()

Creates a new socket connection on the port specified in the options. Does nothing if already connected. 

## close()

Disconnects the socket. Does nothing if already disconnected

## send(data)

Writes to the socket. The data passed is sent through the parser's `encode` function.

### data
	
Type: *

The data to be written to the socket. 

## getReconnection()

Returns the connector's `reconnection` option.

## getReconnectionDelay()

Returns the connector's `reconnectionDelay` option. 

## getReconnectionAttempts()

Returns the connector's `reconnection` option. 

## getSocket()

Returns the connector's current socket. 

## setReconnection(reconnection)

Type: Boolean

Sets the connector's `reconnection` option. Returns `this` for chaining.

## setReconnectionDelay(delay)

Type: Number

Sets the connector's `reconnectionDelay` option. Returns `this` for chaining.

## setReconnectionAttempts(attempts)

Type: Number

Sets the connector's `reconnection` option. Returns `this` for chaining.

## setParser(parser)

Sets the connector's `reconnection` option. Returns `this` for chaining. The parser must have a encode function, which is used for encoding outgoing messages, a `decode` function, which is used to decode incoming messages.

# Events

## close

Emitted when the connection has ended.

## Error

Emitted when the socket errors. A close event is emitted after an error event. 

## connect

Emitted when a connection is made to the server.

## reconnect_attempt

Emitted attempting to reconnect. The attempt number is passed.