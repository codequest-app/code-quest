## ADDED Requirements

### Requirement: Summoner transport SHALL queue outbound requests during disconnect

`SummonerWsClient` SHALL maintain an outbox of pending envelopes. While disconnected, calls to `request()` SHALL be queued rather than rejected. On reconnect, the outbox SHALL be flushed in order before any new requests are sent.

#### Scenario: request during disconnect is queued

- **WHEN** summoner is disconnected
- **AND** `rpc.request(method, params)` is called
- **THEN** the request SHALL be added to the outbox
- **AND** the returned Promise SHALL remain pending

#### Scenario: queued requests are sent on reconnect

- **WHEN** summoner reconnects
- **THEN** all queued outbox requests SHALL be sent in order
- **AND** their Promises SHALL resolve or reject based on the server response

#### Scenario: outbox overflow drops oldest request

- **WHEN** the outbox exceeds its size limit (default 100)
- **THEN** the oldest queued request SHALL be dropped
- **AND** its Promise SHALL be rejected with an `outbox overflow` error

### Requirement: Summoner transport SHALL send RESUME_EVENT on reconnect

On each successful reconnect, `SummonerWsClient` SHALL send `{ kind: 'resume', lastSeq }` as the first message, where `lastSeq` is the highest `seq` received from the server in this process lifetime.

#### Scenario: resume sent before outbox flush

- **WHEN** summoner reconnects successfully
- **THEN** `{ kind: 'resume', lastSeq }` SHALL be sent before any queued outbox envelopes
- **AND** server SHALL replay any buffered events with seq > lastSeq

#### Scenario: first connect sends resume with lastSeq 0

- **WHEN** summoner connects for the first time (no prior messages received)
- **THEN** `{ kind: 'resume', lastSeq: 0 }` SHALL be sent
- **AND** server SHALL replay nothing (empty buffer)

### Requirement: Summoner transport SHALL use sessionKey for ResumableSocket rebind

The `sessionKey` query parameter SHALL be a stable UUID generated once per summoner process and included in every connection URL (including reconnects). This allows server `resumable()` middleware to rebind the same `ResumableSocket` on reconnect.

#### Scenario: reconnect uses same sessionKey

- **WHEN** summoner disconnects and reconnects
- **THEN** the reconnect URL SHALL include the same `sessionKey` as the original connection
- **AND** server SHALL rebind the existing `ResumableSocket` for that key

#### Scenario: new summoner process uses new sessionKey

- **WHEN** summoner process restarts
- **THEN** a new `sessionKey` UUID SHALL be generated
- **AND** server SHALL create a new `ResumableSocket` for the new key

### Requirement: Summoner transport SHALL handle state:refresh_required

If the server's `ResumableSocket` buffer has been overrun and cannot replay missed events, the server SHALL emit `state:refresh_required`. `SummonerWsClient` SHALL log a warning when this event is received.

#### Scenario: gap detected after reconnect

- **WHEN** summoner reconnects with a `lastSeq` older than the server's oldest buffered seq
- **THEN** server SHALL emit `state:refresh_required`
- **AND** summoner SHALL log a warning indicating events were lost
