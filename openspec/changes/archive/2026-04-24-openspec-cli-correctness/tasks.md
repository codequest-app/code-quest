## Tasks

### 1. Shared schemas
- [ ] Extend `OpenspecChangeSummary` with `status: 'in-progress' | 'complete'`. Update zod schema.
- [ ] Remove `openspecSyncPayloadSchema` / `openspecSyncResultSchema` + re-exports.
- [ ] Remove `openspec:sync` from `EVENTS.openspec` + `ClientToServerEvents`.

### 2. Summoner — LocalOpenspecService
- [ ] Rewrite `LocalOpenspecService.list(cwd)` to spawn `openspec list --json` (and `--specs --json`) via the injected `ProcessProvider`. Parse output with a zod schema; map each entry to `OpenspecChangeSummary` / `OpenspecSpecSummary`. On `ENOENT` return `{ error: 'openspec-cli-not-found' }`.
- [ ] Fix `changeNew` to spawn `openspec new change <name>` (args array `['new', 'change', name]`).
- [ ] Delete `sync` method from `OpenspecService` interface + `LocalOpenspecService` + `FakeOpenspecService`.
- [ ] Update / expand tests covering the CLI-driven list (happy path, CLI-missing, invalid JSON).

### 3. Server
- [ ] Remove `openspec:sync` handler + `openspec:sync` scenario in the spec-pane test suite.
- [ ] `openspec:changeNew` handler unchanged (just delegates to service).

### 4. Client
- [ ] `OpenspecContext`: drop `sync` action; keep `changeNew` / `toggleTask`.
- [ ] `SpecPane`: drop `sync` button + handler. `Ready` badge reads `c.status === 'complete'` instead of the derived formula.
- [ ] Update SpecPane + OpenspecContext tests (drop `sync action` describe block; update `Ready` badge tests to seed `status` instead of tasks counts).

### 5. Verification
- [ ] Full `pnpm vitest run` green across summoner / server / client.
- [ ] `openspec validate openspec-cli-correctness --strict`.
- [ ] Manual smoke: `+ new` in a real project creates a change directory; `Ready` badge lights up for a change whose tasks are all checked.
