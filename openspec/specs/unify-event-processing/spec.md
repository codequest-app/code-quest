# unify-event-processing Specification

## Purpose
TBD - created by archiving change unify-event-processing. Update Purpose after archive.
## Requirements
### Requirement: Live and history produce identical messages for same event sequence
The system SHALL produce identical `Message[]` output for the same `ClientMessage[]` input, regardless of whether events arrived via live stream or history replay.

#### Scenario: Error banner appears in history replay
- **WHEN** session history contains `is_error=true` result with a rate-limit message
- **THEN** B joining sees an error banner with `data-type="error"` and no result divider (`data-type="result"`)

#### Scenario: Assistant text appears in history replay
- **WHEN** session history contains a user message and assistant reply
- **THEN** B joining sees both messages rendered correctly

#### Scenario: control:permission excluded from history
- **WHEN** session history contains a `control:permission` event
- **THEN** B joining does NOT see any `data-type="permission"` element

### Requirement: is_error result emits error:message
The summoner SHALL emit an `error:message` event when `is_error=true` and a result string is present (whether in `errors[]` array or `result` field directly).

#### Scenario: is_error with errors array
- **WHEN** CLI emits result with `is_error=true` and non-empty `errors` array
- **THEN** summoner emits `message:result` followed by `error:message` for each error

#### Scenario: is_error with result string and no errors array
- **WHEN** CLI emits result with `is_error=true`, `result` string set, and no `errors` array
- **THEN** summoner emits `message:result` followed by one `error:message`

### Requirement: onResult skips result divider on error
The client SHALL NOT insert a result divider message when `message:result` has `isError=true`.

#### Scenario: Normal result inserts divider
- **WHEN** `message:result` arrives with `isError=false`
- **THEN** a result divider message with `type: "result"` is added to messages

#### Scenario: Error result skips divider
- **WHEN** `message:result` arrives with `isError=true`
- **THEN** NO result divider message is added

### Requirement: Server history uses denylist
The server SHALL use a denylist (`HISTORY_EXCLUDE`) to filter history events, defaulting to include all events except explicitly excluded ones.

#### Scenario: New event types included by default
- **WHEN** a new event type not in HISTORY_EXCLUDE is stored
- **THEN** it appears in history replay

#### Scenario: control events excluded
- **WHEN** history contains `control:permission`, `control:elicitation`, or other control events
- **THEN** those events do NOT appear in the history batch sent to joining clients

