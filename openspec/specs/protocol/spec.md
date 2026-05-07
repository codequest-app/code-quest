## MODIFIED Requirements

### Requirement: All RPC ack responses SHALL follow the RpcResult discriminated union

Every request/response RPC pair (a client envelope with `kind: 'request'` and the matching server envelope with `kind: 'response'`, OR a server envelope with `kind: 'request'` and the matching summoner envelope with `kind: 'response'`) SHALL carry a payload matching `RpcResult<T>`:

```ts
type RpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
```

On success, data fields live under `data`. On failure, the error message is a user-facing string; `code` is an optional machine-readable classifier.

Fire-and-forget events (envelope `kind: 'event'` without a paired response) and broadcast events (no request-response pairing) are exempt.

This requirement applies to ALL directions of RPC communication:
- Client → Server requests (browser sessions)
- Server → Summoner requests (remote filesystem, git, process operations)
- Summoner → Server responses

Zod schemas in `packages/shared` SHALL validate against `RpcResult` regardless of transport or direction.

#### Scenario: successful launch returns ok with channel data

- WHEN a client sends a `session:launch` request envelope with a valid cwd
- THEN the response envelope SHALL carry `{ ok: true, data: { channelId, slashCommands?, models?, account? } }`

#### Scenario: failed launch returns err with message

- WHEN `session:launch` handler throws during processing
- THEN the response envelope SHALL carry `{ ok: false, error: <string message> }`

#### Scenario: successful summoner fs/readFileAbsolute returns ok with content

- WHEN server sends a `fs/readFileAbsolute` request to a summoner
- THEN the summoner's response envelope SHALL carry `{ ok: true, data: { content: '...' } }`

#### Scenario: failed summoner operation returns err

- WHEN a summoner handler throws during `git/status` processing
- THEN the response envelope SHALL carry `{ ok: false, error: <string message> }`
