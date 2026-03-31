## ADDED Requirements

### Requirement: Pure refactor — no behavioral changes

All existing tests must pass with expect unchanged or equivalent (only import paths updated).

#### Scenario: Public API unchanged
- **WHEN** external packages import from `@code-quest/summoner`
- **THEN** all existing exports remain available at the same names

#### Scenario: All tests pass after restructure
- **WHEN** running `vitest run` in summoner, server, and client packages
- **THEN** all tests pass with zero failures
