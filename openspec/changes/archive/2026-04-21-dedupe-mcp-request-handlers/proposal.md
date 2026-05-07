## Why

`apps/server/src/socket/handlers/mcp.ts` has a `createRequestHandler` factory that covers 5 simple MCP handlers (`handleReconnect`, `handleToggle`, `handleServers`, `handleSetServers`, `handleMessage`). Three additional handlers — `handleAuthenticate`, `handleClearAuth`, `handleOAuthCallback` — are hand-written copies of the same "parse → sendRequest → reshape response → cb" pattern, differing only in the success/failure shape. Adding a new auth-like MCP handler today means writing ~12 lines of boilerplate that the factory could emit.

## What Changes

- Extend `createRequestHandler` with an optional `mapSuccess(response)` option. When provided, on `result.success === true` the handler calls `cb?.(ok(mapSuccess(result.response)))`; on failure it calls `cb?.(err(result.error ?? fallback))`.
- Migrate `handleAuthenticate`, `handleClearAuth`, `handleOAuthCallback` to use the factory.
- Preserve all user-visible behaviour: identical schema validation, identical success/error shapes, identical error messages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `protocol`: MCP socket handlers share a single construction pattern; adding a new auth-style MCP handler is a one-liner.

## Impact

- Affected file: `apps/server/src/socket/handlers/mcp.ts`.
- Tests: `apps/server/src/__tests__/mcp.test.ts` must stay green without `expect` modification.
- No client / shared / summoner change. No protocol change.
