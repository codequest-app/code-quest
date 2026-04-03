## Overview

Split 705-line CommandMenu into 3 files by responsibility.

## Architecture

```
CommandMenu.tsx (orchestrator, ~200 lines)
  ├── imports command-menu-items.ts (pure utility, ~230 lines)
  │     └── buildMenuItems(params) → MenuSections
  └── imports command-menu-parts.tsx (renderers, ~180 lines)
        ├── MenuSection({ label, items, activeId, onSelect })
        └── MenuItemRow({ item, isActive, onSelect })
```

## Extraction Plan

### 1. command-menu-items.ts
- Move: `MenuItem`, `MenuSections`, `BuildMenuItemsParams` interfaces
- Move: `buildMenuItems` function
- Move: `DEFAULT_EFFORT_LEVELS` constant
- Export all

### 2. command-menu-parts.tsx
- Extract inline section rendering from CommandMenu render body
- Each section (context, model, customize, tools, slash, settings, support) uses same pattern: header + items list
- Extract `MenuItemRow` for individual item rendering (currently inline JSX in .map())

### 3. CommandMenu.tsx (keep)
- State: filter, activeIndex, sections visibility
- Keyboard: ArrowUp/Down/Enter/Escape/Tab
- Filtering: merge sections → flat list → filter by query
- Layout: container + filter input + scrollable sections

## Key constraint
- **TDD**: extract buildMenuItems first with tests, then extract parts, verify existing CommandMenu tests pass throughout
- **No behavior changes**: pure refactor, expect assertions don't change

## Files Changed

| File | Change |
|------|--------|
| `CommandMenu.tsx` | Remove buildMenuItems + inline renderers, import from new files |
| `command-menu-items.ts` | New: buildMenuItems utility |
| `command-menu-parts.tsx` | New: MenuSection + MenuItemRow components |
