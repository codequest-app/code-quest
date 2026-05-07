## ADDED Requirements

### Requirement: Pure-logic modules live in utils/, not components/

Client source files that export only pure functions (no JSX, no React
hooks, no DOM/socket side effects) SHALL live under
`apps/web/src/utils/` or a comparable non-component directory.
`apps/web/src/components/` is reserved for React components and
component-scoped JSX helpers.

#### Scenario: Pure routing decision function is in utils/
- **WHEN** a contributor reads the directory layout
- **THEN** `resumeRoute` — a pure function returning a routing decision
  based on current tab + picked session — is under `utils/`
- **AND** its test file is under `utils/__tests__/`
