## ADDED Requirements

### Requirement: Internal refactor only

This change is a pure internal restructure of the Feature contract and adapter layer. It SHALL NOT introduce, modify, or remove any capability-level requirement currently captured under `openspec/specs/`.

#### Scenario: No spec-level behavior change
- **WHEN** the refactor is applied
- **THEN** every existing spec in `openspec/specs/` (including `adapter`, `command-menu-structure`, `client`) remains valid without modification
- **AND** all existing tests pass without any `expect` assertion changes
- **AND** no component prop, channel contract, or user-visible behavior changes
