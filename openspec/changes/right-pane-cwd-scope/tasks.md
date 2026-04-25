## 1. FileTree rootCwd (TDD)
- [x] 1.1 Red: extend FileTree.test.tsx — given `rootCwd="/repo"`, root items are children of /repo (not the configured roots).
- [x] 1.2 Green: add optional `rootCwd` prop; when set, root dataLoader uses it.

## 2. RightPane / panes — narrow cwd type (TDD)
- [x] 2.1 Red: update FilesPane/GitPane/SpecPane/RightPane tests — drop null-cwd tests; add tests asserting empty-state cases that ARE valid (clean repo, empty openspec).
- [x] 2.2 Green: change `cwd: string | null` → `cwd: string` on all four; drop fallback branches.

## 3. WorkspaceLayout — conditional right Panel (TDD)
- [x] 3.1 Red: update WorkspaceLayoutRWD test — when projects exist but none selected → no right Panel + no resize handle.
- [x] 3.2 Green: render right `<Panel>` + `<PanelResizeHandle>` only when `cwd != null`.

## 4. Topbar right toggle — hide when no cwd
- [x] 4.1 Red: WorkspaceTopbar test — `onToggleRight` undefined → no Toggle right pane button.
- [x] 4.2 Green: WorkspaceLayout passes `onToggleRight={cwd ? handler : undefined}`.

## 5. Verify
- [x] 5.1 client tsc + vitest green; biome clean.

## 6. Finalize
- [x] 6.1 Commit: `fix(right-pane): bind to active cwd; hide pane when no selection; FileTree rooted at cwd`
