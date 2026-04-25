## ADDED Requirements

### Requirement: ActiveTabCwdContext SHALL hold the cwd of the currently active chat tab

A new `ActiveTabCwdContext` MUST expose `{ cwd: string | null; setCwd: (cwd: string | null) => void }`. Its provider MUST be mounted in WorkspaceLayout above both the project tab containers (writers) and the right pane (reader). When no chat tab is active in any project, `cwd` MUST be `null`.

#### Scenario: No tabs open
- **WHEN** the user has no chat tabs open in any project
- **THEN** `useActiveTabCwdContext().cwd` returns `null`

### Requirement: Publisher hook SHALL push the active project's active-tab cwd

`useActiveTabCwdPublisher()` MUST be called inside each project's `<TabContainer>`. The hook SHALL `setCwd(activeTab?.cwd ?? null)` if and only if this project's `cwd` equals the global `activeProjectCwd`. Inactive projects' publishers MUST NOT write (avoids stale overwrites racing the active project's writer).

#### Scenario: User switches chat tabs within the active project
- **WHEN** the active project's user switches from a main-branch chat tab (cwd=/repo) to a worktree chat tab (cwd=/repo/.claude/worktrees/x)
- **THEN** `ActiveTabCwdContext.cwd` updates to `/repo/.claude/worktrees/x`

#### Scenario: User switches between projects
- **WHEN** the user switches from project A (with active chat tab cwd=/A/wt-1) to project B (with active chat tab cwd=/B)
- **THEN** `ActiveTabCwdContext.cwd` updates to `/B` (B's TabContainer publisher fires; A's no longer writes because A is no longer active)

### Requirement: useActiveCwd SHALL prefer the active-tab cwd over project fallbacks

`useActiveCwd()` MUST read `ActiveTabCwdContext.cwd` first. When non-null, it returns that value; only when null does it fall through to the existing chain (`selectedWorktreeCwd[activeProjectCwd]` → `activeProjectCwd` → `null`).

#### Scenario: Active tab cwd is set
- **WHEN** `ActiveTabCwdContext.cwd` is non-null AND `activeProjectCwd` is also set
- **THEN** `useActiveCwd()` returns the active-tab cwd, not the project cwd

#### Scenario: Active tab cwd is null but project is selected
- **WHEN** `ActiveTabCwdContext.cwd` is `null` AND `activeProjectCwd === '/repo'`
- **THEN** `useActiveCwd()` returns `/repo` via the existing fallback chain
