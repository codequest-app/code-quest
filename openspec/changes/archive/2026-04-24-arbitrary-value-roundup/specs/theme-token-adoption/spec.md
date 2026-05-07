## ADDED Requirements

### Requirement: Pixel-valued Tailwind arbitraries collapse to built-in utilities

Component className strings under `apps/web/src/components/` SHALL NOT use Tailwind arbitrary values of the form `\w+-[Npx]` (any utility, any pixel value). Tailwind v4's integer spacing (`h-9`, `max-h-120`, `max-w-45`, etc.) and existing `@theme` tokens cover the design ranges; the 1–2 px gap allowed by the "差 1-2px 就近取" rule absorbs the rest.

The arbitrary form survives only for these explicit categories:

- `calc(...)` / `min(...)` / `max(...)` expressions
- `var(--…)` references (CSS-variable indirection)
- Viewport-relative units (`*vh`, `*vw`, `*dvh`)
- em-relative units (`*em`) — keeps font-axis scaling intact
- Radix data-attribute selectors (`data-[state=…]`, `data-[highlighted]`, etc.)
- Documented "intentional off-grid" cases (e.g. `backdrop-blur-[2px]` for sub-token glass effect)

#### Scenario: New component
- **WHEN** a new component file under `apps/web/src/components/` is added
- **THEN** its className strings contain no `\w+-[Npx]` literal-pixel arbitraries

#### Scenario: Existing arbitrary
- **WHEN** code review or grep finds `\w+-[Npx]` outside the allow-list
- **THEN** the value is replaced with the matching Tailwind built-in (integer spacing or named utility) in the same change

#### Scenario: Justified arbitrary
- **WHEN** the design genuinely needs a value Tailwind cannot express (calc, var, viewport, em, intentional off-grid)
- **THEN** the arbitrary is allowed, and the surrounding code carries a brief comment explaining why
