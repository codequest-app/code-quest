## Context

Claude API streaming protocol 送 tool_use 的順序是：
```
content_block_start  index=N  {type:"tool_use", id:"toolu_xxx", name:"Edit", input:{}}
content_block_delta  index=N  {type:"input_json_delta", partial_json:"..."}
content_block_delta  index=N  {type:"input_json_delta", partial_json:"..."}
content_block_stop   index=N
message:assistant              {content: [{type:"tool_use", input: 完整}]}
```

目前 client 的問題：
1. `stream:block_start [tool_use]` 是 no-op — 沒建 message
2. `onInputJsonChunk` 找「最後一個 tool_use message」patch `partialInput` — 可能找到前一個已完成的
3. `message:assistant` 建新 message — 前一個被污染的 `partialInput` 永遠不清
4. View 層 `partialInput` 優先顯示 — 蓋住完整的 input

## Goals / Non-Goals

**Goals:**
- tool_use message 的生命週期正確：block_start 建、chunk 累加、assistant 覆蓋
- `input_json_delta` 用 `index` 對應正確的 block
- Edit tool streaming 時顯示即時 diff 預覽（嘗試 parse partialInput JSON）
- History replay 行為不變

**Non-Goals:**
- 不改 summoner transform 層（`stream:chunk(input_json)` 已經帶 index，不需改）
- 不改 `raw_deltas` 儲存邏輯

## Decisions

### 1. stream:block_start handler 建 tool_use placeholder

收到 `stream:block_start` 且 `blockType === 'tool_use'` 時：
- 從 `contentBlock` 取 `id`（toolId）和 `name`
- 建一個 tool_use message：`{ type: 'tool_use', content: name, meta: { toolId, input: {} } }`
- 記錄 `streamingBlockIndex = index`，供 input_json_delta 匹配

### 2. onInputJsonChunk 改為用 toolId 匹配

目前的 `stream:chunk(input_json)` payload 沒帶 index — 但 chunk handler 裡沒有 block context。

方案：在 ChannelState 加 `streamingToolUseId?: string`，`stream:block_start [tool_use]` 時設定，`stream:block_stop` / `message:assistant` 時清除。`onInputJsonChunk` 用這個 ID 找 message。

### 3. message:assistant tool_use → patch 而非 addMessage

`applyAssistantBlock` 裡 `case 'tool_use'`：
- 用 `block.toolId` 查找已有的 tool_use message
- 找到 → patch input + 清 partialInput
- 沒找到（history replay，沒有 block_start）→ addMessage（向後相容）

### 4. View 層 partialInput 即時 diff 預覽

`ToolBody` 裡 Edit/MultiEdit 的 `partialInput`：
- 嘗試 `JSON.parse(partialInput)` 提取 `old_string`/`new_string`
- 成功 → `DiffViewer` 顯示 diff
- 失敗（JSON 不完整）→ 顯示 "Editing..." 或 streaming 指示器
- 有完整 `input`（keys > 0）→ 忽略 `partialInput`，用完整 input

## Risks / Trade-offs

- **[Risk] stream:block_start 可能晚到** — 理論上不會，API 保證 block_start 在 delta 前。但防禦性：若 chunk 找不到 `streamingToolUseId` 對應的 message，fallback 到舊邏輯找最後一個 tool_use
- **[Trade-off] ChannelState 多一個 `streamingToolUseId`** — 暫態欄位，只在 streaming 時有值，replay 時不需要
