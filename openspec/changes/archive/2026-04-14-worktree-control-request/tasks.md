# Tasks: worktree-control-request

**TDD discipline**: RED → GREEN per step. `expect` unchanged for refactors; new behavior lands via new tests. Full suite green at each section.

**Test discipline** (project standards):
- Server RPC flows: **FakeClaude + real JSON fixtures** (via `createFakeSummoner` / `createFakeServer`). No hand-mocked socket behavior.
- Client component tests: **@testing-library/react** rendering real components. No shallow render. Use `renderHook` for hook tests, `render` for component tests.
- DB tests: **in-memory database**. Project supports both **sqlite** (better-sqlite3 `:memory:`) and **mysql** — when adding DB schema changes, write migrations for BOTH and run the test suite against both engines.
- Git tests: real temp dirs + real `git` binary (`LocalGitService` integration tests already follow this pattern).

## 1. GitService `getProjectRoot` + capabilities

- [x] 1.1 Add `getProjectRoot(cwd: string): Promise<string | null>` to `GitService` interface (`apps/summoner/src/git/types.ts`). Add `capabilities: { worktree: boolean }` readonly field.
- [x] 1.2 RED: failing test in `apps/summoner/src/__tests__/git/local.test.ts` (or existing git test file) — verify `getProjectRoot('/some/worktree')` returns the main repo path (not the worktree path). Mock or use real temp git repo.
- [x] 1.3 Implement `LocalGitService.getProjectRoot` via `git rev-parse --git-common-dir` → strip trailing `/.git` to get parent dir. Add `capabilities = { worktree: true }`.
- [x] 1.4 Update `FakeGitService` (`apps/summoner/src/test/fake-git-service.ts`) to match new interface — return configurable projectRoot, `capabilities = { worktree: true }` by default.
- [x] 1.5 Summoner tests green.

## 2. Persist `projectRoot` on session

- [x] 2.1 Add optional `projectRoot: z.string().optional()` to `SessionSummary` schema (`packages/shared/src/schemas/session.ts`) and DB-facing schemas in `server/src/services/session-store.ts`.
- [x] 2.2 Drizzle migration: add `projectRoot` column (sqlite + mysql). Nullable for backward compat.
- [x] 2.3 On channel create: server calls `gitService.getProjectRoot(cwd)` and passes to `sessionStore.upsert` when persisting.
- [x] 2.4 Session-connect test verifies newly created session has `projectRoot` populated for a git repo cwd.
- [x] 2.5 Server + shared tests green.

## 3. Client grouping by projectRoot

- [x] 3.1 `apps/web/src/contexts/ProjectContext.tsx`: change Project identity key from `cwd` to `session.projectRoot ?? session.cwd` (fallback preserves old sessions).
- [x] 3.2 Update `deriveProjects(sessions)` to group by projectRoot. Each Project has `cwd = projectRoot`, `sessions = all sessions with matching projectRoot`.
- [x] 3.3 Client tests: add case where two sessions have different `cwd` but same `projectRoot` → single Project with 2 sessions.
- [x] 3.4 Client tests green, visual verification optional.

## 4. `project:create_worktree` RPC

- [x] 4.1 Update `createWorktreePayloadSchema` in `shared/schemas/worktree.ts` from `{ channelId, name }` to `{ cwd, name }`. Response type `rpcResult({ channelId; worktreePath })`.
- [x] 4.2 Update `listWorktreesPayloadSchema` → `{ cwd }`; `deleteWorktreePayloadSchema` → `{ cwd, name }`. Response shapes unchanged except wrapping in `rpcResult`.
- [x] 4.2a **Unify callback format** (resolves the ad-hoc `WorktreeInfo | { error: string }` outlier):
  - `worktree:create` callback → `RpcResult<WorktreeInfo>` (was `WorktreeInfo | { error: string }`)
  - `worktree:list` callback → `RpcResult<{ worktrees: WorktreeInfo[] }>` (was plain `WorktreeListResponse`)
  - `worktree:delete` already `RpcResult<Record<string,never>>` — no change
  - Update `worktreeListResponseSchema` to `rpcResult(z.object({ worktrees: z.array(worktreeInfoSchema) }))`
  - Update all call sites (client WorktreeProvider in Section 5a, any tests) to branch on `response.ok`
- [x] 4.3 `server/socket/handlers/worktree.ts`:
  - Drop `withChannel` wrappers on all three handlers
  - `handleCreate`: parse → `gitService.getProjectRoot(cwd)` (NOT `getRepoRoot` — see proposal Section 3 note on nested-worktree trap) → err if null → `gitService.createWorktree(projectRoot, name)` → spawn fresh Claude in `info.path` → broadcast `session:created` → return `ok({ channelId, worktreePath })` → rollback `deleteWorktree(projectRoot, name)` on spawn failure
  - `handleList` / `handleDelete`: similar cwd-based refactor
- [x] 4.4 Integration test: dispatch `worktree:create` with `{ cwd, name }` → verify worktree exists on filesystem + `session:created` broadcast + new channel has correct cwd + rollback on spawn failure.
- [x] 4.5 Server tests green.

## 5. Capabilities exposure

- [x] 5.1 Extend `app:init` response (or new dedicated RPC) to include `capabilities: { worktree: boolean }`.
- [x] 5.2 Client reads capabilities inside the new WorktreeProvider (Section 5a) — not a standalone hook.
- [x] 5.3 Client tests green.

## 5a. WorktreeProvider (React Context)

- [x] 5a.1 Create `apps/web/src/contexts/WorktreeContext.tsx` with `WorktreeState` + `WorktreeActions` interfaces, `WorktreeProvider` React component, and `useWorktree` hook. Split into `WorktreeStateContext` + `WorktreeActionsContext` if justified (≥ 5 consumers); start combined.
- [x] 5a.2 `create(cwd, name)` wraps `rpc(socket, 'worktree:create', ...)`.
- [x] 5a.3 `list(cwd)` wraps `rpc(socket, 'worktree:list', ...)` and caches result in `listing[cwd]`.
- [x] 5a.4 `remove(cwd, name)` wraps `rpc(socket, 'worktree:delete', ...)` and invalidates the cached listing.
- [x] 5a.5 `isCreating` / `createError` transient state for in-flight create op.
- [x] 5a.6 Mount `<WorktreeProvider>` in App root near `<ProjectProvider>`.
- [x] 5a.7 Unit test: mock socket; verify `create` calls RPC with correct payload, `list` caches, `remove` invalidates.
- [x] 5a.8 Client tests green.

## 6. Client UI — ProjectContextMenu entry + form

- [x] 6.1 Add "Create Worktree…" item to `ProjectContextMenu.tsx`. Conditional on `useWorktree().capabilities.worktree === true`.
- [x] 6.2 New component `CreateWorktreeDialog.tsx`:
  - Name input with extension-matching validation (regex `/^[a-zA-Z0-9._-]+$/`, max 64, no dot traps)
  - Submit → `useWorktree().create(cwd, name)` (no direct RPC)
  - Error display from `useWorktree().createError`
  - On success: close dialog; new tab auto-opens via existing `session:created` broadcast handling
- [x] 6.3 Tests: name validation unit test; dialog flow with mock `useWorktree()` (not mock socket).
- [x] 6.4 Storybook story for CreateWorktreeDialog.

## 7. TabBar worktree badge + divider

- [x] 7.1 `apps/web/src/components/TabBar.tsx` — extend `TabInfo` to include `worktree?: { name: string; path: string }` (passed from session metadata).
- [x] 7.2 Render tab label as `{title} · {worktree.name}` when worktree present. Badge styled subtly (muted color, smaller font).
- [x] 7.3 Tooltip on tab shows worktree path when present.
- [x] 7.4 Group tabs by worktree key (main = no worktree, or `worktree.name`). Render groups in order: main first, then worktrees by worktree name. Vertical divider (1px border-left) between groups.
- [x] 7.5 Tests: TabBar with mixed main + 2 worktree sessions renders divider; tab label includes worktree badge.
- [x] 7.6 Storybook story for TabBar with worktrees.

## 8. Validation

- [x] 7.1 `pnpm -r tsc --noEmit` clean.
- [x] 7.2 Full test suite green.
- [ ] 7.3 Manual e2e (deferred — automated tests cover happy + error paths; requires user to run dev server):
  - Right-click on Project → Create Worktree… → enter "feature-x" → verify new tab opens in `<repo>/.claude/worktrees/feature-x` grouped under same Project as main repo.
  - With active channel in project → same flow with "Fork current conversation" checked → verify new session has fork history.
- [x] 7.4 `openspec validate worktree-control-request` passes.
