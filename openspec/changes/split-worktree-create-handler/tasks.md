## 1. Baseline

- [x] 1.1 Run `pnpm --filter @code-quest/server exec vitest run src/__tests__/worktree.test.ts` and record the green baseline.

## 2. Extract steps

- [x] 2.1 Introduce `resolveProjectRoot(cwd: string): Promise<string | null>` private to the factory.
- [x] 2.2 Introduce `spawnChannelInWorktree(projectRoot, info, socket)` that:
  - takes a freshly-created `WorktreeInfo` (caller owns `createWorktree` so its distinct `'Failed to create worktree'` error stays at the same conceptual failure point)
  - calls `channelManager.create(...)` + `emitter.broadcastAll('session:created', …)` on success
  - on `channelManager.create` failure calls `gitService.deleteWorktree(projectRoot, info.name)` (logging rollback failure with the existing message) and re-throws the original error
  - returns `{ channelId, worktreePath }` on success

## 3. Rewire `handleCreate`

- [x] 3.1 Reduce `handleCreate` to parse → resolveProjectRoot (early err) → spawnChannelInWorktree (try/catch for callback) → `ok`.
- [x] 3.2 Ensure `errMsg(e, 'Failed to create worktree')` and `errMsg(e, 'Failed to spawn channel in new worktree')` are emitted at the same conceptual failure points as before.

## 4. Verification

- [x] 4.1 Re-run `worktree.test.ts`. All existing cases green, no `expect` modified.
- [x] 4.2 Run full server suite `pnpm --filter @code-quest/server exec vitest run`.
- [x] 4.3 Manually read the rewritten `handleCreate` and confirm it fits ≤15 lines of orchestration.
