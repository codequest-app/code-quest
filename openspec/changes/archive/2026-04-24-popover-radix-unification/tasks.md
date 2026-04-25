## Tasks

### 1. Dependencies
- [ ] `pnpm --filter @code-quest/client add @radix-ui/react-popover @radix-ui/react-dropdown-menu @radix-ui/react-context-menu`

### 2. Popover migrations (TDD per file, keep existing tests green)
- [ ] `BranchPopover` → `Popover.Root/Trigger/Portal/Content`. Custom filter input + arrow-key nav stay inside `Content`. Update `GitPane.tsx`: drop `branchPopover` state + `openBranchSwitcher`; "switch ⌄" becomes `<Popover.Trigger asChild>`; load branches lazily on `onOpenChange(true)`.
- [ ] `LiveSessionPopover` → Popover. Update `TopbarLiveSessions.tsx`: drop manual `getBoundingClientRect`; trigger button becomes `<Popover.Trigger asChild>`.
- [ ] `PlanCommentPopover` → Popover. Replace `useFloating` with Radix Popover; preserve virtual-element anchoring (Radix supports `<Popover.Anchor virtualRef>` via `Anchor` element).

### 3. DropdownMenu migrations (TDD)
- [ ] `MessageActionsMenu` → `DropdownMenu.Root/Trigger/Portal/Content/Item`. Drop `createPortal` + manual position; ⋯ button becomes `Trigger`.
- [ ] `WorktreeContextMenu` ⋯ icon path → DropdownMenu. Extract menu items into a shared `<WorktreeMenuItems>` render so the same items mount under both DropdownMenu and ContextMenu (next task).

### 4. ContextMenu migrations (TDD)
- [ ] `WorktreeContextMenu` right-click path → `ContextMenu.Root/Trigger/Portal/Content/Item` wrapping `WorktreeRow`. Drop `onContextMenu` coord capture in `WorktreeRow.tsx`.
- [ ] `ProjectContextMenu` → ContextMenu. Update `ProjectCard.tsx`: drop manual coord capture.
- [ ] Extract FileTree inline menu → new `FileTreeContextMenu.tsx` using ContextMenu. Update `FileTree.tsx`: wrap row in `<ContextMenu.Trigger asChild>`; remove `contextMenu` state, `setContextMenu`, the `useEffect` close handler, and the inline `<div style={{ left, top }}>`.

### 5. Cleanup & verification
- [ ] Remove now-unused custom positioning helpers / portal wrappers.
- [ ] Confirm no other consumers import removed internals.
- [ ] All existing tests pass without semantic changes (role assertions still match — Radix emits `menu` / `menuitem` automatically).
- [ ] `openspec validate popover-radix-unification --strict`.
- [ ] Full typecheck + test suite green (client + server).

### 6. Out-of-scope reminder (post-merge)
- [ ] After merging, **remind the user** of surfaces intentionally excluded so they can decide whether to follow up:
  - `EffortSwitch` — not a floating surface (click-to-set position slider); uses `getBoundingClientRect` for hit-test only. No migration needed unless it later grows a popover.
  - `@radix-ui/react-dialog` consumers (`DiffModal`, `SpecModal`, plus any other modal) — already on Radix; no action.
  - Any new popover/menu added between proposal and merge — re-scan with the same grep (`position:\s*['"]?fixed`, `getBoundingClientRect`, `onContextMenu`) before closing the change.
