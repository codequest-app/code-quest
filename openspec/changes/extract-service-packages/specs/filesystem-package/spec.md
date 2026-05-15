## ADDED Requirements

### Requirement: Unified Filesystem Package
`@code-quest/filesystem` package SHALL export `LocalFilesystemService` and `RemoteFilesystemService`, both implementing the `FilesystemService` interface from `@code-quest/schemas`.

#### Scenario: Local mode
WHEN summoner imports `@code-quest/filesystem`
THEN it SHALL use `LocalFilesystemService` backed by Node.js fs APIs

#### Scenario: Remote mode
WHEN server imports `@code-quest/filesystem`
THEN it SHALL use `RemoteFilesystemService` backed by RPC calls to summoner
