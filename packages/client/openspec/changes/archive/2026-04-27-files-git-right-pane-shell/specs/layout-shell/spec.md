## MODIFIED Requirements

### Requirement: Workspace shell RWD structure
The workspace shell SHALL render a single `WorkspaceTopbar` above a content area. On desktop the content area is a resizable three-column `PanelGroup` containing `[Sidebar | chat | RightPane]`. On tablet/mobile the content area is a single-column chat region with overlay drawers for the sidebar and the right pane. There MUST NOT be a separate vertical ActivityBar.

#### Scenario: Desktop (≥1024px) renders three resizable columns
- **WHEN** viewport is ≥1024px
- **THEN** layout is: `WorkspaceTopbar` above a horizontal `PanelGroup` with `[Sidebar | PanelResizeHandle | TabContainer | PanelResizeHandle | RightPane]`.
- **AND** Sidebar and RightPane are both collapsible (collapsedSize=0); TabContainer has a minimum size ensuring it remains usable.
- **AND** sizes and collapsed state persist across reloads via `PanelGroup autoSaveId`.

#### Scenario: Tablet (768–1023px)
- **WHEN** viewport is 768–1023px
- **THEN** the chat region takes the full width; Sidebar is hidden and opens as an overlay drawer via the topbar left trigger; RightPane is hidden and opens as an overlay drawer via the topbar right trigger.
- **AND** the `PanelGroup` is NOT mounted at this breakpoint.

#### Scenario: Mobile (<768px)
- **WHEN** viewport is <768px
- **THEN** chat is full-width; Sidebar + RightPane both only accessible as overlay drawers via topbar triggers; MobileNav remains at the bottom; no ActivityBar and no `PanelGroup`.

#### Scenario: Right drawer mirrors sidebar drawer semantics
- **WHEN** the right pane overlay drawer is open on tablet or mobile
- **THEN** a semi-transparent backdrop is shown; clicking the backdrop or pressing Esc closes the drawer; the drawer slides in from the right.

#### Scenario: Breakpoint change remounts instead of preserving state
- **WHEN** the viewport crosses 1024px in either direction
- **THEN** the inactive mount (PanelGroup or drawers) unmounts and the other mounts; sizes/collapsed state restore from persisted `autoSaveId` on re-entry to desktop.

## REMOVED Requirements

### Requirement: Fixed-width 260px sidebar on desktop
**Reason:** Desktop sidebar becomes resizable + collapsible inside the `PanelGroup`. Default width comes from the Panel's `defaultSize` percentage (~18% at 1024px ≈ 184px, but user-adjustable).

**Migration:** No code migration needed — `WorkspaceLayout.tsx` swaps the fixed `style={{ width: 260 }}` container for a `<Panel defaultSize={18} minSize={10} collapsible collapsedSize={0}>`. Returning users see their last-chosen size from localStorage; first-run users see the percentage default.
