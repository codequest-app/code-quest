## Why

目前每個 content block（thinking、text、tool_use）是獨立的 Message，失去 API message 的邊界。造成：
1. 無法關聯 per-turn 的 model、usage、stopReason 到對應的 blocks
2. streaming reconciliation 依賴三個 boolean flags（isTextStreaming、isThinkingStreaming、wasStreamedViaDelta），容易出 bug
3. 無法做 per-turn metadata 顯示（model、token、cost tag）
4. 無法實現「最後一個 turn 的 blocks 不收合」的 UX

## What Changes

- Message union type 新增 `AssistantTurn`：一個 API message 對應一個 turn，內含 `blocks[]`、`model`、`usage`、`stopReason`
- 每個 block 有獨立 `id`，`parentToolUseId` 移到 block 層級
- Handler 重構：`message_start` 建 turn → delta 累加 blocks → `message:assistant` 完成 turn（live）；replay 時直接建完整 turn
- tool_result handler 改為搜尋 `turn.blocks[]` 找 tool_use block，patch result 到 block 上
- MessageContent 新增 `assistant_turn` renderer：逐一渲染 blocks，視覺結果等價現有 UI
- Collapse 行為：最後一個 turn 的 blocks 不收合（`defaultOpen=true`），出現下一則時才收合
- 簡化 streaming flags：移除 `isTextStreaming`、`isThinkingStreaming`、`wasStreamedViaDelta`，改用 turn 的 `isStreaming` 狀態
- `local_agent` task result 用 MarkdownContent 渲染，`local_bash` task result 用 OutputContent 渲染
- SpinnerVerb 顯示 elapsed time + token count：`* Manifesting… (42s · ↑ 1.2k tokens)`
- Storybook stories 更新，測試用 protocol → 前端完整鏈路

## Capabilities

### New Capabilities
- `compound-message`: AssistantTurn message model，一個 API message = 一個 turn with blocks[]

### Modified Capabilities
- `streaming`: streaming handler 從 per-block message 改為 per-turn 累加
- `tool-result`: tool_result 關聯改為搜尋 turn.blocks[]
- `collapse`: 最後一個 turn 不收合

## Impact

- `apps/web/src/types/ui.ts` — Message union 加 AssistantTurn、Block type
- `apps/web/src/types/chat.ts` — ChannelState 簡化 streaming 欄位
- `apps/web/src/contexts/channel/handlers/streaming.ts` — 重寫：turn 生命週期
- `apps/web/src/contexts/channel/handlers/message.ts` — message:assistant patch turn、tool_result 搜尋 turn.blocks
- `apps/web/src/components/chat/conversation/MessageContent.tsx` — assistant_turn renderer
- `apps/web/src/components/chat/conversation/ChatMessage.tsx` — 處理 assistant_turn layout
- `apps/web/src/components/chat/conversation/MessageList.tsx` — collapse 邏輯
- `apps/web/src/contexts/channel/MessageVisibilityContext.tsx` — visibility 規則調整
- `apps/web/src/utils/message.ts` — patchMeta 支援 turn.blocks
- `apps/web/src/test/story-fixtures.ts` — 更新 fixtures
- Storybook stories — 更新
- 不改：ToolUseBlock、ThinkingBlock、MarkdownContent、DiffViewer、Server、Summoner
