## Why

`worktree-row-context-menu` shipped the right-click trigger + menu UI; Rename and Archive items show a "coming soon" toast. This change wires the backends so those items work.

The two operations have non-obvious semantics; we lock them down here:

- **Rename = rename the branch.** Run `git -C <worktree> branch -m <newName>`. The worktree directory keeps its name (preserves filesystem paths used by sessions / logs / settings). Branch ref is updated; subsequent `git status` reflects the new name.
- **Archive = remove the worktree, keep the branch.** Run `git worktree remove <path>` (refuse if dirty unless user confirms force). The branch ref stays, so `git worktree add` can recreate it later.

These are intentionally narrow; they avoid the harder questions ("rename worktree dir" → moving paths breaks every open session reference; "archive to .archive" → introduces a new convention with no precedent).

## What Changes

- Add **`renameWorktree(cwd, newBranchName)`** + **`archiveWorktree(cwd, { force })`** to `GitService` interface; implement on `LocalGitService` (simple-git) and `FakeGitService`.
- Add socket events **`worktree:rename`** + **`worktree:archive`** with payload schemas in shared.
- Add server handler routes; broadcast `worktree:branchChanged` on rename, `worktree:removed` on archive — same broadcasts the existing flows use, so consumers update without new wiring.
- Add **`<RenameWorktreeDialog>`** — small radix dialog with a single text input pre-filled with current branch name; reuses the `validateWorktreeName` regex from create-worktree.
- Add **`<ArchiveWorktreeConfirmDialog>`** — same shape as `RemoveWorktreeConfirmDialog` but with archive copy. Surfaces the `dirty` error from server and offers a "Force archive" button.
- Wire `WorktreeChildList` overlays:
  - On `onRename` → open `<RenameWorktreeDialog>`. On submit → `useWorktreeActions().rename(cwd, newName)` → toast.
  - On `onArchive` → open `<ArchiveWorktreeConfirmDialog>`. On confirm → `useWorktreeActions().archive(cwd)` → toast.
- Extend `useWorktreeActions` with `rename` + `archive` thin wrappers around the new socket events.

Out of scope:
- Renaming the worktree directory itself (intentional; see Why).
- Soft-undo for archive.
- Bulk archive / multi-select.

## Capabilities

### Modified Capabilities
- `worktree-management`: adds `rename` + `archive` actions; existing list / create / delete / checkout unchanged.

## Impact

**New code:**
- `apps/web/src/components/RenameWorktreeDialog.tsx` + test.
- `apps/web/src/components/ArchiveWorktreeConfirmDialog.tsx` + test.
- `apps/server/src/socket/handlers/worktree-rename.ts` (or extend `worktree.ts` in place).

**Modified code:**
- `apps/summoner/src/git/types.ts` — add 2 methods.
- `apps/summoner/src/git/local.ts` — implement.
- `apps/summoner/src/test/fake-git-service.ts` — implement + new error setters for tests.
- `packages/shared/src/schemas/worktree.ts` — add 2 payload/response schemas + `WorktreeArchiveError` discriminated union for the dirty case.
- `packages/shared/src/socket-events.ts` — register events.
- `apps/server/src/socket/handlers/worktree.ts` — handlers.
- `apps/web/src/contexts/WorktreeContext.tsx` — add `rename` + `archive` to actions.
- `apps/web/src/components/WorktreeChildList.tsx` — replace toast placeholders with dialog flows.

**Risk:** medium.
- `git branch -m` from a non-checked-out worktree — must use `-C <worktree-path>` to scope correctly, otherwise it renames the main repo's branch.
- `git worktree remove` refuses on dirty worktrees by default; we surface that as a typed error and offer `--force` only after explicit confirmation.
- Renaming a branch that has an upstream ref leaves the ref dangling; we accept this in v1 (matches `git`'s default; user can re-`--set-upstream-to` later).
