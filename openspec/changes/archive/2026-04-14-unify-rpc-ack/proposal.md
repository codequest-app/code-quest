# Proposal: unify-rpc-ack

## Why

cc-office has 19+ RPC endpoints with **5 distinct ack shapes** accumulated across its history:

- `{ channelId, slashCommands?, ... error? }` (launch)
- `{ ok: true/false, channelId?, error? }` (resume)
- `{ success: true/false, channelId?, error? }` (fork, teleport, worktree, settings, rename, delete, rewind…)
- `{ error?, files?|sessions?|branch?|events? }` (query-style: file:list, git:status, session:get)
- `{ worktrees?, error? }` (worktree:list variant)

Every new RPC forces re-deciding which shape to follow. Every caller writes a different error check (`.success` / `.ok` / `.error`-only). Cross-cutting concerns (error toast, logging middleware, metrics) can't be written once — each site has to know the local convention. Type safety through zod is per-endpoint; no shared `RpcResult<T>`.

This change unifies the ack shape to a **discriminated union** `RpcResult<T> = { ok: true, data: T } | { ok: false, error, code? }` across all callback-returning RPCs. Introduces `ok()` / `err()` helpers on the server side and a `call<T>()` wrapper on the client side for one-line error handling.

## What Changes

Shared (`packages/shared/src/schemas/rpc.ts` — new):

- `RpcResult<T>` type alias.
- `rpcResult<T>(schema)` generic zod schema builder returning the discriminated union.
- Replace every per-endpoint response schema with a call to `rpcResult(...)`.

Server (`packages/server/src/socket/utils/rpc.ts` — new):

- `ok<T>(data: T): RpcResult<T>` helper.
- `err(error: string, code?: string): RpcResult<never>` helper.
- Every handler's `callback?.({...})` invocation migrates to `callback?.(ok({...}))` or `callback?.(err(...))`.

Client (`packages/client/src/socket/rpc.ts`):

- `call<T>(socket, event, payload): Promise<T>` wrapper: returns `data` on ok, throws (and/or toasts) on err.
- Existing `rpc()` keeps returning the raw `RpcResult<T>` for callers that want to branch manually.
- All call sites migrate from `if (result.success)` / `if (!result.error)` to either `if (result.ok)` or `await call(...)`.

Migration covers 99 server `callback?.({...})` invocations across 15 handler files, ~19 RPC endpoints, plus all client callers.

## Scope — out of scope

- Fire-and-forget events (emitter.emit without callback) — they don't have an ack shape.
- Raw socket.io broadcasts (session:created, session:states, message:assistant) — not RPC-style.
- Internal control-request responses (CLI `control_request` / `control_response`) — different protocol layer.
- Adding new RPCs as part of this change.

## Impact

- Affected specs: `protocol` (ack shape requirement added).
- Affected code:
  - NEW: `packages/shared/src/schemas/rpc.ts`
  - NEW: `packages/server/src/socket/utils/rpc.ts`
  - Modified: all 15 `packages/server/src/socket/handlers/*.ts` (99 callback sites)
  - Modified: `packages/server/src/socket/handlers/session/{connect,fork,query}.ts`
  - Modified: `packages/client/src/contexts/channel/handlers/session.ts`, `SessionContext.tsx`, `ChannelMessagesContext.tsx`, component callers
  - Modified: all response schemas in `packages/shared/src/schemas/*.ts`
  - Modified: test fixtures and assertions — per TDD rule, `expect(result.success).toBe(true)` becomes `expect(result.ok).toBe(true)` (semantically equivalent name change), `expect(result.channelId)` becomes `expect(result.data.channelId)` (equivalent path change). These count as equivalent per the rule; no behavioral expects changed.

- Risk: high. 99 server sites + matching client sites + many tests. Mitigations:
  1. Type the new `RpcResult<T>` strictly — tsc catches every miss.
  2. Migrate one RPC family at a time (session → file → git → settings → worktree → message), run tests after each batch.
  3. Keep a backward-compat layer during migration? No — tsc-driven find-and-fix is faster than preserving dual shapes.

- Rollout: direct merge after TDD green across all three packages.
