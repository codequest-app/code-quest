## ADDED Requirements

### Requirement: Tiny text sizes (10–11 px) collapse into the existing `text-xs` token

Component className strings under `packages/client/src/components/` SHALL NOT use Tailwind arbitrary values `text-[10px]` or `text-[11px]`. Both collapse into the existing `text-xs` (12 px) token. Visual weight differences for uppercase chips MUST be controlled via `tracking`, opacity (`bg-x/10`, `border-x/30`), and color choice — not by sub-12px font sizes.

The token-first rule already documents the wider principle ("差 1-2px 就近取"); this requirement makes the 10/11 → xs collapse explicit so it survives future PR review.

#### Scenario: New component
- **WHEN** a new component is added under `packages/client/src/components/`
- **THEN** its className strings contain no `text-[10px]` or `text-[11px]`
- **AND** any visually "smaller than body" element uses `text-xs`

#### Scenario: Existing arbitrary text size
- **WHEN** code review or grep finds `text-[10px]` or `text-[11px]` in a component className
- **THEN** the value is replaced with `text-xs` in the same change

#### Scenario: Chip / badge needs visual reduction
- **WHEN** a chip or badge looks too heavy at `text-xs`
- **THEN** the design adjusts via `tracking-wider`, lower opacity background, lighter color, or smaller padding — not by reverting to `text-[10px]`
