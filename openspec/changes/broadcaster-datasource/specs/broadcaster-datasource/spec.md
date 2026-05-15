## ADDED Requirements

### Requirement: DataSource interface encapsulates read and change detection
Each data domain (files, git, openspec) SHALL implement `DataSource<T>` with `read(): Promise<T>` and `onChange(cb: () => void): Unsubscribe`. The `onChange` callback SHALL only signal that data has changed, not carry the new value.

#### Scenario: DataSource notifies on relevant file change
- **WHEN** a file change event arrives that matches the domain's filter
- **THEN** the DataSource SHALL invoke all registered onChange callbacks

#### Scenario: DataSource ignores irrelevant file changes
- **WHEN** a file change event arrives that does not match the domain's filter
- **THEN** the DataSource SHALL NOT invoke any onChange callbacks

### Requirement: CachedDataSource wraps a DataSource and deduplicates reads
`CachedDataSource<T>` SHALL wrap a `DataSource<T>` and cache the last `read()` result. On `onChange`, the cache SHALL be invalidated lazily (set to null) so the next `read()` call triggers a fresh fetch. Multiple rapid `onChange` signals SHALL result in at most one `read()` call if the value has not been consumed yet.

#### Scenario: Cache hit returns immediately
- **WHEN** `read()` is called and a cached value exists
- **THEN** the cached value SHALL be returned without calling the inner DataSource's `read()`

#### Scenario: Cache miss delegates to inner DataSource
- **WHEN** `read()` is called and no cache exists (first call or after invalidation)
- **THEN** `CachedDataSource` SHALL call the inner DataSource's `read()` and cache the result

#### Scenario: Rapid onChange signals deduplicate reads
- **WHEN** multiple `onChange` callbacks fire before any `read()` is called
- **THEN** the cache SHALL be invalidated once and only one `read()` SHALL be triggered on next access

### Requirement: Broadcaster holds multiple named DataSources and manages per-cwd subscriptions
`Broadcaster` SHALL allow registering multiple named DataSource factories via `add(type, createSource)`. On `subscribe(cwd, subscriberId, cb)`, it SHALL lazily create all registered DataSources for that cwd and push typed snapshots `cb(type, data)` whenever any DataSource changes. A single WatchService instance MAY be shared across all DataSources for the same cwd — the Broadcaster does not manage the WatchService directly.

#### Scenario: New subscriber receives current values for all types immediately
- **WHEN** a new subscriber calls `subscribe(cwd, id, cb)`
- **THEN** for each registered type, if `lastValue` is cached, `cb(type, lastValue)` SHALL be called immediately
- **THEN** for each type with no `lastValue`, a `read()` SHALL be initiated and `cb(type, data)` called when resolved

#### Scenario: All subscribers receive updated value when any DataSource changes
- **WHEN** a DataSource's `onChange` fires for a given type
- **THEN** `Broadcaster` SHALL call `source.read()` and push `cb(type, data)` to all active subscribers for that cwd

#### Scenario: Last subscriber unsubscribes cleans up all DataSources for that cwd
- **WHEN** the last subscriber for a given cwd unsubscribes
- **THEN** `Broadcaster` SHALL dispose all DataSources for that cwd and remove the cwd entry

#### Scenario: Single subscribe covers all registered types
- **WHEN** `subscribe(cwd, id, cb)` is called once
- **THEN** `cb` SHALL receive updates for ALL registered types (files, git, openspec) without additional subscribe calls

### Requirement: FilesDataSource filters fs events and wraps CachedDataSource
`FilesDataSource` SHALL subscribe to `WatchService` for a given cwd. It SHALL call `notifyChange()` only for events whose path does NOT match `GIT_META_RE` and is NOT in the glob ignore list (node_modules, .git, dist, coverage, logs). It SHALL be wrapped in `CachedDataSource` by the caller.

#### Scenario: Non-git, non-ignored file triggers notification
- **WHEN** a `change` event arrives for `src/foo.ts`
- **THEN** `FilesDataSource` SHALL call `notifyChange()`

#### Scenario: Git metadata file does not trigger notification
- **WHEN** a `change` event arrives for `.git/HEAD`
- **THEN** `FilesDataSource` SHALL NOT call `notifyChange()`

### Requirement: GitDataSource filters git metadata events
`GitDataSource` SHALL subscribe to `WatchService` for a given cwd. It SHALL call `notifyChange()` only when the event path matches `GIT_META_RE = /^\.git\/(HEAD|index|packed-refs|refs\/.*)$/`.

#### Scenario: Git HEAD change triggers notification
- **WHEN** a `change` event arrives for `.git/HEAD`
- **THEN** `GitDataSource` SHALL call `notifyChange()`

#### Scenario: Regular file change does not trigger git notification
- **WHEN** a `change` event arrives for `src/foo.ts`
- **THEN** `GitDataSource` SHALL NOT call `notifyChange()`

### Requirement: OpenspecDataSource filters openspec directory events
`OpenspecDataSource` SHALL subscribe to `WatchService` for a given cwd. It SHALL call `notifyChange()` only when the event path starts with `openspec/`.

#### Scenario: Openspec file change triggers notification
- **WHEN** a `change` event arrives for `openspec/changes/foo/design.md`
- **THEN** `OpenspecDataSource` SHALL call `notifyChange()`

#### Scenario: Non-openspec file does not trigger openspec notification
- **WHEN** a `change` event arrives for `src/bar.ts`
- **THEN** `OpenspecDataSource` SHALL NOT call `notifyChange()`

### Requirement: One Broadcaster instance covers all types, shared WatchService per process
The single `Broadcaster` instance SHALL be created in the summoner process with all three DataSource types registered. A single `WatchService` instance SHALL be shared across all DataSource factories for the same process so that only one underlying fs watcher is opened per cwd.

#### Scenario: Local mode server accesses Broadcaster in-process
- **WHEN** running in local mode (server embeds summoner)
- **THEN** server SHALL hold one direct in-process reference to the single `Broadcaster` instance

#### Scenario: Remote mode uses watch RPC protocol with one subscribe per cwd
- **WHEN** running in remote mode (summoner is separate process)
- **THEN** server SHALL send `watch.start({ cwd })` RPC request to summoner exactly once per cwd (on first socket subscriber)
- **THEN** summoner SHALL call `broadcaster.subscribe(cwd, ...)` once, which covers all types
- **THEN** summoner SHALL push `watch.snapshot({ cwd, type, data })` to server for each type update
- **THEN** server SHALL send `watch.stop({ cwd })` when no sockets remain subscribed to that cwd
- **THEN** `watch.stop` SHALL cause summoner to call the unsubscribe returned by `broadcaster.subscribe()`

#### Scenario: watch.start does not cause duplicate subscriptions
- **WHEN** `watch.start({ cwd })` is received while a subscription for that cwd already exists
- **THEN** summoner SHALL NOT create a second subscription for that cwd

### Requirement: Socket events carry optional snapshot payload
Existing `EVENTS.fs.dirty`, `EVENTS.git.dirty`, `EVENTS.openspec.dirty` events SHALL gain an optional `snapshot` field carrying the complete data. The `cwd` and existing fields SHALL remain unchanged for backwards compatibility.

#### Scenario: Frontend receives snapshot without re-fetch
- **WHEN** server emits a dirty event with `snapshot` field set
- **THEN** frontend SHALL use the snapshot value directly without issuing a re-fetch request
