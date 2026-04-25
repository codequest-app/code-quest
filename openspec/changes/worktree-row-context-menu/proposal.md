## Why

F.html lists "Worktree row 的 ⋯ → context menu (open / copy path / rename / archive / delete)" as one of the missing pieces. Today the worktree row in the sidebar's project tree supports click → activate and the create-new flow, but **maintenance actions are scattered**:
- Delete worktree only reachable from the create-worktree dialog's existing-worktree list.
- Rename has no UI at all (CLI-only).
- Copy path is not exposed.
- Archive (soft-delete that keeps the branch but removes the worktree dir) doesn't exist.

The result is high discovery cost and dead-ends for normal worktree hygiene.

We have most of the building blocks:
- `LocalGitService.deleteWorktree` exists.
- `LocalGitService.listWorktrees` returns enough metadata.
- Server-side `worktree:delete` socket event is wired.
- A radix-based menu primitive is already in the codebase (used by chat tab close, branch popover, etc).
- `BranchPopover` v2 demonstrates the keyboard / search pattern for menus.

Missing: a unified context menu component on the worktree row, plus the rename / archive backends (rename is a `git branch -m` + worktree path move; archive is `git worktree remove --keep-branch`).

## What Changes

- Add **`<WorktreeRowMenu>`** opened by right-click OR a `⋯` icon button that appears on row hover. Items:
  - **Open in chat** — same as left-click (already works); included so keyboard users can discover it.
  - **Copy path** — writes worktree's absolute path to clipboard + toast confirmation.
  - **Reveal in Files pane** — switches RightPane to Files tab and seeds it with this worktree's cwd. (Future-proofed; can stub as "coming soon" if Files-pane wiring proves too coupling-y for this change.)
  - **Rename branch…** — opens a small inline `<RenameWorktreeDialog>` (radix dialog, prefilled current branch name, validates with the same regex worktree-create uses). Submits → `worktree:rename { cwd, newBranchName }`.
  - **Archive** — confirmation prompt → `worktree:archive { cwd }` removes worktree dir but keeps branch. Toast + sidebar refresh.
  - **Delete** — destructive style; confirmation prompt that explicitly says "branch will be deleted too if no other worktree references it". Calls existing `worktree:delete`.
- Add **`worktree:rename` socket event** + `LocalGitService.renameWorktree(cwd, newBranchName)` (runs `git branch -m old new`, updates worktree metadata).
- Add **`worktree:archive` socket event** + `LocalGitService.archiveWorktree(cwd)` (runs `git worktree remove --keep-branch <path>` or equivalent guard + `git worktree remove`).
- Broadcast `worktree:branchChanged` on rename, `worktree:removed` on archive/delete (already broadcast for delete; just confirm parity).

Explicitly out of scope:
- Bulk select / multi-row operations.
- Drag-reorder.
- Worktree-level git operations beyond rename/archive/delete (use the Git pane).
- Soft-undo / trash for archive — out of scope for v1; a 5-second toast undo is a future polish.

## Capabilities

### New Capabilities
- `worktree-row-menu`: per-row context menu UX in the sidebar project tree, plus the rename/archive backends it depends on.

### Modified Capabilities
- `worktree-management`: adds `rename` + `archive` actions; existing list / create / delete / checkout unchanged.

## Impact

**Affected code (new):**
- `packages/client/src/components/WorktreeRowMenu.tsx`
- `packages/client/src/components/RenameWorktreeDialog.tsx`
- `packages/client/src/components/__tests__/WorktreeRowMenu.test.tsx`
- `packages/client/src/components/__tests__/RenameWorktreeDialog.test.tsx`
- `packages/server/src/socket/handlers/worktree-rename.ts` (or extend `worktree.ts`)
- `packages/shared/src/schemas/worktree.ts` — add `WorktreeRenamePayload` / `WorktreeArchivePayload`.

**Affected code (modified):**
- `packages/client/src/components/ProjectTree.tsx` (or wherever WorktreeRow lives) — add right-click + hover-`⋯` triggers.
- `packages/summoner/src/git/local.ts` — add `renameWorktree` + `archiveWorktree`.
- `packages/summoner/src/git/types.ts` — extend `GitService` interface.
- `packages/summoner/src/test/fake-git-service.ts` — implement the new methods.
- `packages/server/src/socket/handlers/worktree.ts` — add new events.
- `packages/server/src/socket/server.ts` — already includes worktree handler; no change if extending in-place.

**Dependencies on other changes:**
- Independent of the right-pane changes.
- Reuses radix menu primitive that already lives in the codebase.

**Risk:** medium.
- **Rename**: `git branch -m` from a non-checked-out worktree may need `git -C <worktree> branch -m`. Test with simple-git carefully.
- **Archive**: deciding when to `--force` is delicate. v1 should refuse if worktree has uncommitted changes (return `dirty` error → UI confirms with the user, not silent force).
- Right-click on macOS Safari may differ; use `onContextMenu` + ensure mobile/touch fallback via the hover-`⋯` button.
- Existing tests around the project tree may need updates if we add new DOM nodes inside the row.
