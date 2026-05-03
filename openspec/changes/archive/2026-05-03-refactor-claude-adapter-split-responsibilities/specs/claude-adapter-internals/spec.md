## ADDED Requirements

### Requirement: Notification transforms are isolated in their own module
`transforms/notification.ts` SHALL export `transformRateLimit(message)` as the sole transformer for `rate_limit_event` protocol messages. The function signature and output shape SHALL be identical to the current inline `convertRateLimitMessage` in `adapter.ts`.

#### Scenario: transformRateLimit produces system:rate_limit ClientMessage
- **WHEN** a `rate_limit_event` ProtocolMessage is passed to `transformRateLimit`
- **THEN** the function returns a `ClientMessage` with `name: 'system:rate_limit'` and a `payload.info` object containing `status`, `rateLimitType`, `resetsAt`, `utilization`, `overageStatus`, `isUsingOverage`

### Requirement: Auth transforms are isolated in their own module
`transforms/auth.ts` SHALL export `transformAuthStatus(message)` as the sole transformer for `auth_status` protocol messages. The function signature and output shape SHALL be identical to the current inline `convertAuthStatusMessage` in `adapter.ts`.

#### Scenario: transformAuthStatus produces notification:auth_status ClientMessage
- **WHEN** an `auth_status` ProtocolMessage is passed to `transformAuthStatus`
- **THEN** the function returns a `ClientMessage` with `name: 'notification:auth_status'` and `payload` containing `status` (`'authenticating'` or `'authenticated'`), optional `output`, and optional `account`

### Requirement: Request mappings are isolated as a pure data module
`request-mappings.ts` SHALL export `requestMappings` (the mapping table) and `RequestMapping` (the type). No class, no factory — only the const and the type.

#### Scenario: requestMappings contains all existing event mappings
- **WHEN** `requestMappings` is imported from `claude/request-mappings.ts`
- **THEN** it contains all entries currently defined in `REQUEST_MAPPINGS` in `adapter.ts`, with no additions or removals

### Requirement: ClaudeAdapter contains only wiring
`adapter.ts` SHALL NOT contain any inline transform functions or inline data tables. All logic SHALL be imported from `transforms/notification.ts`, `transforms/auth.ts`, and `request-mappings.ts`.

#### Scenario: adapter.ts has no inline convert functions
- **WHEN** the refactoring is complete
- **THEN** `adapter.ts` contains no function definitions for `convertRateLimitMessage`, `convertAuthStatusMessage`, or `RequestMapping` type, and no `REQUEST_MAPPINGS` literal
