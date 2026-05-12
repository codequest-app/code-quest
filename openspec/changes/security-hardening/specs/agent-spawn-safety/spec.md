## ADDED Requirements

### Requirement: Reject duplicate sessionId spawn

`Agent` SHALL reject a spawn request when a process with the same `sessionId` is already tracked.

#### Scenario: spawn with unique sessionId
- **WHEN** `process.spawn` is called with a sessionId not currently in `Agent.spawned`
- **THEN** the process is started and tracked

#### Scenario: spawn with duplicate sessionId
- **WHEN** `process.spawn` is called with a sessionId already present in `Agent.spawned`
- **THEN** the new spawn is rejected with `{ ok: false, error: 'sessionId already active' }`
- **AND** the existing process continues running undisturbed

#### Scenario: process exit removes sessionId
- **WHEN** a tracked process exits normally
- **THEN** its sessionId is removed from `Agent.spawned`
- **AND** a subsequent spawn with the same sessionId succeeds
