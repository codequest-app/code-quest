## ADDED Requirements

### Requirement: Unified Watch Package
`@code-quest/watch` package SHALL export the `WatchService` interface, `LocalWatchService`, and `RemoteWatchService`.

#### Scenario: Local mode
WHEN a DataSource imports `@code-quest/watch`
THEN it SHALL use `LocalWatchService` backed by chokidar

#### Scenario: Remote mode
WHEN a DataSource imports `@code-quest/watch`
THEN it SHALL use `RemoteWatchService` that delegates watch events to summoner via RPC

### Requirement: Single Watcher Per CWD
`LocalWatchService` SHALL share one underlying chokidar watcher per cwd across all subscribers.

#### Scenario: Multiple subscribers same cwd
WHEN multiple DataSources subscribe to the same cwd
THEN LocalWatchService SHALL open exactly one chokidar watcher for that cwd
AND fan-out events to all subscribers
