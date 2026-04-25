## Why

Several `ui/` primitives and dropdown/listbox components are hand-rolled with custom ARIA roles, keyboard handlers, focus tracking, and document-level click listeners. Radix UI primitives already cover these patterns with audited a11y, roving focus, portal positioning, and controlled/uncontrolled APIs. Migrating drops bespoke code, fixes subtle a11y gaps (missing `aria-selected` semantics, no Home/End nav, focus-trap edges), and aligns the component layer with our existing Radix usage (`Tabs`, `Dialog`, `DropdownMenu`, `Popover`, `ContextMenu`).

In parallel, the existing `ui/` primitives each ship their own focus-ring, size, and hover/active classes — so even after Radix migration the UI would not look consistent. To deliver real consistency, this change also extracts shared visual tokens (focus ring, control sizes, surface states) and applies them across all migrated primitives. **Behavior + visuals together.**

## What Changes

- **Wave 0 — extract shared visual tokens**: introduce `ui/_tokens.ts` (or Tailwind `@utility`) defining `focusRing`, `controlSize.{sm,md,lg}` (height + padding), `surfaceHover`, `surfaceActive`, `controlBorder`. Apply to existing `Button` / `IconButton` / `TextField` first as the reference; audit and unify any drift.
- Replace hand-rolled primitives with Radix equivalents in three waves, **each wave adopts Wave 0 tokens** so visual consistency lands incrementally:
  - **Wave 1 — small primitives**: `ToggleSwitch` → `@radix-ui/react-switch`, `ChoicePills` → `@radix-ui/react-radio-group`, `EffortSwitch` → `@radix-ui/react-slider`. All adopt `focusRing` + `controlSize`.
  - **Wave 2 — listbox/select**: `ModelPickerPopover`, `SessionHistory`, `TopScopeSwitcher` → `@radix-ui/react-select` (or Popover + RovingFocus where Select doesn't fit a search pattern). Items use `surfaceHover` / `surfaceActive`.
  - **Wave 3 — autocomplete/forms**: DEFERRED to a follow-up change (MentionDropdown autocomplete + textarea cursor coordination didn't fit any Radix primitive cleanly; QuestionContent migration moves with Wave 3).
- Add new Radix deps: `react-switch`, `react-radio-group`, `react-slider`, `react-select`, `react-checkbox`.
- Preserve all existing public props, controlled-state contracts, and `data-testid`s. **Visuals only change in token-driven directions (focus ring / size / hover) — no F.html-level redesign.**
- **Out of scope** (deferred):
  - `@radix-ui/themes`, `@radix-ui/colors`, `@radix-ui/react-icons` — rejected (conflicts with current Tailwind tokens / Heroicons).
  - Color-token / theme overhaul — separate change (token extraction here covers shape/state, not palette).
  - `FilterPopover` checkbox conversion, `AlertBanner` → `AlertDialog` — low value, defer.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `shared-ui-primitives`:
  - Form/listbox primitives switch from hand-rolled ARIA to Radix; behavior contracts unchanged, a11y guarantees strengthened.
  - **NEW**: shared visual tokens (`focusRing`, `controlSize`, `surfaceHover`, `surfaceActive`, `controlBorder`) defined once and reused by every primitive — replacing per-component drift.

## Impact

- **Code**: `packages/client/src/components/ui/{ToggleSwitch,ChoicePills,EffortSwitch}.tsx`; `packages/client/src/components/{ModelPickerPopover,SessionHistory,TopScopeSwitcher,MentionDropdown,QuestionContent}.tsx`; tests + stories for each.
- **Dependencies**: +5 `@radix-ui/react-*` packages (~ small bundle delta; tree-shakable).
- **Tests**: existing assertions on text/click should pass; some queries shifted from `data-testid` to `getByRole('switch'|'radio'|'slider'|'option')` where appropriate.
- **Visual**: no intentional change. Snapshot/Storybook diff expected to be empty modulo trivial markup nesting (e.g., extra `<span>` from Radix Slot).
- **Out of scope confirmation**: No `@radix-ui/themes` / `colors` / `react-icons`; no Tailwind token refactor; Heroicons stays.
