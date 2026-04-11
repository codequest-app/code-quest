## ADDED Requirements

### Requirement: Project list derived from sessions
The system SHALL derive the project list by grouping existing sessions by their `cwd` field. Each unique `cwd` represents one project.

#### Scenario: Sessions with different cwds create separate projects
- **WHEN** server has sessions with cwd `/cc-office` and `/DQ`
- **THEN** project list contains two projects: `cc-office` and `DQ`

#### Scenario: Project name is basename of cwd
- **WHEN** project cwd is `/Users/user/WebstormProjects/cc-office`
- **THEN** project name displayed is `cc-office`

### Requirement: Active project switches tab group
The system SHALL display only the tabs belonging to the active project. Switching active project SHALL switch the entire tab group.

#### Scenario: Switch from cc-office to DQ
- **WHEN** user clicks the DQ project card
- **THEN** TabBar shows only DQ's sessions
- **AND** ChatPanel shows DQ's active tab

#### Scenario: Switch back preserves state
- **WHEN** user switches from DQ back to cc-office
- **THEN** cc-office's tabs and active tab are restored
- **AND** sessions that were running continue running

### Requirement: Project card in sidebar
The system SHALL display each project as a card in the sidebar showing the project name. The active project card SHALL have a visual highlight (accent border).

#### Scenario: Active project highlighted
- **WHEN** cc-office is the active project
- **THEN** cc-office card has accent border
- **AND** DQ card has no accent border

#### Scenario: Click card switches project
- **WHEN** user clicks DQ card
- **THEN** DQ becomes the active project
- **AND** DQ card gets accent border

### Requirement: New tab inherits active project cwd
The system SHALL create new tabs with the active project's cwd. The `[+]` button in TabBar SHALL create a session in the active project's directory.

#### Scenario: Create new tab in active project
- **WHEN** active project is cc-office (cwd: `/path/to/cc-office`)
- **AND** user clicks `[+]` new tab
- **THEN** new tab is created with `cwd: /path/to/cc-office`
- **AND** new tab appears in cc-office's tab group

### Requirement: Empty state when no projects
The system SHALL display an empty state with "Add Project" button when no sessions/projects exist.

#### Scenario: First launch with no sessions
- **WHEN** user opens the app with no existing sessions
- **THEN** main area shows empty state with "Add Project" button
- **AND** sidebar shows empty project list with "Add" button

### Requirement: Add project creates first session
The system SHALL create a new session in the selected directory when adding a project via the dialog. The new project becomes the active project.

#### Scenario: Add project from dialog
- **WHEN** user clicks "Add" and selects `/path/to/new-project` in dialog
- **THEN** a new project appears in the sidebar
- **AND** a new tab is created with that cwd
- **AND** the new project becomes active
