## Why

Remote summoner exposes filesystem and git operations as RPC endpoints. Several of these lack consistent path validation:

- `listFiles` and `readFile` do not check `cwd` against fsRoots, only that `filePath` doesn't escape `cwd`. An attacker who controls `cwd` can read or list any directory on the host.
- `LocalRootGuard` uses `path.resolve()` to normalise paths but cannot detect symlink escapes — a symlink inside a root that points outside is accepted as valid.
- `git.diff` with untracked status reads the file directly via `readFile(resolve(cwd, filePath))` bypassing all guards.
- The summoner daemon constructs `LocalFilesystemService` without a `LocalWatchService`, so `fs/list` cache entries are never invalidated after file changes.
- `Agent.spawned` uses `sessionId` as map key with a plain `.set()`, so a duplicate spawn silently orphans the old process; when the new process exits it also deletes the stale handle, losing track of the orphan entirely.

## What Changes

- Add fsRoots guard to `listFiles` and `readFile` in `LocalFilesystemService`
- Add symlink escape detection to `LocalRootGuard` using `realpath()`
- Guard `git.diff` untracked path against cwd-relative traversal
- Wire `LocalWatchService` into the summoner daemon's `LocalFilesystemService`
- Reject duplicate `sessionId` spawns in `Agent` instead of silently overwriting

## Capabilities

### New Capabilities
- `fs-root-guard`: Consistent fsRoots enforcement across all `LocalFilesystemService` read/list operations and git diff
- `agent-spawn-safety`: Duplicate sessionId spawn returns an error instead of orphaning the old process

### Modified Capabilities
- `symlink-safety`: LocalRootGuard gains realpath-based symlink escape detection

## Impact

- `apps/summoner/src/filesystem/local.ts` — `listFiles`, `readFile`
- `apps/summoner/src/filesystem/local-root-guard.ts` — `isWithinRoots`
- `apps/summoner/src/git/commands.ts` — `diff` untracked branch
- `apps/summoner/src/main.ts` — `LocalFilesystemService` construction
- `apps/summoner/src/connection/agent.ts` — duplicate spawn guard
