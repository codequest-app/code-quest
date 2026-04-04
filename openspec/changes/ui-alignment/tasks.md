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

## Phase 9: Code Review 修正

### 17. 此次 branch 改動的問題

- [x] 17.1 settings.ts: worktree payload 改用 zod safeParse（不用 as cast）
- [x] 17.2 ToolUseBlock.tsx: BashToolBody 改用 AnsiContent（統一 ANSI 渲染）
- [x] 17.3 ToolResultBlock.tsx: 移除多餘的 toolId ?? ''

### 18. 既有程式碼的問題

- [x] 18.1 MessageContent.tsx: meta as TextMeta/ThinkingMeta → 用 MetaMap 的 discriminated union narrowing
- [x] 18.2 (跳過 — React Compiler 處理 memoization) ChannelConfigContext.tsx: createConfigActions 加 useMemo
- [x] 18.3 (跳過 — emit 已在 updater 外) TabContext.tsx: socket.emit 移出 setState updater
- [x] 18.4 (跳過 — React Compiler) TabContext.tsx: Provider value 加 useMemo
- [x] 18.5 channel-manager.ts: 空 catch 加 log
- [x] 18.6 (已有 comment) runner.ts: 空 catch 加 log
- [x] 18.7 settings.ts line 267: as never → 修 event type

## Phase 10: Zod 轉換 + Inline Type 整理 + Skills

### 19. 重複型別移到 shared + zod schema

- [x] 19.1 Question + Option → shared/schemas/question.ts (zod schema)，QuestionContent + AskUserQuestionBanner 改 import
- [x] 19.2 McpServerInfo + McpTool → shared/schemas/mcp.ts (zod schema)，MCPPanel + ComposeToolbar 改 import
- [x] 19.3 FileDiff → shared (zod schema, 跟 RewindResult 整合)
- [x] 19.4 ModifiedFile → 評估是否移 shared

### 20. as cast → zod safeParse

- [x] 20.1 PlanReviewBanner: allowedPrompts as Record → planInputSchema safeParse
- [x] 20.2 RewindPreview: fileDiffs as Record<string, FileDiff> → fileDiffSchema safeParse
- [x] 20.3 MessageActions: result as unknown as Record → rewindResultSchema safeParse

### 21. Inline import → top-level import

- [x] 21.1 ui.ts: import('@code-quest/shared').RewindResult → top-level import
- [x] 21.2 ChannelControlContext.tsx: import('@code-quest/shared').ControlPermissionResponse → top-level import

### 22. Run all tests + commit

- [x] 22.1 Run all tests green (summoner + server + client)
- [x] 22.2 Commit skills + code changes + push

## Phase 11: Final Code Review 修正

### 23. 快速修

- [x] 23.1 worktree.ts: 移除重複 errMsg，import from ../utils/helpers.ts
- [x] 23.2 session-history.ts:107: 空 catch 加 comment
- [x] 23.3 notification.ts:112,130: as never → 用 channelEmit helper
- [x] 23.4 notification.ts: 移除未使用的 openFileLocationSchema / OpenFileLocation

### 24. summoner transforms 型別修正

- [x] 24.1 修改 6 個 transform function signatures: Record<string, unknown> → typed ProtocolMessage 或 union member
- [x] 24.2 adapter.ts: 移除 message as Record 的 casts（line 274, 287）
- [x] 24.3 adapter.ts:77: 移除 rate_limit_info as Record cast（已有 type narrowing）

### 25. protocol.ts 修正

- [x] 25.1 protocol.ts:152: getSchemaForType 改回傳型別，移除 as ProtocolMessage
- [x] 25.2 protocol.ts:211: parseInitializeResponse 用 zod schema 取代 as casts

### 26. Run all tests + commit

- [x] 26.1 Run all tests green
- [x] 26.2 Commit + push
