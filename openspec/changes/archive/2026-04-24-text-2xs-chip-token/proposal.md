## Why

`text-arbitrary-cleanup` collapsed `text-[10px]` / `text-[11px]` into `text-xs` (12 px). Hands-on review shows the **uppercase tracked chips** on SpecPane (`Ready`, `Archive`, task pill) read too heavy at 12 px — they compete with the change-name (also `text-xs`) instead of subordinating to it.

There's also a precedent for 10 px in the codebase already: the `section-label` `@utility` hardcodes `font-size: 10px` for section headings. So 10 px is a real visual hierarchy slot we've been informally using.

Promote it to a proper token: `--text-2xs: 0.625rem` in `@theme`. Use it for the chips AND clean up `section-label`'s hardcoded value.

## What Changes

- Add `--text-2xs: 0.625rem;  /* 10px — chip / section-label scale */` to `@theme` in `packages/client/src/App.css`. Tailwind v4 generates the `text-2xs` utility automatically.
- `SpecPane.tsx`: change `text-xs` → `text-2xs` on three uppercase / chip elements:
  - `Ready` badge
  - `Archive` button (uppercase tracked)
  - Task progress pill `1/2` (font-mono numerals)
- `App.css` `@utility section-label`: replace literal `font-size: 10px;` with `font-size: var(--text-2xs);` — same value, now sourced from the token.
- Guard test (`no-arbitrary-utility.test.ts` after the parallel `arbitrary-value-roundup`) is unaffected — `text-2xs` is a token, not an arbitrary.
- Skill update (`tailwind-v4`): the chip-heaviness-mitigation note grows an "or use the dedicated `text-2xs` token for chip-style uppercase tracked badges" exception.

Explicitly out of scope:
- `text-2xs` on body / link / hint text — those stay `text-xs`. The new token is **chip / section-heading only**.
- Other size tokens (`text-3xs`, `text-2sm`, etc.) — only one new slot, only when a real use case demands it.

## Capabilities

- **theme-token-adoption**: add `text-2xs` (10 px) as a sanctioned token for uppercase tracked chip badges and section headings; consolidate the previously-hardcoded `section-label` 10 px to flow through the token.
