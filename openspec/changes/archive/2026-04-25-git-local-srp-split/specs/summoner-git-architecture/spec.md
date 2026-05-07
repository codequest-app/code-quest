## ADDED Requirements

### Requirement: `LocalGitService` is a thin facade over `GitCommands` and `GitWorktreeOps`

`packages/summoner/src/git/local.ts` SHALL contain only the `LocalGitService` class implementing `IGitService`. It MUST compose two helper classes — `GitCommands` (from `commands.ts`) and `GitWorktreeOps` (from `worktree.ts`) — and implement every `IGitService` method as a one-line delegation (arrow-method form) to one of them.

#### Scenario: Plain git commands route through `GitCommands`
- **WHEN** a consumer calls `localGitService.status(cwd)` (or `checkout` / `log` / `diff` / `add` / `commit` / `push` / `fetch` / `pull` / `discardFile` / `initRepo` / `listBranches` / `getRepoRoot` / `getProjectRoot`)
- **THEN** the call is delegated to the matching method on the composed `GitCommands` instance and returns its result unchanged

#### Scenario: Worktree operations route through `GitWorktreeOps`
- **WHEN** a consumer calls `localGitService.createWorktree` / `listWorktrees` / `deleteWorktree` / `renameWorktree` / `archiveWorktree`
- **THEN** the call is delegated to the matching method on the composed `GitWorktreeOps` instance, including the `.claude/worktrees/<slug>` path conventions and slug helpers (`branchToSlug`, `generateWorktreeName`)

### Requirement: Shared simple-git helpers live in `git-runner.ts`

`createGit(cwd?)` and `rawGit(git, args)` SHALL live in `packages/summoner/src/git/git-runner.ts` as a stateless utility module. Both `GitCommands` and `GitWorktreeOps` MUST import them — neither subclass duplicates the simple-git invocation pattern.

#### Scenario: Subclass invokes git
- **WHEN** `GitCommands` or `GitWorktreeOps` needs to run a git command
- **THEN** it imports `createGit` and/or `rawGit` from `git-runner.ts` rather than defining its own copy

### Requirement: Public surface is unchanged

The `IGitService` interface and the `LocalGitService` constructor's role as the single bound implementation SHALL remain byte-for-byte unchanged. Consumers, DI bindings in `packages/server/src/container.ts`, socket event names (including `archive`), and the `summoner/src/index.ts` re-exports of `detectWorktree` and `validateWorktreeName` MUST NOT require modification as part of this change.

#### Scenario: Existing consumer compiles without modification
- **WHEN** the refactor lands
- **THEN** every existing `IGitService` consumer compiles and runs without any code change, and `container.ts` bindings are not modified
