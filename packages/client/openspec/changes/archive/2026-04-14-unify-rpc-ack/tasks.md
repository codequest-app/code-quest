# Tasks: unify-rpc-ack

**TDD discipline:**

- "expect 不變或等價" — mechanical rename (e.g. `.success` → `.ok`, `.channelId` → `.data.channelId`) count as equivalent. Behavioral assertions MUST NOT change.
- tsc after every batch; full test suite after every commit.
- Migrate in batches by RPC family. Green at each boundary.

## 1. Foundation

- [x] 1.1 `packages/shared/src/schemas/rpc.ts`: export `RpcResult<T>` type + `rpcResult<T>(schema)` zod builder (discriminated union on `ok`).
- [x] 1.2 `packages/server/src/socket/utils/rpc.ts`: export `ok(data)` + `err(error, code?)` helpers.
- [x] 1.3 `packages/client/src/socket/rpc.ts`: add `call<T>(socket, event, payload): Promise<T>` wrapper (throws on err with RpcError carrying code).
- [x] 1.4 Unit tests for all three modules.

## 2. session family (highest usage)

- [x] 2.1 Migrate `session:launch` response schema + handler + client caller + tests.
- [x] 2.2 `session:resume` (already close to target shape — just ensure `ok | err` union).
- [x] 2.3 `session:fork` (`success` → `ok`, move `channelId`/`parentChannelId` under `data`).
- [x] 2.4 `session:teleport`.
- [x] 2.5 `session:join` (`error?` + data fields → unified).
- [x] 2.6 `session:get`.
- [x] 2.7 `session:list` / `session:list_remote`.
- [x] 2.8 `session:rename` / `session:delete` / `session:update_state`.
- [x] 2.9 tsc + full server + client tests green.

## 3. chat / message family

- [x] 3.1 `chat:rewind_code` + all sub-handlers in message.ts.
- [x] 3.2 `chat:respond` / `chat:cancel` / `chat:stop_task` / `chat:cancel_async` / `chat:hook_callback_respond` (fire-and-forget — no migration needed).
- [x] 3.3 tests.

## 4. file / git / settings / worktree / mcp / plan / speech / usage / explorer / terminal / auth / app

- [x] 4.1 `file:read` / `file:list` (query-shape → `{ ok, data: { files } }`).
- [x] 4.2 `git:status` / `git:checkout` / `git:log` / `git:skip_branch_update`.
- [x] 4.3 `settings:*`.
- [x] 4.4 `worktree:create` / `worktree:list` / `worktree:delete`.
- [x] 4.5 `mcp:*`.
- [x] 4.6 `plan:*`.
- [x] 4.7 `speech:*`, `usage:*`, `explorer:*`, `terminal:*`, `auth:*`, `app:*`.
- [x] 4.8 tests after each sub-family.

## 4b. Tighten ad-hoc test type signatures (final pass after all migrations)

After all production migrations are complete, sweep test files for
ad-hoc inline shapes like `claude.send<{ ok: boolean; error?: string }>(...)`
and `vi.fn().mockResolvedValue({ ok: true, data: {} })`. Replace with the
shared `RpcResult<T>` type so test signatures match production wire schema.
Bulk find-and-replace; no expects modified beyond the names already
migrated.

- [x] 4b.1 Server tests: `claude.send<{...}>(event, ...)` → `claude.send<RpcResult<T>>(event, ...)`.
- [x] 4b.2 Client mock fixtures: `mockResolvedValue({ ok, data, error })` → typed `RpcResult<T>` literals.
- [x] 4b.3 Final tsc + tests green.

## 5. Validation

- [x] 5.1 `pnpm tsc --noEmit` clean across summoner + server + client + shared.
- [x] 5.2 `pnpm -r test` green.
- [x] 5.3 `git diff main..HEAD -- '**/__tests__/**' | grep '^[-+].*expect('` — only name/path renames, no behavioral changes.
- [x] 5.4 `openspec validate unify-rpc-ack` passes.
- [x] 5.5 Manual smoke: launch / resume / fork / terminal / worktree all work end-to-end.
