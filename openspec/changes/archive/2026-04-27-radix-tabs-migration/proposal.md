## Why

Three components (`CreateWorktreeDialog`, `ManagePluginsDialog`, `SpecModal`) use hand-rolled tab UIs with manual `role="tablist"` / `role="tab"` / `aria-selected` attributes and custom state management. The project already depends on `@radix-ui/react-tabs` (used by `TabBar`/`TabContainer`), so these hand-rolled tabs duplicate accessible behavior that Radix provides out of the box (keyboard nav, focus management, ARIA).

## What Changes

- Replace hand-rolled tab buttons in **CreateWorktreeDialog** with `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` / `Tabs.Content` from `@radix-ui/react-tabs`
- Replace hand-rolled tab buttons in **ManagePluginsDialog** with `@radix-ui/react-tabs`
- Replace hand-rolled tab buttons in **SpecModal** with `@radix-ui/react-tabs`
- Delete `worktree-dialog/TabButton.tsx` after all consumers are migrated (no longer needed)
- Visual styling remains identical — only the underlying primitives change

## Capabilities

### New Capabilities

- `radix-tabs-migration`: Migration of hand-rolled tab UIs to `@radix-ui/react-tabs` across CreateWorktreeDialog, ManagePluginsDialog, and SpecModal

### Modified Capabilities

_(none — no spec-level behavior changes, only implementation primitives)_

## Impact

- **Files modified:** `CreateWorktreeDialog.tsx`, `ManagePluginsDialog.tsx`, `SpecModal.tsx`
- **Files deleted:** `worktree-dialog/TabButton.tsx`
- **Dependencies:** `@radix-ui/react-tabs` (already installed)
- **Tests:** `CreateWorktreeDialog.test.tsx` — may need selector updates if tests query by role/attribute
- **Visual:** No change — tab styling preserved via Tailwind classes
