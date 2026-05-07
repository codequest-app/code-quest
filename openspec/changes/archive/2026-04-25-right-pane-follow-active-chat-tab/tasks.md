## Tasks

### 1. ActiveTabCwdContext + Provider
- [x] New `apps/web/src/contexts/ActiveTabCwdContext.tsx`: `{ cwd: string | null; setCwd: (cwd: string | null) => void }`. Provider holds `useState`. Soft-binding (`useContext` returns null when outside) so `useActiveCwd` can fall through gracefully.
- [x] Mount `<ActiveTabCwdProvider>` in WorkspaceLayout above the row containing `<main>` and the right `<DrawerAside>`.

### 2. Publisher hook
- [x] New `apps/web/src/hooks/useActiveTabCwdPublisher.ts`: reads `useTabState` + this project's cwd (prop or context) + `useProjectState().activeProjectCwd` + `useActiveTabCwdContext`. When `projectCwd === activeProjectCwd`, publish `activeTab?.cwd ?? null`; otherwise no-op.
- [x] Hook: when this project becomes inactive (was active, now not), do NOT clear (let the new active project's hook overwrite — last-writer-wins).
- [x] Call the hook inside `<TabContainer>` (or wherever has access to project cwd + TabContext).

### 3. useActiveCwd reads from new context
- [x] Update `useActiveCwd`: read `ActiveTabCwdContext.cwd` first; if non-null, return it. Existing fallbacks (selectedWorktree → activeProject) follow.

### 4. Tests
- [x] Hook unit test: publisher writes when project is active; no-op when inactive.
- [x] Integration test: switching chat tabs within an active project updates `useActiveCwd()` to the new tab's cwd.
- [x] Integration test: switching projects (different `activeProjectCwd`) updates `useActiveCwd()` via the new project's TabContainer publisher.

### 5. Verification
- [x] `pnpm -F client test` green.
- [x] `npx openspec validate right-pane-follow-active-chat-tab --strict`.
