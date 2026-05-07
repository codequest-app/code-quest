## ADDED Requirements

### Requirement: sendMessage marks messages as user input
When the user submits a message via `sendMessage`, the resulting message SHALL have `meta.fromInput: true` set. Messages arriving from CLI replay, history load, or skill injection SHALL NOT have `fromInput` set.

#### Scenario: User-submitted message has fromInput true
- **WHEN** the user submits a message through the compose input
- **THEN** the message in channel state SHALL have `meta.fromInput === true`

#### Scenario: CLI-echoed message without prior sendMessage has no fromInput
- **WHEN** a `message:user` event arrives from the CLI with no matching prior `sendMessage` call
- **THEN** the resulting message SHALL NOT have `meta.fromInput` set

#### Scenario: History-loaded messages have no fromInput
- **WHEN** messages are loaded from session history via `buildMessagesFromHistory`
- **THEN** none of the resulting messages SHALL have `meta.fromInput` set
