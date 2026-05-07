## MODIFIED Requirements

### Requirement: WsTransport acceptConnection supports transformSocket hook
WsTransport.acceptConnection SHALL check for a `transformSocket` function on the ConnectionContext after creating the TypedSocket. If present, it SHALL call `transformSocket(typed)` and use the returned socket for route handler and connection listeners.

#### Scenario: no transformSocket set
- **WHEN** a connection is accepted and `context.transformSocket` is not set
- **THEN** the TypedSocket from `makeTypedSocket` SHALL be used directly (no change from current behavior)

#### Scenario: transformSocket wraps TypedSocket
- **WHEN** a connection is accepted and `context.transformSocket` is a function
- **THEN** WsTransport SHALL call `context.transformSocket(typed)` and pass the returned socket to the route handler and connection listeners
