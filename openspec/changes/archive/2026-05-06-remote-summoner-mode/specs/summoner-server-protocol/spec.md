## ADDED Requirements

### Requirement: Protocol uses JSON-RPC 2.0 over WebSocket
All messages between remote daemon and server SHALL follow JSON-RPC 2.0 framing (omitting the `"jsonrpc":"2.0"` field on the wire for compactness, per Codex convention). Each message SHALL be a single line of JSON terminated by newline.

#### Scenario: Request/response pairing
- **WHEN** server sends a request with `id: 1` to daemon
- **THEN** daemon responds with matching `id: 1` in the response

#### Scenario: Streaming notifications
- **WHEN** a spawned process writes to stdout
- **THEN** daemon sends a notification (no `id`) with method `process/stdout` and the line content

### Requirement: Protocol defines typed methods for local operations
The protocol SHALL define the following methods:

- `process/spawn` (server→daemon): spawn a CLI process; params: `{ command, args, cwd, sessionId }`
- `process/stdin` (server→daemon): write to process stdin; params: `{ sessionId, data }`
- `process/kill` (server→daemon): terminate a process; params: `{ sessionId }`
- `process/stdout` (daemon→server, notification): process stdout line; params: `{ sessionId, line }`
- `process/exit` (daemon→server, notification): process exited; params: `{ sessionId, code }`
- `fs/read` (server→daemon): read file; params: `{ path }`
- `fs/list` (server→daemon): list files; params: `{ cwd, pattern? }`
- `git/status` (server→daemon): git status; params: `{ cwd }`
- `git/log` (server→daemon): git log; params: `{ cwd, args }`

#### Scenario: Spawn and stream
- **WHEN** server sends `process/spawn` for a claude session
- **THEN** daemon spawns the process and sends `process/stdout` notifications for each line until `process/exit`

### Requirement: Protocol types are defined in shared package
All JSON-RPC method names, request params, and response shapes SHALL be defined as TypeScript types in `packages/shared`, importable by both server and daemon.

#### Scenario: Type import
- **WHEN** server's RemoteProcessProvider or daemon's SummonerAgent imports from `@code-quest/shared`
- **THEN** both sides use the same typed definitions with no duplication
