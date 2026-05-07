## ADDED Requirements

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
