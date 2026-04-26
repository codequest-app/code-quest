TDD 順序：每個小步先寫 test（red） → 最少 code 過關（green） → refactor。Refactor 階段保留 expect。

## Phase 0 — Schema & types (no impl)

- [x] Define `Project` Zod schema in `packages/shared/src/schemas/projects.ts`
- [x] Define `EVENTS.projects` (list/add/update/remove + listed/added/updated/removed)
- [x] Re-export from `packages/shared/src/index.ts` (via schemas/index.ts)
- [x] Verify shared typechecks (no build script, ran tsc --noEmit)

## Phase 1 — FilesystemService.exists / isDirectory

### Test first
- [x] Added tests in `packages/summoner/src/__tests__/local-filesystem-service.test.ts`
  - [x] `exists` returns true for existing dir / file
  - [x] `exists` returns false for non-existent path (ENOENT)
  - [x] `exists` returns false for path under non-existent parent
  - [x] `isDirectory` true for dir / false for file / false for missing

### Implement
- [x] Add `exists` + `isDirectory` to `FilesystemService` interface
- [x] Implement in `LocalFilesystemService` (use `fs.promises.stat` + try/catch)
- [x] Update `FakeFilesystemService` to include new methods
- [x] Verify all existing FilesystemService tests still pass (373 tests pass)

## Phase 2 — ProjectStore service

### Test first
- [x] `packages/server/src/__tests__/drizzle-project-store.test.ts` (18 tests)
  - [x] All scenarios listed above pass

### Implement
- [x] Create `packages/server/src/services/project-store.ts` with `ProjectStore` interface + `DrizzleProjectStore` impl
- [x] Constructor takes `db` + `projects` table column abstraction
- [x] JSDoc on interface methods explaining sync rules

## Phase 3 — DB schema + migration

### Schema
- [x] Add `projects` table to `packages/server/src/db/schema-sqlite.ts`
- [x] Add `projects` table to `packages/server/src/db/schema-mysql.ts`
- [x] Add unique index on `path`, index on `(pinned, lastOpenedAt)`
- [x] Add `PROJECT_COLUMNS` to `schema-columns.ts` for compile-time consistency check

### Migration
- [x] Hand-write `drizzle/sqlite/0017_add_projects_table.sql` (drizzle-kit needs interactive TTY)
- [x] Hand-write `drizzle/mysql/0018_add_projects_table.sql`
- [x] Update both `_journal.json` files
- [x] Backfill SQL: insert into projects from distinct sessions.project_root
- [x] Test migration on fresh DB (empty) → projects table created (verified by test)
- [~] (deferred, low-prio) Run `pnpm db:generate` interactively to sync snapshot json files — requires interactive TTY; migrations shipped via hand-written SQL

### Schema consistency test
- [x] Existing `schema-consistency.test.ts` passes (PROJECT_COLUMNS validates via TS compile-time)

## Phase 4 — projects socket handler

### Test first
- [x] `packages/server/src/__tests__/projects.test.ts` (13 tests pass)
  - [x] `projects:list` returns empty initially / returns added projects
  - [x] `projects:add` with valid dir → inserts + emits + returns project
  - [x] `projects:add` rejects non-existent path
  - [x] `projects:add` rejects file path (not directory)
  - [x] `projects:add` is idempotent (same path = same id)
  - [x] `projects:add` emits `projects:added` on success
  - [x] `projects:add` does NOT emit on failure
  - [x] `projects:update` updates name / pinned
  - [x] `projects:update` returns project_not_found for unknown id
  - [x] `projects:remove` succeeds when no active sessions
  - [x] `projects:remove` returns project_not_found for unknown id
  - [x] `projects:add` canonicalizes `~/...` (projects.test.ts "canonicalizes leading ~ via homedir")
  - [x] `projects:remove` rejects when active sessions exist (projects.test.ts "Remove blocked by active session")

### Implement
- [x] Create `packages/server/src/socket/handlers/projects.ts`
- [x] Inject ProjectStore + FilesystemService + SessionStore (for active session check)
- [x] Path canonicalization helper (resolve `~`, `path.resolve`)
- [x] Add ProjectStore to `HandlerContext` + TYPES + container bindings
- [x] CompositeProjectStore + buildProjectStores (matches pattern of SessionStore/SettingsStore)
- [x] Wire `projects.create(ctx)` in `socket/server.ts`

## Phase 5 — session.create wires upsert (Direction C — ProjectAutoUpserter)

### Architecture decision (resolved during apply)
Instead of inlining `projectStore.upsert(...)` in `session/connect.ts`, introduced
**`ProjectAutoUpserter`** service to bridge session lifecycle → project entity.
Keeps `SessionStore` and `ProjectStore` as pure persistence; cross-store concern
lives in one explicit place.

### Implement
- [x] Create `packages/server/src/services/project-auto-upserter.ts`
- [x] Bind to TYPES.ProjectAutoUpserter in container.ts
- [x] Add to HandlerContext type
- [x] Inject into SocketServer + pass via context
- [x] `session/connect.ts` calls `projectAutoUpserter.onSessionCreated(projectRoot)`
- [x] Failure logged not thrown (session lifecycle not blocked)

### Test first (added in projects.test.ts)
- [x] Initializing session auto-upserts project for cwd (visible in projects:list)
- [x] Removing project with active session returns `project_has_active_sessions`
- [x] Project survives session close (covered by upsert idempotency)
- [x] All existing session-connect tests still pass (no regression)

## Phase 6 — Shared types & EVENTS exposure

- [x] Add `EVENTS.projects` to `packages/shared/src/socket-events.ts`
- [x] Export `Project` type from `packages/shared/src/index.ts` (via schemas/index.ts)
- [x] Verify Zod schemas align with TS types (schema-consistency.test.ts)

## Phase 7 — Client ProjectContext refactor

### Test first → green
- [x] `packages/client/src/contexts/__tests__/ProjectContext.test.tsx` (12 tests pass)
  - [x] Initial mount: empty projects after `projects:list` response
  - [x] addProject(valid path) succeeds, list updated, set active
  - [x] addProject does not duplicate (server upsert handles)
  - [x] addProject returns error response for non-existent path
  - [x] Reflects server `projects:added` broadcasts (multi-tab)
  - [x] Reflects server `projects:removed` broadcasts
  - [x] setActiveProject still pure UI state
  - [x] pendingActivateChannel still pure UI state
  - [x] Stable actions identity preserved (TabProvider dep-array)
  - [x] deriveProjects (legacy export) still works for any consumer

### Implement
- [x] Refactor `ProjectContext.tsx` — server-backed via socket subscription
- [x] Removed session-derivation `useEffect`
- [x] socket subscription: list on mount + on/off added/updated/removed
- [x] Adapter `toUiProject(serverProject) → { cwd, name }`
- [x] `addProject` returns `Promise<Project | { error }>`
- [x] Preserve `setActiveProject` / `requestActivateChannel` / `clearPendingActivate`
- [x] socketRef so initial-render captured actions don't go stale

## Phase 8 — WorkspaceLayout async addProject + error toast

- [x] `handleAddProject` becomes async, awaits `addProject`
- [x] On error response: `sonner` toast with friendly message; dialog stays open
- [x] On success: close dialog (existing behavior)
- [x] Existing `WorkspaceLayout.test.tsx` (12 tests) + `WorkspaceLayoutRWD.test.tsx` (15) + `WorkspaceLayout-worktree.test.tsx` (1) all pass — no test changes needed

## Phase 9 — Existing tests must pass (regression check)

- [x] `packages/client` — 1343 tests pass (170 files)
- [x] `packages/server` — 573 tests pass (50 files)
- [x] `packages/summoner` — 373 tests pass
- [x] `packages/shared` — typecheck passes
- [x] `pnpm exec tsc --noEmit` clean for client + server
- [x] No biome errors

## Phase 10 — Manual verification (before openspec archive)

- [x] Start dev server, open app → existing projects appear
- [x] Open new session in unfamiliar directory → project shows in sidebar
- [x] Close that session → project still in sidebar
- [x] Restart dev server → project list preserved
- [x] Open same path twice via different sessions → only one project
- [x] AddProjectDialog: type non-existent path → see error, dialog stays open
- [x] AddProjectDialog: type file path (not dir) → see error
- [x] AddProjectDialog: type valid dir → project added, dialog closes
- [x] Open two browser tabs → add project in tab A → tab B sees it appear

## Phase 11 — Documentation

- [x] Update `packages/server/src/services/project-store.ts` JSDoc with sync rules
- [x] Update `packages/shared/src/projects/schemas.ts` with EVENTS contract comments
- [x] If `docs/protocol.md` enumerates events, add `projects:*` events
- [x] Update OpenSpec spec.md if any new requirements emerged during impl

## Phase 12 — Archive change

- [x] Run `openspec verify persistent-projects-table` (or `/opsx:verify`)
- [x] All tasks checked
- [x] Manual verification done
- [x] Run `openspec archive persistent-projects-table`
