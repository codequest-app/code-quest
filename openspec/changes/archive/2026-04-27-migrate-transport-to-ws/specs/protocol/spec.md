## MODIFIED Requirements

### Requirement: All RPC ack responses SHALL follow the RpcResult discriminated union

Every request/response RPC pair (a client envelope with `kind: 'request'` and the matching server envelope with `kind: 'response'`) SHALL carry a payload matching `RpcResult<T>`:

```ts
type RpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
```

On success, data fields live under `data`. On failure, the error message is a user-facing string; `code` is an optional machine-readable classifier.

Fire-and-forget events (envelope `kind: 'event'` without a paired response) and broadcast events (no request-response pairing) are exempt.

This requirement is transport-agnostic: the same `RpcResult<T>` shape SHALL apply whether the underlying transport is socket.io ack callback (legacy) or a `kind: 'response'` envelope over raw WebSocket. Zod schemas in `packages/shared` SHALL validate against `RpcResult` regardless of transport.

#### Scenario: successful launch returns ok with channel data

- WHEN a client sends a `session:launch` request envelope with a valid cwd
- THEN the response envelope SHALL carry `{ ok: true, data: { channelId, slashCommands?, models?, account? } }`

#### Scenario: failed launch returns err with message

- WHEN `session:launch` handler throws during processing
- THEN the response envelope SHALL carry `{ ok: false, error: <string message> }`

#### Scenario: resume reuse acks ok with existing channel

- GIVEN an alive channel for the requested sessionId
- WHEN a client sends a `session:resume` request envelope
- THEN the response envelope SHALL carry `{ ok: true, data: { channelId: <alive channelId> } }`

#### Scenario: fork rejected with unknown parent

- GIVEN no sessionStore row for the parent channelId
- WHEN a client sends a `session:fork` request envelope
- THEN the response envelope SHALL carry `{ ok: false, error: /parent session not found/ }`

#### Scenario: file:list returns ok with files array

- WHEN a client sends a `file:list` request envelope
- AND the channel has a valid cwd
- THEN the response envelope SHALL carry `{ ok: true, data: { files: FileResult[] } }`

#### Scenario: zod response schemas accept only the discriminated union shape

- GIVEN any response schema `rpcResult(T)`
- WHEN `safeParse` is called on a legacy shape `{ success: true, channelId: 'X' }`
- THEN `success` SHALL be `false`
- AND `error.issues` SHALL indicate the missing `ok` discriminator

#### Scenario: legacy socket.io ack still accepted during coexistence

- GIVEN the server is running with `transport.socketio.enabled = true`
- WHEN a legacy client emits via socket.io ack callback
- THEN the ack value SHALL still match `RpcResult<T>` exactly
- AND no shape difference SHALL exist between socket.io ack payload and ws response envelope's `data`/`error` fields

### Requirement: Socket event names are referenced via the shared `EVENTS` constant

All code under `apps/server` and `apps/web` that registers handlers, emits, or awaits a reply on a project-defined socket event SHALL reference the event name via the `EVENTS` constant exported from `@code-quest/shared`. Bare string literals MUST NOT be used for project-defined event names.

Exemptions:
- Transport-level lifecycle events (`'connection'`, `'disconnect'`, `'error'`, `'connect'`, `'connect_error'`) — these are library-level (Socket.IO and the `ws` library both emit them) and not part of the project protocol.
- Synthetic envelope-protocol kinds (`'__resume__'` and other `__*__` events fired by `WsTransport` for the registry layer) — internal plumbing, not application events.
- Test fixtures explicitly asserting on the wire-level string (if any) — these remain as literals but MUST assert equality with `EVENTS.*` to pin the binding.

#### Scenario: Typo in an event name fails at type-check time

- **WHEN** a developer writes `socket.emit(EVENTS.session.lsit, …)` (typo)
- **THEN** TypeScript reports a missing-property error at build time, before runtime

#### Scenario: Rename of an event updates every caller via the constant

- **WHEN** `EVENTS.chat.rewind_code` is renamed to `EVENTS.chat.rewindCode` in the shared module
- **THEN** TypeScript flags every call site that still references the old key
