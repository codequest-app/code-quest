## Strategy

Hard-cut migration. No alias layer. Each event rename is one commit-able unit; tsc + tests guard against missed consumers.

Order: shared schemas → server handler → client consumers → delete dead code → verify.

## 1. Shared — new event map + payload schemas
- [x] 1.1 Add nested `EVENTS.git.worktree.{list,add,remove,rename}` + flatten the rest under `EVENTS.git.*` (init / branches / checkout / status / statusSummary / diff / log / stageAll / commit / push).
- [x] 1.2 Move worktree payload/result schemas from `schemas/worktree.ts` into `schemas/git.ts`; add `gitInitPayload/Result`, `gitBranchesPayload/Result`, `gitStatusSummaryResult` schemas.
- [x] 1.3 Re-export from `schemas/index.ts`; update `socket-events.ts` `ClientToServerEvents` interface.
- [x] 1.4 Delete `schemas/worktree.ts` AFTER all consumers migrated (last step).
- [x] 1.5 `pnpm --filter @code-quest/shared exec tsc --noEmit` green.

## 2. Server git handler — absorb worktree ops (TDD)
- [x] 2.1 Red: extend git handler test — add cases for `git:worktree:list/add/remove/rename`, `git:init`, `git:branches`, `git:statusSummary`, plus renamed `git:status / diff`. Use existing fake services.
- [x] 2.2 Green: copy worktree handler ops into git handler; rename event registrations; preserve broadcast semantics (worktree:added etc still broadcast — those are server→client events, unchanged).
- [x] 2.3 Server tsc green; vitest green except worktree.test.ts which gets deleted in 2.4.
- [x] 2.4 Delete `handlers/worktree.ts` + its test file; remove `worktree.create(ctx)` from server.ts.

## 3. Client — useGitStatus, useGitWrites, GitPane
- [x] 3.1 `useGitStatus`: `EVENTS.git.statusByCwd` → `EVENTS.git.status`.
- [x] 3.2 `GitPane`: same; also `EVENTS.git.diffByCwd` → `EVENTS.git.diff`.
- [x] 3.3 Run client tests for these — green.

## 4. Client — Rename WorktreeContext → GitContext + migrate consumers (TDD)

**Why rename**: handler is now `git:*` namespace; context name should match.
Actions span all git ops (init / branches / checkout / status / worktree CRUD)
— "WorktreeContext" undersells.

- [x] 4.1 (in progress) Rename event refs inside the context — done as part of step 1-3.
- [x] 4.2 Rename file: `contexts/WorktreeContext.tsx` → `contexts/GitContext.tsx`.
- [x] 4.3 Rename exports: `WorktreeProvider` → `GitProvider`; `useWorktreeState/Actions` → `useGitState/Actions`; `WorktreeStateContext/ActionsContext` → `GitStateContext/ActionsContext`.
- [x] 4.4 Keep state field `listing` as-is (still semantically "worktree listing per project", which IS git state).
- [x] 4.5 Migrate consumers (grep `useWorktree` / `WorktreeProvider` / `WorktreeContext`): WorktreeChildList, ProjectTree, RemoveWorktreeConfirmDialog, RenameWorktreeDialog, ArchiveWorktreeConfirmDialog, BranchPopover callers, App root, all test wrappers.
- [x] 4.6 Rename test file `contexts/__tests__/WorktreeContext.test.tsx` → `GitContext.test.tsx`.
- [x] 4.7 Run all client tests — green.

## 5. Channel-scoped variant removal
- [x] 5.1 Audit (2026-04-24): **zero production callers**. Only `server/__tests__/git.test.ts` (6 cases) calls them.
- [x] 5.2 Delete the 6 test cases (or rewrite to call `git:status({cwd})` etc).
- [x] 5.3 Remove channel-variant event handlers from server git.ts.
- [x] 5.4 Remove from shared EVENTS map + ClientToServerEvents.
- [x] 5.5 Rename `git:statusByCwd` → `git:status` and `git:diffByCwd` → `git:diff`.

## 6. Final cleanup
- [x] 6.1 Delete `schemas/worktree.ts`; remove from index.ts.
- [x] 6.2 Search for any stale `worktree:` event string — should be zero.
- [x] 6.3 `pnpm exec biome check --write` + tsc all packages.

## 7. Verify + commit
- [x] 7.1 client + server + shared tsc green.
- [x] 7.2 client + server vitest green.
- [x] 7.3 Single commit (or per-step commits if reviewable).

## 8. Bonus: stageAll → add (CLI parity)
- [x] 8.1 Schema: rename `gitStageAllPayload/Result` → `gitAddPayload/Result`; add optional `paths?: string[]` (omit = `git add -A`).
- [x] 8.2 EVENTS: `git:stageAll` → `git:add`.
- [x] 8.3 GitService: rename `stageAll(cwd)` → `add(cwd, paths?)` on interface + Local + Fake.
- [x] 8.4 Server git handler: rename event registration + delegate to `add()`.
- [x] 8.5 Client GitPane: rename rpc call; UI label stays "Stage all".
- [x] 8.6 Tests updated (preserve assertions per "expect 不變或等價").
