## Why

`text-arbitrary-cleanup` cleared `text-[10px]` / `text-[11px]`. A wider grep finds **8 more arbitrary values** in `packages/client/src/components/` that violate token-first — and every single one has a Tailwind built-in equivalent. **No new token needs to be added.**

## What Changes

Replace 8 arbitrary occurrences with Tailwind built-ins:

| Arbitrary | File:line | Replacement | Notes |
|---|---|---|---|
| `text-[13px]` | ProjectCard:88 | `text-xs` | 1 px diff, body text |
| `text-[13px]` | TopScopeSwitcher:78 | `text-xs` | 1 px diff |
| `text-[12px]` | WorktreeRow:93 | `text-xs` | exact value |
| `h-[38px]` | WorkspaceTopbar:27 | `h-9` (= 36 px) | 2 px diff, topbar height |
| `ring-[rgba(0,0,0,0.2)]` | EffortSwitch:102 | `ring-black/20` | opacity modifier |
| `max-h-[480px]` | DiffModal:61, FilePreviewModal:124+135, SpecModal:77 | `max-h-120` (= 480 px) | Tailwind v4 integer spacing |
| `max-w-[180px]` | TopScopeSwitcher:83 | `max-w-45` (= 180 px) | Tailwind v4 integer spacing |

Broaden the guard test (`utils/__tests__/no-arbitrary-text.test.ts` → renamed `no-arbitrary-utility.test.ts`) so it scans **any `\w+-[\dpx]+]` arbitrary**, with explicit allow-list of legitimate categories: `calc(...)`, `min(...)`, `max(...)`, `var(...)`, `*vh`, `*vw`, `*em`, `data-[...]` selectors. Future PRs adding raw `text-[Npx]` / `w-[Npx]` / etc. fail the build.

Out of scope:
- `bg-[rgba(var(--color-text-rgb),0.35)]` (EffortSwitch:93) — keep until separate `--color-text-rgb` cleanup audits whether the RGB-split pattern is still load-bearing.
- chip-size token (`text-2xs`) — covered by parallel `text-2xs-chip-token` change.

## Capabilities

- **theme-token-adoption**: extend the no-arbitrary rule beyond text sizes — every `\w+-[Npx]` arbitrary must collapse to a Tailwind built-in or @theme token; arbitrary survives only for calc/min/max/var/vh/vw/em.
