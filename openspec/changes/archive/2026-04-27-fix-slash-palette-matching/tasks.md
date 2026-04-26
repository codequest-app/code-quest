## Tasks

### 1. Test — filterMenuItems empty-first-token guard
- [x] Added failing tests in `menu-layout.test.ts` for ` wiki` and `wiki` filters.

### 2. Implement — filterMenuItems guard
- [x] `menu-layout.ts`: guard `matchFirstToken && !matchText` before the `includes` check.

### 3. Test — palette hides on empty flatItems
- [x] Added integration tests in `CommandMenu.test.tsx` using `ComposeInput + CommandMenu` wrapper for `/zzznomatch`, `/btw`, `/ wiki` cases.

### 4. Implement — palette visibility gate
- [x] `CommandMenu.tsx`: render gate switched to `buttonOpen || (externalOpen && flatItems.length > 0)`.

### 5. Test — Enter fallthrough with no palette items
- [x] `/zzznomatch{Enter}` test asserts `claude.received('user')` gains one entry with `/zzznomatch`; compose cleared.

### 6. Implement — Enter fallthrough
- [x] `slashPaletteState` singleton in `command-menu/slash-palette-state.ts`; CommandMenu writes `itemsCount` in a `useLayoutEffect`; `ComposeInput.handleSlashKeyDown` falls through Enter when `itemsCount === 0`.

### 7. Update legacy test
- [x] `slash-command/typing.test.tsx` — "No matching commands" empty-state test rewritten to assert palette not rendered.

### 8. Run full suite + typecheck
- [x] `pnpm vitest run` — 1311/1311 pass.
- [x] `pnpm tsc --noEmit` — clean.
