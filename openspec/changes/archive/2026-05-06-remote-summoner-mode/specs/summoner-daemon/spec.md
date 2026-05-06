## ADDED Requirements

### Requirement: Summoner daemon connects to server
Summoner daemon SHALL connect to the server's `/summoner` WebSocket endpoint on startup, authenticating with a Bearer token from its config. The connection SHALL be long-lived and the daemon SHALL remain running until explicitly stopped.

#### Scenario: Successful connection
- **WHEN** daemon starts with valid `--server` URL and `--token`
- **THEN** daemon establishes WS connection to server's `/summoner` endpoint and logs "connected"

#### Scenario: Invalid token rejected
- **WHEN** daemon starts with an invalid token
- **THEN** server rejects the WS handshake with 401, daemon logs the error and exits

### Requirement: Daemon handles local operation requests from server
Daemon SHALL receive JSON-RPC requests from server and execute them using local services (ChildProcessProvider, FilesystemService, GitService), returning results via JSON-RPC response.

#### Scenario: Spawn process request
- **WHEN** server sends a `process/spawn` JSON-RPC request
- **THEN** daemon spawns the requested CLI process locally and begins streaming stdout/stderr events back to server

#### Scenario: File read request
- **WHEN** server sends a `fs/read` JSON-RPC request with a file path
- **THEN** daemon reads the file from local filesystem and returns content in the JSON-RPC response

### Requirement: Daemon is started manually by the user
Daemon SHALL be invokable as a standalone Node.js script with `--server` and `--token` CLI arguments. No auto-start or installer is required in this phase.

#### Scenario: CLI argument parsing
- **WHEN** daemon is invoked with `--server wss://example.com --token abc123`
- **THEN** daemon reads those values and uses them for the connection
