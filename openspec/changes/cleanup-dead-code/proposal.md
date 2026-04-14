# cleanup-dead-code

## Why

After unify-rpc-ack + tighten-production-casts + consolidate-zod-shared landed, a `knip` scan revealed accumulated deadwood:

- **3 unused files** (2 drizzle configs for engines not yet wired + 1 dead barrel file)
- **9 unused exports** (including `RpcError`, `channelRpc`, `call` helpers that nobody imports; `readFileResultSchema` from earlier refactor; test helpers)
- **30 unused exported types** — most are React component prop types exported for API shape, plus ~10 genuinely dead types (context value types never imported externally)
- **~13 unused dependencies** across client/server packages

Each class of deadwood has a different judgment: props types may be intentional public API, context value types are internal, helper functions are either future-use or dead.

## What Changes

Three-pass cleanup with TDD safety net:

1. **Pass 1 — trivially dead**: remove the 3 unused files (after verifying drizzle configs aren't referenced by build tooling); remove the 9 unused non-type exports with no consumer across the monorepo.

2. **Pass 2 — types**: categorize the 30 unused exported types:
   - **Internal-only types** (context values, test helper options): make them unexported (stop leaking)
   - **Component prop types** (`XxxProps`): keep exported — they define the component's public API
   - **Transitional/dead types** (e.g. `ToolResult` in client/types/ui.ts): remove

3. **Pass 3 — dependencies**: remove unused deps, but verify against lockfile and CI to make sure they're not transitive build-time deps.

Each pass: tsc + full test suite green before commit.

## Impact

- Smaller `dist` bundle, clearer public API surface
- `knip` score near zero for unused exports (keeping only intentional public APIs)
- No behavior change. Existing tests catch regression.
- No dependency removal that breaks build.
