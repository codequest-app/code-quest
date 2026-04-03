## MODIFIED Requirements

### Requirement: No Event suffix on non-protocol names
All interface, function, variable names referencing ClientMessage or control responses SHALL NOT use Event suffix unless they correspond to a CLI protocol field name.

#### Scenario: ControlResponseEvent renamed
- **WHEN** reading the adapter output type for control responses
- **THEN** it is named `ResolvedControlResponse`

#### Scenario: Transform parameters use raw
- **WHEN** reading transform function signatures
- **THEN** the parameter for the parsed JSON object is named `raw` (not `event`)

#### Scenario: Variables holding ClientMessage use message
- **WHEN** a local variable holds a ClientMessage
- **THEN** it is named with `message` suffix (e.g., `resultMessage`, `userMessage`)
