## ADDED Requirements

### Requirement: session record args match the spawned process

When a CLI spawns and emits `session:init`, the server SHALL persist
the session record with `args = payload.args` from that event (the
args the spawned process actually received), NOT a precomputed base
args set. Server MUST NOT call `adapter.buildArgs` directly in the
session-record code path.

#### Scenario: launch with per-session opts records those opts

- **WHEN** client sends `session:launch` with
  `launchOptions: { thinking: 'adaptive', thinkingDisplay: 'summarized', ... }`
- **AND** CLI spawns and emits `session:init`
- **THEN** `sessions.args` in DB contains both
  `--thinking adaptive` and `--thinking-display summarized`

#### Scenario: two launches with different opts produce different records

- **WHEN** one session launches with `thinking: 'adaptive'` and
  another with `thinking: 'disabled'`
- **THEN** the two rows in `sessions` differ in their `args` column

#### Scenario: no runnerFactory.args / channelManager.runnerArgs

- **WHEN** grepping server code for `runnerFactory.args` or
  `channelManager.runnerArgs`
- **THEN** no matches exist (dead abstractions removed)
