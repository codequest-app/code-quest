## ADDED Requirements

### Requirement: resumable middleware factory
`resumable(opts?)` SHALL return a WsTransport `Middleware` that manages a session registry of ResumableSockets with configurable `bufferSize` (default 500) and `ttlMs` (default 300000).

#### Scenario: first connection creates ResumableSocket
- **WHEN** a client connects with `?sessionKey=abc` for the first time
- **THEN** the middleware SHALL create a new ResumableSocket wrapping the TypedSocket and store it in the registry keyed by `abc`

#### Scenario: reconnection rebinds existing ResumableSocket
- **WHEN** a client reconnects with `?sessionKey=abc` and a ResumableSocket for `abc` exists in the registry
- **THEN** the middleware SHALL call `rebind(newTypedSocket)` on the existing ResumableSocket instead of creating a new one

#### Scenario: anonymous connection without sessionKey
- **WHEN** a client connects without a `sessionKey` query parameter
- **THEN** the middleware SHALL create a ResumableSocket for the connection lifetime but NOT store it in the registry

### Requirement: RESUME_EVENT triggers replay
The middleware SHALL listen for RESUME_EVENT on the TypedSocket and call `resumable.resume(lastSeq)`.

#### Scenario: successful resume replay
- **WHEN** client sends a resume envelope with `lastSeq` and the buffer can satisfy it
- **THEN** the middleware SHALL replay buffered events with seq > lastSeq

#### Scenario: resume gap emits refresh signal
- **WHEN** client sends a resume envelope with `lastSeq` that falls outside the buffer
- **THEN** the middleware SHALL emit `state:refresh_required` through the ResumableSocket

### Requirement: TTL cleanup on disconnect
The middleware SHALL start a TTL timer when a session disconnects. If no reconnection occurs within `ttlMs`, the session SHALL be removed from the registry.

#### Scenario: TTL expires without reconnect
- **WHEN** a session disconnects and `ttlMs` elapses without reconnection
- **THEN** the ResumableSocket and its buffer SHALL be removed from the registry

#### Scenario: reconnect cancels TTL timer
- **WHEN** a session disconnects and reconnects before `ttlMs` elapses
- **THEN** the TTL timer SHALL be cancelled and the session SHALL remain in the registry

### Requirement: transformSocket hook integration
The middleware SHALL set `context.transformSocket` before calling `next()`, allowing WsTransport to apply the socket transformation after creating the TypedSocket.

#### Scenario: middleware sets transformSocket on context
- **WHEN** the middleware runs
- **THEN** `context.transformSocket` SHALL be a function that accepts a TypedSocket and returns a ResumableSocket
