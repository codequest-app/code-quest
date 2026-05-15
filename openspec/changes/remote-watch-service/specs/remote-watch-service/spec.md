## ADDED Requirements

### Requirement: RemoteWatchService delegates watch to summoner via RPC
In remote mode the server SHALL implement `WatchService` by delegating watch operations to the connected summoner over the existing `AgentTransport` RPC channel, so that `DirtyBroadcaster` receives fs events from the summoner's local filesystem.

#### Scenario: Subscribe triggers summoner watch
- **WHEN** server calls `RemoteWatchService.subscribe(cwd, cb)`
- **THEN** server sends a `watch/subscribe` RPC request to summoner with `{ cwd }`
- **AND** summoner starts watching that cwd with its local `LocalWatchService`

#### Scenario: Summoner pushes events to server
- **WHEN** summoner detects a filesystem event on a watched cwd
- **THEN** summoner emits `watch/event` with `{ cwd, event: WatchEvent }` to server
- **AND** server delivers the `WatchEvent` to the registered callback for that cwd

#### Scenario: Unsubscribe stops summoner watch
- **WHEN** the unsubscribe function returned by `subscribe` is called
- **THEN** server sends a `watch/unsubscribe` RPC request to summoner with `{ cwd }`
- **AND** summoner stops watching that cwd and releases the local watcher

#### Scenario: Multiple cwds are tracked independently
- **WHEN** server subscribes to two different cwds
- **THEN** each cwd has an independent watch on summoner
- **AND** events from each cwd are delivered only to the correct callback

### Requirement: Container injects correct WatchService based on mode
The server container SHALL inject `RemoteWatchService` when a remote RPC connection exists, and `LocalWatchService` when running in local mode, so that `DirtyBroadcaster` works correctly in both modes without code changes.

#### Scenario: Local mode uses LocalWatchService
- **WHEN** server starts without a remote summoner connection
- **THEN** `DirtyBroadcaster` is constructed with `LocalWatchService`

#### Scenario: Remote mode uses RemoteWatchService
- **WHEN** server starts with an active `ReconnectableRpc` connection to summoner
- **THEN** `DirtyBroadcaster` is constructed with `RemoteWatchService`

### Requirement: Summoner registers watch RPC handlers
Summoner SHALL register handlers for `watch/subscribe` and `watch/unsubscribe` RPC requests, managing a local `LocalWatchService` instance per cwd.

#### Scenario: Subscribe handler starts local watch
- **WHEN** summoner receives `watch/subscribe` request with `{ cwd }`
- **THEN** summoner subscribes to that cwd via `LocalWatchService`
- **AND** stores the unsubscribe function keyed by cwd

#### Scenario: Unsubscribe handler stops local watch
- **WHEN** summoner receives `watch/unsubscribe` request with `{ cwd }`
- **THEN** summoner calls the stored unsubscribe function for that cwd
- **AND** removes the entry from its internal map
