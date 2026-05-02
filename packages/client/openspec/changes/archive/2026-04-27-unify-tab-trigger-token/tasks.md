## 1. Add shared token

- [x] 1.1 Add `tabTrigger` export to `ui/_tokens.ts`
- [x] 1.2 Add test for `tabTrigger` in `_tokens.test.ts`

## 2. Migrate consumers (one at a time, verify green each step)

- [x] 2.1 CreateWorktreeDialog: replace inline trigger classes with `cn(tabTrigger, ...)`
- [x] 2.2 ManagePluginsDialog: replace inline trigger classes with `cn(tabTrigger, ...)`
- [x] 2.3 RightPane: replace `TRIGGER_BASE` with `cn(tabTrigger, ...)`
- [x] 2.4 SpecModal: migrate to Radix Tabs + use `tabTrigger` token

## 3. Cleanup

- [x] 3.1 Delete `worktree-dialog/TabButton.tsx`
- [x] 3.2 Remove TabButton import from test helpers if present (none found)
- [x] 3.3 Run full test suite and tsc, verify green
