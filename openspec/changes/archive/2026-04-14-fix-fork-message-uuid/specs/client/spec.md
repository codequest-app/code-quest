# Spec Delta: client (fix-fork-message-uuid)

## ADDED Requirements

### Requirement: Message identity separates local id from CLI uuid

Each `Message` SHALL expose two distinct identity fields:

- `id: string` — locally assigned at message creation (e.g. `crypto.randomUUID()`); used as React key and dedup anchor; NEVER mutated post-creation.
- `cliUuid?: string` — the JSONL `uuid` assigned by CLI/server; populated when a `message:user` or assistant event carries a `uuid`; absent until the CLI/server has acknowledged the message.

#### Scenario: dedup matches by content sets cliUuid not id

- GIVEN a user message in state with `id === 'local-x'` and `content === 'hi'` and no `cliUuid`
- WHEN a `message:user` event arrives with `uuid === 'cli-y'` and matching content `'hi'`
- THEN the message SHALL retain `id === 'local-x'`
- AND the message SHALL gain `cliUuid === 'cli-y'`

#### Scenario: non-matching content appends new message with cliUuid

- GIVEN a user message in state with `content === 'hi'` (no cliUuid)
- WHEN a `message:user` event arrives with `uuid === 'cli-z'` and content `'hello'` (does not match)
- THEN a new message SHALL be appended with `cliUuid === 'cli-z'`
- AND the existing `'hi'` message SHALL remain unchanged

#### Scenario: no uuid in payload mutates nothing

- GIVEN a user message in state
- WHEN a `message:user` event arrives WITHOUT a `uuid` field
- THEN no message's `id` or `cliUuid` SHALL be modified

### Requirement: Fork picker excludes messages without cliUuid

`RewindDialog` SHALL only display messages whose `cliUuid` is a non-empty string. Messages awaiting the CLI echo (no `cliUuid` yet) SHALL NOT be selectable as fork points.

#### Scenario: picker shows only messages with cliUuid

- GIVEN three user text messages: A (cliUuid='u1'), B (no cliUuid), C (cliUuid='u3')
- WHEN `RewindDialog` renders
- THEN the rewindable list SHALL contain only A and C

#### Scenario: confirm emits cliUuid as messageId

- GIVEN a user selects message A in the picker (cliUuid='u1', id='local-a')
- WHEN the user confirms
- THEN `onConfirm` SHALL be invoked with `messageId === 'u1'`
- AND `onConfirm` SHALL NOT receive `'local-a'`
