## ADDED Requirements

### Requirement: Workspace right pane shell
The workspace SHALL render a `RightPane` component as the third column on desktop, holding a Files/Git/Spec tab strip. Each tab's body is a placeholder in this change; real content arrives in follow-up changes.

#### Scenario: Tab strip is always rendered when RightPane is visible
- **WHEN** RightPane renders (desktop Panel or tablet/mobile drawer)
- **THEN** three tab buttons are present with labels `Files`, `Git`, `Spec` (or equivalent `aria-label`s), and exactly one is active at any time.

#### Scenario: Default active tab is Files
- **WHEN** RightPane mounts for the first time in a session
- **THEN** the `Files` tab is active.

#### Scenario: Tab switch is local state
- **WHEN** the user clicks a tab button
- **THEN** the active tab updates and only the corresponding placeholder body is visible; the active tab does not persist across reloads in this change (persistence is out of scope).

#### Scenario: Placeholder bodies render
- **WHEN** any tab is active
- **THEN** its body renders a neutral placeholder (e.g. "Files coming soon") so the shell is visually complete.

### Requirement: useActiveCwd hook
The workspace SHALL expose a `useActiveCwd` hook returning `activeTab?.cwd ?? activeProjectCwd ?? null`. RightPane content is expected to depend only on this hook, not directly on TabContext or ProjectContext.

#### Scenario: Active tab wins
- **WHEN** a project is active AND an active tab exists within it
- **THEN** `useActiveCwd()` returns the active tab's `cwd`.

#### Scenario: Project cwd is the fallback
- **WHEN** a project is active AND no active tab exists
- **THEN** `useActiveCwd()` returns `activeProjectCwd`.

#### Scenario: Returns null with no active project
- **WHEN** no project is active
- **THEN** `useActiveCwd()` returns `null`.
