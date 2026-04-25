## Tasks

### 1. Add unified action

- [x] In `packages/client/src/contexts/GitContext.tsx`, add `removeWorktree(projectCwd, name, opts?: { force?: boolean; deleteBranch?: boolean })`.
- [x] Forward `opts` to `EVENTS.git.worktree.remove` unchanged.
- [x] On success, update the local `listing` cache for the project (drop the removed entry).
- [x] On error, return the error unchanged (no swallow / no rewrap).

### 2. Migrate callers

- [x] Worktree row context menu: replace `archive(projectCwd, name, { skipBranchDelete, force })` with `removeWorktree(projectCwd, name, { deleteBranch: !skipBranchDelete, force })`.
- [x] ChannelManager teardown: replace `remove(cwd, name)` with `removeWorktree(cwd, name, { force: true, deleteBranch: false })`.

### 3. Remove the alias

- [x] Delete the `archive` action from `GitContext` and from its TypeScript context type.
- [x] Delete the `remove` action from `GitContext` and from its TypeScript context type.
- [x] `tsc` is green.

### 4. Tests

- [x] Unit test: `removeWorktree` forwards `opts` verbatim to the RPC.
- [x] Unit test: `removeWorktree` updates `listing` on success.
- [x] Unit test: `removeWorktree` returns the RPC error unchanged on failure.
- [x] Regression test: `GitContext` no longer exposes an `archive` property.

### 5. Verification

- [x] `npx openspec validate worktree-archive-remove-unify --strict`.
