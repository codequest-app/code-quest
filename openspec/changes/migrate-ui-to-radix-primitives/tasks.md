## 0. Wave 0 — Extract shared visual tokens

- [x] 0.1 Audited: Button/IconButton lacked focus-visible ring; TextField used border-only focus; EffortSwitch had ring-2 — three different recipes
- [x] 0.2 Created `_tokens.ts` with `focusRing`, `controlSize.{sm,md,lg}`, `surfaceHover`, `surfaceActive`, `controlBorder`
- [x] 0.3 Token-shape test (`_tokens.test.ts`) — 5 tests
- [x] 0.4 `Button.tsx` composes `focusRing` + `controlBorder` (secondary variant); kept its own xs/sm/md paddings (CTA scale ≠ form-control scale)
- [x] 0.5 `IconButton.tsx` composes `focusRing`
- [x] 0.6 `TextField.tsx` composes `focusRing` + `controlBorder` on top of existing border-color focus
- [ ] 0.7 Storybook visual review — drift resolved, no regression (deferred to manual smoke before merge)
- [x] 0.8 Full client test suite green: 1679/1679
- [ ] 0.9 Commit: `refactor(ui): extract shared visual tokens (focus ring / size / surface)`

## 1. Wave 1 — Small primitives (Switch / RadioGroup / Slider)

- [x] 1.1 Added deps: `@radix-ui/react-switch`, `react-radio-group`, `react-slider`
- [x] 1.2 ToggleSwitch test: role="switch" + aria-checked + Space toggle + display-only branch (5 tests)
- [x] 1.3 ToggleSwitch on `Switch.Root`/`Switch.Thumb` + `focusRing`; display-only branch kept as div (avoids button-in-button when nested in menu items)
- [x] 1.4 ChoicePills test: role="radio" + aria-checked + click + radiogroup horizontal (4 tests)
- [x] 1.5 ChoicePills on `RadioGroup.Root`/`Item` + `focusRing` (kept accent-strong selected style — semantically distinct from neutral surfaceActive)
- [x] 1.6 EffortSwitch test rewrite: role="slider" + aria-valuemin/max/now + Arrow/Home/End + tick count + disabled (7 tests). Old CSS-formula assertions replaced with behavior assertions.
- [x] 1.7 EffortSwitch — Radix Slider attempted, **reverted to hand-rolled**: visual contract (thumb-edges flush with pill, fill always present) doesn't fit Radix Slider's center-aligned thumb / 0-width-Range model; Radix click-to-value also caused position jumps. Kept hand-rolled impl, layered `focusRing` token, added Home/End + `aria-disabled`. Added click-mapping regression tests.
- [x] 1.8 Updated `trailing-renderers.test.tsx` to query aria-checked instead of `<input>.checked` (Radix radio is `<button>`)
- [ ] 1.9 Storybook visual review (deferred to manual smoke before merge)
- [x] 1.10 Full client test suite green: 1688/1688
- [ ] 1.11 Commit: `refactor(ui): migrate ToggleSwitch/ChoicePills/EffortSwitch to Radix`

## 2. Wave 2 — Listbox / Select widgets

- [x] 2.1 Skipped Radix Select — neither ModelPicker/SessionHistory/TopScopeSwitcher fits Select shape (search not supported; ModelPicker/SessionHistory are inline content not popover-shape). Used Radix Popover for TopScopeSwitcher; tokens-only for the others.
- [x] 2.2-2.3 ModelPickerPopover: kept hand-rolled (inline content, parent-managed positioning); applied `focusRing` token to all interactive items.
- [x] 2.4-2.5 SessionHistory: kept hand-rolled (panel content, not popover); applied `focusRing` to search input.
- [x] 2.6-2.7 TopScopeSwitcher: migrated to `@radix-ui/react-popover` (`Popover.Root`/`Trigger asChild`/`Portal`/`Content`); dropped `wrapRef` + document mousedown/keydown listeners (Radix supplies outside-click + Escape). Inner `role="listbox"` preserved for test queries. Added outside-click regression test.
- [ ] 2.8 Storybook visual review (deferred to manual smoke before merge)
- [x] 2.9 Full client test suite green: 1694/1694
- [ ] 2.10 Commit: `refactor(ui): TopScopeSwitcher → Radix Popover; tokens for ModelPicker/SessionHistory`

## 3. Wave 3 — Autocomplete + form inputs (DEFERRED)

**Deferred to a follow-up change.** QuestionContent has a clear Radix
fit (Checkbox + RadioGroup); MentionDropdown is an autocomplete with
cursor-position-sensitive insertion that no current Radix primitive
covers cleanly (cmdk would add a new dep + tricky textarea coordination).
Decided to ship Waves 0-2 as-is and re-scope Wave 3 separately.


- [ ] 3.1 Add dep: `@radix-ui/react-checkbox` (decide on `cmdk` at start of wave; add if adopted)
- [ ] 3.2 RED: role-based assertions for `MentionDropdown.test.tsx` — option role, ArrowDown moves active, Esc closes
- [ ] 3.3 GREEN: rewrite `MentionDropdown.tsx` on Radix `Popover` + RovingFocusGroup (or `cmdk`); preserve cursor/insertion semantics
- [ ] 3.4 Manual smoke: type `@` in composer → mention list → arrow + Enter inserts; Escape closes
- [ ] 3.5 RED: role assertions for `QuestionContent.test.tsx` (`getByRole('checkbox')` / `getByRole('radio')`, Space toggles)
- [ ] 3.6 GREEN: rewrite multi-choice path on `Checkbox.Root`; single-choice path on `RadioGroup`
- [ ] 3.7 Storybook visual review (QuestionContent stories)
- [ ] 3.8 Full client test suite green
- [ ] 3.9 Commit: `refactor(ui): migrate MentionDropdown/QuestionContent to Radix`

## 4. Verify + finalize

- [ ] 4.1 Full repo test suite green (`pnpm -w test`)
- [ ] 4.2 Touched files biome-clean
- [ ] 4.3 Grep clean: no remaining `role="switch|radio|listbox|option|checkbox"` in migrated files (only Radix-injected)
- [ ] 4.4 Grep clean: no bespoke `focus-visible:ring-` / `h-7 px-` / `hover:bg-white/5` literals in `ui/` primitives — all flow through `_tokens.ts`
- [ ] 4.5 `openspec validate migrate-ui-to-radix-primitives --strict` → green
- [ ] 4.5 Manual smoke checklist:
  - effort slider keyboard nav
  - model picker Esc closes
  - top scope switcher near viewport edge collides correctly
  - mention dropdown insertion still works
- [ ] 4.6 PR description references this proposal
