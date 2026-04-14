# Spec Delta: protocol (worktree-control-request)

## ADDED Requirements

### Requirement: `worktree:create` RPC SHALL be cwd-based and atomic

`worktree:create` accepts `{ cwd, name }` (no channel binding). Server SHALL:
1. Resolve `repoRoot` via `gitService.getRepoRoot(cwd)`; err if not a git repo.
2. Create worktree at `<repoRoot>/.claude/worktrees/<name>` via `gitService.createWorktree`.
3. Spawn a fresh Claude channel with `cwd = worktreePath`.
4. Broadcast `session:created` with `{ channelId, cwd: worktreePath }`.
5. On failure of steps 3+, roll back by deleting the worktree.

The response is `RpcResult<{ channelId; worktreePath }>`. Creating a worktree that continues an existing conversation (fork-to-worktree) is explicitly out of scope.

#### Scenario: worktree creation from a project opens a new tab

- GIVEN a project at `/foo` with a git repository
- WHEN client emits `worktree:create { cwd: '/foo', name: 'feature-x' }`
- THEN server SHALL create the worktree at `/foo/.claude/worktrees/feature-x`
- AND spawn a fresh Claude session in that cwd
- AND broadcast `session:created` with `cwd: /foo/.claude/worktrees/feature-x`
- AND client SHALL show the new session in a tab with WorktreeBanner visible

#### Scenario: worktree creation rejects non-git cwd

- GIVEN `cwd = '/tmp/scratch'` that is not inside a git repository
- WHEN client emits `worktree:create { cwd: '/tmp/scratch', name: 'x' }`
- THEN server SHALL respond `{ ok: false, error: /not inside a git repository/ }`
- AND SHALL NOT broadcast `session:created`

#### Scenario: rollback on spawn failure

- GIVEN worktree creation succeeds but channel spawn fails
- WHEN the server handler catches the spawn error
- THEN it SHALL call `gitService.deleteWorktree` to remove the newly-created worktree
- AND return `{ ok: false, error: <reason> }` to the caller

### Requirement: Sessions SHALL be grouped by `projectRoot` (git common-dir) in the UI

The server SHALL compute `projectRoot` via `gitService.getProjectRoot(cwd)` (based on `git rev-parse --git-common-dir`) when creating a channel, and persist it on `SessionSummary`. The client ProjectContext SHALL group sessions by `projectRoot`, falling back to `cwd` when `projectRoot` is null.

#### Scenario: worktree session groups under the same project as main working tree

- GIVEN a session with `cwd: '/foo'` and `projectRoot: '/foo'`
- AND a session with `cwd: '/foo/.claude/worktrees/feat-x'` and `projectRoot: '/foo'`
- WHEN the client builds the Project list
- THEN both sessions SHALL appear under a single Project entry keyed `/foo`

#### Scenario: non-git cwd falls back to cwd as project identity

- GIVEN a session with `cwd: '/tmp/scratch'` where `projectRoot` is null (not a git repo)
- WHEN the client builds the Project list
- THEN the session SHALL appear under a Project entry keyed `/tmp/scratch`
