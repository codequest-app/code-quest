# Spec Delta: protocol (review-round-2)

## ADDED Requirements

### Requirement: Utility helpers SHALL have a single source of truth

Generic utility functions (isRecord, errMsg, common type guards) that are needed by 2+ packages SHALL live in `@code-quest/shared` under `utils/` and be imported by consumers. Local copies of the same helper across packages are prohibited.

#### Scenario: a new package needs a generic helper

- WHEN a developer needs `isRecord` in a new file
- THEN the import SHALL be `import { isRecord } from '@code-quest/shared'`
- AND NOT a local redeclaration of the same function

### Requirement: Handler names SHALL reflect what they do

Functions named `handleX` / `onX` / `applyX` SHALL match their actual behavior. A function that produces side effects (socket emit, DB write, cache mutation) SHALL have a name that conveys the effect — not a name that suggests pure mapping.

#### Scenario: a handler applies side effects

- GIVEN a function parses a response and emits 3 broadcasts
- WHEN reviewed for naming
- THEN the name SHALL NOT end with `Response` (which suggests pure mapping)
- AND SHALL include a verb like `apply`, `broadcast`, `persist`, or `notify`
