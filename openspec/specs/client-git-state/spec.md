# client-git-state Specification

## Purpose
TBD - created by archiving change worktree-archive-remove-unify. Update Purpose after archive.
## Requirements
### Requirement: GitContext SHALL expose a single removeWorktree action

`GitContext` SHALL expose exactly one worktree-removal action, `removeWorktree(projectCwd, name, opts?: { force?: boolean; deleteBranch?: boolean })`, which calls `EVENTS.git.worktree.remove`. The legacy `archive` and `remove` aliases SHALL NOT be present on the context value.

#### Scenario: Options forwarded to the RPC

- **WHEN** a caller invokes `removeWorktree(projectCwd, name, { force: true, deleteBranch: false })`
- **THEN** the `EVENTS.git.worktree.remove` RPC is called with `{ force: true, deleteBranch: false }` (or the equivalent payload field names) unchanged

#### Scenario: Local listing updated on success

- **WHEN** `removeWorktree` resolves successfully for `(projectCwd, name)`
- **THEN** the local `listing` cache for `projectCwd` no longer contains an entry whose name equals `name`

#### Scenario: RPC error returned unchanged

- **WHEN** the underlying RPC rejects with an error `E`
- **THEN** `removeWorktree` rejects with the same error `E` AND the local `listing` cache is not modified

#### Scenario: No archive alias remains

- **WHEN** test code reads `gitContext.archive` or `gitContext.remove`
- **THEN** the value is `undefined` and the TypeScript type does not declare these properties

