## MODIFIED Requirements

### Requirement: Permission prompt layout matches extension
ToolPermissionBanner SHALL render as an inline dialog with background overlay, matching the extension's F5 CSS module structure.

#### Scenario: Dialog structure
- **WHEN** a permission request is pending
- **THEN** the container has a background overlay layer, content area with header and details, button container, and keyboard hints

#### Scenario: Header shows tool name
- **WHEN** permission request for tool "Bash"
- **THEN** header displays "Do you want to proceed with **Bash**?"

#### Scenario: Input JSON collapsible
- **WHEN** tool input has properties
- **THEN** a collapsible "Details" section shows JSON.stringify(input, null, 2) in a pre block

#### Scenario: Input JSON empty
- **WHEN** tool input is empty
- **THEN** no "Details" section is shown

### Requirement: Permission prompt numbered buttons
ToolPermissionBanner buttons SHALL display numbered keyboard shortcuts matching the extension.

#### Scenario: Standard permission buttons
- **WHEN** no permission suggestions exist
- **THEN** buttons are "① Yes" and "② No"

#### Scenario: Permission with suggestions
- **WHEN** permission suggestions exist
- **THEN** buttons are "① Yes", "② Yes, allow for session", "③ No"

#### Scenario: Focused button highlight
- **WHEN** user navigates with Arrow keys
- **THEN** the focused button has highlighted background (accent color)

### Requirement: Permission prompt keyboard behavior
ToolPermissionBanner SHALL support full keyboard navigation matching the extension.

#### Scenario: Number key triggers button
- **WHEN** user presses "1"
- **THEN** the first button action is triggered (allow)

#### Scenario: Escape cancels
- **WHEN** user presses Escape
- **THEN** permission is denied with cancel message

#### Scenario: Arrow navigation
- **WHEN** user presses ArrowDown
- **THEN** focus moves to next button

#### Scenario: Enter on focused button
- **WHEN** user presses Enter (not in reject input)
- **THEN** the focused button action is triggered

### Requirement: Permission prompt reject input
ToolPermissionBanner SHALL include a text input for rejection message.

#### Scenario: Reject input placeholder
- **WHEN** permission prompt renders
- **THEN** input shows placeholder "Tell Claude what to do instead"

#### Scenario: Enter in reject input
- **WHEN** user types in reject input and presses Enter
- **THEN** permission is denied with the typed message

### Requirement: Permission prompt escape hint
ToolPermissionBanner SHALL display "Esc to cancel" hint at the bottom.

#### Scenario: Escape hint visible
- **WHEN** permission prompt renders
- **THEN** "Esc to cancel" text is visible at the bottom
