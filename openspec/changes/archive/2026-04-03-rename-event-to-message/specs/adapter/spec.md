## MODIFIED Requirements

### Requirement: AdapterOutput uses message terminology
AdapterOutput.events field SHALL be renamed to AdapterOutput.messages. All consumers SHALL use the `messages` field name.

#### Scenario: AdapterOutput field is messages
- **WHEN** adapter.transform() returns an AdapterOutput
- **THEN** the field containing ClientMessage[] is named `messages`

### Requirement: Transform functions use message terminology
All transform functions SHALL drop the `Event` suffix. Parameter names referencing ClientMessage SHALL use `message` instead of `se` or `event`.

#### Scenario: Transform function names
- **WHEN** reading transform function signatures
- **THEN** names are `transformAssistant`, `transformUser`, `transformSystem`, `transformResult`, `transformStream`, `transformControlRequest`

#### Scenario: Adapter private methods
- **WHEN** reading ClaudeAdapter private methods
- **THEN** names are `convertMessage` and `convertOtherMessage` (not `convertEvent`)

#### Scenario: Variable names referencing ClientMessage
- **WHEN** a variable holds a ClientMessage instance
- **THEN** it is named `message` (not `se`, not `event`)
