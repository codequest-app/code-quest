# Spec Delta: protocol (cleanup-dead-code)

## ADDED Requirements

### Requirement: Unused exports SHALL be unexported or deleted

Any non-type export (function, constant, class) with zero consumers across the monorepo SHALL be either (a) deleted if it serves no future purpose, or (b) kept unexported if used only internally to its module. `knip` output for "Unused exports" SHALL be kept minimal.

Type exports follow a different rule (see next requirement).

#### Scenario: a helper function has no consumers

- GIVEN `packages/*/src/**/helper.ts` exports `function foo()`
- WHEN `grep -r "from '.../helper'"` finds zero imports of `foo`
- THEN `foo` SHALL be either deleted or made unexported

### Requirement: Exported types SHALL have an external consumer or a clear API-design reason

Internal types (context-value types, test-harness options) SHALL NOT be exported once they have no external consumer. Component prop types (`XxxProps`) MAY remain exported as the component's public contract. Transitional types left over from refactors SHALL be deleted.

#### Scenario: a context value type has no import outside its provider file

- GIVEN `export interface SessionContextValue` in SessionContext.tsx
- WHEN only SessionProvider (same file) uses it
- THEN the `export` keyword SHALL be removed
