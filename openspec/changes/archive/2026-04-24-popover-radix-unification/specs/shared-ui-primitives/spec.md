## ADDED Requirements

### Requirement: Floating UI surfaces use Radix primitives

All floating UI surfaces in `packages/client/src/components/` (popovers, dropdown menus, context menus) SHALL use the matching Radix primitive (`@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-context-menu`) rather than hand-rolled `position: fixed` + `getBoundingClientRect()` placement. Modals continue to use `@radix-ui/react-dialog`.

A floating surface is anything that visually overlays the page anchored to a trigger element: branch pickers, message action menus, worktree / project / file context menus, live-session popovers, plan-comment popovers, and any future popover/menu added.

Non-floating positional UI (e.g. click-to-set sliders that use `getBoundingClientRect` only for hit-testing) is exempt.

#### Scenario: Trigger button opens a popover
- **WHEN** a button needs to open a positioned popover anchored to itself
- **THEN** it uses `<Popover.Root>` / `<Popover.Trigger asChild>` / `<Popover.Portal>` / `<Popover.Content>` and does not call `getBoundingClientRect()` to compute coordinates

#### Scenario: ⋯ icon opens a dropdown menu
- **WHEN** an icon button opens a list of actions
- **THEN** it uses `<DropdownMenu.Root>` / `<DropdownMenu.Trigger>` / `<DropdownMenu.Content>` / `<DropdownMenu.Item>` and Radix-emitted `role="menu"` / `role="menuitem"` semantics

#### Scenario: Right-click on a row opens a context menu
- **WHEN** a row supports right-click for actions
- **THEN** the row is wrapped in `<ContextMenu.Trigger>` and the menu content lives in `<ContextMenu.Content>` rather than a hand-managed `onContextMenu` + fixed-positioned `<div>`

#### Scenario: Popover near viewport edge
- **WHEN** a popover or menu would overflow the viewport on its preferred side
- **THEN** Radix's built-in collision handling flips or shifts it to remain visible (no manual flip logic in component code)
