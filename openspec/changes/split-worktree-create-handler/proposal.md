## Why

`packages/server/src/socket/handlers/worktree.ts` `handleCreate` mixes four responsibilities — git-repo validation, worktree filesystem creation, channel spawning, and rollback on failure — in a single ~55-line function with three nested `try` blocks. This makes the happy-path hard to read and the rollback path easy to forget when a future branch or failure mode is added.

## What Changes

- Split `handleCreate` into named steps:
  - `resolveProjectRoot(cwd)` — returns main-repo root or fails with a clear error.
  - `spawnChannelInWorktree(projectRoot, name, socket)` — creates the worktree, registers the channel, broadcasts `session:created`. Encapsulates the rollback (`gitService.deleteWorktree`) when channel spawn throws.
  - `handleCreate` becomes the orchestration layer: parse payload → resolveProjectRoot → spawnChannelInWorktree → callback.
- No change to public socket API (`worktree:create` payload + response unchanged).
- No change to other handlers in the file (`handleList`, `handleDelete`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `protocol`: internal refactor of the `worktree:create` handler; observable protocol behaviour is unchanged but the rollback invariant is now explicitly expressed.

## Impact

- Affected file: `packages/server/src/socket/handlers/worktree.ts`.
- Test file: `packages/server/src/__tests__/worktree.test.ts` (existing cases must stay green; no `expect` modifications).
- No client / shared / summoner changes.
