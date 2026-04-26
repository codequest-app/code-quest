## ADDED Requirements

### Requirement: Command palette mounts at workspace level

The `CommandPalette` SHALL be mounted exactly once at the workspace shell level (i.e. inside `WorkspaceLayout`, NOT per chat tab inside `ChatPanel`). Open / close state SHALL be managed by `CommandPaletteContext` (`useCommandPalette()`).

#### Scenario: Single mount across chat tabs
- **WHEN** the user has multiple chat tabs open and switches between them
- **THEN** the `CommandPalette` element is mounted once at the workspace level (not duplicated per tab)
- **AND** opening / closing the palette is identical from any tab

#### Scenario: Palette is reachable in empty state
- **WHEN** the workspace has no active chat (e.g. project selected but no worktree opened)
- **THEN** `⌘K` opens the palette
- **AND** the palette displays features that don't require an active channel (preferences, global actions)

### Requirement: Palette features filter by active chat context

The palette SHALL render features context-aware via `useActiveChatContext()`:
- Channel-bound features (messages search, message-type filters, raw panel toggle) SHALL appear only when an active chat channel is present
- Workspace-global features (preferences, switch project, add project, settings, switch worktree) SHALL always appear

#### Scenario: With active chat, all features visible
- **WHEN** the user opens the palette while a chat tab is active
- **THEN** the Messages tab is enabled and lists messages from the active channel
- **AND** raw panel toggle / message-type filter actions appear

#### Scenario: Without active chat, channel features are hidden
- **WHEN** the user opens the palette with no active chat
- **THEN** the Messages tab is hidden or disabled
- **AND** raw panel toggle / message-type filters do NOT appear
- **AND** preferences (theme / density / font size) and global actions (switch project, add project, settings) ARE listed

### Requirement: Palette has multiple entry points

The command palette SHALL be openable via:
- Keyboard shortcut `⌘K` / `Ctrl+K` from anywhere in the workspace
- Keyboard shortcut `⌘F` / `Ctrl+F` from within an active chat — opens the palette pre-focused on the Messages tab
- A `⌕` (search) icon in the workspace topbar — opens the palette pre-focused on the All tab

All entry points SHALL invoke the same `openPalette(opts?)` function from `CommandPaletteContext`, optionally passing a target tab.

#### Scenario: ⌘K from any context
- **WHEN** the user presses `⌘K` while focused outside any input/textarea
- **THEN** the palette opens with the All tab active

#### Scenario: ⌘F inside chat focuses Messages tab
- **WHEN** the user presses `⌘F` from within an active chat (focus not on a form input)
- **THEN** the palette opens with the Messages tab active

#### Scenario: Topbar search button
- **WHEN** the user clicks the `⌕` button in the workspace topbar
- **THEN** the palette opens (All tab default)

### Requirement: Mobile palette renders as full-screen overlay

On viewports `< 1024px` the palette SHALL render as a full-screen overlay (input pinned to top, results filling the remaining viewport, no backdrop margin). On `≥ 1024px` it SHALL render as a centered modal (existing behaviour).

#### Scenario: Mobile fills viewport
- **WHEN** the viewport is `< 1024px` and the palette is open
- **THEN** the palette container occupies the full viewport (`inset-0`)
- **AND** the search input remains visible above the virtual keyboard

#### Scenario: Desktop centered modal
- **WHEN** the viewport is `≥ 1024px` and the palette is open
- **THEN** the palette container is a centered modal with bounded width

### Requirement: Workspace-global actions available from the palette

The palette SHALL provide at minimum the following global actions when opened (regardless of active chat):
- `Switch project…` — list all known projects, select to set active
- `Add project…` — open the AddProjectDialog
- `Switch worktree…` — list worktrees across all projects, select to activate
- `Open settings` — open the SettingsDialog

These SHALL be implemented as features in the existing palette feature system (`features/global-actions/`).

#### Scenario: Switch project from palette
- **WHEN** the user types "switch p" and selects "Switch project…"
- **THEN** a sub-list of projects appears
- **AND** selecting one calls `setActiveProject(cwd)` and closes the palette

#### Scenario: Add project from palette
- **WHEN** the user selects "Add project…"
- **THEN** the AddProjectDialog opens
- **AND** the palette closes
