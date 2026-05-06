## ADDED Requirements

### Requirement: Each summoner daemon SHALL connect as a channel peer with user identity

When a summoner daemon connects via WsTransport, it SHALL authenticate with a bearer token that maps to a user identity. The server SHALL create a summoner channel for that user, tracked in ChannelEmitter alongside browser channels.

The summoner channel SHALL be keyed by user identity so that browser requests for that user route to the correct daemon.

#### Scenario: summoner connects and registers as channel peer

- **WHEN** a summoner daemon connects with a valid bearer token for user `u-1`
- **THEN** the server SHALL create a summoner channel associated with `u-1`
- **AND** the channel SHALL be accessible via `channelManager.getSummonerChannel('u-1')`

#### Scenario: summoner with invalid token is rejected

- **WHEN** a summoner daemon connects with an invalid or missing bearer token
- **THEN** the server SHALL reject the connection with HTTP 401 during upgrade
- **AND** no channel SHALL be created

### Requirement: Server SHALL route RPC calls to the correct user's summoner

When a browser session needs to invoke a remote operation (e.g., `fs/readFileAbsolute`), the server SHALL look up the summoner channel for the session's user and forward the request to that daemon. If no summoner is connected for the user, the server SHALL return an error.

#### Scenario: browser request routes to user's summoner

- **GIVEN** user `u-1` has a browser session and a connected summoner daemon
- **WHEN** the browser session triggers `fs/readFileAbsolute` via a handler
- **THEN** the server SHALL forward the request to `u-1`'s summoner channel
- **AND** the summoner's response SHALL be returned to the calling handler

#### Scenario: no summoner connected returns error

- **GIVEN** user `u-2` has a browser session but no connected summoner daemon
- **WHEN** the browser session triggers a remote filesystem operation
- **THEN** the server SHALL return an error: "No remote daemon connected"

### Requirement: Multiple summoner daemons SHALL coexist independently

The server SHALL support N simultaneous summoner connections, each belonging to a different user. Each daemon SHALL have its own channel, lifecycle, and process namespace. One daemon disconnecting SHALL NOT affect other daemons.

#### Scenario: two users each with their own summoner

- **GIVEN** user `u-1` and user `u-2` each have a connected summoner daemon
- **WHEN** `u-1`'s browser requests `git/status`
- **THEN** the request SHALL be routed to `u-1`'s summoner only
- **AND** `u-2`'s summoner SHALL NOT receive the request

#### Scenario: one summoner disconnects without affecting others

- **GIVEN** `u-1` and `u-2` both have connected summoners
- **WHEN** `u-1`'s summoner disconnects
- **THEN** `u-2`'s summoner SHALL remain connected and functional
- **AND** only `u-1`'s browser sessions SHALL see a "daemon disconnected" status

### Requirement: Summoner daemon SHALL support session resume via Envelope protocol

Summoner daemons SHALL use the same `sessionKey` + `resume` mechanism as browser clients. On reconnect, the daemon SHALL send `{ kind: 'resume', lastSeq }` and the server SHALL replay missed events from the ring buffer.

#### Scenario: summoner reconnects and resumes

- **GIVEN** a summoner daemon was connected with sessionKey `sk-1` and received events up to `seq: 5`
- **WHEN** the connection drops and the daemon reconnects with `{ kind: 'resume', lastSeq: 5 }`
- **THEN** the server SHALL replay events `seq: 6..N` from the ring buffer
- **AND** the summoner channel SHALL be rebound to the new connection
