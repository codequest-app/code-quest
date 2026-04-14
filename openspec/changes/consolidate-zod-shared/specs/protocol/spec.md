# Spec Delta: protocol (consolidate-zod-shared)

## ADDED Requirements

### Requirement: Wire-data shapes SHALL live as zod schemas in `@code-quest/shared`

Any data shape that crosses a process boundary (socket wire, CLI argv, DB row, file system) SHALL be defined as a zod schema in `packages/shared/src/schemas/<domain>.ts` and re-exported via `@code-quest/shared`. Pure UI state, React context values, service interfaces (function signatures), and DI containers MAY remain TS-only `interface` / `type` declarations in their owning package.

#### Scenario: client component receives wire-data type from shared, not local

- GIVEN a client component reads a message metadata field over the socket
- WHEN the component types the meta as e.g. `RateLimitMeta`
- THEN the type SHALL be derived from a zod schema in `@code-quest/shared/schemas/message-meta.ts`
- AND the import path SHALL be `@code-quest/shared`, not a local types file

#### Scenario: server handler parses wire payload via shared zod schema

- GIVEN a server handler validates an incoming socket payload
- WHEN it calls `XPayloadSchema.safeParse(raw)`
- THEN `XPayloadSchema` SHALL be imported from `@code-quest/shared`, not defined inline

### Requirement: shared/schemas/ SHALL be organized by domain

Schema files SHALL be grouped by domain (auth, session, message, settings, mcp, plan, etc.). Files SHALL NOT exceed 300 lines unless the domain genuinely cohesive. Re-exports in `shared/index.ts` SHALL be grouped by domain comment.

#### Scenario: searching for a session-related schema

- GIVEN a developer needs `SessionLaunchPayload`
- WHEN they look in `packages/shared/src/schemas/`
- THEN they SHALL find it in `session.ts` or a clearly named subfile (e.g. `session-payload.ts`)
- AND NOT in unrelated files like `common.ts` or `chat.ts`
