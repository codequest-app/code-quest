## Context

Several interactive patterns in the client are hand-rolled: collapsible blocks (6+ files), a model picker listbox, a mention dropdown, and checkboxes. Each implements its own keyboard navigation, ARIA attributes, and focus management. Radix UI primitives already handle this correctly and are already a project dependency for other components (Popover, Dialog, Tabs, etc.).

## Goals / Non-Goals

**Goals:**
- Replace `CollapsibleBlock` with `@radix-ui/react-collapsible` — no visible behavior change, internal state managed by Radix
- Replace hand-rolled checkboxes in `FilterPopover` and `TaskChecklist` with `@radix-ui/react-checkbox` via a shared `ui/Checkbox` wrapper
- Replace hand-rolled `role="listbox"` in `ModelPickerPopover` with Radix Popover + accessible keyboard list
- Replace hand-rolled ArrowUp/Down in `MentionDropdown` with Radix Popover + accessible list
- Keep identical visual output — Radix primitives are unstyled, existing Tailwind classes are preserved

**Non-Goals:**
- Changing UX behavior or visual design
- Migrating scroll areas to Radix ScrollArea
- Adding new features to any of the migrated components

## Decisions

### D1: CollapsibleBlock → `@radix-ui/react-collapsible`

`Collapsible.Root` accepts `open`/`onOpenChange` props — drop-in for the current `useState(open)` pattern. `Collapsible.Trigger` replaces the `<button>` toggle. `Collapsible.Content` replaces the conditional render, giving Radix control over the animated mount/unmount. No API change to callers.

### D2: Shared `ui/Checkbox` wrapper

Rather than using `@radix-ui/react-checkbox` directly in each consumer, a thin `ui/Checkbox` wrapper (`checked`, `onCheckedChange`, `children`) keeps the styling in one place and matches the project's `ui/` primitive convention. Both `FilterPopover` and `TaskChecklist` switch to this wrapper.

### D3: ModelPickerPopover — keep Radix Popover, replace manual listbox

`@radix-ui/react-select` is designed for a single-value native-style select; the model picker has custom row rendering (model name + description). Better to keep `Popover.Root/Content` and replace the manual `activeIndex` state + `onKeyDown` handler with `@radix-ui/react-roving-focus` or a simple `[data-highlighted]` focus pattern. Use `role="listbox"` + `role="option"` with `aria-selected` managed by Radix focus primitives.

Simpler alternative (preferred): use Radix Popover + a `ul` with `role="listbox"`, and let the existing `onKeyDown` stay but remove the `activeIndex` state by using DOM focus directly (`focus()` on the option elements).

### D4: MentionDropdown — Radix Popover + DOM-focus list

Same pattern as D3. Replace the `activeIndex` ref with direct `focus()` calls on `li` elements. Each `li` gets `tabIndex={-1}` and `role="option"`. The `ArrowUp/Down` handler calls `element.focus()` instead of updating `activeIndex`. Radix Popover handles the portal and outside-click.

## Risks / Trade-offs

- [Risk] `Collapsible.Content` may introduce a CSS transition on height → Mitigation: set `data-state` animation to `none` in Tailwind or disable via `asChild` if needed
- [Risk] DOM-focus approach for listboxes loses the "hover highlights" that currently come from `activeIndex` state → Mitigation: use CSS `:focus` and `data-highlighted` to style the focused option instead of React state
- [Risk] `@radix-ui/react-checkbox` indeterminate state not used currently → no risk, just unused feature

## Migration Plan

1. Install `@radix-ui/react-collapsible` and `@radix-ui/react-checkbox` in `apps/web`
2. Migrate `CollapsibleBlock` (primitives.tsx) — verify all tool-use block consumers compile and render identically
3. Add `ui/Checkbox` wrapper, migrate `FilterPopover` and `TaskChecklist`
4. Migrate `ModelPickerPopover` listbox
5. Migrate `MentionDropdown`

Each step is independently testable and releasable on main.
