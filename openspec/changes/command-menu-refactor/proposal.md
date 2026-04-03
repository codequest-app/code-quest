## Why

CommandMenu.tsx is 705 lines — a god component mixing menu item construction (buildMenuItems, 226 lines), keyboard navigation, filtering, section rendering, and multiple inline sub-components. Hard to test individual sections and maintain.

## What Changes

- Extract `buildMenuItems` into a separate utility file `command-menu-items.ts`
- Extract section renderer components (MenuSection, MenuItemRow) into `command-menu-parts.tsx`
- Keep `CommandMenu` as orchestrator (~200 lines): state, keyboard handling, filtering, layout

## Capabilities

### New Capabilities

- `command-menu-structure`: CommandMenu split into utility (item building) + parts (rendering) + orchestrator (state/keyboard)

### Modified Capabilities

## Impact

- `packages/client/src/components/CommandMenu.tsx` — reduced to orchestrator
- `packages/client/src/components/command-menu-items.ts` — new: buildMenuItems utility
- `packages/client/src/components/command-menu-parts.tsx` — new: section/item renderers
- No API changes, no behavior changes
