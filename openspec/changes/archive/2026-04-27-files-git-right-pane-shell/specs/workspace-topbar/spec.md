## MODIFIED Requirements

### Requirement: Workspace topbar composition
The workspace SHALL render a `WorkspaceTopbar` component immediately above the content area. The topbar carries two symmetric pane triggers (one for the left sidebar, one for the right pane) plus the existing Settings cog. Each pane trigger has a **dual role by breakpoint**: on desktop it toggles the pane's collapse inside the `PanelGroup`; on tablet/mobile it opens the pane's overlay drawer.

#### Scenario: Settings button is right-most on all breakpoints
- **WHEN** the workspace renders at any breakpoint
- **THEN** the topbar contains a button with `aria-label="Settings"` positioned at the right edge (pushed right by `ml-auto` or equivalent).

#### Scenario: Settings click opens the settings dialog
- **WHEN** the user clicks the topbar's Settings button
- **THEN** `SettingsDialog` opens.

#### Scenario: Left pane trigger present on all breakpoints
- **WHEN** the workspace renders at any breakpoint
- **THEN** a button with `aria-label="Toggle sidebar"` (or similar) renders at the left of the topbar; its presence is no longer gated by breakpoint.

#### Scenario: Right pane trigger present on all breakpoints
- **WHEN** the workspace renders at any breakpoint
- **THEN** a button with `aria-label="Toggle right pane"` (or similar) renders immediately left of the Settings cog.

#### Scenario: Desktop trigger → toggles Panel collapse
- **WHEN** viewport is desktop AND the user clicks either pane trigger
- **THEN** the corresponding Panel (`Sidebar` or `RightPane`) toggles between its persisted expanded size and `collapsedSize=0`.

#### Scenario: Tablet/mobile trigger → opens drawer
- **WHEN** viewport is tablet or mobile AND the user clicks a pane trigger
- **THEN** the corresponding overlay drawer opens with backdrop + Esc-to-close semantics.

#### Scenario: Topbar preserves existing test IDs
- **WHEN** the topbar renders
- **THEN** the root element carries `data-testid="desktop-topbar"` at desktop/tablet breakpoints and `data-testid="mobile-topbar"` on mobile, matching previous conventions.
