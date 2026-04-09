## ADDED Requirements

### Requirement: GitService interface SHALL define git and worktree operations

GitService interface SHALL provide async methods for git operations (`status`, `checkout`, `log`, `diff`) and worktree operations (`getRepoRoot`, `createWorktree`, `listWorktrees`, `deleteWorktree`). All methods SHALL accept `cwd` or `repoRoot` as parameter and return Promise.

#### Scenario: Handler uses GitService instead of direct simple-git calls
- **WHEN** git handler processes `git:status` event
- **THEN** it calls `GitService.status(cwd)` instead of `createGit(cwd).status()`

#### Scenario: Worktree handler uses GitService
- **WHEN** worktree handler processes `worktree:create` event
- **THEN** it calls `GitService.createWorktree(repoRoot)` instead of standalone `createWorktree()` function

### Requirement: status SHALL return branch, clean state, and changed files

`status(cwd)` SHALL return `Promise<GitStatusResult>` with current branch name, clean state, and list of changed files.

#### Scenario: Clean repo
- **WHEN** `await status('/repo')` is called on a clean repo
- **THEN** it resolves with `{ branch: 'main', isClean: true, changedFiles: [] }`

#### Scenario: Dirty repo
- **WHEN** `await status('/repo')` is called with uncommitted changes
- **THEN** it resolves with `isClean: false` and `changedFiles` containing the modified files

#### Scenario: Not a git repo
- **WHEN** `await status('/not-a-repo')` is called
- **THEN** it throws an error

### Requirement: checkout SHALL switch branches with fallback strategies

`checkout(cwd, branch)` SHALL attempt checkout with fallback: direct → fetch+checkout → --track origin.

#### Scenario: Local branch exists
- **WHEN** `await checkout('/repo', 'feature-x')` is called and branch exists locally
- **THEN** it switches to the branch

#### Scenario: Remote branch only
- **WHEN** `await checkout('/repo', 'feature-x')` is called and branch exists only on remote
- **THEN** it fetches and tracks the remote branch

#### Scenario: Branch not found
- **WHEN** `await checkout('/repo', 'nonexistent')` is called
- **THEN** it throws an error

### Requirement: log SHALL return commit history

`log(cwd, limit?)` SHALL return `Promise<GitLogResult>` with commit entries.

#### Scenario: Default limit
- **WHEN** `await log('/repo')` is called without limit
- **THEN** it resolves with up to 20 entries

#### Scenario: Custom limit
- **WHEN** `await log('/repo', 5)` is called
- **THEN** it resolves with up to 5 entries

### Requirement: diff SHALL return working tree diff

`diff(cwd)` SHALL return `Promise<GitDiffResult>` with the diff string.

#### Scenario: Has changes
- **WHEN** `await diff('/repo')` is called with uncommitted changes
- **THEN** it resolves with `{ diff: '...' }` containing the diff output

#### Scenario: No changes
- **WHEN** `await diff('/repo')` is called on a clean repo
- **THEN** it resolves with `{ diff: '' }`

### Requirement: getRepoRoot SHALL find git repository root

`getRepoRoot(cwd)` SHALL return the root path of the git repository, or null if not in a repo.

#### Scenario: Inside a repo
- **WHEN** `await getRepoRoot('/repo/src')` is called inside a git repo
- **THEN** it resolves with the repo root path (e.g., `/repo`)

#### Scenario: Not inside a repo
- **WHEN** `await getRepoRoot('/tmp/no-repo')` is called outside any git repo
- **THEN** it resolves with `null`

### Requirement: createWorktree SHALL create git worktree with branch

`createWorktree(repoRoot, name?)` SHALL create a worktree at `.claude/worktrees/<name>` with a branch `worktree-<name>`.

#### Scenario: Create with auto-generated name
- **WHEN** `await createWorktree('/repo')` is called without name
- **THEN** it creates a worktree with a generated name and returns `WorktreeInfo`

#### Scenario: Create with explicit name
- **WHEN** `await createWorktree('/repo', 'my-task')` is called
- **THEN** it creates worktree at `.claude/worktrees/my-task` with branch `worktree-my-task`

#### Scenario: Invalid name
- **WHEN** `await createWorktree('/repo', '../bad')` is called
- **THEN** it throws a validation error

### Requirement: listWorktrees SHALL list managed worktrees

`listWorktrees(repoRoot)` SHALL return only worktrees under `.claude/worktrees/`.

#### Scenario: Has worktrees
- **WHEN** `await listWorktrees('/repo')` is called with existing worktrees
- **THEN** it resolves with array of `WorktreeInfo` objects

#### Scenario: No worktrees
- **WHEN** `await listWorktrees('/repo')` is called with no worktrees
- **THEN** it resolves with `[]`

### Requirement: deleteWorktree SHALL remove worktree and branch

`deleteWorktree(repoRoot, name)` SHALL remove the worktree directory and its associated branch.

#### Scenario: Delete existing worktree
- **WHEN** `await deleteWorktree('/repo', 'my-task')` is called
- **THEN** it removes the worktree and deletes branch `worktree-my-task`

#### Scenario: Invalid name
- **WHEN** `await deleteWorktree('/repo', '../bad')` is called
- **THEN** it throws a validation error

### Requirement: GitService SHALL be injectable via DI container

Server SHALL bind `GitService` in the DI container. Handlers SHALL receive it through `HandlerContext`.

#### Scenario: Server passes GitService to handlers
- **WHEN** server registers git and worktree handlers
- **THEN** both receive the same GitService instance from the container

### Requirement: FakeGitService SHALL allow test control of git state

FakeGitService SHALL provide setup methods to control branch, status, worktree list, etc. for testing.

#### Scenario: Test sets branch and status
- **WHEN** test calls `fakeGit.setBranch('main')` and `fakeGit.setClean(true)`
- **THEN** `await fakeGit.status(cwd)` returns `{ branch: 'main', isClean: true, changedFiles: [] }`

#### Scenario: Test adds worktree
- **WHEN** test calls `fakeGit.addWorktree({ name: 'wt-1', path: '/repo/.claude/worktrees/wt-1' })`
- **THEN** `await fakeGit.listWorktrees(repoRoot)` includes that worktree
