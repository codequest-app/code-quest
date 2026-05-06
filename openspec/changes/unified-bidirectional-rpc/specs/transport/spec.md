## MODIFIED Requirements

### Requirement: Browser ↔ server transport SHALL use raw WebSocket with a JSON envelope

The browser client, summoner daemon, and Node.js server SHALL communicate over raw WebSocket connections (RFC 6455) using JSON-encoded `Envelope` objects. The Envelope union SHALL be extended to support bidirectional request/response:

```ts
type Envelope =
  | { kind: 'event';    seq: number; event: string;  data: unknown }
  | { kind: 'request';  id: string;  event: string;  data: unknown }
  | { kind: 'response'; id: string;  ok: boolean;    data?: unknown; error?: string }
  | { kind: 'ping' }
  | { kind: 'pong' }
  | { kind: 'resume';   lastSeq: number };
```

The Envelope schema is unchanged structurally — the modification is that `kind: 'request'` and `kind: 'response'` SHALL now be valid in both directions (client→server AND server→client/summoner). Previously only client→server requests were supported.

The schema SHALL live in `packages/shared/src/transport/envelope.ts` as a Zod discriminated union and SHALL be the single source of truth for all peers.

#### Scenario: server-initiated event carries seq and event name

- **WHEN** server emits an application event to a connected client
- **THEN** the client SHALL receive an Envelope with `kind: 'event'`, a monotonically increasing `seq`, the event name in `event`, and the payload in `data`

#### Scenario: client request gets exactly one matching response

- **WHEN** client sends an Envelope with `kind: 'request'`, unique `id`, event `session:launch`, and payload
- **THEN** the server SHALL reply with exactly one Envelope where `kind: 'response'` and `id` equals the request's `id`
- **AND** the response payload SHALL conform to `RpcResult<T>` (`{ ok, data? | error }`)

#### Scenario: server request to summoner gets exactly one matching response

- **WHEN** server sends an Envelope with `kind: 'request'`, unique `id`, event `fs/readFileAbsolute`, and payload to a summoner
- **THEN** the summoner SHALL reply with exactly one Envelope where `kind: 'response'` and `id` equals the request's `id`
- **AND** the response payload SHALL conform to `RpcResult<T>`

#### Scenario: malformed envelope is rejected

- **WHEN** an incoming WebSocket frame fails Zod validation against the Envelope schema
- **THEN** the receiver SHALL drop the frame and log a warning
- **AND** the receiver SHALL NOT close the connection on a single bad frame

### Requirement: WsTransport SHALL accept both browser and summoner connections

WsTransport SHALL distinguish connection types by URL path or query parameter. Browser clients connect to `/ws`; summoner daemons connect to `/ws/summoner`. Both connection types SHALL be wrapped as `TypedSocket` and delivered to ChannelEmitter via `onConnection`.

The summoner's `TypedSocket` SHALL additionally expose a `request(event, data): Promise<R>` method for server-initiated RPC calls, using the Envelope request/response mechanism.

#### Scenario: browser connects to /ws

- **WHEN** a browser client connects to `/ws` with valid credentials
- **THEN** WsTransport SHALL wrap the connection as a TypedSocket and emit `onConnection`
- **AND** the TypedSocket SHALL support `emit` and `on` for event-driven communication

#### Scenario: summoner connects to /ws/summoner

- **WHEN** a summoner daemon connects to `/ws/summoner` with a valid bearer token
- **THEN** WsTransport SHALL wrap the connection as a TypedSocket and emit `onConnection`
- **AND** the TypedSocket SHALL support `request(event, data)` for server→summoner RPC

#### Scenario: summoner path without token is rejected

- **WHEN** a connection attempts `/ws/summoner` without a valid bearer token
- **THEN** WsTransport SHALL reject with HTTP 401 during upgrade
