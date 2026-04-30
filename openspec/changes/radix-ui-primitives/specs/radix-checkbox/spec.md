## ADDED Requirements

### Requirement: Shared Checkbox primitive wraps Radix Checkbox
A `ui/Checkbox` component SHALL wrap `@radix-ui/react-checkbox` and accept `checked`, `onCheckedChange`, and `children` props.

#### Scenario: Renders checked state
- **WHEN** `checked={true}` is passed
- **THEN** the checkbox SHALL render in a checked visual state

#### Scenario: Renders unchecked state
- **WHEN** `checked={false}` is passed
- **THEN** the checkbox SHALL render in an unchecked visual state

#### Scenario: Fires callback on click
- **WHEN** the user clicks the checkbox
- **THEN** `onCheckedChange` SHALL be called with the new checked value

#### Scenario: Label text rendered
- **WHEN** `children` are provided
- **THEN** the label text SHALL appear next to the checkbox indicator
