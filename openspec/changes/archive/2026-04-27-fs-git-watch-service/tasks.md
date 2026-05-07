## 1. Dependencies

- [x] 1.1 Add `chokidar` to `apps/summoner/package.json` (latest 3.x).
- [x] 1.2 `pnpm install`.
- [x] 1.3 Confirm chokidar types available — no extra `@types/chokidar` needed (ships with types in 3.x).

## 2. TDD — FakeWatchService

- [x] 2.1 Red: create `apps/summoner/src/test/__tests__/fake-watch-service.test.ts`:
  - subscribe returns an Unsubscribe
  - simulate fans out to all subscribers on that cwd
  - unsubscribe stops callbacks
  - multiple cwds are independent
  - throwing subscriber does not block others (assert B receives event even when A throws)
  - idempotent unsubscribe (second call is a no-op)
- [x] 2.2 Green: implement `apps/summoner/src/test/fake-watch-service.ts`.
- [x] 2.3 Run: confirm green.

## 3. TDD — WatchService interface

- [x] 3.1 Create `apps/summoner/src/fs-watch/types.ts` with the interface + `WatchEvent` type.
- [x] 3.2 Update `apps/summoner/src/index.ts` to export `WatchService`, `WatchEvent`, `createWatchService` factory placeholder.
- [x] 3.3 The FakeWatchService tests from step 2 already cover the interface contract — confirm they still pass with the extracted type.

## 4. TDD — FsGitDirtyBroadcaster

- [x] 4.1 Red: create `apps/server/src/services/__tests__/fs-git-dirty-broadcaster.test.ts` injecting `FakeWatchService` and a fake emitter. Cases:
  - `.git/HEAD` event → 1× `git:dirty` after 200 ms
  - `src/foo.ts` event → 1× `files:dirty` with paths `['src/foo.ts']` after 200 ms
  - `node_modules/x/y.js` → no emit
  - `.git/objects/aa/bb` → no emit
  - storm: 100 file events across 50ms → 1× `files:dirty` with all 100 paths
  - concurrent git+files in same window → 1× `git:dirty` + 1× `files:dirty`
  - events on two different cwds → two separate emits, not merged
- [x] 4.2 Green: implement `apps/server/src/services/fs-git-dirty-broadcaster.ts`:
  - internal `buffer: Map<cwd, { files: Set<string>; git: boolean }>`
  - first event schedules `setTimeout(flush, 200)`
  - flush: emit per cwd+kind via injected emitter; clear buffer
- [x] 4.3 Run: confirm green.

## 5. Shared schemas + event catalog

- [x] 5.1 Add `packages/shared/src/schemas/fs-dirty.ts` with:
  - `filesDirtyEventSchema = z.object({ cwd: z.string(), paths: z.array(z.string()) })`
  - `gitDirtyEventSchema = z.object({ cwd: z.string() })`
- [x] 5.2 Re-export from `packages/shared/src/schemas/index.ts`.
- [x] 5.3 Add `EVENTS.fs.filesDirty` / `EVENTS.fs.gitDirty` to `packages/shared/src/socket-events.ts` with string values `'files:dirty'` / `'git:dirty'`.
- [x] 5.4 Run `pnpm --filter @code-quest/shared exec tsc --noEmit`.

## 6. Lifecycle wiring

- [x] 6.1 Red: add integration test `apps/server/src/socket/__tests__/watch-lifecycle.test.ts` using FakeSummoner:
  - Open a channel with cwd `/repo` via real session init.
  - Simulate a `WatchEvent` through injected FakeWatchService.
  - Assert `files:dirty` broadcast reaches the socket.
  - Close the channel.
  - Simulate again → no broadcast.
- [x] 6.2 Green: wire subscribe in `channel-manager.ts` (or the appropriate session-open path); unsubscribe on channel close. Confirm refcount semantics: two channels on same cwd → one watcher; close one → still watching; close both → unsubscribed.
- [x] 6.3 Bind `WatchService` (TYPES.WatchService) and `FsGitDirtyBroadcaster` in `apps/server/src/container.ts`.
- [x] 6.4 Run all server tests — confirm green.

## 7. Real LocalWatchService (chokidar-backed)

- [x] 7.1 Create `apps/summoner/src/fs-watch/local.ts` implementing `WatchService` with chokidar:
  - `awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }`
  - `ignoreInitial: true`
  - ignore patterns: `node_modules/`, `.git/objects/`, `.git/logs/`, `dist/`, `build/`, `out/`, `.next/`, `.turbo/`, `.parcel-cache/`, `*.log`, `.DS_Store`
  - `followSymlinks: false`
- [x] 7.2 Handle `ENOSPC` error: log once per process, swallow — don't crash.
- [x] 7.3 Opt-in integration test `apps/summoner/src/__tests__/local-watch-service.test.ts` guarded by `RUN_INTEGRATION` env (like `local-filesystem-service.test.ts`): create tmpdir, subscribe, write a file, assert callback fires within 1s, unsubscribe, close.
- [x] 7.4 Wire `LocalWatchService` into container when `NODE_ENV !== 'test'`; tests use `FakeWatchService` via container override (existing pattern).

## 8. Verify

- [x] 8.1 `pnpm --filter @code-quest/summoner exec vitest run` — green.
- [x] 8.2 `pnpm --filter @code-quest/server exec vitest run` — green.
- [x] 8.3 `pnpm --filter @code-quest/shared exec tsc --noEmit` — clean.
- [x] 8.4 biome check on all touched files.

## 9. Manual QA (deferred to smoke-test session)

- [~] 9.1 Run server with `RUN_INTEGRATION=1`; open cc-office in dev; edit a file externally → server logs show `files:dirty` after 200ms.
- [~] 9.2 `git commit` externally → server logs show `git:dirty`.
- [~] 9.3 `pnpm install` in cc-office repo → no crash; no `files:dirty` spam (node_modules ignored).

## 10. Finalize

- [x] 10.1 Commit: `feat(watch): chokidar-based FS watch service + files:dirty / git:dirty broadcast`.
- [x] 10.2 Ready to `/opsx:archive fs-git-watch-service` once merged.
