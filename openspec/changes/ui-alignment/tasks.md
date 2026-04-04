## Phase 1: Permission Prompt 對齊

### 1. Tests first (RED)

- [x] 1.1 Write ToolPermissionBanner tests using renderWithWorkspace + FakeClaude: verify dialog structure (header with tool name, details section, buttons, reject input, keyboard hints)
- [x] 1.2 Write keyboard interaction tests: number keys trigger actions, Escape cancels, Arrow navigation changes focus, Enter triggers focused button
- [x] 1.3 Write collapsible details test: when input has properties → details section with JSON; when empty → no details

### 2. Implementation (GREEN)

- [x] 2.1 Refactor ToolPermissionBanner layout: container with bg overlay → content (header + details) → buttons → reject input → hints
- [x] 2.2 Add collapsible details section with chevron for tool input JSON
- [x] 2.3 Add numbered button labels (① ② ③) with focus highlight styling
- [x] 2.4 Ensure keyboard behavior matches extension (number keys, Escape, Arrow, Enter)
- [x] 2.5 Add "Esc to cancel" hint at bottom
- [x] 2.6 Update PermissionHeader to show "Do you want to proceed with **toolName**?"
- [x] 2.7 Run all tests green

### 3. Stories

- [x] 3.1 Update ToolPermissionBanner stories to show new layout (standard, with suggestions, empty input)

### 4. Stop for UI review

- [x] 4.1 Pause — user confirms UI matches extension

---

## Phase 2: Elicitation 多問題支援 (後續)

- [ ] 5.1 Add tab navigation for multi-question elicitation
- [ ] 5.2 Add radio/checkbox option rendering
- [ ] 5.3 Add answered state markers on tabs
- [ ] 5.4 Tests + stories

## Phase 3: Diff Review 對齊 (後續)

- [ ] 6.1 Change ContentPreviewPanel from side panel to modal overlay
- [ ] 6.2 Tests + stories

## Phase 4: Tool Use IN/OUT Grid (後續)

- [ ] 7.1 Add IN/OUT label grid layout to tool use message blocks
- [ ] 7.2 Add bash-specific command styling
- [ ] 7.3 Tests + stories

## Phase 5: Plugins/Marketplace (後續)

- [ ] 8.1 Expand PluginsPanel with search, tabs, marketplace install flow
- [ ] 8.2 Tests + stories

## Phase 6: Context Menu (後續)

- [ ] 9.1 Create ContextMenu component for message right-click
- [ ] 9.2 Tests + stories

## Phase 7: Worktree Banner (後續)

- [ ] 10.1 Add "Open worktree" action to WorktreeBanner
- [ ] 10.2 Tests + stories
