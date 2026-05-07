# shared-ui-primitives Specification

## Purpose
TBD - created by archiving change shared-ui-primitives. Update Purpose after archive.
## Requirements
### Requirement: Button primitive covers all button variants in the codebase

Every rendered `<button>` in `apps/web/src/components/` SHALL either use `ui/Button` or be a trivially-styled icon button. Any new button primitive variant SHALL be added to `ui/Button` rather than inlined.

#### Scenario: Primary dialog button
- **WHEN** a dialog needs a primary action button
- **THEN** it uses `<Button variant="primary" size="sm">` and renders with the accent background + white text tokens

#### Scenario: Destructive action
- **WHEN** a button triggers a destructive action
- **THEN** it uses `<Button variant="danger">` and renders with danger tokens

### Requirement: TextField primitive unifies input/textarea chrome

All `<input>` and `<textarea>` elements with the shared chrome (`bg-black/20` style) SHALL use `ui/TextField`.

#### Scenario: Input variant
- **WHEN** a form needs a short text input
- **THEN** `<TextField as="input" value={v} onChange={...} />` is used

#### Scenario: Textarea variant
- **WHEN** a form needs multi-line input
- **THEN** `<TextField as="textarea" rows={4} />` is used

### Requirement: SearchField primitive replaces hand-rolled search inputs

Any UI surface with "search" semantics (magnifier icon + input) SHALL use `ui/SearchField`.

#### Scenario: Palette search
- **WHEN** CommandPalette renders its search input
- **THEN** it uses `<SearchField placeholder="Search messages or type a command…" value={query} onChange={...} />`

### Requirement: PanelHeader unifies panel title bars

Panel components with a title + actions row SHALL use `ui/PanelHeader`.

#### Scenario: Raw event panel
- **WHEN** RawEventPanel renders its header
- **THEN** it uses `<PanelHeader title="Raw Events" actions={<CloseButton />} />`

### Requirement: SectionHeader unifies uppercase section labels

Small uppercase section dividers (e.g. "PROJECTS", "FILTERS", "MESSAGES") SHALL use `ui/SectionHeader`.

#### Scenario: Palette section
- **WHEN** PaletteCommandList renders a section header
- **THEN** it uses `<SectionHeader>Filters</SectionHeader>` (no inline style)

### Requirement: PopoverShell handles chrome + outside-click for popups

Popover-style components (dropdowns, filter popovers) SHALL wrap their content in `ui/PopoverShell` for chrome and outside-click dismissal. Positioning stays in the consumer.

#### Scenario: SessionDropdown
- **WHEN** SessionDropdown opens
- **THEN** `<PopoverShell onOutsideClick={close}>` wraps the list

### Requirement: Dialog supports size variants and replaces all overlay holdouts

`ui/Dialog`'s `DialogContent` SHALL accept `size="md" | "lg" | "fullscreen"`. Any component currently rendering `fixed inset-0 z-[1000]` overlay chrome SHALL be migrated to Dialog.

#### Scenario: Full-screen viewer
- **WHEN** ContentPreviewPanel opens
- **THEN** `<DialogContent size="fullscreen">` is used (not inline `fixed inset-0 z-[1000]`)

### Requirement: EmptyState action props are optional

`EmptyState` SHALL render without requiring `actionLabel` / `onAction`, so it can represent both "empty with CTA" and "empty read-only" states.

#### Scenario: Empty list without CTA
- **WHEN** MentionDropdown has no matches
- **THEN** it renders `<EmptyState icon={<SearchIcon />} message="No matches" />` with no action

### Requirement: Floating UI surfaces use Radix primitives

All floating UI surfaces in `apps/web/src/components/` (popovers, dropdown menus, context menus) SHALL use the matching Radix primitive (`@radix-ui/react-popover`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-context-menu`) rather than hand-rolled `position: fixed` + `getBoundingClientRect()` placement. Modals continue to use `@radix-ui/react-dialog`.

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

### Requirement: Checkbox primitive added to ui/ directory
A `ui/Checkbox` component SHALL exist in `apps/web/src/components/ui/Checkbox.tsx`, wrapping `@radix-ui/react-checkbox` with the project's visual style.

#### Scenario: Checkbox renders with label
- **WHEN** `<Checkbox checked={true} onCheckedChange={fn}>Label</Checkbox>` is rendered
- **THEN** a visible checkbox indicator and label text SHALL appear

#### Scenario: Checkbox accessible
- **WHEN** the checkbox is rendered
- **THEN** it SHALL have correct ARIA role and checked state via the Radix primitive

