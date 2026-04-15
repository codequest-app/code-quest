## ADDED Requirements

### Requirement: /btw slash command triggers side question
The system SHALL support `/btw <question>` as a slash command in the compose area. When the user selects `/btw` from the command menu with non-empty question text, the system SHALL send a `side_question` control request to the active Claude process without adding any message to the main conversation.

#### Scenario: User submits /btw with question text
- **WHEN** user types `/btw what does this function do?` and selects the `/btw` item from command menu
- **THEN** system sends `side_question` control request with question `"what does this function do?"`
- **AND** compose input is cleared of the `/btw ...` text
- **AND** main conversation messages are unchanged

#### Scenario: /btw with empty question is disabled
- **WHEN** user types `/btw` with no text after it
- **THEN** the `/btw` command menu item SHALL be disabled (not selectable)

### Requirement: SideQuestionDialog shows loading then answer
The system SHALL display a dialog overlay within the active ChatPanel while the side question is in flight, and replace the loading state with the answer once received.

#### Scenario: Loading state while waiting for answer
- **WHEN** a side question has been sent and no answer received yet
- **THEN** the dialog SHALL display a loading indicator
- **AND** the dialog SHALL remain visible until answer or error arrives

#### Scenario: Answer rendered with markdown
- **WHEN** the side question answer is received
- **THEN** the dialog SHALL render the answer using `MarkdownContent` (supports code blocks, bold, etc.)
- **AND** the dialog SHALL display the original question as the dialog title or subtitle

#### Scenario: Error state displayed
- **WHEN** the side question request fails (network error, Claude busy, etc.)
- **THEN** the dialog SHALL display an error message
- **AND** the dialog SHALL remain open so the user can dismiss manually

### Requirement: SideQuestionDialog is scoped to ChatPanel
The dialog SHALL be positioned as an absolute overlay within the ChatPanel (not a global modal), so it only covers the active channel panel and does not affect other tabs or the sidebar.

#### Scenario: Dialog overlays only the active ChatPanel
- **WHEN** SideQuestionDialog is open
- **THEN** it SHALL be rendered inside the ChatPanel's DOM subtree with `position: absolute`
- **AND** it SHALL NOT use a portal to document body

### Requirement: Dialog dismissal
The user SHALL be able to dismiss the SideQuestionDialog without any side effects on the main conversation.

#### Scenario: Dismiss with Escape key
- **WHEN** SideQuestionDialog is open and user presses Escape
- **THEN** the dialog SHALL close

#### Scenario: Dismiss with close button
- **WHEN** SideQuestionDialog is open and user clicks outside the dialog panel or a close button
- **THEN** the dialog SHALL close

### Requirement: server chat:ask_side_question RPC
The server SHALL handle socket event `chat:ask_side_question` with payload `{ question: string }`, send a `side_question` control request to the Claude process, and return `RpcResult<{ answer: string }>` via callback.

#### Scenario: Successful side question
- **WHEN** server receives `chat:ask_side_question` with a non-empty question
- **THEN** server sends `side_question` control request to Claude process
- **AND** callback is called with `{ ok: true, data: { answer: "<response string>" } }`

#### Scenario: Claude returns null response
- **WHEN** Claude process returns `response: null` for side_question
- **THEN** callback is called with `{ ok: false, error: "No answer returned" }`
