## MODIFIED Requirements

### Requirement: Plan content is always visible
The banner SHALL display the plan content fully expanded without any collapsible wrapper.

#### Scenario: Plan content visible on render
- **WHEN** the banner renders with a plan
- **THEN** the plan markdown content SHALL be visible without any user interaction

#### Scenario: No plan content shows nothing
- **WHEN** the banner renders without a plan
- **THEN** no plan content area SHALL be rendered

### Requirement: Default state shows two action buttons at the bottom
In the default state the banner SHALL show "Approve Plan" and "Continue Planning" buttons at the bottom of the card.

#### Scenario: Default buttons visible
- **WHEN** the banner is in default state
- **THEN** "Approve Plan" and "Continue Planning" buttons SHALL be visible
- **THEN** no feedback textarea SHALL be visible

#### Scenario: Approve Plan submits allow response
- **WHEN** the user clicks "Approve Plan"
- **THEN** `onRespond` SHALL be called with `behavior: 'allow'`

### Requirement: Continue Planning expands feedback inline
Clicking "Continue Planning" SHALL expand a feedback textarea inline within the card — no dialog or separate panel.

#### Scenario: Textarea appears after clicking Continue Planning
- **WHEN** the user clicks "Continue Planning"
- **THEN** a feedback textarea SHALL appear
- **THEN** "Continue Planning" and "Approve Plan" buttons SHALL be replaced by "Send Feedback" and "Cancel"

#### Scenario: Cancel returns to default state
- **WHEN** the user clicks "Cancel" while feedback is expanded
- **THEN** the textarea SHALL hide
- **THEN** the default "Approve Plan" and "Continue Planning" buttons SHALL reappear
- **THEN** any typed feedback SHALL be cleared

#### Scenario: Send Feedback submits deny response
- **WHEN** the user clicks "Send Feedback"
- **THEN** `onRespond` SHALL be called with `behavior: 'deny'` and the feedback as the message

#### Scenario: Send Feedback with empty textarea uses default message
- **WHEN** the user clicks "Send Feedback" with no text in the textarea
- **THEN** `onRespond` SHALL be called with `behavior: 'deny'` and a default message

### Requirement: State resets on new plan request
When a new plan request arrives the banner SHALL reset to the default state.

#### Scenario: New request clears feedback state
- **WHEN** `pending.requestId` changes
- **THEN** the feedback textarea SHALL hide
- **THEN** any typed comment SHALL be cleared
