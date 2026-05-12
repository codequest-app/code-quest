## 1. Type 定義

- [x] 1.1 `types/ui.ts` — 新增 `Block` type（id, type, content, meta, parentToolUseId）
- [x] 1.2 `types/ui.ts` — 新增 `AssistantTurn` type（id, role, type, timestamp, model, messageId, blocks, usage, stopReason, isStreaming）加入 Message union
- [x] 1.3 `types/chat.ts` — 移除 `isTextStreaming`、`isThinkingStreaming`、`wasStreamedViaDelta`，保留 `streamingToolUseId`（保留欄位但邏輯不再使用）

## 2. Handler — AssistantTurn 生命週期（Live）

- [x] 2.1 `streaming.ts` — `onMessageStart` 建 AssistantTurn（model, usage, isStreaming=true）
- [x] 2.2 `streaming.ts` — `onBlockStart` 改為 push Block 到當前 streaming turn 的 blocks[]（不再建獨立 Message）
- [x] 2.3 `streaming.ts` — `onStreamChunk` text/thinking 改為 append 到 turn.blocks[] 的對應 block
- [x] 2.4 `streaming.ts` — `onStreamChunk` input_json 改為用 streamingToolUseId 找 turn.blocks[] 裡的 block
- [x] 2.5 `streaming.ts` — `onMessageDelta` 更新 turn.stopReason 和 usage.outputTokens
- [x] 2.6 `streaming.ts` — `onBlockStop` 清 streamingToolUseId + thinking isStreaming
- [x] 2.7 `streaming.ts` — `onStreamEnd` (message_stop) 設 turn.isStreaming=false
- [x] 2.8 測試：完整 live 流程（message_start → blocks → deltas → assistant → message_stop）

## 3. Handler — message:assistant（Live + Replay）

- [x] 3.1 有 streaming turn 且無 parentToolUseId → patch blocks
- [x] 3.2 無 streaming turn 或有 parentToolUseId → 建完整 AssistantTurn（replay / sub-agent 路徑）
- [x] 3.3 per-block message:assistant 不 finalize turn（只有 message_stop 才 finalize）
- [x] 3.4 sub-agent 的 message:assistant（有 parentToolUseId）建獨立 turn，不 patch 主線
- [x] 3.5 測試：per-block 保持同一 turn、sub-agent 分離

## 4. Handler — tool_result 關聯

- [x] 4.1 message-tree `mergeToolResult` 搜尋 assistant_turn 的 blocks[] 找 toolId
- [x] 4.2 mergeToolResult 時 taskStatus=running → 自動 completed/failed
- [x] 4.3 測試

## 5. Renderer — AssistantTurn

- [x] 5.1 `MessageContent.tsx` — `case 'assistant_turn'` 渲染 blocks[]
- [x] 5.2 `ChatMessage.tsx` — assistant_turn 的 layout/avatar 處理
- [x] 5.3 每個 block 用現有元件渲染：thinking → ThinkingBlock, text → MarkdownContent, tool_use → ToolUseBlock
- [x] 5.4 測試：assistant_turn 渲染結果等價現有 per-block 渲染

## 6. Collapse 規則

- [x] 6.1 `MessageList.tsx` — 判斷 isLastTurn，傳 prop 給 block renderer
- [x] 6.2 tool_use block：isLastTurn → defaultOpen=true，否則 defaultOpen=false
- [x] 6.3 thinking block：永遠 defaultOpen=false
- [x] 6.4 測試

## 7. local_agent / local_bash — schema + TaskBadge

- [x] 7.1 `taskTypeSchema` 加 `local_bash`（shared, summoner, message-meta）
- [x] 7.2 `TaskBadge` 判斷從 AGENT_TOOLS 改為 AGENT_TOOLS || meta.taskType
- [x] 7.3 `TaskStatusBadge` [local] 涵蓋 local_bash
- [x] 7.4 `DefaultToolBody` local_agent result 用 MarkdownContent
- [x] 7.5 fixture: task-started-local-bash.jsonl
- [x] 7.6 segment-builders taskStarted 加 opts.taskType
- [x] 7.7 測試

## 8. MessageVisibilityContext 調整

- [x] 8.1 visibility 規則適配 assistant_turn（block 層級判斷）

## 9. Storybook

- [x] 9.1 ChatMessage stories（AssistantTurnWithBlocks, AssistantTurnCollapsed）
- [x] 9.2 SpinnerVerb stories（WithElapsedAndTokens）

## 10. SpinnerVerb elapsed + token

- [x] 10.1-10.5 完成

## 11. per-block message:assistant 修正

- [x] 11.1 Real CLI 每個 block 完成送一次 message:assistant，不應 finalize turn
- [x] 11.2 block_stop 清 thinking isStreaming
- [x] 11.3 測試：per-block 保持一個 turn

## 12. Task block 獨立呈現（local_bash / local_agent）

**背景**：`task_started` → `task_notification(completed)` 定義了一個獨立的 task 生命週期。
不管 `local_bash` 還是 `local_agent`，它們的 tool_use 都應該是**獨立的 task block**，
有自己的生命週期（Running → Done），而不是被當成主線的普通 tool_use。

兩個並行 task 應該各自在自己的 timeline 上呈現，互不干擾。

Real CLI 的 per-block `message:assistant` 可能在不同 API message streaming 時到達
（Turn A 的 tool_use patch 在 Turn B streaming 時才來）。需要 cross-turn 找到正確
的 turn 去 patch，不要在 streaming turn 裡建重複 block。

### 12.1 cross-turn tool_use patch

- [x] 12.1.1 `patchToolUseAcrossTurns` 搜尋所有 messages 找已有 toolId 做 patch
- [x] 12.1.2 live path — 已 patch 的不加到 streaming turn
- [x] 12.1.3 replay path — 先 cross-turn patch，只建不存在的 block
- [x] 12.1.4 測試：late assistant patches correct turn
- [x] 12.1.5 測試：finalized turn patch, no new turn

### 12.2 task block 渲染

- [x] 12.2.1 有 taskType 的 tool_use：header 顯示 description + TaskBadge(Running/Done/[local])
- [x] 12.2.2 local_bash：Bash header detail = input.description，body = BashToolBody
- [x] 12.2.3 local_agent：Agent header detail = input.description，body = DefaultToolBody + SubagentChildren
- [x] 12.2.4 無 taskType 維持現有呈現
- [x] 12.2.5 測試（ToolUseBlock.test.tsx 4 個 task block 測試）

### 12.3 並行 task timeline

- [x] 12.3.1 兩個 task 各自獨立 tool_use block with TaskBadge
- [x] 12.3.2 task_started patch taskStatus=running, tool_result auto-complete
- [x] 12.3.3 MessageList e2e 測試已覆蓋（local_bash Running→Done, local_agent nest）

## 13. DB 驗證場景測試

問題根源：`onTaskStarted` 做兩件事：
1. `addMessage` 建 `task_started` 系統訊息（content = description = command 全文）
2. `patchToolUseMeta` patch tool_use block 的 taskStatus

導致畫面上 command 出現兩次：一次在 Bash tool_use block，一次在 task_started 系統訊息。

- [x] 13.1 replay 測試（DB seq 1099-1197 場景）— 記錄現狀（7 turns + 2 task_started msgs）
- [x] 13.2 live 測試（delta + stream events）— 1 turn with 3 blocks + 1 task_started msg
- [x] 13.3 修正：task_started 不建獨立系統訊息（或隱藏它），避免 command 重複
- [x] 13.4 修正：SpinnerVerb 在 replay 完成的 session 不應顯示（status 問題）

## 14. 驗證

- [x] 14.1 全部 tests green（2018 passed）
- [x] 14.2 History replay 行為測試
- [x] 14.3 UI 視覺確認（dev server）
