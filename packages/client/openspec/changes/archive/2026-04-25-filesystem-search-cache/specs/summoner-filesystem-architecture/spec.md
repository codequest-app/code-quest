## ADDED Requirements

### Requirement: LocalFilesystemService SHALL cache the per-cwd file list and Fuse index

`LocalFilesystemService` SHALL maintain an internal per-cwd cache of `{ files, fuse }` so that repeated `listFiles(cwd, pattern)` calls for the same cwd reuse a single filesystem walk and a single Fuse index. The cache SHALL be bounded (default 16 cwds, configurable) with LRU eviction.

#### Scenario: Repeat call reuses the file list

- **WHEN** `listFiles(cwd, pattern)` has previously been called for `cwd` and no invalidation event has occurred
- **THEN** the next `listFiles(cwd, anyPattern)` SHALL NOT re-walk the filesystem

#### Scenario: Fuse index is reused across queries

- **WHEN** `listFiles(cwd, pattern)` has built the Fuse index for `cwd`
- **THEN** subsequent calls with different patterns for the same `cwd` reuse the same Fuse instance until invalidation

#### Scenario: LRU eviction

- **WHEN** the configured cap is `N` and `N + 1` distinct cwds have been queried
- **THEN** the least-recently-used cwd's cache entry is evicted; querying it again triggers a fresh walk

#### Scenario: Public signature unchanged

- **WHEN** any existing caller invokes `listFiles(cwd, pattern)`
- **THEN** the return shape and behavior contract are identical to the pre-cache implementation

### Requirement: Chokidar events SHALL invalidate the matching cwd cache

`LocalFilesystemService` SHALL subscribe to `LocalWatchService` chokidar events. On any add / unlink / addDir / unlinkDir event under a cached cwd, the cached `files` and `fuse` for that cwd SHALL be dropped so the next `listFiles` call rebuilds them.

#### Scenario: File added invalidates the cache

- **WHEN** a chokidar `add` event fires for a path under `cwd` that has a cached entry
- **THEN** the cached `files` and `fuse` for `cwd` are cleared AND the next `listFiles(cwd, ...)` walks the filesystem again

#### Scenario: Event for unrelated cwd does not invalidate

- **WHEN** a chokidar event fires for a path under `cwdA` and `cwdB` also has a cached entry
- **THEN** `cwdB`'s cache is unchanged
