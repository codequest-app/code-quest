## ADDED Requirements

### Requirement: Server supports REMOTE_MODE environment variable
Server SHALL read `REMOTE_MODE` from the environment at startup. Accepted values are `local` (default) and `remote`. In `local` mode the server SHALL bind `ChildProcessProvider`, `LocalFilesystemService`, and `LocalGitService` via DI, preserving current behaviour exactly. In `remote` mode the server SHALL bind their remote counterparts.

#### Scenario: Default local mode
- **WHEN** `REMOTE_MODE` is unset or set to `local`
- **THEN** server starts with `ChildProcessProvider` bound and behaves identically to the current implementation

#### Scenario: Remote mode activated
- **WHEN** `REMOTE_MODE=remote`
- **THEN** server binds `RemoteProcessProvider`, `RemoteFilesystemService`, `RemoteGitService` and opens the `/summoner` WS endpoint

### Requirement: REMOTE_TOKEN is required in remote mode
When `REMOTE_MODE=remote`, server SHALL require `REMOTE_TOKEN` to be set. If absent, server SHALL fail to start with a clear error message.

#### Scenario: Missing token in remote mode
- **WHEN** `REMOTE_MODE=remote` but `REMOTE_TOKEN` is not set
- **THEN** server throws at startup: "REMOTE_TOKEN is required when REMOTE_MODE=remote"
