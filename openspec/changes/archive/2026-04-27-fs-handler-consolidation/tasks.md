## Strategy

Hard-cut migration. Same playbook as `git-handler-consolidation`:
shared schemas → server handler → client consumers → delete dead code → verify.

**Scope reduced** (after attempt): the channel-scoped `file:list / file:read`
migration is **deferred** to a separate change. Reason: it requires putting
`cwd` into the channel context tree, and the test setup
(`render-with-channel`) intentionally avoids passing `cwd` to ChannelProvider
to prevent dueling `session:launch` calls. Decoupling that needs more
thought than fits this change.

## 1. Shared — fs schemas + EVENTS map
- [x] 1.1 Create `packages/shared/src/schemas/fs.ts` with browse/read/search/watch/unwatch.
- [x] 1.2 EVENTS: add `EVENTS.fs.{browse,read,search,watch,unwatch}`; remove `EVENTS.explorer.*`.
- [x] 1.3 Re-organize broadcast events: `EVENTS.fs.dirty` (was `fs.filesDirty`), `EVENTS.git.dirty` (was `fs.gitDirty`).
- [x] 1.4 ClientToServerEvents: replace explorer:* with fs:* (keep file:list / file:read).
- [x] 1.5 Delete `schemas/explorer.ts`. (Keep `schemas/file.ts` for now.)
- [x] 1.6 `pnpm --filter @code-quest/shared exec tsc --noEmit` clean.

## 2. Server fs handler
- [x] 2.1 Create `handlers/fs.ts` combining browse/read/search/watch/unwatch.
- [x] 2.2 `socket/server.ts`: register `fs.create(ctx)`. Keep `file.create(ctx)` (file:list/read still channel-scoped).
- [x] 2.3 Delete `handlers/explorer.ts` + `handlers/file.test.ts` redirect noise.
- [x] 2.4 Server tsc + vitest green (590).

## 3. Client — rename cwd-based callers (`explorer:*` → `fs:*`)
- [x] 3.1 `useExplorerBrowse`: `EVENTS.explorer.browse` → `EVENTS.fs.browse`; type imports.
- [x] 3.2 `FilePreviewModal`: `EVENTS.explorer.read` → `EVENTS.fs.read`; schema rename.
- [x] 3.3 `FilesPane` + `GitPane`: `EVENTS.explorer.watch / unwatch` → `EVENTS.fs.watch / unwatch`.
- [x] 3.4 Update FsBrowseResponse usage in tests.
- [x] 3.5 Migrate dirty event consumers: `EVENTS.fs.filesDirty` → `EVENTS.fs.dirty`, `EVENTS.fs.gitDirty` → `EVENTS.git.dirty`.

## 4. Channel-scoped migration — DEFERRED
- [ ] Future change: move file:list / file:read from channel-scoped to fs:search / fs:read.
  - Requires: ChannelProvider exposing cwd via Context (tried: ChannelIdContext extension worked, but render-with-channel test setup intentionally omits cwd to avoid dueling launch — needs investigation).
  - Server-side: drop file:list/file:read handlers (unify into fs).
  - Client: createFileActions migrate, streaming.ts open_file enrichment migrate.

## 5. Final cleanup
- [x] 5.1 Delete `schemas/explorer.ts` (done in 1.5).
- [x] 5.2 No stale `'explorer:'` strings.
- [x] 5.3 biome check + tsc all packages.

## 6. Verify
- [x] 6.1 client + server + shared tsc green.
- [x] 6.2 client + server vitest green (1537 + 591).

## 7. Finalize
- [ ] 7.1 Commit.
