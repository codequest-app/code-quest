## ADDED Requirements

### Requirement: SessionHistory resolves sessionId from channel or DB
SessionHistory SHALL resolve a sessionId given a channelId by first checking the in-memory channel's `sessionId`, then falling back to `SessionStore.getById()`.

#### Scenario: Channel exists in memory with sessionId
- **WHEN** `resolveSessionId(channelId)` is called and channel exists with a non-null `sessionId`
- **THEN** the channel's `sessionId` SHALL be returned without querying SessionStore

#### Scenario: Channel not in memory, falls back to DB
- **WHEN** `resolveSessionId(channelId)` is called and channel is undefined
- **THEN** SessionStore.getById SHALL be queried and the stored `sessionId` returned, or `channelId` as fallback

### Requirement: SessionHistory returns filtered history events
SessionHistory SHALL convert raw entries to SocketEvents and filter to history-relevant names (`message:assistant`, `message:user`, `message:result`, `session:init`).

#### Scenario: Get session history with mixed event types
- **WHEN** `getSessionHistory(channelId)` is called and raw entries contain assistant, user, stream, and control events
- **THEN** only events with names in the HISTORY_NAMES set SHALL be returned

#### Scenario: Stdin user messages deduplicated when stdout echoes them
- **WHEN** raw entries contain both stdin user messages and stdout user echo events
- **THEN** stdin entries SHALL be skipped to avoid duplicate `message:user` events

### Requirement: SessionHistory provides pending replay events with responded request IDs
SessionHistory SHALL return all converted events plus the set of already-responded request IDs for a given sessionId.

#### Scenario: Get pending replay events
- **WHEN** `getPendingReplayEvents(sessionId)` is called
- **THEN** the result SHALL contain `events` (all converted SocketEvents) and `respondedRequestIds` (Set extracted by adapter)

### Requirement: SessionHistory uses ProviderAdapter for protocol transformation
SessionHistory SHALL delegate stdout JSON parsing to `ProviderAdapter.transform()` and request ID extraction to `ProviderAdapter.extractRespondedRequestIds()`.

#### Scenario: Transform raw stdout line
- **WHEN** a raw entry with direction `out` contains valid JSON matching `protocolEventBase`
- **THEN** `adapter.transform(parsed)` SHALL be called and its `.events` appended to results
