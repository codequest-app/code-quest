## ADDED Requirements

### Requirement: Command Menu has Rewind action
The Command Menu SHALL include a "Rewind" item in the Context section that opens the RewindDialog.

#### Scenario: User opens Rewind from Command Menu
- **WHEN** user opens Command Menu and clicks "Rewind"
- **THEN** the RewindDialog SHALL open

### Requirement: RewindDialog lists user messages
The RewindDialog SHALL display all user messages (excluding synthetic, tool-related, and messages without uuid) in reverse chronological order, each showing the prompt text and relative timestamp.

#### Scenario: Messages available
- **WHEN** RewindDialog opens with conversation history
- **THEN** it SHALL show user messages with prompt text and time (e.g. "1h ago")
- **AND** the most recent message SHALL be at the top

#### Scenario: No messages
- **WHEN** RewindDialog opens with empty conversation
- **THEN** it SHALL show "No messages to rewind to yet."

### Requirement: RewindDialog keyboard navigation
The RewindDialog SHALL support keyboard navigation: ↑↓ to move selection, Enter to select, Esc to close.

#### Scenario: Navigate and select with keyboard
- **WHEN** user presses ↓ then Enter
- **THEN** the second message SHALL be selected and rewind SHALL proceed

#### Scenario: Close with Escape
- **WHEN** user presses Esc
- **THEN** the dialog SHALL close without rewinding

### Requirement: Rewind executes and forks
When a message is selected, the system SHALL rewind code to that point and fork the conversation. The original prompt text SHALL be filled into the compose input.

#### Scenario: Successful rewind
- **WHEN** user selects a message and rewind succeeds
- **THEN** code SHALL be restored to that point
- **AND** a new forked conversation SHALL be created
- **AND** the original prompt text SHALL appear in the compose input
- **AND** a success notification SHALL be shown

#### Scenario: Rewind fails
- **WHEN** rewind fails (no checkpoint found)
- **THEN** an error notification SHALL be shown
- **AND** no fork SHALL be created
