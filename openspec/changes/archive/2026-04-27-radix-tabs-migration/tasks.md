## 1. CreateWorktreeDialog (priority)

- [x] 1.1 Replace hand-rolled tablist in CreateWorktreeDialog with `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`, using `mode` as controlled value
- [x] 1.2 Style `Tabs.Trigger` with `data-[state=active]:` variants matching existing TabButton visuals
- [x] 1.3 Verify `resetAndClose` resets active tab to "existing"
- [x] 1.4 Update CreateWorktreeDialog.test.tsx — adjust selectors if needed, verify green

## 2. ManagePluginsDialog

- [x] 2.1 Replace hand-rolled tab buttons with `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` / `Tabs.Content`
- [x] 2.2 Preserve badge count as child of `Tabs.Trigger`
- [x] 2.3 Replace inline `style={{ height: '400px' }}` with Tailwind class (`h-100`)

## 3. SpecModal

- [x] 3.1 Replace hand-rolled tablist with `Tabs.Root` / `Tabs.List` / `Tabs.Trigger` (no `Tabs.Content` — content driven by async fetch)
- [x] 3.2 Keep `tabs.length > 1` guard to hide tab strip for single-tab spec view

## 4. Cleanup

- [x] 4.1 Delete `worktree-dialog/TabButton.tsx`
- [x] 4.2 Remove TabButton import from `render-with-workspace.tsx` test helper if present (none found)
- [x] 4.3 Run full test suite and tsc, verify green
