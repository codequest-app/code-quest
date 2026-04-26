## ADDED Requirements

### Requirement: Project list MUST visually group by Pinned / Recent

The sidebar Projects pane MUST render two sections: Pinned (where `pinned=true`)
and Recent (where `pinned=false`). Each section is sorted by `lastOpenedAt`
descending. Empty sections are omitted.

#### Scenario: Mixed pinned / recent projects

- **GIVEN** 4 projects: A (pinned, opened 10:00), B (recent, opened 12:00),
  C (pinned, opened 09:00), D (recent, opened 11:00)
- **WHEN** ProjectList renders
- **THEN** order is: PINNED header → A → C → RECENT header → B → D

#### Scenario: All projects pinned

- **GIVEN** all projects have `pinned=true`
- **WHEN** ProjectList renders
- **THEN** only PINNED section renders (no empty RECENT header)

### Requirement: User MUST be able to pin/unpin a project

A pin star button on each project row toggles its `pinned` state via
`projects:update`. On success, the project moves between Pinned and Recent
sections (state syncs from `projects:updated` broadcast).

#### Scenario: Pin a recent project

- **GIVEN** project `cc-office` in Recent section with `pinned=false`
- **WHEN** user clicks the pin star
- **THEN** client calls `projectActions.pinProject('/path/cc-office', true)`
- **AND** server emits `projects:updated`
- **AND** `cc-office` re-renders in Pinned section with filled star icon

#### Scenario: Unpin a project

- **GIVEN** project `cc-office` in Pinned section with `pinned=true`
- **WHEN** user clicks the pin star (now filled)
- **THEN** `pinProject(cwd, false)` called
- **AND** project moves back to Recent section

### Requirement: User MUST be able to rename a project

A `Rename` item in the project context menu opens `RenameProjectDialog`. The
dialog pre-fills with current name; submitting calls
`projectActions.renameProject(cwd, newName)`.

#### Scenario: Rename succeeds

- **GIVEN** project `cc-office` with default name from basename
- **WHEN** user opens context menu → Rename → enters "CC Office" → submits
- **THEN** client calls `renameProject('/path/cc-office', 'CC Office')`
- **AND** server emits `projects:updated`
- **AND** `ProjectCard` displays "CC Office" instead of "cc-office"
- **AND** dialog closes

#### Scenario: Rename input validation

- **GIVEN** RenameProjectDialog open with current name "cc-office"
- **WHEN** input is empty or unchanged
- **THEN** Rename button is disabled
- **AND** Esc closes the dialog without action

### Requirement: User MUST be able to remove a project (when no active sessions)

A `Remove` item in the project context menu opens `RemoveProjectConfirmDialog`.
Behavior depends on whether the project has active sessions (sessions whose
`projectRoot === project.cwd && state !== 'exited'`).

#### Scenario: Remove project with no active sessions

- **GIVEN** project `cc-office` has 0 active sessions
- **WHEN** user opens context menu → Remove
- **THEN** confirm dialog shows "Remove cc-office? Folder is NOT deleted."
- **AND** Remove button enabled
- **WHEN** user clicks Remove
- **THEN** client calls `removeProject('/path/cc-office')`
- **AND** server emits `projects:removed`
- **AND** `cc-office` disappears from sidebar
- **AND** dialog closes

#### Scenario: Remove blocked by active sessions

- **GIVEN** project `cc-office` has 2 active chat sessions
- **WHEN** user opens context menu → Remove
- **THEN** dialog shows warning state: "cc-office has 2 active session(s). Close them first."
- **AND** only OK button is shown (no Remove action)

#### Scenario: Active project switches when removed

- **GIVEN** active project is `cc-office` and 2 other projects exist
- **WHEN** `cc-office` is removed
- **THEN** `activeProjectCwd` switches to the next project (pinned-first, then most-recently-opened)

### Requirement: TopScopeSwitcher MUST provide quick project switching

A dropdown in the top header shows current active project. Clicking opens a
list grouped by Pinned / Recent, with a search input. Clicking a project
switches active project.

#### Scenario: Switch project from top header

- **GIVEN** top scope switcher shows current active "cc-office"
- **WHEN** user clicks the switcher
- **THEN** dropdown opens with Pinned / Recent groups
- **WHEN** user clicks "anthropic-cookbook"
- **THEN** `setActiveProject('/path/anthropic-cookbook')` called
- **AND** dropdown closes
- **AND** switcher trigger now shows "anthropic-cookbook"

#### Scenario: Filter projects by search

- **GIVEN** top scope switcher dropdown is open with 5 projects
- **WHEN** user types "cook" in the search input
- **THEN** only projects matching "cook" (case-insensitive substring on name) are shown

#### Scenario: Add new project from switcher

- **GIVEN** top scope switcher dropdown is open
- **WHEN** user clicks "+ Add project" item
- **THEN** dropdown closes
- **AND** existing `AddProjectDialog` opens

## MODIFIED Requirements

### Requirement: ProjectActions MUST expose pin / rename / remove operations

The client-side `ProjectActions` API MUST provide async methods for:

- `pinProject(cwd, pinned): Promise<Project | { error }>`
- `renameProject(cwd, name): Promise<Project | { error }>`
- `removeProject(cwd): Promise<{ ok } | { error, activeSessionCount? }>`

Each method internally resolves the server-side `id` from `cwd` and emits the
corresponding `projects:update` / `projects:remove` socket event.

#### Scenario: pinProject when cwd not found

- **GIVEN** `projectActions.pinProject('/unknown/path', true)` called
- **AND** no project with that cwd exists in current state
- **THEN** returns `{ error: 'project_not_found' }` (client-side check)
- **AND** does NOT emit any socket event
