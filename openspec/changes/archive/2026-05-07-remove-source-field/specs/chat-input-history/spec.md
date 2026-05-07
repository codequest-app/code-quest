## MODIFIED Requirements

### Requirement: History initializes from channel messages on load
On channel join, the input history SHALL be pre-populated from messages with `meta.fromInput === true` in the channel, so history persists across reloads. Messages without `fromInput` (CLI-injected, skill bodies, loop wakeups, history replays) SHALL NOT be included.

#### Scenario: History available after reload
- **WHEN** the channel has prior user messages replayed from the server
- **THEN** pressing ArrowUp in an empty single-line input SHALL cycle through those messages newest-first

#### Scenario: Empty channel has no history
- **WHEN** the channel has no prior user messages
- **THEN** ArrowUp SHALL have no effect (input remains unchanged)

#### Scenario: CLI-injected messages not in history
- **WHEN** the channel contains messages without `meta.fromInput` (skill bodies, loop wakeups)
- **THEN** those messages SHALL NOT appear when cycling with ArrowUp
