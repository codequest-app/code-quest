## ADDED Requirements

### Requirement: Worktree name validation
WorktreeService SHALL validate worktree names before creation. Valid names contain only letters, numbers, dots, hyphens, and underscores. Names MUST NOT contain `..` segments, end with `.` or `.lock`, or exceed 100 characters.

#### Scenario: Valid worktree name
- **WHEN** name is "my-feature-branch"
- **THEN** validation passes

#### Scenario: Invalid characters rejected
- **WHEN** name contains `/` or spaces
- **THEN** validation throws with descriptive error message

#### Scenario: Path traversal rejected
- **WHEN** name contains ".."
- **THEN** validation throws "must not contain '..' path segments"

#### Scenario: Dangerous suffix rejected
- **WHEN** name ends with ".lock"
- **THEN** validation throws "must not end with '.' or '.lock'"

### Requirement: Worktree creation
WorktreeService SHALL create git worktrees at `<repo>/.claude/worktrees/<name>` with branch `worktree-<name>` based on `origin/<default-branch>`.

#### Scenario: Create new worktree
- **WHEN** createWorktree("feature-x") is called
- **THEN** system runs: mkdir `.claude/worktrees/`, git worktree prune, git branch -D worktree-feature-x, git worktree add -b worktree-feature-x .claude/worktrees/feature-x origin/<default-branch>

#### Scenario: Worktree already exists
- **WHEN** the path `.claude/worktrees/<name>` is already a valid git worktree
- **THEN** return the existing path without recreating

#### Scenario: Auto-generate name
- **WHEN** no name is provided
- **THEN** generate name as `claude-session-<YYYYMMDDHHmmss>`

### Requirement: Worktree listing
WorktreeService SHALL list all worktrees in the repository.

#### Scenario: List worktrees
- **WHEN** listWorktrees() is called
- **THEN** return array of `{ name, path, branch }` parsed from `git worktree list --porcelain`

### Requirement: Worktree deletion
WorktreeService SHALL remove a worktree and its branch.

#### Scenario: Delete worktree
- **WHEN** deleteWorktree("feature-x") is called
- **THEN** system runs: git worktree remove .claude/worktrees/feature-x, git branch -D worktree-feature-x

### Requirement: Worktree detection
WorktreeService SHALL detect if a given path is inside a worktree.

#### Scenario: Path is a worktree
- **WHEN** path matches `/.claude/worktrees/<name>` pattern
- **THEN** return `{ name, path }`

#### Scenario: Path is not a worktree
- **WHEN** path does not match the pattern
- **THEN** return null

### Requirement: Session worktree binding
Channel SHALL support binding to a worktree. When bound, CLI spawn uses worktree path as cwd.

#### Scenario: New session with worktree
- **WHEN** session is created with `useWorktree: true`
- **THEN** a new worktree is created and CLI is spawned with worktree path as cwd

#### Scenario: Session with existing worktree
- **WHEN** session is created with `existingWorktree: { name, path }`
- **THEN** CLI is spawned with the existing worktree path as cwd

#### Scenario: Session state includes worktree info
- **WHEN** a session is bound to a worktree
- **THEN** session state includes `worktree: { name, path }` sent to client

### Requirement: Socket events for worktree management
Server SHALL expose socket events for worktree CRUD operations.

#### Scenario: Create worktree via socket
- **WHEN** client emits `worktree:create` with `{ name? }`
- **THEN** server creates worktree and responds with `{ name, path }`

#### Scenario: List worktrees via socket
- **WHEN** client emits `worktree:list`
- **THEN** server responds with array of `{ name, path, branch }`

#### Scenario: Delete worktree via socket
- **WHEN** client emits `worktree:delete` with `{ name }`
- **THEN** server deletes worktree and responds with success

### Requirement: Worktree banner in client
Client SHALL display a banner when the active session is in a worktree.

#### Scenario: Banner visible in worktree session
- **WHEN** active session has worktree info
- **THEN** banner shows "This session is in worktree `<name>`"

#### Scenario: Banner hidden in normal session
- **WHEN** active session has no worktree
- **THEN** no worktree banner is displayed
