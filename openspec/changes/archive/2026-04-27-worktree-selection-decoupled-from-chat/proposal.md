## Why

Continuation of `right-pane-cwd-scope` + `git-handler-consolidation`. Two
related UX bugs surfaced after we removed the auto-spawn from
`git:worktree:add`:

### Bug 1 — clicking a worktree row in the sidebar still auto-opens chat
`WorktreeChildList.openWorktree()` calls `requestOpenWorktree(...)` →
TabContext intent → tab spawn. Same anti-pattern as the old
`worktree:create` auto-spawn, just from a different entry point.

### Bug 2 — `+` button on the tab strip ignores worktree selection
`TabContext.createNewTab()` defaults to `cwdRef.current` which is
`<TabProvider cwd={project.cwd}>` — i.e. **project root**, not the
worktree the user is currently looking at. So if the user navigated to a
worktree via sidebar then clicked `+`, the new chat lands in the project
root, not the worktree.

Together: the user has no way to "browse a worktree without opening
chat, then open chat in that worktree when ready."

## What Changes

### NavigationContext: add per-project worktree selection
- `selectedWorktreeCwd: Record<projectCwd, worktreeCwd | null>`
- `setSelectedWorktree(projectCwd, worktreeCwd | null)` — null = back to project root

### WorktreeChildList: row click is pure navigation
- Click row → `setActiveProject(projectCwd)` + `setSelectedWorktree(projectCwd, wt.path)`
- **Drop** `requestOpenWorktree` from row-click path (still keep it for the
  context menu's "Open in new chat" item which IS explicit chat creation).
- WorktreeRow `active` prop now reflects "this is the selected worktree"
  (visual highlight stays).

### TabProvider: take selected worktree as override for new-tab cwd
- New optional prop `selectedCwd?: string`.
- `createNewTab(opts)` priority: `opts?.cwd ?? selectedCwd ?? cwdRef.current`.

### WorkspaceLayout: wire selection to TabProvider
- For each project's `<TabProvider>`, pass
  `selectedCwd={selectedWorktreeCwd[project.cwd] ?? undefined}`.

### useActiveCwd: include selection in priority chain
- New priority: `activeTab?.cwd ?? selectedWorktreeCwd[activeProject] ?? activeProjectCwd`.
- This way RightPane (Files / Git / Spec) follows sidebar selection even
  before the user opens chat.

## Server (no changes)
The `cwd` / `project_root` separation in `sessions` table is already
correct. Channel creation already takes `cwd` and resolves `projectRoot`
via `gitService.getProjectRoot()`. We just need to make sure the client
sends the right `cwd` when launching, which is what this change fixes.

## Impact

**Modified:**
- `apps/web/src/contexts/NavigationContext.tsx` — add selection state + action
- `apps/web/src/contexts/TabContext.tsx` — add `selectedCwd` prop + use in createNewTab
- `apps/web/src/components/WorktreeChildList.tsx` — row click → selection only
- `apps/web/src/components/WorktreeRow.tsx` — `active` semantic stays the same; consumer just feeds different value
- `apps/web/src/components/WorkspaceLayout.tsx` — wire selection to TabProvider
- `apps/web/src/hooks/useActiveCwd.ts` — new priority chain

**Tests:**
- Update WorktreeChildList tests: row click → assert no tab created, assert selection set
- Update TabContext tests: createNewTab with selectedCwd
- WorkspaceLayout tests: clicking sidebar then + creates tab with worktree cwd
- useActiveCwd test: selection priority

**Risk:** medium-low.
- "Click row no longer opens chat" is intentional behavior change — old tests assuming auto-open need rewriting (per "expect 不變或等價": rewrite to assert new contract).
- The "Open in new chat" context menu item still works as the explicit chat-creation path, preserving the old behavior for users who want it.
