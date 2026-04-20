## ADDED Requirements

### Requirement: Pure internal refactor, no spec-level behavior change

This change is a code-review follow-up refactor across `server`, `summoner`, `shared`, and `client` packages. It SHALL NOT introduce, modify, or remove any capability-level requirement currently captured under `openspec/specs/`.

#### Scenario: Existing specs remain valid
- **WHEN** the refactor is applied
- **THEN** every existing spec in `openspec/specs/` remains valid without modification
- **AND** all existing tests pass without any `expect` assertion changes (only new tests may be added for newly-exposed units such as `ControlRequestTracker` / `NotificationTracker`)
- **AND** no public API surface (socket event names, RPC payloads, component props, class public methods) changes

#### Scenario: Behavioral invariance validated by test suite
- **WHEN** `pnpm test` is run across all packages after the refactor
- **THEN** the full suite passes
- **AND** no prior passing test is deleted, skipped, or has its `expect` assertions altered

#### Scenario: Channel collaborator split preserves class contract
- **WHEN** `Channel` delegates control-request and notification state to internal trackers
- **THEN** the set of public methods on `Channel` is unchanged (name, signature, semantics)
- **AND** callers (handlers, emitter) require no signature updates
