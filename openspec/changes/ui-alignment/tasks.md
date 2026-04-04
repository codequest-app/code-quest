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

## Phase 12: cwd bug fix + 架構重構

### 27. Bug fix: handleLaunch 傳 cwd 給 channelManager.create

- [x] 27.1 FakeProcessProvider 加 spawnCalls 記錄（summoner test helper）
- [x] 27.2 Test (RED): session:launch 帶 cwd 時，CLI spawn options 含正確 cwd
- [x] 27.3 Fix handleLaunch: 加 cwd: parsed.cwd 到 channelManager.create
- [x] 27.4 Test green

### 28. 重構: workspaceFolder → cwd rename + TabMeta 存 cwd

- [x] 28.1 TabMeta 加 cwd?: string
- [x] 28.2 createNewTab 存 cwd 到 TabMeta
- [x] 28.3 TabProvider rename workspaceFolder → defaultCwd
- [x] 28.4 ChannelProvider rename workspaceFolder → cwd
- [x] 28.5 WorkspaceFolderContext → CwdContext，useWorkspaceFolder → useCwd
- [x] 28.6 WorkspaceLayout 讀 tab.cwd 傳給 ChannelProvider cwd prop
- [x] 28.7 更新所有 consumer（import rename）
- [x] 28.8 Run all tests green (summoner + server + client)
- [x] 28.9 Commit + push

## Phase 13: onWorktree callback — ChannelProvider → WorkspaceLayout

### 29. Tests (RED)

- [x] 29.1 Test: renderWithWorkspace — WorktreeBanner 點 "Open in new tab" 觸發 onWorktree callback
- [x] 29.2 Test: WorkspaceLayout — onWorktree 建新 tab 帶正確 cwd

### 30. Implementation (GREEN)

- [x] 30.1 ChannelProvider 加 onWorktree prop
- [x] 30.2 ChannelConfigContext 暴露 openWorktree action（呼叫 onWorktree callback）
- [x] 30.3 WorkspaceLayout 傳 onWorktree 實作為 createNewTab
- [x] 30.4 WorktreeBanner 改用 context action openWorktree（移除 onOpenInNewTab prop）
- [x] 30.5 ChatPanel 移除 useTab + createNewTab（不再直接用 TabContext）

### 31. Run all tests + commit

- [x] 31.1 Run all tests green
- [x] 31.2 Commit + push

## Phase 14: Shared Schemas 重構

### 32. 修重複

- [x] 32.1 gitCheckoutResultSchema → 用 successResponseSchema 取代
- [x] 32.2 chromeMcpControlSchema / jupyterMcpControlSchema / debuggerHelpSchema → 用 channelIdPayloadSchema
- [x] 32.3 rateLimitPayloadSchema (system.ts) vs rateLimitInfoSchema (settings.ts) → 統一
- [x] 32.4 chatStatsSchema / sessionStatsSchema → sessionStats extends chatStats
- [x] 32.5 移除冗餘 AuthStatusValue、launchOptionsSchema export
- [x] 32.6 Run tests green + commit

### 33. 搬錯位

- [x] 33.1 closeChannelPayloadSchema + cancelRequestEventPayloadSchema: file.ts → session.ts
- [x] 33.2 stateUsagePayloadSchema + contextUsageDataSchema: notification.ts → settings.ts
- [x] 33.3 actionOpenUrlPayloadSchema + actionOpenFilePayloadSchema: notification.ts → 新 actions.ts
- [x] 33.4 errorMessagePayloadSchema: notification.ts → common.ts
- [x] 33.5 speechToTextMessagePayloadSchema: notification.ts → common.ts
- [x] 33.6 sessionSummarySchema + sessionListResponseSchema: common.ts → session.ts
- [x] 33.7 更新所有 import 路徑（socket-events.ts + consumers）
- [x] 33.8 Run tests green + commit

### 34. 拆大檔

- [x] 34.1 message.ts → 拆 message-blocks.ts + message-stats.ts + message-stream.ts
- [x] 34.2 notification.ts → 清理後只保留 notification 相關
- [x] 34.3 更新 index.ts barrel exports
- [x] 34.4 更新所有 import 路徑
- [x] 34.5 Run all tests green (summoner + server + client)
- [x] 34.6 Commit + push

### 35. Schema 命名對齊 socket event

- [x] 35.1 ChatCreatePayload → SessionLaunchPayload（event: session:launch）
- [x] 35.2 chatCreateSchema → sessionLaunchSchema
- [x] 35.3 ChatKillPayload → SessionClosePayload（event: session:close）
- [x] 35.4 chatKillSchema → sessionCloseSchema
- [x] 35.5 ChatJoinPayload → SessionJoinPayload（event: session:join）
- [x] 35.6 chatJoinSchema → sessionJoinSchema
- [x] 35.7 ChatInterruptPayload → ChatCancelPayload（event: chat:cancel）
- [x] 35.8 chatInterruptSchema → chatCancelSchema
- [x] 35.9 ChatSetModelPayload → SettingsSetModelPayload（event: settings:set_model）
- [x] 35.10 chatSetModelSchema → settingsSetModelSchema
- [x] 35.11 ChatSetPermissionModePayload → SettingsSetPermissionModePayload
- [x] 35.12 chatSetPermissionModeSchema → settingsSetPermissionModeSchema
- [x] 35.13 ChatSetThinkingLevelPayload → SettingsSetThinkingLevelPayload
- [x] 35.14 chatSetThinkingLevelSchema → settingsSetThinkingLevelSchema
- [x] 35.15 更新 socket-events.ts + 所有 consumer imports
- [x] 35.16 Run all tests green
- [x] 35.17 Commit + push

### 36. control.ts 搬移到正確檔案

- [ ] 36.1 settingsSetProactiveSchema + settingsSetRemoteControlSchema → settings.ts
- [ ] 36.2 sessionGenerateTitleSchema + generateSessionTitleResponseSchema → session.ts
- [ ] 36.3 chatCancelAsyncMessageSchema → message.ts
- [ ] 36.4 chatHookCallbackRespondSchema + controlHookCallbackPayloadSchema + hookStartedInfoSchema + hookResponseInfoSchema → system.ts
- [ ] 36.5 getClaudeStateResponseSchema → control-response.ts
- [ ] 36.6 Run tests green

### 37. fileDiff + rewindResult 搬移

- [ ] 37.1 fileDiffSchema + rewindResultSchema: message-payloads.ts → session.ts
- [ ] 37.2 Run tests green

### 38. Cleanup + commit

- [ ] 38.1 確認 control.ts 只剩 control-scoped schemas
- [ ] 38.2 確認 message-payloads.ts 只剩 message S2C payloads
- [ ] 38.3 確認無重複、無錯位
- [ ] 38.4 Run all tests green
- [ ] 38.5 Commit + push
