# Spec Delta: protocol (unify-rpc-ack)

## ADDED Requirements

### Requirement: All RPC ack responses SHALL follow the RpcResult discriminated union

Every socket.io RPC (emit with callback) SHALL ack with a value matching `RpcResult<T>`:

```ts
type RpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
```

On success, data fields live under `data`. On failure, the error message is a user-facing string; `code` is an optional machine-readable classifier.

Fire-and-forget events (no ack callback) and broadcast events (no request-response pairing) are exempt.

#### Scenario: successful launch returns ok with channel data

- WHEN a client emits `session:launch` with a valid cwd
- THEN the ack SHALL be `{ ok: true, data: { channelId, slashCommands?, models?, account? } }`

#### Scenario: failed launch returns err with message

- WHEN `session:launch` handler throws during processing
- THEN the ack SHALL be `{ ok: false, error: <string message> }`

#### Scenario: resume reuse acks ok with existing channel

- GIVEN an alive channel for the requested sessionId
- WHEN a client emits `session:resume`
- THEN the ack SHALL be `{ ok: true, data: { channelId: <alive channelId> } }`

#### Scenario: fork rejected with unknown parent

- GIVEN no sessionStore row for the parent channelId
- WHEN a client emits `session:fork`
- THEN the ack SHALL be `{ ok: false, error: /parent session not found/ }`

#### Scenario: file:list returns ok with files array

- WHEN a client emits `file:list`
- AND the channel has a valid cwd
- THEN the ack SHALL be `{ ok: true, data: { files: FileResult[] } }`

#### Scenario: zod response schemas accept only the discriminated union shape

- GIVEN any response schema `rpcResult(T)`
- WHEN `safeParse` is called on a legacy shape `{ success: true, channelId: 'X' }`
- THEN `success` SHALL be `false`
- AND `error.issues` SHALL indicate the missing `ok` discriminator
