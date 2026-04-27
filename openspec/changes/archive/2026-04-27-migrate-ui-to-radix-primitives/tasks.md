## Tasks

### ~~CommandMenu~~ (excluded — incompatible with Radix Popover positioning)

### 1. MentionDropdown → Radix Popover (low risk)
- [ ] Wrap MentionDropdown in Radix Popover anchored to ComposeInput
- [ ] Replace positioning logic with Radix Popover.Content placement
- [ ] Verify outside-click dismisses the dropdown
- [ ] Verify keyboard nav (owned by ComposeInput) still works
- [ ] Run existing tests, fix any breakage

### 2. SessionDropdown → Radix Popover (low risk)
- [ ] Replace custom overlay + positioning with Radix Popover
- [ ] Remove manual outside-click handler
- [ ] Verify session list renders and scrolls correctly
- [ ] Run existing tests, fix any breakage

### 3. ModelPickerPopover → Radix Popover (low risk)
- [ ] Replace usePopover usage with Radix Popover
- [ ] Verify model list renders and selection works
- [ ] Run existing tests, fix any breakage
- [ ] Delete `usePopover` hook if no consumers remain

### 4. AccountUsageDialog → Radix Dialog (low risk)
- [ ] Replace custom backdrop + focus trap with Radix Dialog
- [ ] Verify modal behavior (focus trap, Escape close, backdrop click close)
- [ ] Verify dialog content/layout unchanged
- [ ] Run existing tests, fix any breakage

### 5. CommandMenu: move dismiss decision from feature layer to CommandMenu
- [ ] Add `dismissBehavior: 'close' | 'closeSilent' | 'none'` to `MenuItem`
- [ ] Set `dismissBehavior` in `featureToMenuItem` based on toggle/closeSilent
- [ ] Remove close/closeSilent calls from `featureToMenuItem` onClick (onClick only calls execute)
- [ ] CommandMenu handles dismiss after item.onClick based on dismissBehavior
- [ ] Update build-menu-items unit tests to verify dismissBehavior instead of close calls
- [ ] All 1747 integration tests pass unchanged
