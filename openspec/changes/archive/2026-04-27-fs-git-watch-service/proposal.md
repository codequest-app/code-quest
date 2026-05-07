## Why

The upcoming Files pane and Git pane (tracked in `files-pane-v1`, `git-pane-readonly`) would otherwise go stale the moment anything happens outside the UI — an editor saves a file, a CLI rebases a branch, `pnpm install` rewrites thousands of nested paths. Without real-time signal, users either stare at incorrect state or hit a manual refresh button. Neither is acceptable for a pane whose whole premise is "show me what's going on in this worktree right now".

Solving this with polling is wrong (wastes CPU/fd for idle workspaces and lags for active ones). Solving it with "re-fetch on window focus" covers some cases but misses in-app edits. The correct primitive is filesystem events: `chokidar` observes real FS changes, and the server broadcasts a coalesced **derived signal** (`files:dirty` / `git:dirty`) so each pane can invalidate and re-fetch.

This change is scoped to the **server-side watch service + socket broadcast** only. No UI code changes in this change — the Files and Git panes consume the signal in their own changes.

## What Changes

- Introduce **`WatchService`** in `apps/summoner`: observes a directory via `chokidar`; subscribers register a callback and get de-duplicated, debounced batches of changes.
- Introduce **`FakeWatchService`** in `apps/summoner/test` following the established Fake pattern (manual `.simulate()` helper for deterministic tests).
- Wire **`WatchService`** into the server container (inversify) with a `FileSystemWatcher` TYPES symbol.
- Add **subscription lifecycle** to the channel/session layer: when a channel is created with a `cwd`, subscribe; when the channel dies, unsubscribe. Use refcount so N sessions on the same `cwd` share one `chokidar` watcher.
- Add **derived-signal broadcaster**: classifies FS events into "git state may have changed" vs "file tree may have changed" and emits `files:dirty { cwd, paths }` / `git:dirty { cwd }` over socket.io.
- Add socket event schemas + handlers registration; no RPC, these are server-pushed broadcasts only.

## Capabilities

### New Capabilities
- `fs-watch-service`: a Summoner-level service that watches a directory and notifies subscribers of coalesced FS events. Refcount + lifecycle management included. Not socket-aware.
- `fs-git-dirty-broadcast`: a Server-level concern that consumes `WatchService` subscriptions and translates FS events into `files:dirty` / `git:dirty` socket broadcasts for the right clients (same-project channels).

### Modified Capabilities
(none — this change is purely additive server-side)

## Impact

**Affected code (new):**
- `apps/summoner/src/fs-watch/types.ts` — `WatchService` interface + event shape.
- `apps/summoner/src/fs-watch/local.ts` — `chokidar`-backed real impl.
- `apps/summoner/src/fs-watch/errors.ts` — typed errors (e.g. `InotifyLimitError` on Linux).
- `apps/summoner/src/test/fake-watch-service.ts` — test double.
- `apps/server/src/services/fs-git-dirty-broadcaster.ts` — routes events to socket emits.
- `packages/shared/src/schemas/fs-dirty.ts` — zod schemas for `files:dirty` / `git:dirty` payloads.
- `packages/shared/src/socket-events.ts` — add `EVENTS.fs.*` keys.
- Tests: unit (`WatchService` via FakeWatchService), server (broadcaster with real channel) — no client changes.

**Affected code (modified):**
- `apps/server/src/container.ts` — bind `WatchService` + `FsGitDirtyBroadcaster`.
- `apps/server/src/socket/channel-manager.ts` (or session lifecycle equivalent) — subscribe on channel create, unsubscribe on close. Refcount handled inside `WatchService`.

**Dependencies:**
- Adds `chokidar` to `apps/summoner` dependencies (~70 KB with deps; stable, MIT).

**Risk:**
- **Linux `inotify` watch limit.** Default `fs.inotify.max_user_watches` is ~8192 on many distros; pnpm workspaces can exceed this. Mitigated by aggressive ignore lists (`node_modules`, `.git/objects`, `.git/logs`, `dist`, build artifacts). `InotifyLimitError` surfaces gracefully with a server-log hint to bump the sysctl.
- **Symbolic link loops.** `followSymlinks: false` by default.
- **Fd leak on bad lifecycle.** Mitigated by refcounted `WatchService` + mandatory `unsubscribe()` in channel close path; unit test verifies watcher closure when subscriber count hits zero.
- **Event storm.** 200 ms debounce window in the broadcaster; tests assert a flood of 1000 synthetic events collapses to ≤ 1 emit per (cwd, signal).
- **Test flakiness from real FS.** Production code uses `chokidar`; all server/client tests use `FakeWatchService` + `.simulate()`. No real FS writes in unit or integration tests.

**No client-side changes in this change.** Clients receive `files:dirty` / `git:dirty` events as new socket-event schemas, which follow-up changes will start consuming.
