## Why

The slash command palette has three inconsistent matching/submit behaviors that break user expectations:

1. `matchFirstToken` features (e.g. `/btw`) falsely match when the filter's first token is empty (typing `/ foo` with a leading space makes every matchFirstToken item appear).
2. When the filter yields zero items, the palette still renders as an empty surface instead of dismissing.
3. When the filter yields zero items, pressing Enter is swallowed by the palette; the user cannot submit their raw slash text as a plain message.

## What Changes

- `filterMenuItems` (command-menu): skip `matchFirstToken` items whose filter first-token is empty — empty string must not be treated as a universal match.
- `CommandMenu` visibility: when `slashOpen` is true but the computed `flatItems` is empty, the palette hides (same as slash-closed state). No empty-popup surface.
- Enter-to-submit fallthrough: when the palette is open with zero items, Enter submits the compose value via the normal `sendMessage` path instead of being captured by the palette's select-first behavior.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `command-menu-structure`: tighten matchFirstToken filter, hide palette on empty results, let Enter fall through when no items.

## Impact

- `packages/client/src/components/command-menu/menu-layout.ts` — `filterMenuItems` empty-first-token guard.
- `packages/client/src/components/command-menu/CommandMenu.tsx` — visibility + Enter key fallthrough.
- Existing tests in `command-menu/__tests__/` need new cases; no migration / no schema changes.
