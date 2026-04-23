## MODIFIED Requirements

### Requirement: Workspace shell RWD structure
The workspace shell SHALL render a single top strip (`WorkspaceTopbar`) above a horizontal content area that combines a Sidebar (left) and TabContainer (right). There MUST NOT be a separate vertical ActivityBar. The topbar contents carried over from before this change (currently `TopScopeSwitcher` plus, on mobile, a hamburger) MUST be preserved; the only new additions are the Settings cog at the right and a tablet hamburger (both described below).

#### Scenario: Desktop (≥1024px)
- **WHEN** viewport is ≥1024px
- **THEN** layout is: `WorkspaceTopbar` (full width) above `[Sidebar 260px] + [TabContainer flex-1]`; Sidebar is always visible; no ActivityBar is rendered; topbar shows `TopScopeSwitcher` on the left and a Settings cog on the right.

#### Scenario: Tablet (768–1023px)
- **WHEN** viewport is 768–1023px
- **THEN** `WorkspaceTopbar` renders a hamburger (`☰`) at its left (new, replacing ActivityBar's toggle), followed by existing `TopScopeSwitcher`, with a Settings cog at the right; Sidebar is hidden by default and opens as an overlay drawer when the hamburger is clicked; no ActivityBar is rendered.

#### Scenario: Mobile (<768px)
- **WHEN** viewport is <768px
- **THEN** `WorkspaceTopbar` renders the existing hamburger (`☰`) at its left, existing `TopScopeSwitcher`, and now a Settings cog at the right; Sidebar stays hidden (controlled by `MobileNav`); TabContainer is full-width; no ActivityBar is rendered.

#### Scenario: ActivityBar component is removed
- **WHEN** any breakpoint renders
- **THEN** no element with `data-testid="activity-bar"` and no `ActivityBar` component exists in the DOM.

## REMOVED Requirements

### Requirement: ActivityBar presence across breakpoints
**Reason:** The ActivityBar exposed exactly one panel (Projects) plus a Settings cog. A dedicated 40px vertical strip for a single toggle was redundant indirection; Sidebar becomes direct (always-on desktop, drawer elsewhere) and Settings relocates to the topbar.

**Migration:** `ActivityBar` file and tests are deleted. `WorkspaceLayout` renders `WorkspaceTopbar` with Settings cog at its right and (on tablet/mobile) a hamburger at its left. Sidebar visibility on desktop becomes unconditional.
