## Context

`transformStream` 在 `stream.ts` 裡對 `message_start`、`message_delta`、`content_block_stop` 回傳 null。`compaction_delta` 在 delta handler 裡也被忽略。`transformSystem` 對 `post_turn_summary` 回傳 null。

這些事件攜帶的資訊可以用來顯示 token 用量、管理 streaming 狀態、通知 context compaction。

## Goals / Non-Goals

**Goals:**
- 5 個被忽略的事件回傳有意義的 ClientMessage
- Client handler 處理這些事件
- Channel state 新增 token usage 追蹤

**Non-Goals:**
- 不做完整的 token 費用計算 UI（只存資料，UI 顯示另開 change）
- 不改 raw_events / raw_deltas 的儲存邏輯

## Decisions

### 1. 新增 ClientMessage 名稱

```ts
'stream:message_start'    // message_start → model + input tokens
'stream:message_delta'    // message_delta → stop_reason + output tokens
'stream:block_stop'       // content_block_stop → index
'stream:compaction'       // compaction_delta → compacted content
'system:post_turn_summary' // post_turn_summary → summary text
```

### 2. stream:message_start payload

```ts
{
  model: string;
  messageId: string;
  usage: {
    inputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
}
```

### 3. stream:message_delta payload

```ts
{
  stopReason: string | null;
  usage: {
    outputTokens: number;
  };
}
```

### 4. stream:block_stop payload

```ts
{ index: number }
```

Client 收到後：如果是 thinking block 結束，設 `isThinkingStreaming = false`。

### 5. stream:compaction payload

```ts
{ content: string }
```

Client 收到後在 message list 顯示 compaction 分界線。

### 6. system:post_turn_summary payload

```ts
{ summary: string }
```

從 `post_turn_summary` 的 raw data 提取 summary 文字。

### 7. Channel State 擴展

```ts
interface ChannelState {
  // 新增
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
}
```

`stream:message_start` 累加 input tokens，`stream:message_delta` 累加 output tokens。

## Risks / Trade-offs

- **[Risk] post_turn_summary 格式不明** → 先用 raw:event fallback，確認格式後再 narrow
- **[Trade-off] block_stop 觸發 isThinkingStreaming=false** → 比目前在 stream:end 才結束更精確，但要確認不會跟現有邏輯衝突
