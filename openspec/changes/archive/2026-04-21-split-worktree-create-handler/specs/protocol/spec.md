## ADDED Requirements

### Requirement: `worktree:create` handler isolates rollback in a dedicated step

The server handler for `worktree:create` SHALL separate three responsibilities into named functions:
1. Project-root resolution (`resolveProjectRoot`) — rejects with a clear error when `cwd` is not inside a git repo.
2. Worktree + channel spawn (`spawnChannelInWorktree`) — creates the worktree on disk, creates the channel, broadcasts `session:created`, and on spawn failure MUST delete the freshly-created worktree to prevent orphaned filesystem state.
3. Top-level orchestration in `handleCreate` — parses the payload, composes the steps, and returns the callback with `ok`/`err`.

#### Scenario: Spawn failure triggers worktree rollback

- **WHEN** `gitService.createWorktree` succeeds but `channelManager.create` throws
- **THEN** `gitService.deleteWorktree` is called with the freshly-created worktree name
- **AND** the callback receives an `err(...)` describing the spawn failure

#### Scenario: Non-git cwd rejected before any filesystem mutation

- **WHEN** `cwd` is not inside a git repository
- **THEN** `gitService.createWorktree` is NOT called
- **AND** the callback receives `err('Not inside a git repository')`

#### Scenario: Happy path returns channel id and worktree path

- **WHEN** payload is valid, `cwd` is inside a repo, and both worktree creation and channel spawn succeed
- **THEN** the callback receives `ok({ channelId, worktreePath })`
- **AND** `session:created` is broadcast with the channel id, worktree cwd, and project root
