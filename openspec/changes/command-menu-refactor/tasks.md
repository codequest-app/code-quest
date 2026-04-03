## Tasks

- [x] **Task 1: Extract buildMenuItems to command-menu-items.ts** — Move MenuItem, MenuSections, BuildMenuItemsParams interfaces + buildMenuItems function + DEFAULT_EFFORT_LEVELS to new file. TDD: write tests for buildMenuItems first (slash commands section, model section, etc.), then extract. Verify CommandMenu tests still pass.
- [x] **Task 2: Extract section renderers to command-menu-parts.tsx** — Extract MenuSection and MenuItemRow components from CommandMenu render body. TDD: verify existing CommandMenu rendering tests pass after extraction.
- [x] **Task 3: Verify CommandMenu.tsx is under 250 lines** — Count lines, verify all existing tests pass, no behavior changes.
