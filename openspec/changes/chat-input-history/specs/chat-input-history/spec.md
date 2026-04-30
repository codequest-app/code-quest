## ADDED Requirements

### Requirement: History initializes from channel messages on load
On channel join, the input history SHALL be pre-populated from existing user messages in the channel, so history persists across reloads.

#### Scenario: History available after reload
- **WHEN** the channel has prior user messages replayed from the server
- **THEN** pressing ArrowUp in an empty single-line input SHALL cycle through those messages newest-first

#### Scenario: Empty channel has no history
- **WHEN** the channel has no prior user messages
- **THEN** ArrowUp SHALL have no effect (input remains unchanged)

### Requirement: ArrowUp only triggers history when cursor is on the first line
ArrowUp SHALL navigate input history only when the textarea cursor is positioned on the first line.

#### Scenario: Single-line input ArrowUp triggers history
- **WHEN** the input contains no newlines and the user presses ArrowUp
- **THEN** the input value SHALL be replaced with the previous history entry

#### Scenario: Multiline input ArrowUp on first line triggers history
- **WHEN** the input contains multiple lines and the cursor is on the first line
- **THEN** ArrowUp SHALL replace the input with the previous history entry

#### Scenario: Multiline input ArrowUp on non-first line does not trigger history
- **WHEN** the input contains multiple lines and the cursor is NOT on the first line
- **THEN** ArrowUp SHALL move the cursor up within the textarea (default browser behavior)

### Requirement: New messages are appended to history on submit
After a message is submitted, it SHALL be appended to the in-memory history so it is immediately available for ArrowUp navigation.

#### Scenario: Submitted message appears in history
- **WHEN** the user submits a message
- **THEN** pressing ArrowUp immediately after SHALL show that message

#### Scenario: Duplicate consecutive messages are not added
- **WHEN** the user submits the same message as the most recent history entry
- **THEN** the history SHALL NOT contain a duplicate

### Requirement: ArrowDown navigates forward in history
ArrowDown SHALL navigate toward newer history entries, and return to an empty input when past the newest entry.

#### Scenario: ArrowDown after ArrowUp returns to newer entry
- **WHEN** the user has navigated back with ArrowUp and then presses ArrowDown
- **THEN** the input SHALL show the next newer history entry

#### Scenario: ArrowDown past newest clears input
- **WHEN** the user presses ArrowDown past the most recent history entry
- **THEN** the input SHALL be cleared to empty string
