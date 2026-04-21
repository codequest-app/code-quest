## Context

The slash palette (`CommandMenu` + `filterMenuItems`) currently handles three edge cases incorrectly:

1. `matchFirstToken` items use `String.prototype.includes` against the filter's first token; when that token is `""` (leading space in the filter), every `matchFirstToken` item matches.
2. The palette renders a container even when `flatItems` is empty, producing a blank floating surface for unmatched slash filters.
3. Enter in the compose is intercepted by the palette when `slashOpen`, even if the palette has nothing to select — users cannot send `/someunknowncmd` as a raw CLI slash command via Enter.

All three are local to the command-menu module and to how compose interacts with it. No server/protocol changes involved.

## Goals / Non-Goals

**Goals:**
- Empty filter first-token MUST NOT trigger matchFirstToken matches.
- Empty `flatItems` MUST hide the palette entirely.
- Enter with empty `flatItems` MUST fall through to `sendMessage`.

**Non-Goals:**
- Redesigning slash discovery (e.g. fuzzy match, substring scoring).
- Changing `getSlashQuery` regex.
- Any change to `Feature` shape / `ui` options.

## Decisions

### Decision 1: Guard empty first-token in `filterMenuItems`

**Change** (`menu-layout.ts`):

```ts
const matchText = i.matchFirstToken ? f.split(' ')[0] : f;
if (i.matchFirstToken && !matchText) return false;
return i.label.toLowerCase().includes(matchText);
```

**Why**: cheapest, localised fix. The semantic of `matchFirstToken` is "compare against the first token" — a *missing* first token should be a non-match, not a universal match.

**Alternative considered**: Trimming the filter before splitting. Rejected — leading space is meaningful to users typing `/ foo` (e.g. accidental space); silently trimming would change what "first token" means.

### Decision 2: Palette visibility derived from `flatItems.length`

`CommandMenu` currently gates its surface on `externalOpen` (i.e. `slashFilter != null`). Add: also require `layout.flatItems.length > 0`.

**Why**: a palette with zero items is just visual noise and steals keyboard focus / Enter. Hiding is consistent with how it behaves when `slashOpen` is false.

**Alternative considered**: render an "no matches" placeholder row. Rejected — doesn't solve issue 3 (Enter still captured), and the user already has the raw text they typed as visible feedback.

### Decision 3: Enter fallthrough when palette is effectively closed

Since Decision 2 makes the palette hide on empty `flatItems`, its Enter handler simply stops firing (not mounted). Compose's own Enter handler (submit) runs → `sendMessage("/test")` → registry.findSlashCommand → no match → `messageActions.sendMessage("/test")` → CLI receives it.

**Why**: falls out of Decision 2 for free; no separate plumbing needed. Verifies with an integration-level test that Enter on `/test` triggers send.

## Risks / Trade-offs

- **[Risk]** Decision 2 hides the palette the moment the user types something unmatchable, which some users might read as "the palette broke". **Mitigation**: user can still see their own text in compose; pressing Backspace brings the palette back as soon as there's a match. This mirrors VS Code's command palette behaviour.
- **[Risk]** Decision 1 changes behaviour for any other feature that relies on `matchFirstToken` with a filter starting in whitespace. **Mitigation**: `/btw` is currently the only feature with `matchFirstToken: true`; no other consumers to break.

## Migration Plan

None — client-only bug fix, ships in a single PR.
