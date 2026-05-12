## 1. ChannelState 加 streamingToolUseId

- [x] 1.1 `types/chat.ts` — `ChannelState` 加 `streamingToolUseId?: string`

## 2. stream:block_start handler 建 tool_use placeholder

- [x] 2.1 `streaming.ts` — 新增 `onBlockStart` handler：blockType=tool_use 時建 tool_use message + 設 streamingToolUseId
- [x] 2.2 註冊到 `streamingHandlerOn`
- [x] 2.3 測試：block_start tool_use 建 placeholder、設 streamingToolUseId

## 3. onInputJsonChunk 用 streamingToolUseId

- [x] 3.1 `streaming.ts` — `onInputJsonChunk` 改用 `state.streamingToolUseId` 找 message
- [x] 3.2 測試：chunk patch 到正確的 tool_use、無 streamingToolUseId 時不 patch

## 4. stream:block_stop 清 streamingToolUseId

- [x] 4.1 `streaming.ts` — `onBlockStop` 加清除 `streamingToolUseId`
- [x] 4.2 測試：block_stop 後 streamingToolUseId 為 undefined

## 5. message:assistant patch 既有 tool_use

- [x] 5.1 `message.ts` — `applyAssistantBlock` tool_use case 改為先找既有 message（by toolId），找到就 patch，沒找到就 addMessage
- [x] 5.2 測試：有 placeholder → patch input + 清 partialInput；無 placeholder → addMessage

## 6. View 層 partialInput 即時 diff 預覽

- [x] 6.1 `ToolUseBlock.tsx` — Edit/MultiEdit：有完整 input 時忽略 partialInput
- [x] 6.2 `ToolUseBlock.tsx` — partialInput 嘗試 JSON.parse 提取 old_string/new_string → DiffViewer
- [x] 6.3 `ToolUseBlock.tsx` — parse 失敗顯示 streaming 指示器（不是 raw JSON）
- [x] 6.4 Storybook

## 7. 驗證

- [x] 7.1 全部 tests green
- [x] 7.2 History replay 行為不變
