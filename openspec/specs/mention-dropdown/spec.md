# mention-dropdown Specification

## Purpose
TBD - created by archiving change radix-ui-primitives. Update Purpose after archive.
## Requirements
### Requirement: MentionDropdown uses DOM-focus for keyboard navigation
`MentionDropdown` SHALL remove the `activeIndex` ref and instead use DOM `focus()` calls on `li` elements for ArrowUp/Down navigation.

#### Scenario: ArrowDown focuses next suggestion
- **WHEN** the user presses ArrowDown in the mention dropdown
- **THEN** focus SHALL move to the next suggestion item

#### Scenario: ArrowUp focuses previous suggestion
- **WHEN** the user presses ArrowUp in the mention dropdown
- **THEN** focus SHALL move to the previous suggestion item

#### Scenario: Enter selects focused suggestion
- **WHEN** the user presses Enter on a focused suggestion
- **THEN** that suggestion SHALL be inserted and the dropdown SHALL close

#### Scenario: Option elements are focusable
- **WHEN** the dropdown is open
- **THEN** each `li` SHALL have `tabIndex={-1}` and `role="option"` so DOM focus works correctly

