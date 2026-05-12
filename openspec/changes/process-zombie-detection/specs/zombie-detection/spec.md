## ADDED Requirements

### Requirement: Server resets processing on process exit

#### Scenario: Process crashes during processing
- **WHEN** CLI process exits while `_isProcessing` is true
- **THEN** server sends a synthetic `message:result(isError=true)` to client
- **AND** `_isProcessing` is reset to false

#### Scenario: Process exits normally (not processing)
- **WHEN** CLI process exits while `_isProcessing` is false
- **THEN** no synthetic result is sent

### Requirement: Client cancelling timeout

#### Scenario: Cancel succeeds within timeout
- **WHEN** user cancels and `message:result` arrives within 15s
- **THEN** status transitions normally (cancelling → idle)
- **AND** timeout is cleared

#### Scenario: Cancel times out
- **WHEN** user cancels and no `message:result` arrives within 15s
- **THEN** status transitions to `idle`
- **AND** an error message is shown

### Requirement: session:closed clears all active states

#### Scenario: session:closed during processing
- **WHEN** `session:closed` event arrives while status is `processing` or `cancelling`
- **THEN** status transitions to `disconnected`
- **AND** spinner stops
