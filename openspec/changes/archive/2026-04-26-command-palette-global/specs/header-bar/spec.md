## ADDED Requirements

### Requirement: Topbar exposes a search button that opens the command palette

The workspace topbar (`WorkspaceTopbar`) SHALL render a `⌕` (magnifying glass) button on every breakpoint. Clicking it SHALL invoke `openPalette()` from `CommandPaletteContext`. The button SHALL have `aria-label="Search"` (or equivalent) for screen readers.

#### Scenario: Topbar shows search button
- **WHEN** the workspace shell is rendered (any breakpoint)
- **THEN** the topbar contains a button with `aria-label="Search"` (or "Open command palette")

#### Scenario: Click opens palette
- **WHEN** the user clicks the topbar search button
- **THEN** the command palette opens with the All tab active

#### Scenario: Mobile entry point
- **WHEN** the viewport is `< 768px`
- **THEN** the search button remains visible in the topbar (mobile users have no keyboard `⌘K` access)
