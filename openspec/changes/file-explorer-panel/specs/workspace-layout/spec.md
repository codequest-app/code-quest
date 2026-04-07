## ADDED Requirements

### Requirement: WorkspaceLayout SHALL use a three-column structure

WorkspaceLayout SHALL be restructured into three columns: Activity Bar (fixed), Left Sidebar (resizable), and Main Area (flex).

```
┌──────────┬──────────────┬────────────────────────────┐
│ Activity │   Sidebar    │      Main Area             │
│   Bar    │  (resizable) │  (TabBar + ChatPanel)      │
│  (fixed) │              │                            │
└──────────┴──────────────┴────────────────────────────┘
```

- Activity Bar: fixed width (~40px), always visible
- Sidebar: resizable via drag handle, collapsible
- Main Area: takes remaining space, contains TabBar + per-tab ChatPanel
- TabBar SHALL be inside the Main Area (not full-width)

#### Scenario: Default layout renders all three columns
- **WHEN** WorkspaceLayout mounts
- **THEN** Activity Bar, Sidebar, and Main Area are all visible

#### Scenario: TabBar is within Main Area only
- **WHEN** layout is rendered with sidebar open
- **THEN** TabBar spans only the Main Area width, not the full viewport

### Requirement: Activity Bar SHALL toggle sidebar panels

Activity Bar SHALL display a vertical list of icon buttons. Clicking an icon SHALL toggle the corresponding sidebar panel.

- Clicking an unselected icon: show that panel in sidebar + expand sidebar if collapsed
- Clicking the already-selected icon: collapse sidebar (toggle off)
- Selected icon SHALL have a visual indicator (accent left border or background highlight)

#### Scenario: Click unselected icon expands sidebar
- **WHEN** sidebar is collapsed and user clicks the Explorer icon
- **THEN** sidebar expands and shows the FileExplorerPanel

#### Scenario: Click selected icon collapses sidebar
- **WHEN** sidebar shows FileExplorerPanel and user clicks the Explorer icon again
- **THEN** sidebar collapses

#### Scenario: Selected icon has visual indicator
- **WHEN** FileExplorerPanel is active
- **THEN** the Explorer icon in Activity Bar has an accent-colored left border or highlighted background

### Requirement: Sidebar SHALL be resizable via drag handle

Sidebar panel SHALL be resizable using `react-resizable-panels`. User SHALL be able to drag the border between sidebar and main area to adjust width.

- Default size: 20% of viewport width
- Minimum size: 15%
- Maximum size: 40%
- Sidebar SHALL support collapsing (0% width) via Activity Bar toggle

#### Scenario: Drag to resize sidebar
- **WHEN** user drags the resize handle between sidebar and main area
- **THEN** sidebar width changes proportionally, main area adjusts to fill remaining space

#### Scenario: Sidebar respects minimum width
- **WHEN** user drags resize handle to make sidebar smaller than 15%
- **THEN** sidebar collapses to 0% (fully hidden)

#### Scenario: Sidebar respects maximum width
- **WHEN** user drags resize handle to make sidebar larger than 40%
- **THEN** sidebar width stops at 40%

### Requirement: Activity Bar SHALL support multiple panel entries

Activity Bar SHALL accept an array of panel definitions and render an icon for each. This enables future panels (Search, History, etc.) to be added without layout changes.

- Each entry has: `id`, `icon` (ReactNode), `title` (tooltip text)
- MVP ships with one entry: File Explorer
- Panel content is rendered in the Sidebar based on the active panel id

#### Scenario: MVP renders single Explorer icon
- **WHEN** layout mounts with default configuration
- **THEN** Activity Bar shows one icon (File Explorer) with tooltip "Explorer"

#### Scenario: Future panel added without layout change
- **WHEN** a new panel entry (e.g., Search) is added to the Activity Bar items array
- **THEN** a new icon appears in Activity Bar and clicking it shows the corresponding panel in sidebar

### Requirement: Right side panel SHALL remain per-tab and unchanged

The existing right side panel (RawEventPanel) SHALL continue to be managed per-tab inside ChatPanel. It SHALL NOT be affected by the new Activity Bar or sidebar system.

#### Scenario: RawEventPanel toggle still works
- **WHEN** user clicks "Raw" button in HeaderBar
- **THEN** RawEventPanel appears on the right side of the active ChatPanel, independent of left sidebar state

#### Scenario: Left sidebar and right panel coexist
- **WHEN** both left sidebar (Explorer) and right panel (RawEventPanel) are open
- **THEN** both are visible simultaneously, main chat area shrinks to accommodate both
