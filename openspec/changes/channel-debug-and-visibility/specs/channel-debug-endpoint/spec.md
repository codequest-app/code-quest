## ADDED Requirements

### Requirement: Debug channels endpoint
Server SHALL expose `GET /debug/channels` returning a JSON snapshot of all channels currently in `ChannelManager`, guarded by a config flag so it is disabled in production.

#### Scenario: Endpoint returns all channels
- **WHEN** `GET /debug/channels` is requested and debug mode is enabled
- **THEN** response is `200 OK` with `{ channels: [...] }` where each entry contains `channelId`, `sessionId`, `exited`, `isBound`, `isProcessing`, `cwd`, `projectRoot`

#### Scenario: Endpoint disabled in production
- **WHEN** `GET /debug/channels` is requested and debug mode is disabled
- **THEN** response is `404 Not Found`

### Requirement: join() sets projectRoot
`ChannelManager.join()` SHALL set `channel.projectRoot` from the session DB row when performing a lazy resume, so subsequent `app:init` calls include a valid `projectRoot`.

#### Scenario: Lazy resume carries projectRoot
- **WHEN** `session:join` triggers lazy resume via `channelManager.join()`
- **THEN** the created channel's `projectRoot` equals the value stored in the session DB row (or `cwd` if the row has none)

#### Scenario: handleInit always includes projectRoot
- **WHEN** `app:init` is called after a lazy resume
- **THEN** every session entry in the response includes `projectRoot` as a non-empty string

### Requirement: SessionLookup exposes projectRoot resolution
`SessionLookup` interface SHALL include `resolveProjectRoot(channelId): Promise<string>` so `ChannelManager` can retrieve it without depending on the full `SessionStore`.

#### Scenario: resolveProjectRoot returns DB value
- **WHEN** `resolveProjectRoot(channelId)` is called for a known channelId
- **THEN** returns the `projectRoot` stored in the session row, or `cwd` as fallback
