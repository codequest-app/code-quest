## ADDED Requirements

### Requirement: Pure refactor — no behavioral changes

All existing tests must pass with expect unchanged or equivalent.

#### Scenario: All tests pass after restructure
- **WHEN** running vitest in server and client packages
- **THEN** all tests pass with zero failures and same test count
