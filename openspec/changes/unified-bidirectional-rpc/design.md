## Context

The server currently has two WebSocket protocol stacks:
1. **Envelope protocol** (WsTransport) — browser ↔ server, with ChannelEmitter, ResumableSocket, TypedSocket
2. **JSON-RPC protocol** (Connection + upgrade-handler) — server ↔ single summoner daemon

Both are WebSocket-based, both do request/response, both have heartbeat. But they're completely separate implementations. The Envelope stack already has channel routing, session resume, multi-client support, and broadcast — features the JSON-RPC stack lacks.

The architecture is moving toward multiple summoner daemons (one per user). This requires channel routing and identity management for daemons — capabilities the Envelope stack already provides.

### Current data flow

```
Browser  →  WsTransport  →  TypedSocket  →  ChannelEmitter  →  handlers
Summoner →  upgrade-handler  →  Connection (JSON-RPC)  →  Remote*Service
```

### Target data flow

```
Browser  →  WsTransport(/ws)           →  TypedSocket  →  ChannelEmitter  →  handlers
Summoner →  WsTransport(/ws/summoner)  →  TypedSocket  →  ChannelEmitter  →  summoner channel
                                                           ↕ request()
                                                       Remote*Service
```

## Goals / Non-Goals

**Goals:**
- Unify browser and summoner connections into one transport layer (WsTransport + Envelope)
- Enable multi-summoner support via ChannelEmitter channel routing
- Reuse session resume / replay buffer for summoner reconnects
- Remove the separate JSON-RPC Connection class and upgrade-handler

**Non-Goals:**
- Changing the browser client protocol (it already speaks Envelope)
- Multi-user authentication system (identity comes from token, auth system is separate)
- Changing handler registration API (ChannelEmitter.on() stays the same)

## Decisions

### 1. Extend Envelope for bidirectional RPC — don't create a new protocol

**Decision**: Keep the existing Envelope schema unchanged (it already supports `kind: 'request'` and `kind: 'response'`). The only change is allowing server→peer direction, which is a semantic change not a schema change.

**Alternative**: Create a separate `ServerRequest` envelope kind. Rejected — adds schema complexity with no benefit since the existing request/response kinds are direction-agnostic.

### 2. TypedSocket gains optional `request()` method for server→peer RPC

**Decision**: Add `request(event: string, data: unknown): Promise<RpcResult<unknown>>` to TypedSocket as an optional method. Server code checks if the socket supports it before calling. This keeps backward compatibility with browser sockets that don't need it.

**Alternative**: Create a separate `RpcSocket extends TypedSocket`. Rejected — splits the type hierarchy and forces all handlers to know which type they have.

### 3. Summoner connects to `/ws/summoner` on the same WsTransport

**Decision**: WsTransport distinguishes peer type by URL path during upgrade. `/ws` = browser, `/ws/summoner` = summoner daemon. Both go through the same Authenticator and produce TypedSocket instances.

**Alternative**: Separate WsTransport instance for summoner. Rejected — duplicates transport infrastructure and complicates shutdown.

### 4. Remote*Service calls summoner via TypedSocket.request() through ChannelEmitter

**Decision**: RemoteFilesystemService, RemoteGitService, RemoteProcessProvider no longer hold a Connection reference. Instead, they receive a function `getSummonerSocket(userId): TypedSocket | null` and call `socket.request(REMOTE_METHODS.fs.readFileAbsolute, params)`.

**Alternative**: Keep Connection as a wrapper around TypedSocket. Rejected — adds an unnecessary layer since TypedSocket.request() provides the same capability.

### 5. Summoner Agent becomes an Envelope request handler

**Decision**: The summoner-side Agent class registers handlers keyed by REMOTE_METHODS. When the Envelope client receives `kind: 'request'`, it invokes the matching handler and sends `kind: 'response'`. This is structurally identical to today's JSON-RPC dispatch, just with Envelope framing.

**Alternative**: Have the summoner register as a ChannelEmitter listener. Rejected — the summoner is a responder, not an event subscriber.

### 6. Shared `EnvelopeClient` class for both browser and summoner

**Decision**: Extract a shared `EnvelopeClient` class (in `packages/shared`) that handles:
- Sending requests and awaiting responses (with timeout)
- Receiving requests and dispatching to handler map
- Sending/receiving events
- Heartbeat (using the existing shared `createHeartbeat`)

Browser client and summoner daemon both instantiate this class with their WebSocket.

**Alternative**: Keep separate client implementations. Rejected — that's the current problem.

## Risks / Trade-offs

- **[Breaking change]** Summoner wire protocol changes — all summoner binaries must be updated simultaneously with the server. → Mitigation: version the summoner and fail fast on mismatch.
- **[Complexity in WsTransport]** WsTransport now handles two peer types with different capabilities. → Mitigation: peer type is determined once at upgrade time and attached to metadata; the rest is transparent via TypedSocket.
- **[Process notification throughput]** Summoner stdout/stderr notifications go through Envelope seq numbering, adding overhead vs raw JSON-RPC. → Mitigation: notifications use `kind: 'event'` which is lightweight; seq is just an incrementing counter.
- **[Migration window]** During implementation, both protocols need to work until the switch is complete. → Mitigation: implement behind feature flag or do the switch in a single coordinated commit per package.
