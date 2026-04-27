## Tasks

### 1. TruncatedContent / ThinkingBlock → Radix Collapsible
- [ ] Audit TruncatedContent and ThinkingBlock for expand/collapse patterns
- [ ] Install/verify `@radix-ui/react-collapsible`
- [ ] Migrate TruncatedContent to Radix Collapsible
- [ ] Migrate ThinkingBlock to Radix Collapsible
- [ ] Match existing animation with `data-state` CSS transitions
- [ ] Run existing tests, fix any breakage
- [ ] Visual regression check in browser

### 2. Tooltip → Radix Tooltip
- [ ] Audit all custom tooltip usages across the codebase
- [ ] Install/verify `@radix-ui/react-tooltip`
- [ ] Add `Tooltip.Provider` at app/workspace level
- [ ] Migrate each tooltip instance to Radix Tooltip
- [ ] Verify hover delay, focus trigger, Escape dismiss
- [ ] Run existing tests, fix any breakage

### 3. Scroll Areas → Radix ScrollArea
- [ ] Audit custom-styled scroll containers (session list, file list, sidebar panels)
- [ ] Install/verify `@radix-ui/react-scroll-area`
- [ ] Migrate scroll containers to Radix ScrollArea
- [ ] Verify no conflicts with virtualized lists
- [ ] Verify cross-browser scrollbar appearance
- [ ] Run existing tests, fix any breakage
