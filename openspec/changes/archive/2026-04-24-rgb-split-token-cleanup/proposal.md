## Why

The codebase carries 6 `--color-*-rgb` tokens (accent, border, shadow, button, text, hover-tint) — a legacy split where the RGB triple is stored separately so it can be composed into `rgba(var(--X-rgb), 0.N)` for alpha. Tailwind v4's opacity modifier (`bg-accent/10`) is the modern idiom and obviates the split for utility-class consumers.

Audit shows the RGB-split remains load-bearing in two real situations Tailwind opacity modifier **cannot** replace:

1. **Inline style with dynamic alpha**: `RawEventFilterBar.tsx` builds `style={{ background: 'rgba(var(--color-accent-rgb), 0.08)' }}`. Tailwind opacity modifier only works inside className strings, not inline `style`.
2. **Mode-aware shadow indirection**: `ChatInputArea.tsx` uses `focus-within:shadow-[0_1px_2px_rgba(var(--mode-accent-rgb),var(--mode-shadow-alpha,0))]`. The `--mode-accent-rgb` re-export changes per provider (Claude / Gemini / Codex); collapsing back to a single color token would lose the mode-aware behavior.

So the goal is not "remove all RGB-split" — it's "shrink to the minimal load-bearing set, document why it survives, and stop using it where opacity modifier already wins".

## What Changes

- **Audit + document first**: add a comment block above the `--color-*-rgb` declarations in `App.css` listing the two surviving categories (inline-style alpha, mode-aware shadow) and which tokens each needs.
- **Migrate `EffortSwitch.tsx` line 93**: `bg-[rgba(var(--color-text-rgb),0.35)]` → `bg-text/35` (uses className opacity modifier — not blocked by inline-style limitation). Verify visually identical.
- **Keep**: `--color-accent-rgb`, `--color-shadow-rgb`, `--color-text-rgb` (used by `--tw-prose-kbd-shadows` and inline styles), `--color-button-rgb` (mode-accent re-export), `--color-hover-tint-rgb` (if any inline alpha consumers — verify, drop if zero).
- **Remove**: `--color-border-rgb` and any `*-rgb` token with zero remaining consumers after the className migration.
- Update the comment in `App.css` (currently "use like `rgba(var(--color-accent-rgb), 0.2)`") to "**only** for inline `style` alpha or mode-aware shadow — for className use the `bg-X/N` opacity modifier".

Explicitly out of scope:
- Migrating `RawEventFilterBar.tsx`'s inline-style to Tailwind classes (would require restructuring the conditional styling in that file — separate change).
- Migrating `ChatInputArea.tsx`'s mode-aware shadow (would need reworking the per-provider mode dispatch — separate change).
- Adding any new RGB-split tokens.

## Capabilities

- **theme-token-adoption**: shrink `--color-*-rgb` to the minimal load-bearing set; document the two legitimate categories (inline-style alpha, mode-aware shadow indirection); className-style alpha must use Tailwind opacity modifier.
