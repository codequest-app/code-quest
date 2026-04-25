## Scope note

After auditing the codebase, **most menu UI already exists** (`WorktreeContextMenu` + hover-`⋯` button on `WorktreeRow`). The two real gaps are:

1. **Right-click trigger** — today the menu only opens via the hover `⋯` button. Add `onContextMenu`.
2. **Rename / Archive backends** — TODOs exist in `WorktreeChildList.tsx`. Semantics are non-trivial (rename = `git branch -m` + worktree path move; archive = ill-defined per existing comment). **Deferred to a follow-up change** — out of scope for this v1.

This change therefore ships: right-click trigger + replace the silent TODO `console.info` with a friendly toast so users know the items are coming.

## 1. Right-click trigger (TDD)

- [x] 1.1 Red: extend `WorktreeRow.test.tsx` — right-clicking the row fires `onMoreActions` with the click coords.
- [x] 1.2 Green: add `onContextMenu` handler to `WorktreeRow`.
- [x] 1.3 Run tests — green.

## 2. Friendly toasts for unimplemented items

- [x] 2.1 Replace `console.info('Rename worktree: not yet implemented')` in `WorktreeChildList.tsx` with `toast('Rename — coming soon')`.
- [x] 2.2 Same for archive.
- [x] 2.3 Quick test that the menu still renders / closes.

## 3. Verify

- [x] 3.1 client tsc + vitest — green.
- [x] 3.2 biome check on touched files.

## 4. Finalize

- [x] 4.1 Commit.
- [x] 4.2 Note in commit body that rename/archive backends will be a follow-up change.
