## Why

`files-git-right-pane-shell` declared `useActiveCwd()` as the **single hook** all right-pane content depends on. Spec also locks the data-flow contract: cwd is sourced from the user's sidebar selection (active project / active worktree).

Two bugs in the current implementation break that contract:

### Bug 1 — RightPane mounts even when no cwd
When the user has not yet picked any project/worktree (`cwd === null`), `<RightPane>` still mounts and each of `<FilesPane>`, `<GitPane>`, `<SpecPane>` renders its own "No active project" empty state. The contract says: no cwd → no right pane. Three local empty-state branches exist purely to paper over this architectural smell.

### Bug 2 — FileTree shows global explorer roots, not the active cwd's contents
`<FileTree>` uses `rootItemId: 'root'` and calls `browseEntries(undefined)` for the root level — which the server interprets as "list all configured `explorerRoots`". So the user sees the whole filesystem the server permits, NOT the contents of the project they picked. The "Files" tab is effectively wrong.

## What Changes

### Layout
- `WorkspaceLayout` (desktop): when `useActiveCwd() === null`, **do not render** the right `<Panel>` nor its preceding `<PanelResizeHandle>`. Layout collapses to two columns (Sidebar | Chat). When the user picks a project, the third column re-renders, restoring its persisted size.
- Topbar right-pane toggle button: hide / disable when no cwd (nothing to toggle).
- Tablet/mobile drawer: don't allow opening the right drawer when no cwd; trigger button hidden.

### Pane components
- `<FilesPane>`, `<GitPane>`, `<SpecPane>`: change `cwd: string | null` → `cwd: string`. **Remove** the per-pane "No active project" empty-state branch.
- `<RightPane>`: change `cwd: string | null` → `cwd: string`. Keep tab strip and other empty states (e.g. clean repo, empty changes list — those are valid cwd states).

### FileTree fix
- `<FileTree>` accepts a new optional `rootCwd?: string` prop.
- When `rootCwd` set: root level loads via `browseEntries(rootCwd)` (its children directly), not the configured roots. The user sees `<rootCwd>/<children>` instead of `<all-roots>`.
- When `rootCwd` omitted: existing behavior (load roots) stays — used by other consumers (mention search, etc.) that intentionally want roots.
- `<FilesPane>` passes `rootCwd={cwd}`.

## Impact

**Modified:**
- `apps/web/src/components/WorkspaceLayout.tsx` — conditional Panel rendering on cwd
- `apps/web/src/components/WorkspaceTopbar.tsx` — hide right-toggle when no cwd
- `apps/web/src/components/RightPane.tsx` — `cwd: string`
- `apps/web/src/components/FilesPane.tsx` — `cwd: string`, drop empty branch, pass rootCwd
- `apps/web/src/components/GitPane.tsx` — `cwd: string`, drop empty branch
- `apps/web/src/components/SpecPane.tsx` — `cwd: string`, drop empty branch
- `apps/web/src/components/FileTree.tsx` — new `rootCwd` prop

**Tests:**
- WorkspaceLayoutRWD: assert right Panel absent when no project
- FilesPane/GitPane/SpecPane: drop the "null cwd → empty state" tests (no longer reachable)
- FileTree: new test for `rootCwd` rooted browsing
- RightPane: drop null-cwd test cases

**Risk:** low.
- Pure refactor + bug fix. No new APIs.
- The "no cwd" state was already handled at WorkspaceLayout level via the `EmptyState` "No projects yet" prompt for the empty-projects case; this change extends that to "have-projects-but-none-selected" via panel hiding.
- Existing FileTree consumers (mention picker) keep working — `rootCwd` is opt-in.
