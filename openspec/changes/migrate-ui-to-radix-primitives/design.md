## Context

`packages/client` already uses Radix for `Tabs`, `Dialog`, `DropdownMenu`, `Popover`, `ContextMenu` — but a handful of widget primitives and dropdowns predate that migration. They hand-roll `role="switch" | "radio" | "listbox" | "option" | "checkbox"`, manual Arrow/Home/End/Esc handlers, document-level click listeners, and ad-hoc focus tracking. Each has subtle a11y gaps (no roving tabindex, missing `aria-activedescendant`, focus-trap edge cases on Esc, viewport-collision is hardcoded).

The `shared-ui-primitives` spec already mandates Radix for *floating* surfaces (popover/menu/context-menu/modal). This change extends that contract to *form* primitives and *listbox*-shaped widgets.

Visual styling stays identical — Radix is unstyled. F.html alignment, Tailwind tokens, and existing classes are untouched.

## Goals / Non-Goals

**Goals:**
- Replace bespoke ARIA + keyboard code with Radix in three waves (small primitives → listbox/select → autocomplete/forms).
- **Extract shared visual tokens (focus ring / control size / surface hover+active / border) and apply across all `ui/` primitives so the component layer renders consistently.**
- Keep public component APIs (props, controlled value, `onChange`, `data-testid`s, sizes) backwards-compatible.
- Strengthen a11y: roving focus, `aria-selected` / `aria-checked`, Home/End/Esc, portal positioning with collision avoidance.
- Drop document-level click listeners; let Radix handle outside-click.

**Non-Goals:**
- Color/palette overhaul — token extraction here covers *shape and state* (sizes, focus ring shape, hover/active surfaces), not theme colors. The existing `bg-bg` / `text-text-bright` / `accent` palette stays.
- F.html-level visual redesign of any specific primitive.
- Adopting `@radix-ui/themes`, `@radix-ui/colors`, `@radix-ui/react-icons` — explicitly rejected (conflicts with current Tailwind tokens / Heroicons).
- `FilterPopover` checkbox migration, `AlertBanner` → `AlertDialog` (low value, deferred).
- Migrating all icon buttons to a Radix-style component.

## Decisions

### D0. Wave 0 first — extract visual tokens before any Radix migration
Define `packages/client/src/components/ui/_tokens.ts` exporting class-string constants:
- `focusRing` — single `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent` recipe
- `controlSize.sm/md/lg` — height + horizontal padding pairs (e.g. `'h-7 px-2 text-xs'`, `'h-8 px-3 text-sm'`, `'h-9 px-4 text-sm'`)
- `surfaceHover` — `'hover:bg-white/5'`
- `surfaceActive` — `'bg-bg text-text-bright'` (selected/active state)
- `controlBorder` — `'border border-border'`

Apply Wave 0 first to existing `Button` / `IconButton` / `TextField` / `Dialog` buttons as the **reference implementation**; resolve any drift (e.g., Button's current focus ring vs the new shared one) in this wave so later waves have one source of truth to reuse.
- **Why**: without tokens, Wave 1-3 each invent their own focus ring / size scale — Radix migration finishes with the same inconsistency we started with. Tokens first means each Radix migration *also* lands a consistency win.
- **Alternative**: do tokens after migration. Rejected — would require re-touching every migrated file, doubling churn.
- **Alternative**: use `cva` (class-variance-authority). Deferred — flat constants are simpler for a small token set; can adopt cva later if the set grows.

### D1. Three waves, three commits — not one big bang
Order: Wave 0 (tokens) → (1) small primitives (`ToggleSwitch`, `ChoicePills`, `EffortSwitch`), (2) listbox/select (`ModelPickerPopover`, `SessionHistory`, `TopScopeSwitcher`), (3) autocomplete/forms (`MentionDropdown`, `QuestionContent`).
- **Why**: smaller blast radius per commit; each wave reviewable in isolation; Wave 1 builds Radix-pattern muscle before tackling combobox-shaped widgets.
- **Alternative**: single squash commit. Rejected — too many tests churn at once, harder to bisect regressions.

### D2. `Tabs.Trigger asChild` precedent governs `asChild` use
For primitives where the visual element must remain a `<div>` or non-default tag (e.g., to nest interactive children, or to keep current Tailwind class chain), use `asChild` and add explicit `biome-ignore lint/a11y/{noStaticElementInteractions,useKeyWithClickEvents}` with the same comment template used in `TabBar.tsx`.
- **Why**: matches established pattern; lint warnings are real (lint can't see Radix Slot runtime injection) but suppression is justified and documented.

### D3. `TopScopeSwitcher` and `MentionDropdown` use Popover + manual list, not Select
Radix `Select` is for **single-value picker without filtering**. These two have **search/filter** semantics → use `@radix-ui/react-popover` for positioning + a roving-focus list inside. Optionally adopt [`cmdk`](https://cmdk.paco.me/) for the list if list logic gets large.
- **Why**: Radix `Select` doesn't support typeahead-filter; forcing it would require working around its internals.
- **Alternative**: full `cmdk` adoption now. Deferred — Wave 3 can decide based on Wave 2 experience.

### D4. Test queries shift to roles, not testids
Migrated components SHALL be queried via `getByRole('switch'|'radio'|'slider'|'option'|'checkbox')` in tests. Existing `data-testid`s on the *outer wrapper* stay (other code may depend on them) but are de-emphasized for Radix-managed inner elements.
- **Why**: roles are a contract; testids are implementation detail. Radix internal DOM may shift between versions.

### D5. No prop API breakage
Every migrated primitive keeps its current props verbatim. Internal implementation switches to Radix; consumers are untouched.
- **Why**: 50+ call sites across stories/tests; rippling prop changes balloons scope.

## Risks / Trade-offs

- **[Risk] Radix Slot wrapper changes DOM structure** → snapshots / class queries may break.
  - *Mitigation*: each wave runs full client test suite; visual diffs reviewed in Storybook.
- **[Risk] `@radix-ui/react-slider` step/range semantics differ from `EffortSwitch` 3-position discrete switch** → may need `step={1}` + `min/max` mapping.
  - *Mitigation*: Wave 1 validates with current 3-effort test cases first; if Slider is wrong fit, fall back to `ToggleGroup` and document.
- **[Risk] `MentionDropdown` autocomplete flow regresses (cursor position, partial-match)** → user-visible bug in chat composer.
  - *Mitigation*: Wave 3 last; covered by existing compose tests; manual smoke required before merge.
- **[Risk] Bundle size grows by ~5 small Radix packages** → low concern (~<10KB tree-shaken).
  - *Mitigation*: accept; Radix packages share `@radix-ui/react-primitive` peer.
- **[Trade-off] Three commits, one branch — not three branches** → keeps OpenSpec change unit but loses ability to ship Wave 1 alone.
  - *Mitigation*: if Wave 2/3 stalls, Wave 1 commit can still be cherry-picked.

## Migration Plan

1. Wave 1 (small): install `react-switch`, `react-radio-group`, `react-slider`. Migrate + test + commit.
2. Wave 2 (listbox/select): install `react-select`. Migrate + test + commit.
3. Wave 3 (autocomplete/forms): install `react-checkbox`. Migrate + test + commit.
4. Run full client suite + Storybook visual review after each wave.
5. Squash-merge to main on completion (matches prior change pattern).

Rollback: revert per-wave commit if a regression surfaces post-merge.

## Open Questions

- Wave 3: adopt `cmdk` for `MentionDropdown` list, or roll a thin RovingFocusGroup-based list? Decide at Wave 3 start.
- Should `ToggleSwitch` rename to `Switch` to match Radix vocabulary? Defer — would touch many import sites for cosmetic gain.
