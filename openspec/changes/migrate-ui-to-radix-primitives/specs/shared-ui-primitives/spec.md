## ADDED Requirements

### Requirement: Shared visual tokens define focus ring and border

`packages/client/src/components/ui/_tokens.ts` SHALL export class-string constants used by every primitive in `ui/`:
- `focusRing` — focus-visible ring recipe
- `controlBorder` — default border recipe

Every interactive primitive in `ui/` SHALL compose its `focus-visible` classes from `focusRing`; primitives with the standard input-style border SHALL compose from `controlBorder`. Other recipes (control sizes, surface hover/active) are deferred until ≥2 primitives need a shared definition (YAGNI).

#### Scenario: All primitives share one focus ring recipe
- **WHEN** any `ui/` interactive primitive renders
- **THEN** its focus-visible classes resolve to the same string as `focusRing` from `_tokens.ts`

### Requirement: Form-control primitives use Radix

`ui/ToggleSwitch`, `ui/ChoicePills`, and `ui/EffortSwitch` SHALL be implemented on top of `@radix-ui/react-switch`, `@radix-ui/react-radio-group`, and `@radix-ui/react-slider` respectively. Hand-rolled `role`, `aria-checked` / `aria-selected`, keyboard handlers (Space/Enter/Arrow/Home/End), and focus tracking SHALL be removed in favor of Radix-supplied behavior.

#### Scenario: ToggleSwitch exposes a switch role
- **WHEN** `<ToggleSwitch checked={v} onChange={...} />` renders
- **THEN** `screen.getByRole('switch')` returns the control and `aria-checked` reflects `v`

#### Scenario: ChoicePills supports arrow-key navigation between options
- **WHEN** focus is on one pill and the user presses ArrowRight
- **THEN** focus moves to the next pill and `onChange` fires for the focused option on Space/Enter (Radix RadioGroup roving focus)

#### Scenario: EffortSwitch exposes a slider role
- **WHEN** `<EffortSwitch value="medium" onChange={...} />` renders with three effort levels
- **THEN** `screen.getByRole('slider')` returns the control with `aria-valuemin` / `aria-valuemax` / `aria-valuenow` set, and ArrowLeft/ArrowRight + Home/End move the value

### Requirement: Listbox/select widgets use Radix

`ModelPickerPopover` and `SessionHistory` retain hand-rolled `role="listbox"` + `role="option"` semantics — Radix `Select` does not support their search/filter UX and they are inline content rather than popover-shaped (positioning is parent-managed). They SHALL adopt the shared `focusRing` token to align focus signaling with Radix-migrated primitives.

`TopScopeSwitcher` SHALL use `@radix-ui/react-popover` for positioning (Radix `Select` does not support its search/typeahead filter); the inner option list SHALL still expose proper roles. `ModelPickerPopover` and `SessionHistory` are inline content (not popover-shaped, positioning handled by parent) and remain hand-rolled, but adopt the shared `focusRing` token.

#### Scenario: ModelPickerPopover options have option role
- **WHEN** the popover opens
- **THEN** each model entry is queryable via `getByRole('option')` and the active item carries `aria-selected="true"`

#### Scenario: SessionHistory closes on Escape
- **WHEN** the dropdown is open and the user presses Escape
- **THEN** Radix closes it and returns focus to the trigger (no manual document keydown listener in component code)

#### Scenario: TopScopeSwitcher search popover positions via Radix
- **WHEN** the switcher opens near the viewport edge
- **THEN** Radix Popover collision handling flips/shifts the panel and the component contains no `getBoundingClientRect()` positioning code

### Requirement: Migrated primitives preserve public API and visuals

Each migrated component SHALL keep its existing prop names, types, controlled-value contract, `data-testid`s on outer wrappers, and Tailwind class output. Visual rendering SHALL be unchanged modulo trivial Radix Slot wrapper markup.

#### Scenario: Existing call sites need no prop changes
- **WHEN** a consumer that currently uses `<ToggleSwitch checked={v} onChange={fn} />` is rebuilt against the migrated primitive
- **THEN** it compiles and behaves identically without prop edits

#### Scenario: Storybook visual diff is empty
- **WHEN** Storybook is rebuilt after a wave
- **THEN** stories for migrated primitives render with the same on-screen pixels (no intentional visual regression)
