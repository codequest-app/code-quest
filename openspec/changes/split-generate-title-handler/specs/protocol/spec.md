## ADDED Requirements

### Requirement: Session title generation separates request, persist, and broadcast

The server module that produces session titles SHALL expose three disjoint steps:
1. Title request — sends `session:generate_title` to the CLI, validates the response with `controlGenerateTitleResponseSchema`, returns the title or `null` (on invalid / empty response).
2. Title persistence — calls `sessionStore.renameByChannelId(channelId, title)`; a persistence failure MUST be logged as a warning (`'Failed to persist session title'`) but MUST NOT block the broadcast.
3. Title broadcast — calls `channelManager.broadcastSessionState(channelId, 'idle', title)`.

The orchestrator for these steps SHALL early-return when no pending title prompt exists, clear the pending prompt before the request (to prevent duplicate requests on re-entry), and log an error (`'Failed to generate session title'`) if the request itself throws.

#### Scenario: No pending prompt — no-op

- **WHEN** `ch.pendingTitlePrompt` is `undefined`
- **THEN** no CLI request is sent, no persistence occurs, and no broadcast fires

#### Scenario: Happy path — title reaches DB and clients

- **WHEN** a pending prompt exists and the CLI returns a valid `{ title }` response
- **THEN** `ch.title` is set, `sessionStore.renameByChannelId` is called with the channel id and title, and `broadcastSessionState(channelId, 'idle', title)` fires

#### Scenario: Persistence failure does not block broadcast

- **WHEN** the CLI responds successfully but `sessionStore.renameByChannelId` rejects
- **THEN** the rejection is logged at warn level with message `'Failed to persist session title'`
- **AND** the broadcast still fires with the new title

#### Scenario: CLI error swallowed with error log

- **WHEN** `ch.sendRequest('session:generate_title', …)` throws
- **THEN** the error is logged at error level with message `'Failed to generate session title'`
- **AND** no persistence or broadcast occurs
