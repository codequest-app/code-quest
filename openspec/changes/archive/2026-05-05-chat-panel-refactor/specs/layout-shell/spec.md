## MODIFIED Requirements

### Requirement: ChatPanel layout and business logic are separated
`ChatPanel` SHALL be a pure layout component with no business logic. All session-level business logic (resume, diff review, elicitation, hotkeys, side panel state) SHALL reside in `ChatSession`.

#### Scenario: ChatSession assembles ChatPanel with all slots
- **WHEN** `TabContent` renders `<ChatSession title={title} />`
- **THEN** the full chat UI (header, message list, compose input) SHALL be visible and functional

#### Scenario: ChatPanel accepts slots from outside
- **WHEN** `ChatPanel` is used with compound component slots
- **THEN** each slot's content SHALL appear in the correct layout position
