## Why

The codebase carries **27 occurrences** of `text-[10px]` / `text-[11px]` Tailwind arbitrary values across 16 component files. Most accumulated in recent SpecPane / dialog work where designers wanted "smaller than body" chips and hints.

Per `tailwind-v4` skill (Design flow: token-first):
- arbitrary `[Npx]` should only survive for `calc(...)`, dynamic CSS variables, or "intentional off-grid with clear reason"
- "差 1-2px 就近取（design system 一致性 > pixel-perfect）"

10–12px is exactly the band the rule targets — `text-xs` (12px) is the existing token; the 1-2 px gap doesn't justify a new `--text-2xs`. Industry refs (shadcn/ui, Radix Dashboard examples, Linear, cal.com) use `text-xs` for chip badges; 12px is the accessibility-friendly floor for body text.

## What Changes

- **No new tokens.** `text-xs` (12px) absorbs every current `text-[10px]` / `text-[11px]` use.
- Replace all 27 occurrences across the 16 affected components with `text-xs`.
- For uppercase chips (Spec `Ready` / `Archive` badges) the slight visual heft increase is acceptable — visual weight is already controlled by `bg/10` + `border/30` + `tracking-wider`.
- Update the `tailwind-v4` skill's "優先內建 utility" guidance with a callout: text sizes 10–11 px are NOT first-class tokens; collapse into `text-xs`.

Explicitly out of scope:
- `text-[<number>px]` other than 10/11 (no other arbitrary text sizes turned up in the grep).
- Color / spacing / radius arbitrary values (separate audit).
- Pill-badge `@utility` extraction (covered by future `pill-badge-utility` change).

## Capabilities

- **theme-token-adoption**: extend the no-arbitrary-text rule — text-[10px] and text-[11px] are NOT permitted; collapse to `text-xs`.
