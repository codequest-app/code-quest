## ADDED Requirements

### Requirement: ActivityBar SHALL include a History panel entry

ActivityBar items SHALL include a History entry (icon: 🕐, id: `'history'`) in addition to the Explorer entry. Clicking it SHALL toggle the Session History Panel in the sidebar.

#### Scenario: History icon visible in ActivityBar
- **WHEN** WorkspaceLayout renders
- **THEN** ActivityBar displays both Explorer and History icons

#### Scenario: Clicking History icon opens Session History Panel
- **WHEN** user clicks the History icon in ActivityBar
- **THEN** sidebar shows SessionHistoryPanel

### Requirement: SessionHistoryPanel SHALL display sessions grouped by project (cwd)

SessionHistoryPanel SHALL fetch sessions via `listSessions` and group them by their `cwd` field. Each group SHALL be displayed as a collapsible section with the project path as header.

- Sessions with no `cwd` SHALL be grouped under a "(no project)" header
- Groups SHALL be sorted alphabetically by project path
- Sessions within each group SHALL be sorted by `createdAt` descending (newest first)
- Active sessions (isActive=true) SHALL have a visual indicator (e.g., green dot)

#### Scenario: Sessions grouped by project
- **WHEN** SessionHistoryPanel opens and sessions have different cwd values
- **THEN** sessions are displayed in groups, each headed by the project path

#### Scenario: Sessions without cwd grouped separately
- **WHEN** some sessions have no cwd
- **THEN** those sessions appear under a "(no project)" group

#### Scenario: Active sessions have visual indicator
- **WHEN** a session has `isActive: true`
- **THEN** it displays a green dot indicator

### Requirement: SessionHistoryPanel SHALL fetch sessions on panel open

SessionHistoryPanel SHALL trigger `listSessions({ limit: 100 })` when the panel becomes visible. Results SHALL be stored in local component state.

#### Scenario: Sessions fetched on panel open
- **WHEN** user opens the History panel (via ActivityBar click)
- **THEN** panel calls `listSessions({ limit: 100 })` and renders the results

#### Scenario: Loading state while fetching
- **WHEN** sessions are being fetched
- **THEN** panel shows a loading indicator

#### Scenario: Refresh button re-fetches sessions
- **WHEN** user clicks the refresh button in the panel header
- **THEN** panel re-fetches sessions and updates the display

### Requirement: SessionHistoryPanel SHALL support search filtering

SessionHistoryPanel SHALL include a search input that filters sessions by title or id. Filtering SHALL apply across all groups, and empty groups after filtering SHALL be hidden.

#### Scenario: Search filters sessions across groups
- **WHEN** user types "auth" in the search input
- **THEN** only sessions whose title or id contains "auth" are displayed

#### Scenario: Empty groups hidden after filter
- **WHEN** search filter results in a group having zero matching sessions
- **THEN** that group is not displayed

### Requirement: Double-click session SHALL resume in new tab

When user double-clicks a session entry, the system SHALL create a new tab and resume that session in it.

#### Scenario: Double-click session resumes it
- **WHEN** user double-clicks a session entry
- **THEN** system creates a new tab with the session's cwd and resumes the session

### Requirement: Double-click project header SHALL open new tab with that cwd

When user double-clicks a project group header, the system SHALL create a new tab with that project's cwd as the working directory.

#### Scenario: Double-click project header opens new tab
- **WHEN** user double-clicks the project header "/Users/user/projects/cc-office"
- **THEN** system calls `createNewTab({ cwd: '/Users/user/projects/cc-office' })`

### Requirement: Right-click session SHALL show context menu

When user right-clicks a session entry, the system SHALL display a context menu with Resume, Rename, and Delete options.

#### Scenario: Right-click shows context menu
- **WHEN** user right-clicks a session entry
- **THEN** a context menu appears with "Resume", "Rename", "Delete" options

#### Scenario: Resume from context menu
- **WHEN** user selects "Resume" from context menu
- **THEN** system creates a new tab and resumes the session (same as double-click)

#### Scenario: Rename from context menu
- **WHEN** user selects "Rename" from context menu
- **THEN** session title becomes editable inline, and on confirm calls `renameSession`

#### Scenario: Delete from context menu
- **WHEN** user selects "Delete" and confirms
- **THEN** system calls `deleteSession` and removes the entry from the list

### Requirement: Single-click project header SHALL toggle expand/collapse

Single-clicking a project group header SHALL toggle its expanded/collapsed state. Collapsed groups hide their session list.

#### Scenario: Click to collapse group
- **WHEN** user clicks an expanded project header
- **THEN** the session list under that group is hidden

#### Scenario: Click to expand group
- **WHEN** user clicks a collapsed project header
- **THEN** the session list under that group is shown

### Requirement: Existing ChatInputArea resume functionality SHALL remain unchanged

The existing ☰ button in ChatInputArea and SessionDropdown overlay SHALL continue to work as before. This change does NOT modify them.

#### Scenario: ChatInputArea resume still works
- **WHEN** user clicks ☰ in ChatInputArea
- **THEN** SessionDropdown overlay appears as before, independent of History Panel state
