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

## Phase 2: AskUserQuestion 對齊 extension

### 5. 確認 extension 外觀

- [x] 5.1 擷取 extension 的 AskUserQuestion 截圖或從程式碼確認完整 UI 結構
- [x] 5.2 確認：AskUserQuestion 渲染在 permissionRequestContainer (F5) 內，不是獨立 banner
- [x] 5.3 確認：buttons 變成 "① Submit answers"（沒有 No、沒有 reject input）
- [x] 5.4 確認：多問題時 tab navigation 一次顯示一題，單問題時不顯示 tab

### 6. Tests first (RED)

- [x] 6.1 Write tests: AskUserQuestion renders inside ToolPermissionBanner container (not separate banner)
- [x] 6.2 Write tests: tab navigation — tabs visible for multi-question, clicking tab switches question
- [x] 6.3 Write tests: answered tab marker (data-answered attribute)
- [x] 6.4 Write tests: "Submit answers" button instead of "Yes", no "No" button, no reject input
- [x] 6.5 Write tests: single question — no tab bar, just question content

### 7. Implementation (GREEN)

- [x] 7.1 Refactor ToolPermissionBanner to accept content slot or detect AskUserQuestion
- [x] 7.2 Add tab navigation component for multi-question
- [x] 7.3 Add radio/checkbox option rendering matching extension (custom styled, not native input)
- [x] 7.4 Add answered state markers on tabs
- [x] 7.5 Button: "① Submit answers" only when AskUserQuestion, hide No + reject input
- [x] 7.6 Run all tests green

### 8. Stories + UI review

- [x] 8.1 Update stories for AskUserQuestion in ToolPermissionBanner (single question, multi question)
- [x] 8.2 Pause — user confirms UI matches extension

## Phase 3: Diff Review 對齊

- [x] 9.1 確認 extension Diff Review 外觀（modal overlay vs side panel）
- [x] 9.2 Tests (RED): modal overlay renders, close button works
- [x] 9.3 Change ContentPreviewPanel from side panel to modal overlay
- [x] 9.4 Tests green + stories
- [x] 9.5 Pause — user confirms UI

## Phase 4: Tool Use IN/OUT Grid

- [x] 10.1 確認 extension Tool Use Block 外觀（IN/OUT grid layout）
- [x] 10.2 Tests (RED): IN/OUT labels visible, grid layout
- [x] 10.3 Add IN/OUT label grid layout to tool use message blocks
- [x] 10.4 Add bash-specific command styling
- [x] 10.5 Tests green + stories
- [x] 10.6 Pause — user confirms UI

## Phase 5: Plugins/Marketplace

- [x] 11.1 確認 extension Marketplace 外觀
- [x] 11.2 (已對齊，extension-specific 功能跳過) Expand PluginsPanel with search, tabs, marketplace install flow
- [x] 11.3 (不需要改動) Tests + stories

## Phase 6: Context Menu

- [x] 12.1 (extension 只有 link copy，不是 message context menu) 確認 extension Context Menu 外觀
- [x] 12.2 (跳過 — cc-office 已有 MessageActions hover) Create ContextMenu component for message right-click
- [x] 12.3 (不需要) Tests + stories

## Phase 7: Worktree Banner

- [x] 13.1 (依賴 feat/worktree-support merge，跳過) Add "Open worktree" action to WorktreeBanner
- [x] 13.2 (跳過) Tests + stories

## Phase 8: Content Block Types 對齊

### 14. Tests (RED)

- [x] 14.1 Test: image content block — base64 img tag with correct src and media_type
- [x] 14.2 Test: document content block — downloadable pill with title
- [x] 14.3 Test: tool_result with array content — recursively renders each block, filters out tool_reference
- [x] 14.4 Test: tool_reference — renders `<code>` with tool_name
- [x] 14.5 Test: redacted_thinking — renders "[Thinking redacted]" placeholder

### 15. Implementation (GREEN)

- [x] 15.1 Add image content block rendering (base64 → img tag)
- [x] 15.2 Add document content block rendering (downloadable pill)
- [x] 15.3 Add tool_result array content support (recursive rendering + filter tool_reference)
- [x] 15.4 Add tool_reference rendering (`<code>{tool_name}</code>`)
- [x] 15.5 Add redacted_thinking rendering
- [x] 15.6 Run all tests green

### 16. Stories + commit

- [x] 16.1 Add stories for new content block types
- [x] 16.2 Commit + push
