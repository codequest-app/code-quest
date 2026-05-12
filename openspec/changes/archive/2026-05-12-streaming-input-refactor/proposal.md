## Why

`onInputJsonChunk` 用「找最後一個 tool_use message」來累加 `partialInput`，導致第二個 tool_use 的 `input_json_delta` 污染前一個已完成的 tool_use。根因是 `stream:block_start [tool_use]` 沒建 message，`input_json_delta` 沒有正確的 target。且 client 不該自己做 JSON 拼接 — transform 產出什麼就顯示什麼。

## What Changes

- `stream:block_start [tool_use]` → client 建立 placeholder tool_use message（帶 toolId、name、空 input）
- `stream:chunk(input_json)` → 用 block `index` 對應到正確的 tool_use message 累加 `partialInput`
- `message:assistant [tool_use]` → 用 toolId 找到已有的 placeholder，更新完整 `input` 並清除 `partialInput`（而非新增 message）
- View 層：`partialInput` 存在時嘗試 parse 出 `old_string`/`new_string` 顯示即時 diff 預覽，parse 失敗則顯示「Editing...」
- History replay 不受影響（transient stream 事件已排除）

## Capabilities

### New Capabilities

### Modified Capabilities
- `streaming`: 修正 tool_use streaming 的 message 生命週期（block_start 建、chunk 累加、assistant 覆蓋）

## Impact

- `apps/web/src/contexts/channel/handlers/streaming.ts` — 重構 `onInputJsonChunk`，新增 `stream:block_start` handler 建 tool_use placeholder
- `apps/web/src/contexts/channel/handlers/message.ts` — `applyAssistantBlock` tool_use 改為 patch 既有 message
- `apps/web/src/components/chat/tool-use/message-blocks/ToolUseBlock.tsx` — `PartialInputPlaceholder` 改為即時 diff 預覽
