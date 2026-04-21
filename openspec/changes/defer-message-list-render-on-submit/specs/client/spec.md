## ADDED Requirements

### Requirement: Enter-to-submit clears textarea on its own paint
The chat compose textarea SHALL clear its value on a paint that happens before `sendMessage` runs, regardless of how many messages the current channel renders. `flushSync` on the clear commit is used to enforce this ordering.

#### Scenario: Submit on a long conversation
- **WHEN** the user presses Enter on a channel with 100+ existing messages
- **THEN** the textarea renders empty on the next browser paint — before the new user message appears in MessageList

#### Scenario: User message appears without deferral
- **WHEN** the user presses Enter
- **THEN** the new user message appears in MessageList on the following commit (default React priority, not transition); no empty-list delay after the clear

#### Scenario: Socket emit is not deferred
- **WHEN** the user presses Enter
- **THEN** `channelEmit(socket, channelId, 'chat:send', { message })` is called synchronously within the submit call path

#### Scenario: Attachment submit path also clears first
- **WHEN** the user submits with attachments (base64 conversion completes asynchronously, then messages update)
- **THEN** the textarea clear still runs via `flushSync` before the attachment pipeline starts, so the chip strip and textarea empty on the same early paint
