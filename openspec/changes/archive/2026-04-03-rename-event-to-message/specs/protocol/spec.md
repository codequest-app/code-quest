## MODIFIED Requirements

### Requirement: Protocol variables use message terminology
Variables referencing ProtocolMessage SHALL be named `protocolMessage` (not `protocolEvent`).

#### Scenario: Runner variable name
- **WHEN** ProcessRunner processes a parsed line
- **THEN** the variable holding the ProtocolMessage is named `protocolMessage`
