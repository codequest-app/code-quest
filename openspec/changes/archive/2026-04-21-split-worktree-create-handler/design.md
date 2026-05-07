## Context

`handleCreate` in `apps/server/src/socket/handlers/worktree.ts` currently runs three I/O steps with interleaved error paths:

1. `gitService.getProjectRoot(cwd)` (guard).
2. `gitService.createWorktree(projectRoot, name)` inside one `try`.
3. `channelManager.create(...)` + `emitter.broadcastAll(...)` inside a second `try`, whose `catch` calls `gitService.deleteWorktree` (rollback) wrapped in a third `try`.

Rollback belongs to step 2's lifetime — the worktree is only "owned" between its creation and the channel's successful spawn — but is currently expressed as a cross-step `catch` block in the orchestration function. Adding a new step (e.g. recording the worktree in a metadata store) risks forgetting to expand the rollback path.

## Goals / Non-Goals

**Goals:**
- Make rollback ownership obvious: the same function that creates the worktree owns its cleanup on spawn failure.
- Shrink `handleCreate` to ≤15 lines of orchestration.
- Preserve observable behaviour: callback payloads, log messages, broadcast events all identical.

**Non-Goals:**
- Changing the protocol or payload schemas.
- Touching `handleList` / `handleDelete` / emitter wiring.
- Introducing a transactional abstraction or generic rollback helper.

## Decisions

### Extract `spawnChannelInWorktree(projectRoot, name, socket)` that owns the worktree lifecycle

The function creates the worktree, attempts the channel spawn, and on failure calls `gitService.deleteWorktree` before re-throwing (or returning an error shape). This makes the "created worktree must be cleaned up on spawn failure" invariant local to one function.

- Alternative — extract a generic `withRollback(create, commit, rollback)` helper. Rejected: only one call site, premature abstraction.

### Extract `resolveProjectRoot(cwd): Promise<string | null>`

Thin wrapper around `gitService.getProjectRoot(cwd).catch(() => null)`. Named for intent; `handleCreate` now reads "resolve project root; if null, err; else spawn".

### Keep orchestration flat with early returns

`handleCreate` becomes:
1. Parse payload (early err).
2. Resolve project root (early err).
3. Spawn (early err).
4. Return ok.

No nested try/catch in the orchestrator.

## Risks / Trade-offs

- [Log drift] Log messages inside rollback currently read `'Worktree rollback failed after spawn error'`. → Keep the exact string; add a regression test only if an existing one already asserts on it (it does not, per current test file).
- [Error message drift] `errMsg(e, '…')` prefixes are user-visible via the callback. → Preserve prefixes byte-for-byte.

## Migration Plan

Internal refactor. No flag, no migration. Single PR.

## Open Questions

None.
