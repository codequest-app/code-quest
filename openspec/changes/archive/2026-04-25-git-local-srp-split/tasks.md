## Tasks

### 1. Extract shared runner helpers
- [x] Create `packages/summoner/src/git/git-runner.ts` exporting `createGit(cwd?)` and `rawGit(git, args)` (the two simple-git helpers shared by both subclasses).

### 2. Extract `GitCommands`
- [x] Create `packages/summoner/src/git/commands.ts` with `GitCommands` class.
- [x] Move `status`, `checkout`, `log`, `diff`, `add`, `commit`, `push`, `fetch`, `pull`, `discardFile`, `getRepoRoot`, `getProjectRoot`, `initRepo`, `listBranches` from `local.ts` into `GitCommands` (private `checkoutWithFallback` moves with `checkout`).
- [x] Keep behavior identical; no signature changes.

### 3. Extract `GitWorktreeOps`
- [x] Create `packages/summoner/src/git/worktree.ts` with `GitWorktreeOps` class; constructor takes `GitCommands` (used for `getRepoRoot` precondition checks).
- [x] Move `createWorktree`, `listWorktrees`, `deleteWorktree`, `renameWorktree`, `archiveWorktree` plus path conventions (`.claude/worktrees/<slug>`), `branchToSlug`, `generateWorktreeName`, `isExistingWorktree`, `addWorktree`, `getDefaultBranch`, `parseWorktreeList`, `WORKTREE_PATH_RE` into the file.
- [x] Re-export `validateWorktreeName` and `detectWorktree` from `worktree.ts` (keep `summoner/src/index.ts` import path working).
- [x] Keep behavior identical; no signature changes.

### 4. Reduce `local.ts` to a facade
- [x] `LocalGitService` instantiates `GitCommands` and `GitWorktreeOps` as private fields.
- [x] Implement `IGitService` methods as arrow-method delegations (e.g. `status = (cwd) => this.commands.status(cwd)`).
- [x] Re-export `detectWorktree` and `validateWorktreeName` from `local.ts` so `summoner/src/index.ts` re-export path is unchanged.
- [x] Verify `IGitService` is byte-for-byte unchanged.

### 5. Verification
- [x] `pnpm -F summoner test` green (407 passed).
- [x] `pnpm -F server test` green (590 passed).
- [x] `pnpm -F client test` green (1618 passed).
- [ ] `npx openspec validate git-local-srp-split --strict`.

### Out of scope
- `error-codes.ts` extraction (originally planned). The typed-error patterns are operation-specific one-liners (push: 2, pull: 2, archive: 1) with no shared dictionary; extracting moves 1-line regex one indirection away with no readability gain. Same anti-pattern as the rejected `defineGitHandler` wrapper. Inline regex stays in the relevant `GitCommands` / `GitWorktreeOps` methods.
