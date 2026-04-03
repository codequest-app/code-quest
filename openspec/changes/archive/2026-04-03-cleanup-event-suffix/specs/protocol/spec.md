## MODIFIED Requirements

### Requirement: ParseOk uses message field
ParseOk.event field SHALL be renamed to ParseOk.message to reflect that it holds a ProtocolMessage.

#### Scenario: ParseOk field name
- **WHEN** accessing the parsed result from parseLine
- **THEN** the field is `result.message` (not `result.event`)
