## Requirements

### Requirement: RemoteProcessProvider implements ProcessProvider
`RemoteProcessProvider` SHALL implement the `ProcessProvider` interface from `@code-quest/summoner`, proxying `spawn` and `runOnce` calls to the connected remote daemon via the WS RPC protocol.

#### Scenario: Spawn delegates to daemon
- **WHEN** `RemoteProcessProvider.spawn(command, args, options)` is called
- **THEN** it sends a `process/spawn` JSON-RPC request to daemon and returns a `ProcessHandle` whose `lines` async iterable yields lines from `process/stdout` notifications

#### Scenario: No daemon connected
- **WHEN** `spawn` or `runOnce` is called but no remote daemon is connected
- **THEN** it throws an error: "No remote daemon connected"

### Requirement: RemoteFilesystemService implements FilesystemService
`RemoteFilesystemService` SHALL implement `FilesystemService`, proxying `read` and `listFiles` to daemon via `fs/read` and `fs/list` RPC calls.

#### Scenario: File read proxied
- **WHEN** `RemoteFilesystemService.read(path)` is called
- **THEN** it sends `fs/read` to daemon and returns the file content from the response

### Requirement: RemoteGitService implements GitService
`RemoteGitService` SHALL implement `GitService`, proxying git operations to daemon via `git/status` and `git/log` RPC calls.

#### Scenario: Git status proxied
- **WHEN** `RemoteGitService.status(cwd)` is called
- **THEN** it sends `git/status` to daemon and returns the parsed result

### Requirement: Server manages summoner WS connection lifecycle
Server SHALL expose a `/summoner` WebSocket endpoint. When a daemon connects with a valid token, server SHALL store the connection and make it available to the remote service implementations. Only one daemon connection is supported at a time (single-user).

#### Scenario: Daemon connects
- **WHEN** daemon connects to `/summoner` with valid Bearer token
- **THEN** server stores the WS connection and logs "remote daemon connected"

#### Scenario: Daemon disconnects
- **WHEN** the daemon WS connection closes
- **THEN** server logs "remote daemon disconnected" and any subsequent remote calls throw until daemon reconnects
