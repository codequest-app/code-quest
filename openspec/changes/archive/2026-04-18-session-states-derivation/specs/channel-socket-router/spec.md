## MODIFIED Requirements

### Requirement: ChannelId guard by default with explicit opt-out

`router.on(event, listener)` SHALL apply the `matchesChannel` guard
against `payload.channelId` before invoking the listener. There is no
opt-out — the router is exclusively for channel-scoped events whose
payload carries a top-level `channelId`.

Broadcast-shaped events without a top-level `channelId` (e.g.,
`session:states`) SHALL NOT go through the channel router. Instead,
such events are owned by `SessionContext`, which exposes a
`subscribeSessionStates(cb)` callback-style API for consumers that need
sync-timed fan-out (see ADDED Requirement below).

`router.register(handlers, setState, options?)` MAY take
`options.skipGuard: Set<string>` to identify handler-map events that
should bypass the channelId guard (e.g., `'disconnect'`). This bypass
is an internal affordance of `register`; it is not exposed on
`router.on`.

#### Scenario: Guarded listener rejects non-matching channelId
- **WHEN** `router.on('control:permission', fn)` is registered on a router scoped to channel `A`
- **AND** a `control:permission` event fires with `payload.channelId = 'B'`
- **THEN** `fn` is not invoked

#### Scenario: Guarded listener accepts empty channelId (broadcast-to-all)
- **WHEN** `router.on('control:permission', fn)` is registered
- **AND** an event fires with `payload.channelId = ''`
- **THEN** `fn` is invoked

#### Scenario: register respects skipGuard for specific events
- **WHEN** `router.register(handlers, setState, { skipGuard: new Set(['disconnect']) })` is called
- **AND** a `disconnect` event fires with a non-matching channelId
- **THEN** the `disconnect` handler in `handlers` is invoked

## ADDED Requirements

### Requirement: SessionContext fans out session:states synchronously

`SessionContext` SHALL be the single socket subscriber for
`session:states` broadcasts, and SHALL expose a
`subscribeSessionStates(cb: (payload) => void): () => void` API.
Registered callbacks SHALL be invoked synchronously from the underlying
`socket.on('session:states', ...)` handler, before React batches any
subsequent state updates. This sync timing lets subscribers gate on
refs (e.g., a `joinedRef` that distinguishes pre-join vs post-join
events) with the same semantics as a direct `socket.on` registration.

Callbacks SHALL receive the raw payload cast to the schema type.
`setSessions` (the sessions snapshot update) SHALL only run when
`sessionStatesPayloadSchema.safeParse` succeeds; fan-out to callbacks
SHALL happen regardless, preserving behavior that depended on
unvalidated channel-router dispatch prior to this consolidation.

#### Scenario: Listener fires synchronously on event arrival
- **WHEN** a consumer calls `subscribeSessionStates(cb)` on the current session
- **AND** a `session:states` broadcast arrives on the socket
- **THEN** `cb` is invoked synchronously within the socket.on callback
- **AND** the invocation occurs before any React re-render caused by the setSessions update

#### Scenario: Cleanup stops further invocations
- **WHEN** `const off = subscribeSessionStates(cb)` is called
- **AND** `off()` is invoked
- **THEN** subsequent `session:states` broadcasts do not invoke `cb`

#### Scenario: Invalid payloads still fan out to listeners
- **WHEN** a `session:states` broadcast arrives whose payload fails schema validation
- **THEN** `setSessions` is not called
- **AND** registered listeners are still invoked with the raw payload cast to the schema type
