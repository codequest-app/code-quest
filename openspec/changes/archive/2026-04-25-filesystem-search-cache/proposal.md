## Why

`LocalFilesystemService.listFiles(cwd, pattern)` re-walks the tree (`glob('**/*', { maxDepth: 10 })`) AND rebuilds the Fuse index on every call. The command palette and mention dropdown fire this method per keystroke, so a single typing session produces N file-system walks plus N Fuse rebuilds. On a 5k-file repo we measured ~80ms per walk and ~30ms per Fuse rebuild — a few hundred ms of avoidable work per typed query.

We already operate a chokidar watcher (`LocalWatchService`) for the same cwds, so we have a clean invalidation signal — we just don't use it for this cache because the cache doesn't exist.

## What Changes

- Cache the file list per `cwd` inside `LocalFilesystemService`. Cache the Fuse index alongside the list (built lazily on first query for that cwd).
- Inject `LocalWatchService` into `LocalFilesystemService` (DI binding update in `container.ts`).
- On any chokidar event under `cwd` (add / unlink / addDir / unlinkDir), drop both the cached file list and the cached Fuse index for that `cwd`. The next `listFiles` rebuilds.
- Cap the number of cached cwds (default 16, configurable) with LRU eviction so long-running servers don't grow unbounded.

Explicitly out of scope:
- No query-result memoization. We cache the file list and Fuse index, not per-pattern query results — patterns vary too much per keystroke and result memoization gives diminishing returns.
- No server-side query batching across clients.
- No change to the `listFiles` public signature or return shape.

## Capabilities

- **summoner-filesystem-architecture**: `LocalFilesystemService` keeps a per-cwd LRU cache of the file list and Fuse index, reused across queries; chokidar events from `LocalWatchService` invalidate the matching cwd entry.
