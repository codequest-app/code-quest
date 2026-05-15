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

### Requirement: Broadcaster manages per-cwd subscriptions and pushes complete values
`Broadcaster<T>` SHALL manage a map of cwd → `{ source: DataSource<T>, lastValue: T | null, subs }`. Each cwd SHALL have at most one `DataSource<T>` instance (lazily created on first subscribe).

#### Scenario: New subscriber receives current value immediately
- **WHEN** a new subscriber calls `subscribe(cwd, id, cb)`
- **THEN** if `lastValue` is cached, cb SHALL be called synchronously with the cached value
- **THEN** if no `lastValue` exists, a `read()` SHALL be initiated and cb called when resolved

#### Scenario: All subscribers receive updated value on data change
- **WHEN** the DataSource's `onChange` fires
- **THEN** `Broadcaster` SHALL call `source.read()` and push the result to all active subscribers for that cwd

#### Scenario: Last subscriber unsubscribes cleans up DataSource
- **WHEN** the last subscriber for a given cwd unsubscribes
- **THEN** `Broadcaster` SHALL remove the cwd entry (source, lastValue, subs)

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

### Requirement: Broadcaster resides in summoner for both local and remote mode
The three `Broadcaster` instances (files, git, openspec) SHALL be created and managed in the summoner process. WatchService and DataSource reads SHALL always execute on the machine where files reside.

#### Scenario: Local mode server accesses Broadcaster in-process
- **WHEN** running in local mode (server embeds summoner)
- **THEN** server SHALL hold direct in-process references to the Broadcaster instances

#### Scenario: Remote mode uses watch RPC protocol
- **WHEN** running in remote mode (summoner is separate process)
- **THEN** server SHALL send `watch.start({ cwd })` RPC request to summoner on first socket subscriber
- **THEN** summoner SHALL push `watch.snapshot({ cwd, type, data })` to server on each Broadcaster update
- **THEN** server SHALL forward snapshot data to all sockets subscribed to that cwd
- **THEN** server SHALL send `watch.stop({ cwd })` when no sockets remain subscribed to that cwd

### Requirement: Socket events carry optional snapshot payload
Existing `EVENTS.fs.dirty`, `EVENTS.git.dirty`, `EVENTS.openspec.dirty` events SHALL gain an optional `snapshot` field carrying the complete data. The `cwd` and existing fields SHALL remain unchanged for backwards compatibility.

#### Scenario: Frontend receives snapshot without re-fetch
- **WHEN** server emits a dirty event with `snapshot` field set
- **THEN** frontend SHALL use the snapshot value directly without issuing a re-fetch request
