## ADDED Requirements

### Requirement: Browser ↔ server transport SHALL use raw WebSocket with a JSON envelope

The browser client and Node.js server SHALL communicate over a single raw WebSocket connection (RFC 6455). All application messages SHALL be JSON-encoded `Envelope` objects, where the discriminator `kind` identifies the message role.

The Envelope union SHALL be:

```ts
type Envelope =
  | { kind: 'event';    seq: number; event: string;  data: unknown }
  | { kind: 'request';  id: string;  event: string;  data: unknown }
  | { kind: 'response'; id: string;  ok: boolean;    data?: unknown; error?: string }
  | { kind: 'ping' }
  | { kind: 'pong' }
  | { kind: 'resume';   lastSeq: number };
```

The schema SHALL live in `packages/shared/src/transport/envelope.ts` as a Zod discriminated union and SHALL be the single source of truth for both sides.

#### Scenario: server-initiated event carries seq and event name

- **WHEN** server emits an application event to a connected client
- **THEN** the client SHALL receive an Envelope with `kind: 'event'`, a monotonically increasing `seq`, the event name in `event`, and the payload in `data`

#### Scenario: client request gets exactly one matching response

- **WHEN** client sends an Envelope with `kind: 'request'`, unique `id`, event `session:launch`, and payload
- **THEN** the server SHALL reply with exactly one Envelope where `kind: 'response'` and `id` equals the request's `id`
- **AND** the response payload SHALL conform to `RpcResult<T>` (`{ ok, data? | error }`)

#### Scenario: malformed envelope is rejected

- **WHEN** an incoming WebSocket frame fails Zod validation against the Envelope schema
- **THEN** the receiver SHALL drop the frame and log a warning
- **AND** the receiver SHALL NOT close the connection on a single bad frame

### Requirement: Server SHALL guarantee monotonic per-socket seq with replay buffer

For each connected socket the server SHALL maintain a strictly increasing `seq` counter starting from 1, applied to every outbound `kind: 'event'` envelope. The server SHALL retain the most recent N outbound events in a per-socket ring buffer (default N = 500, configurable).

The server SHALL NOT apply seq numbering to `request` / `response` / `ping` / `pong` / `resume` envelopes.

#### Scenario: events are numbered in send order

- **GIVEN** a fresh connection
- **WHEN** server emits three events in order A, B, C
- **THEN** client SHALL receive `seq: 1`, `seq: 2`, `seq: 3` in that order

#### Scenario: ring buffer bounds memory

- **WHEN** server has emitted 600 events on a single socket with default buffer size 500
- **THEN** only events with `seq` 101 through 600 SHALL remain in the replay buffer
- **AND** events with `seq` 1 through 100 SHALL have been dropped from the buffer

### Requirement: Client SHALL reconnect with exponential backoff and resume from lastSeq

When the WebSocket closes for any reason other than explicit user logout, the client SHALL attempt to reconnect. The first retry SHALL fire after 500 ms; each subsequent retry SHALL double the delay up to 10 000 ms maximum. Each delay SHALL include random jitter of ±20%.

On `document.visibilitychange` to visible, the client SHALL fire an immediate retry (resetting backoff to 500 ms) if currently disconnected.

After the WebSocket reaches `OPEN`, the client SHALL send `{ kind: 'resume', lastSeq }` where `lastSeq` is the highest `seq` it has successfully processed.

#### Scenario: backoff doubles on repeated failure

- **GIVEN** the WebSocket fails to connect three times in a row
- **THEN** the client retry delays SHALL be approximately 500 ms, 1000 ms, 2000 ms (each ± 20%)

#### Scenario: visibility change triggers immediate retry

- **GIVEN** the client is currently in backoff state with a 4000 ms timer pending
- **WHEN** `document.visibilitychange` fires with `visible`
- **THEN** the pending timer SHALL be cancelled
- **AND** a new connection attempt SHALL fire within 50 ms

#### Scenario: resume causes server to replay missed events

- **GIVEN** server has emitted events with `seq: 1..10` and client confirmed up to `seq: 7`
- **WHEN** the connection drops and client reconnects, sending `{ kind: 'resume', lastSeq: 7 }`
- **THEN** server SHALL re-send events with `seq: 8`, `seq: 9`, `seq: 10` from its replay buffer
- **AND** server SHALL NOT re-send events with `seq` ≤ 7

#### Scenario: resume gap exceeds buffer falls back to full state refresh

- **GIVEN** server's replay buffer covers `seq: 200..700` and client requests `resume { lastSeq: 50 }`
- **WHEN** server detects the gap is too large to satisfy from buffer
- **THEN** server SHALL respond with a `state:refresh_required` event
- **AND** client SHALL re-subscribe / re-fetch initial state instead of expecting replay

### Requirement: Client SHALL queue outgoing messages while disconnected

When the WebSocket is not in `OPEN` state, the client SHALL place outgoing event and request envelopes into an in-memory FIFO outbox. Upon reconnection (after sending `resume`), the client SHALL flush the outbox in order.

The outbox SHALL be capped at 100 messages; on overflow the oldest message SHALL be dropped and a warning logged.

#### Scenario: emit during disconnect is queued and flushed

- **GIVEN** the WebSocket is in `CLOSED` state
- **WHEN** application code calls `client.emit('chat:send', payload)`
- **THEN** the envelope SHALL be appended to the outbox
- **AND** no error SHALL be thrown to the caller
- **WHEN** the connection later reaches `OPEN` and `resume` has been sent
- **THEN** the queued envelope SHALL be sent over the new connection

#### Scenario: pending request rejects on outbox overflow

- **GIVEN** the outbox is at capacity 100 and the client is disconnected
- **WHEN** application code attempts to enqueue a 101st message
- **THEN** the oldest queued message SHALL be discarded
- **AND** if it was a `request`, its pending Promise SHALL reject with a transport error

### Requirement: Heartbeat SHALL keep idle connections alive across proxies

The server SHALL send a WebSocket control-frame ping to each connected client every 25 seconds of idle time. The client SHALL send an Envelope `{ kind: 'ping' }` every 25 seconds when no other traffic has occurred. Each side SHALL respond promptly to the peer's ping with the matching pong.

If a side fails to receive any traffic (event, request, response, ping, pong) for 60 seconds, it SHALL treat the connection as dead and close it with code 4000.

#### Scenario: server pings idle client

- **GIVEN** a connected socket with no traffic for 25 seconds
- **THEN** the server SHALL send a WebSocket-level ping frame

#### Scenario: client envelope ping receives pong

- **GIVEN** the WebSocket is `OPEN` and the client sends `{ kind: 'ping' }`
- **THEN** the server SHALL reply with `{ kind: 'pong' }` within 1 second

#### Scenario: 60s silence closes the connection

- **GIVEN** a connected socket that has not received any frame for 60 seconds
- **THEN** the side noticing the silence SHALL close the WebSocket with code 4000
- **AND** the client SHALL initiate reconnect per the backoff requirement

### Requirement: Authentication SHALL happen at WebSocket handshake

The server SHALL validate the authentication credential (cookie or `Authorization` header) on the HTTP upgrade request before accepting the WebSocket. Connections without valid credentials SHALL be rejected with HTTP 401 during upgrade, never accepted and then closed at the WebSocket layer.

The validated user identity SHALL be attached to the socket's metadata and used for all subsequent authorization checks.

#### Scenario: missing credential rejected at upgrade

- **WHEN** an HTTP upgrade request arrives without a session cookie
- **THEN** the server SHALL respond with HTTP 401 and SHALL NOT complete the WebSocket handshake

#### Scenario: invalid credential rejected at upgrade

- **WHEN** an HTTP upgrade request arrives with an expired or tampered cookie
- **THEN** the server SHALL respond with HTTP 401

#### Scenario: valid credential attaches userId to socket

- **WHEN** an HTTP upgrade request arrives with a valid session cookie identifying user `u-123`
- **THEN** the server SHALL accept the upgrade
- **AND** the socket's metadata SHALL contain `userId: 'u-123'` for use by subsequent handlers

### Requirement: Server SHALL maintain user-socket and channel-socket maps

For each accepted connection, the server SHALL track:

1. A user → set of sockets map (`Map<UserId, Set<Socket>>`) — used to fan out events to all of a user's open tabs
2. A channel → set of sockets map (`Map<ChannelId, Set<Socket>>`) — used to fan out events to all subscribers of a channel
3. A per-socket meta record containing `userId`, the set of channels it joined, the outbound `seq` counter, and the replay buffer

On socket close, the server SHALL remove the socket from all maps and SHALL delete any channel entries that became empty.

#### Scenario: multi-tab fan-out

- **GIVEN** user `u-1` has three open WebSocket connections (three tabs)
- **WHEN** server calls `sendToUser('u-1', envelope)`
- **THEN** all three sockets SHALL receive the envelope

#### Scenario: empty channel pruned on last leave

- **GIVEN** channel `c-42` has exactly one subscriber socket
- **WHEN** that socket closes
- **THEN** the channel-socket map SHALL no longer contain key `c-42`

### Requirement: ChannelEmitter SHALL operate against a transport-agnostic TypedSocket interface

The existing `ChannelEmitter` and handler ecosystem SHALL continue to work without modification. Each transport implementation SHALL provide an adapter that wraps its native connection as an object satisfying the project's internal `TypedSocket` interface (minimal surface: `id`, `emit`, `on`).

The `TypedSocket` interface SHALL be defined within the project (not imported from `socket.io`) so any future transport (raw ws, SSE, WebTransport) can satisfy it structurally.

#### Scenario: existing emitter handlers receive events unchanged

- **GIVEN** a handler registered via `emitter.on('session:launch', handler)` from before this migration
- **WHEN** a client sends a `kind: 'request'` envelope with `event: 'session:launch'` (ws transport) **OR** emits `session:launch` with ack callback (socket.io transport)
- **THEN** the existing handler SHALL be invoked with the same `(channel, payload, socket, callback)` signature regardless of transport

#### Scenario: socket.id remains stable for the lifetime of one connection

- **WHEN** any transport adapter wraps a connection
- **THEN** the adapter SHALL assign a UUID as `socket.id`
- **AND** that id SHALL remain unchanged for the lifetime of the underlying connection
- **AND** a reconnected client (new connection) SHALL receive a new `socket.id`

### Requirement: Transport contract SHALL allow N implementations to share one ChannelEmitter

Server boot SHALL define a `Transport` interface that all protocol-specific transports (`SocketIoTransport`, `WsTransport`, future `SseTransport`, etc.) implement. Each Transport SHALL:

1. Accept an `Authenticator` instance via constructor
2. `attach(httpServer)` to mount on a Node `http.Server`, returning a `TransportHandle`
3. Expose `onConnection(listener)` so the boot layer can wire each new `TypedSocket` into the shared `ChannelEmitter`
4. Expose `close()` for graceful shutdown

Boot SHALL select transports based on configuration (env `TRANSPORT`) and SHALL be able to attach multiple transports against the same emitter simultaneously.

#### Scenario: shared emitter across two transports

- **GIVEN** `TRANSPORT=both` and both `SocketIoTransport` and `WsTransport` attached to the same `http.Server`
- **AND** a single `ChannelEmitter` shared by both
- **WHEN** a handler registered on the emitter calls `socket.emit('event', payload)` on a TypedSocket from EITHER transport
- **THEN** the message SHALL reach the correct client over its own transport

#### Scenario: per-transport endpoint gating

- **GIVEN** `TRANSPORT=ws` (socket.io disabled)
- **WHEN** a client attempts to connect to `/socket.io`
- **THEN** the request SHALL fail with HTTP 404
- **AND** clients connecting to `/ws` SHALL succeed

#### Scenario: default transport is ws

- **GIVEN** the `TRANSPORT` env var is unset
- **WHEN** the server boots
- **THEN** `WsTransport` SHALL be attached
- **AND** `SocketIoTransport` SHALL NOT be attached unless `TRANSPORT` explicitly includes `socketio` or `both`

### Requirement: Authentication SHALL be performed by an injected Authenticator, not embedded in Transport

Each Transport SHALL receive an `Authenticator` via its constructor. The `Authenticator.authenticate(req)` method SHALL accept a Node `http.IncomingMessage` and return `Promise<AuthContext | null>`.

Transports SHALL:
- Call the authenticator at handshake (HTTP upgrade for ws; `io.use()` middleware for socket.io)
- Reject failed authentication with HTTP 401 during the handshake (not after it)
- On success, attach the returned `AuthContext` (containing at least `userId`) to the produced `TypedSocket`'s metadata

#### Scenario: identical Authenticator drives both transports

- **GIVEN** a `CookieAuthenticator` wired into both `SocketIoTransport` and `WsTransport`
- **WHEN** a request without a session cookie hits either transport's upgrade
- **THEN** both transports SHALL respond with HTTP 401
- **AND** neither shall produce a `TypedSocket`

#### Scenario: AuthContext attached after success

- **GIVEN** a request with a valid session cookie identifying user `u-123` to either transport
- **THEN** the produced `TypedSocket`'s metadata SHALL contain `userId: 'u-123'`

### Requirement: ResumableSocket wrapper SHALL provide cross-transport seq + replay

Sequence numbering and replay buffering SHALL NOT live inside any specific Transport. Instead, a `ResumableSocket` class SHALL wrap any `TypedSocket` and add:

- A monotonically increasing `seq` on every `emit` of a non-control event
- A bounded ring buffer (default 500 entries) of recent outbound events
- A `resume(lastSeq)` method that replays buffered events with `seq > lastSeq` in order

The boot layer SHALL wrap each new `TypedSocket` (from any transport) in a `ResumableSocket` keyed by a `sessionKey` (long-lived, supplied by client). Reconnection from the same `sessionKey` SHALL reuse the existing `ResumableSocket` and rebind its `inner` to the new connection.

This means **socket.io transport ALSO benefits** from message-level replay, fixing the gap where socket.io's auto-reconnect drops in-flight messages.

#### Scenario: replay benefits both transports

- **GIVEN** a client connected via socket.io with sessionKey `s-1` that received seq 1..7
- **WHEN** the connection drops, server emits seq 8/9/10 during the gap, client reconnects with the same sessionKey and reports `lastSeq: 7` via socket.io's reconnect-attempt event
- **THEN** the server SHALL replay seq 8/9/10 from the ResumableSocket's buffer

- **GIVEN** the same scenario but ws transport and `{ kind: 'resume', lastSeq: 7 }` envelope
- **THEN** identical replay behavior SHALL occur

#### Scenario: ws envelope kind: 'resume' triggers ResumableSocket.resume

- **WHEN** a ws client sends `{ kind: 'resume', lastSeq: N }` after reconnect
- **THEN** `WsTransport` SHALL call `resumableSocket.resume(N)` on the rebound socket

#### Scenario: replay buffer is per-sessionKey, not per-connection

- **WHEN** sessionKey `s-1` reconnects 3 times in succession (each with a new underlying connection)
- **THEN** all three reconnections SHALL share the same ResumableSocket and ring buffer

### Requirement: Broadcast SHALL fan out at the Emitter level, not the Transport level

`ChannelEmitter.broadcastAll(event, ...args)` SHALL iterate its tracked sockets (`socketRefs`) and call `socket.emit(event, ...args)` on each. Transports SHALL NOT expose a `broadcast` method.

This guarantees that broadcasts naturally span all attached transports without duplication.

#### Scenario: cross-transport broadcast

- **GIVEN** `TRANSPORT=both` with one socket.io client and one ws client connected
- **WHEN** a handler calls `emitter.broadcastAll('system:announcement', payload)`
- **THEN** both clients SHALL receive the event over their respective transports
