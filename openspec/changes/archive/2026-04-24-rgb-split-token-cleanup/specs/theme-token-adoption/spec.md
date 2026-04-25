## ADDED Requirements

### Requirement: `--color-*-rgb` tokens are restricted to inline-style alpha and mode-aware shadow indirection

The `--color-*-rgb` family in `@theme` SHALL be limited to two specific use categories that Tailwind's opacity modifier cannot serve:

1. **Inline-style alpha**: `style={{ background: 'rgba(var(--color-X-rgb), 0.N)' }}` — Tailwind's `bg-X/N` is className-only.
2. **Mode-aware shadow indirection**: `--mode-accent-rgb: var(--color-X-rgb)` re-exports that change with provider mode (Claude / Gemini / Codex), where the alpha varies per state.

Any other use case (className-driven alpha) MUST use Tailwind's opacity modifier (`bg-accent/10`, `text-success/60`, etc.) instead.

#### Scenario: New className needs alpha
- **WHEN** a developer adds a className that needs partial opacity of a theme color
- **THEN** the className uses `bg-X/N` / `text-X/N` / `border-X/N` opacity modifier — not `bg-[rgba(var(--color-X-rgb),0.N)]`

#### Scenario: Inline style needs alpha
- **WHEN** the styling cannot live in a className (conditional inline `style`, animations with dynamic alpha)
- **THEN** `rgba(var(--color-X-rgb), 0.N)` is the sanctioned pattern, and the surviving `--color-X-rgb` token must remain in `@theme`

#### Scenario: RGB-split token has zero consumers
- **WHEN** an audit finds an `--color-X-rgb` token with no inline-style or mode-shadow consumer
- **THEN** the token is removed from `@theme`
