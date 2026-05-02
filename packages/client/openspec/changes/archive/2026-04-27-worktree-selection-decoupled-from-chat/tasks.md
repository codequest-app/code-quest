## 1. NavigationContext: selectedWorktreeCwd state (TDD)
- [x] 1.1 Red: NavigationContext test — selectedWorktreeCwd defaults to {}; setSelectedWorktree updates per-project; clearing with null removes the key.
- [x] 1.2 Green: add `selectedWorktreeCwd: Record<string, string | null>` to state + `setSelectedWorktree(projectCwd, worktreeCwd | null)` action.

## 2. TabProvider: selectedCwd override (TDD)
- [x] 2.1 Red: TabContext.split.test (or new) — `<TabProvider cwd="/proj" selectedCwd="/proj/.wt/x">` then `createNewTab()` → tab.cwd === "/proj/.wt/x".
- [x] 2.2 Green: add `selectedCwd?: string` prop; `createNewTab` reads `opts?.cwd ?? selectedCwd ?? cwdRef.current`.

## 3. WorktreeChildList: row click → selection only (TDD)
- [x] 3.1 Red: existing tests asserting "click row opens new tab" → rewrite to assert "click row sets selection, no new tab created".
- [x] 3.2 Green: drop `requestOpenWorktree` from row onSelect; replace with `setActiveProject + setSelectedWorktree`.
- [x] 3.3 WorktreeRow `active` prop: feed `selectedWorktreeCwd === wt.path` so visual highlight follows selection.

## 4. WorkspaceLayout: wire selection to TabProvider
- [x] 4.1 Read selectedWorktreeCwd from NavigationContext; pass to per-project TabProvider as `selectedCwd`.

## 5. useActiveCwd: new priority chain
- [x] 5.1 Red: useActiveCwd test — when no active tab + sidebar selection set → returns selection (not project root).
- [x] 5.2 Green: read NavigationContext selectedWorktreeCwd; new priority `activeTab.cwd ?? selectedWorktreeCwd[activeProject] ?? activeProjectCwd`.

## 6. Verify
- [x] 6.1 client tsc + vitest green; preserve assertions per "expect 不變或等價".
- [x] 6.2 biome check on touched files.

## 7. Finalize
- [x] 7.1 Commit.

## 8. Regression fix: liveCountFor matched by projectRoot, not cwd
- [x] 8.1 `WorktreeChildList.liveCountFor`: `s.projectRoot === wt.path` →
        `s.cwd === wt.path`. Old logic attributed every session to the
        main worktree (its path = project root). Surfaced visibly once
        `+` started opening chat in the sidebar-selected worktree.
