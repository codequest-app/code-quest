## Purpose

`WorkspaceLayout` is the top-level shell of the client UI. It owns the responsive layout (sidebar / chat tabs / right pane), the topbar, the dialogs (settings, add-project), and routes mouse/keyboard intent (toggle sidebar, toggle right pane) into open/close state. This spec captures the layout's structural invariants — particularly the single-tree contract that lets in-page state survive viewport-breakpoint crossings.

## Requirements

### Requirement: Layout renders a single component tree across all breakpoints

`WorkspaceLayout` SHALL NOT branch its JSX on `isDesktop` / `isMobile` / any breakpoint flag. A single unified component tree renders for every viewport width; breakpoint-specific differences (sidebar docked vs drawer, right pane docked vs slide-over) are expressed via Tailwind responsive modifiers (`md:`, `lg:`) and CSS transforms — never by mounting / unmounting sibling component subtrees.

Components MAY still *read* the current breakpoint for ARIA labelling or advisory logic, but MUST NOT use it to decide whether to render.

#### Scenario: Crossing the tablet→desktop breakpoint preserves state
- **WHEN** the user has a chat session open with draft text in the compose box, file tree expanded, and a dialog open, then resizes the window from 1023 px to 1025 px
- **THEN** the draft text, tree expansion, and dialog remain intact (no React unmount/remount of the chat / files / dialog subtrees)

#### Scenario: Crossing the mobile→tablet breakpoint preserves state
- **WHEN** the window resizes from 767 px to 769 px
- **THEN** the currently-rendered chat tab does not remount

#### Scenario: Sidebar drawer mode is CSS-driven
- **WHEN** the viewport is below the desktop breakpoint and the drawer is closed
- **THEN** the sidebar element is still present in the DOM (e.g. under `translate-x-[-100%]` or `hidden:lg:block` equivalent) — just visually hidden — rather than being absent from the tree

#### Scenario: No runtime branch on useBreakpoint for layout rendering
- **WHEN** `WorkspaceLayout` renders
- **THEN** the JSX contains no ternary whose result is a different React component/element based on a breakpoint value

### Requirement: Sidebar appears as a docked column on desktop and a slide-in drawer below desktop

The sidebar element SHALL render as a docked left column on viewports `≥ 1024px` and as a fixed-positioned slide-in overlay (with backdrop) on smaller viewports. Open state is governed by a single `leftOpen` boolean shared across breakpoints; CSS interprets the state appropriately for each mode.

#### Scenario: Desktop default
- **WHEN** the viewport is `≥ 1024px`
- **THEN** the sidebar is docked at the left of the workspace and visible by default

#### Scenario: Tablet/mobile default
- **WHEN** the viewport is `< 1024px`
- **THEN** the sidebar is a fixed slide-in drawer that starts closed (translated off-screen)

#### Scenario: Drawer dismissal
- **WHEN** the user clicks the backdrop or presses Esc while the drawer is open
- **THEN** the drawer closes via the same toggle state

### Requirement: Right pane appears as a docked column on desktop and a slide-in drawer below desktop

Mirror behavior of the sidebar, on the right edge. The right pane SHALL only mount when an active project cwd is selected (it has no useful content otherwise). Open state MUST be governed by the `rightOpen` boolean shared across breakpoints.

#### Scenario: No active project
- **WHEN** there is no active project cwd
- **THEN** no right pane element is rendered and the topbar's "Toggle right pane" trigger is hidden or disabled

#### Scenario: With active project on desktop
- **WHEN** the viewport is `≥ 1024px` and there is an active project cwd
- **THEN** the right pane is docked at the right of the workspace and visible by default

#### Scenario: With active project below desktop
- **WHEN** the viewport is `< 1024px` and there is an active project cwd
- **THEN** the right pane is a fixed slide-in drawer that starts closed

### Requirement: Toggle buttons drive the same open state at every breakpoint

The topbar SHALL expose one `Toggle sidebar` button and one `Toggle right pane` button. Clicking each MUST flip the corresponding `leftOpen` / `rightOpen` boolean. CSS chooses the visual interpretation (collapse docked column vs slide drawer in/out) per viewport.

#### Scenario: Click on desktop collapses/expands docked column
- **WHEN** the user clicks `Toggle sidebar` at `≥ 1024px`
- **THEN** the sidebar's column width animates between full and 0 (or equivalent collapse)

#### Scenario: Click below desktop slides drawer in/out
- **WHEN** the user clicks `Toggle sidebar` at `< 1024px`
- **THEN** the drawer slides in/out via `translate-x`

### Requirement: Workspace shell uses CSS for responsive layout, not a panel-resize library

The workspace shell SHALL NOT depend on `react-resizable-panels` (or equivalent JS-driven panel libraries) for the sidebar / main / right-pane composition. The library would force the sidebar/right-pane to be flex Panels — incompatible with their `<lg:` slide-in-drawer mode, which is the structural cause that loses in-page state across breakpoints.

`react-resizable-panels` MAY still be used inside leaf surfaces (e.g. `TabContainer`'s chat-split feature on desktop) where the breakpoint switch doesn't apply.

Per-pane drag-to-resize of the sidebar / right-pane widths is intentionally NOT a current capability; if reintroduced, the implementation must use CSS variables or comparable mechanism that doesn't require unmounting the panes.

#### Scenario: Workspace layout file imports
- **WHEN** `packages/client/src/components/WorkspaceLayout.tsx` is read
- **THEN** it does not import `Panel`, `PanelGroup`, `PanelResizeHandle`, or `ImperativePanelHandle` from `react-resizable-panels`

### Requirement: Active project container has min-w-0

The active project's tab container SHALL carry the `min-w-0` Tailwind class so its content (compose input, terminal output, etc.) does not force the parent flex row wider than the viewport on small screens.

#### Scenario: Mobile active project container
- **WHEN** the viewport is `< 768px` and a project is active
- **THEN** the element with `data-testid="project-container"` has the `min-w-0` class
