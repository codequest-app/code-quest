## ADDED Requirements

### Requirement: Workspace topbar composition
The workspace SHALL render a `WorkspaceTopbar` component immediately above the content area. The topbar contents carried over from the previous layout MUST be preserved unchanged; the only additions are a Settings cog on the right and a hamburger on the left for non-desktop breakpoints.

#### Scenario: Settings button is right-most on all breakpoints
- **WHEN** the workspace renders at any breakpoint
- **THEN** the topbar contains a button with `aria-label="Settings"` positioned at the right edge of the bar (pushed right by `ml-auto` or an equivalent flex spacer).

#### Scenario: Settings click opens the settings dialog
- **WHEN** the user clicks the topbar's Settings button
- **THEN** the `SettingsDialog` opens (same dialog previously opened via ActivityBar's Settings button).

#### Scenario: Desktop topbar contents
- **WHEN** viewport is ≥1024px
- **THEN** topbar renders `TopScopeSwitcher` on the left and Settings button on the right; no hamburger is rendered.

#### Scenario: Tablet topbar includes hamburger to open sidebar drawer
- **WHEN** viewport is 768–1023px
- **THEN** topbar renders a hamburger button on the left (`aria-label="Menu"`), then `TopScopeSwitcher`, then Settings on the right.
- **WHEN** the user clicks the tablet hamburger
- **THEN** the sidebar overlay drawer opens (`drawerOpen` state becomes true).

#### Scenario: Mobile topbar keeps existing hamburger and adds Settings
- **WHEN** viewport is <768px
- **THEN** topbar renders the existing hamburger on the left, `TopScopeSwitcher`, and Settings on the right.

#### Scenario: Topbar preserves existing test IDs
- **WHEN** the topbar renders
- **THEN** the root element carries `data-testid="desktop-topbar"` at desktop/tablet breakpoints and `data-testid="mobile-topbar"` on mobile, matching the current conventions so existing tests continue to locate it.
