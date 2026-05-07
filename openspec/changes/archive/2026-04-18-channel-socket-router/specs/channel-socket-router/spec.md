## ADDED Requirements

### Requirement: Single subscription per socket event per channel

The channel socket router SHALL hold at most one underlying
`socket.on(event)` subscription per event name for the lifetime of a
channel, regardless of how many contexts register handlers for that event.
When the last registered handler for an event is removed, the router
SHALL call `socket.off(event)` for that event.

#### Scenario: Multiple contexts subscribe to the same event
- **WHEN** three contexts each call `router.on('session:states', fn)` on the same router instance
- **THEN** the underlying `socket` has exactly one listener for `session:states`
- **AND** all three registered fns are invoked when the event fires

#### Scenario: Last unregister removes underlying socket listener
- **WHEN** all registered handlers for an event are removed via their returned cleanup functions
- **THEN** the router calls `socket.off(event, ...)` for that event
- **AND** subsequent emissions of that event do not invoke any removed handler

### Requirement: ChannelId guard by default with explicit opt-out

`router.on(event, listener)` SHALL apply the `matchesChannel` guard
against `payload.channelId` before invoking the listener. Callers MAY pass
`{ guard: false }` to subscribe to broadcast-shaped events whose payload
does not carry a top-level `channelId`.

#### Scenario: Guarded listener rejects non-matching channelId
- **WHEN** `router.on('control:permission', fn)` is registered on a router scoped to channel `A`
- **AND** a `control:permission` event fires with `payload.channelId = 'B'`
- **THEN** `fn` is not invoked

#### Scenario: Guarded listener accepts empty channelId (broadcast-to-all)
- **WHEN** `router.on('control:permission', fn)` is registered
- **AND** an event fires with `payload.channelId = ''`
- **THEN** `fn` is invoked

#### Scenario: Unguarded listener receives broadcast payloads
- **WHEN** `router.on('session:states', fn, { guard: false })` is registered
- **AND** an event fires with no top-level `channelId` in the payload
- **THEN** `fn` is invoked with the full payload

### Requirement: Handler-map registration

`router.register(handlers, setState, options?)` SHALL subscribe to each
event key in `handlers` (and in `options.effects` if provided) and fan
out payloads to the state handler and effect handler. The returned
function SHALL remove all subscriptions registered in that call.

#### Scenario: Registered handlers update state
- **WHEN** `router.register({ 'stream:text': reducer }, setState)` is registered
- **AND** a `stream:text` event fires with a channel-matching payload
- **THEN** `setState` is called with `(prev) => reducer(prev, payload)`

#### Scenario: skipGuard bypasses channel matching
- **WHEN** `router.register(handlers, setState, { skipGuard: new Set(['disconnect']) })` is registered
- **AND** a `disconnect` event fires with a non-matching channelId
- **THEN** the `disconnect` handler is invoked

#### Scenario: beforeUpdate runs prior to state update
- **WHEN** `router.register(handlers, setState, { beforeUpdate })` is registered
- **AND** an event in `handlers` fires and passes the guard
- **THEN** `beforeUpdate(event, payload)` is called
- **AND** then `setState(...)` is called

#### Scenario: Cleanup removes all registered handlers at once
- **WHEN** `const off = router.register(handlers, setState)` returns
- **AND** `off()` is called
- **THEN** every handler registered by that call is removed
- **AND** other registrations on the same router remain active

### Requirement: Router disposal cleans up all listeners

When a router is disposed, it SHALL remove every remaining
`socket.on(...)` listener it owns and clear its internal listener map,
even if individual `register`/`on` callers did not call their cleanup
functions.

#### Scenario: Disposing mid-lifecycle detaches all listeners
- **WHEN** handlers are registered but not cleaned up
- **AND** `router.dispose()` is called
- **THEN** the underlying socket has no listeners owned by this router
- **AND** subsequent event emissions invoke no handlers from this router

### Requirement: One router instance per channel

The `ChannelSocketRouterProvider` SHALL construct a new router whenever
`socket` or `channelId` changes, and SHALL dispose the previous router
on unmount or when a new one is created.

#### Scenario: Channel switch swaps router
- **WHEN** the `channelId` prop on `ChannelSocketRouterProvider` changes from `A` to `B`
- **THEN** the router for `A` is disposed
- **AND** child contexts see a new router instance scoped to `B`
