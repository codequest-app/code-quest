## ADDED Requirements

### Requirement: Router subscribes via a pluggable SubscriptionAdapter

`ChannelSocketRouter` SHALL receive a `SubscriptionAdapter` at
construction — an interface exposing only `on(event, fn)` and
`off(event, fn)`. The router SHALL NOT reference `TypedSocket` or any
socket.io type internally; all socket.io-specific type handling lives
in `createSocketAdapter`, a factory function that wraps a `TypedSocket`
into the adapter shape.

#### Scenario: Production wires a socket-backed adapter
- **WHEN** `ChannelSocketRouterProvider` constructs a router
- **THEN** it calls `createSocketAdapter(socket)` to produce the adapter
- **AND** passes that adapter to the `ChannelSocketRouter` constructor

#### Scenario: Unit test uses a custom adapter
- **WHEN** test code instantiates `new ChannelSocketRouter(fakeAdapter, channelId)`
- **THEN** the router operates without any real socket.io socket
- **AND** listener registrations routed to `fakeAdapter.on(event, fn)`
- **AND** cleanups routed to `fakeAdapter.off(event, fn)`
