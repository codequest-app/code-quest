## ADDED Requirements

### Requirement: Unified Git Package
`@code-quest/git` package SHALL export `LocalGitService` and `RemoteGitService`, both implementing the `GitService` interface from `@code-quest/schemas`.

#### Scenario: Local mode
WHEN summoner imports `@code-quest/git`
THEN it SHALL use `LocalGitService` backed by git CLI commands

#### Scenario: Remote mode
WHEN server imports `@code-quest/git`
THEN it SHALL use `RemoteGitService` backed by RPC calls to summoner
