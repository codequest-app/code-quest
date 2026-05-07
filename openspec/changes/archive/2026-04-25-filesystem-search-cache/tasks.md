## Tasks

### 1. DI wiring

- [x] Add `LocalWatchService` as a constructor dependency of `LocalFilesystemService`.
- [x] Update `container.ts` binding for `LocalFilesystemService` to inject `LocalWatchService`.
- [x] Update existing tests / fakes that construct `LocalFilesystemService` directly.

### 2. Per-cwd cache

- [x] Introduce a per-cwd cache holding `{ files: string[]; fuse: Fuse<string> | null }`.
- [x] First call to `listFiles(cwd, pattern)` for a cwd builds and stores `files`; the Fuse index is built lazily on first non-empty pattern.
- [x] Subsequent calls for the same cwd reuse `files` and `fuse` without re-walking or rebuilding.
- [x] Cache is bounded — default 16 cwds, configurable; LRU evicts the least-recently-used cwd on overflow.

### 3. Invalidation

- [x] On construction, `LocalFilesystemService` subscribes via `LocalWatchService` to chokidar events (add / unlink / addDir / unlinkDir) for any watched cwd.
- [x] On any such event for a cwd, the cached `files` and `fuse` for that cwd are dropped.
- [x] The next `listFiles(cwd, ...)` rebuilds.

### 4. Tests

- [x] First call walks the filesystem; second call (no chokidar event in between) does NOT walk.
- [x] First non-empty-pattern call builds Fuse; second non-empty-pattern call (no event in between) reuses the same Fuse instance.
- [x] Chokidar `add` event for a watched cwd invalidates that cwd's cache; the next `listFiles` walks again.
- [x] Chokidar event for cwd A does NOT invalidate cwd B's cache.
- [x] LRU: with cap=2 and three distinct cwds touched in order A, B, C, querying A again walks (A was evicted).
- [x] Public signature and return shape of `listFiles` unchanged.

### 5. Verification

- [x] `npx openspec validate filesystem-search-cache --strict`.
