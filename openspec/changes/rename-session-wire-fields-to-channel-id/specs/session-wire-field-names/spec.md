## ADDED Requirements

### Requirement: Wire fields that carry a channelId use `channelId`-suffixed names

Every field on a client↔server socket/REST schema whose value is a server `Channel.channelId` SHALL use a name ending in `channelId` (or the unqualified field name `channelId` for the self-reference case). Fields MUST NOT use `*Session*` names to refer to values that are actually channel identifiers.

Scope of rename in this change (from previous names → new names):
- `sessionForkPayloadSchema.forkedFromSession` → `forkedFromChannelId`
- `sessionForkPayloadSchema.newSessionId` → `newChannelId`
- `sessionTeleportPayloadSchema.remoteSessionId` → `remoteChannelId`
- `sessionTeleportPayloadSchema.newSessionId` → `newChannelId`
- `sessionLaunchPayloadSchema.resume` → `resumeChannelId`
- `sessionStatesPayloadSchema.activeSessionId` → `activeChannelId`
- `initResponseSchema.activeSessionId` → `activeChannelId`
- `forkConversationResponseSchema.parentSessionId` → `parentChannelId`

#### Scenario: Fork payload

- **WHEN** the client emits `session:fork`
- **THEN** the payload contains `forkedFromChannelId: string` and `newChannelId: string`
- **AND** the payload contains no field named `forkedFromSession` or `newSessionId`

#### Scenario: Launch resume

- **WHEN** the client emits `session:launch` to resume an existing session
- **THEN** the payload contains `resumeChannelId: string` (not `resume`)

#### Scenario: Active channel in states broadcast

- **WHEN** the server broadcasts `session:states` or returns an `initResponse`
- **THEN** the active-channel pointer is named `activeChannelId`, not `activeSessionId`
