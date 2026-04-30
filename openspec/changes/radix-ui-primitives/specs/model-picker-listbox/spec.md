## ADDED Requirements

### Requirement: ModelPickerPopover uses DOM-focus for keyboard navigation
`ModelPickerPopover` SHALL remove manual `activeIndex` state and instead use DOM `focus()` calls on option elements for ArrowUp/Down keyboard navigation.

#### Scenario: ArrowDown moves focus to next option
- **WHEN** the user presses ArrowDown inside the model list
- **THEN** focus SHALL move to the next option element

#### Scenario: ArrowUp moves focus to previous option
- **WHEN** the user presses ArrowUp inside the model list
- **THEN** focus SHALL move to the previous option element

#### Scenario: Enter selects focused option
- **WHEN** the user presses Enter on a focused option
- **THEN** that model SHALL be selected and the popover SHALL close

#### Scenario: ARIA semantics
- **WHEN** the listbox renders
- **THEN** the container SHALL have `role="listbox"` and each option `role="option"` with `aria-selected` reflecting selection state
