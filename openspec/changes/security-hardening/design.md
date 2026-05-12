## Context

Remote summoner exposes `LocalFilesystemService` and `LocalGitService` over RPC. `LocalRootGuard` is the central enforcement point for fsRoots, but several callers bypass it:

- `listFiles(cwd, pattern)` — `getAllFiles(cwd)` calls glob directly on `cwd` with no root check
- `readFile(cwd, filePath)` — only checks that `filePath` doesn't escape `cwd`; `cwd` itself is unchecked
- `git/commands.ts diff(cwd, filePath, "??")` — raw `readFile(resolve(cwd, filePath))` with no validation
- `LocalRootGuard.isWithinRoots()` uses `path.resolve()` which doesn't follow symlinks; a symlink inside a root pointing outside passes the check
- `summoner/main.ts` creates `LocalFilesystemService(config.fsRoots, rootGuard)` without a watcher, so `listFiles` cache is never invalidated
- `Agent.spawned.set(sessionId, handle)` silently overwrites on duplicate sessionId

## Goals / Non-Goals

**Goals:**
- All `LocalFilesystemService` read/list entry points validate `cwd` against fsRoots before operating
- Symlink escape through fsRoots boundary is rejected via `realpath()` check
- `git.diff` untracked path is guarded against traversal outside `cwd`
- Summoner daemon invalidates `listFiles` cache on file changes
- Duplicate `sessionId` spawn returns an error instead of orphaning the old process

**Non-Goals:**
- Remote mode security (delegated to summoner; server uses `RemoteFilesystemService`)
- File-creation / write path hardening (separate concern; already uses `guardPath`)
- Daemon authentication / transport-layer security

## Decisions

### 1. Guard `listFiles` and `readFile` via `guardPath(cwd)`

Add `this.guardPath(cwd)` as the first line of both methods, using the existing `guardPath` → `rootGuard.isWithinRoots()` path. Return `{ error }` from `readFile` on violation (consistent with existing cwd-escape error); throw `PathOutsideRootsError` from `listFiles` (consistent with other mutating operations).

**Alternative considered:** Validate only inside `getAllFiles`/`buildListCacheEntry`. Rejected — too deep, misses the cwd validation intent.

### 2. Symlink detection in `LocalRootGuard` via `realpath()`

Add an async `isWithinRootsReal(path: string): Promise<boolean>` that calls `fs.realpath()` before the same relative-path check. Use this in `guardPath` (which becomes async). Guard callers that need symlink safety (`readFileAbsolute`, `readFile`, `listFiles`) via the async version; keep the sync `isWithinRoots` for tests/sync-only callers.

**Alternative considered:** Make `isWithinRoots` async everywhere. Rejected — `guardPath` is called in many sync-friendly paths; making it universally async would cascade widely. Instead, add the realpath variant and use it only on the RPC-exposed read paths.

**Simpler alternative:** `realpath()` only in `guardPath()` (single place). Preferred — less surface, centralised.

Actually: make `guardPath` async (`guardPathReal`) for the three RPC-exposed read operations; keep sync `guardPath` for write operations that validate parent dir before creation.

### 3. Guard `git.diff` untracked path

Replace raw `readFile(resolve(cwd, filePath), 'utf-8')` with `LocalFilesystemService.readFile(cwd, filePath)` injected via constructor, OR inline the same relative-path check (`relative(cwd, resolved).startsWith('..')`) without introducing a service dependency. Inline check preferred — `commands.ts` is a pure git helper and shouldn't depend on `LocalFilesystemService`.

### 4. Wire `LocalWatchService` in summoner daemon

In `summoner/main.ts`, construct `new LocalWatchService()` and pass it to `LocalFilesystemService`. Matches what the server's local mode already does in `container.ts`.

### 5. Reject duplicate `sessionId` in `Agent.spawn`

Before `this.spawned.set(sessionId, handle)`, check `this.spawned.has(sessionId)`. If true, abort the new handle immediately and return `{ ok: false, error: 'sessionId already active' }`. This avoids the orphan-then-ghost-delete race.

## Risks / Trade-offs

- **realpath() adds async I/O** on every guarded read call. Acceptable — these are already async file operations. Errors (e.g., path doesn't exist yet) should be treated as "not within roots" (deny by default).
- **`guardPathReal` vs `guardPath` split** adds a small maintenance surface. Mitigated by clear naming and a test covering each variant.
- **Breaking change to `listFiles`/`readFile` error shape**: `listFiles` previously silently scanned any cwd; now it throws `PathOutsideRootsError`. Callers that don't pass fsRoots will see an error. In tests, `LocalFilesystemService` is usually constructed without fsRoots (empty array) — need to verify tests still pass or update test construction.
