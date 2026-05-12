## Why

目前 `transformStream` 和 `transformSystem` 有 5 個事件回傳 `null`，丟棄了有用的資訊：

- `message_start` — 有 model、input_tokens、cache tokens（per-message token 計量）
- `message_delta` — 有 stop_reason、output_tokens
- `content_block_stop` — block 串流結束信號（目前只靠 `stream:end` 結束全部）
- `compaction_delta` — context compaction 壓縮摘要
- `post_turn_summary` — agent 模式的 turn 敘述性摘要

這些資訊對 UI 顯示 token 使用量、streaming 狀態管理、context compaction 通知都有價值。

## What Changes

- `apps/summoner/src/claude/transforms/stream.ts` — `message_start`、`message_delta`、`content_block_stop`、`compaction_delta` 回傳有意義的 ClientMessage
- `apps/summoner/src/claude/transforms/system.ts` — `post_turn_summary` 回傳 ClientMessage
- `packages/shared/src/socket-events.ts` — 新增 event type 定義
- `apps/web/src/contexts/channel/handlers/` — 新增 client handler 處理這些事件

## Capabilities

### New Capabilities

- `stream-event-completeness`: 補齊 stream/system transform 被忽略的有用事件

### Modified Capabilities

## Impact

- `apps/summoner/src/claude/transforms/stream.ts` — 5 處 `return null` 改為回傳 ClientMessage
- `apps/summoner/src/claude/transforms/system.ts` — 1 處 `return null` 改為回傳 ClientMessage
- `packages/shared/src/socket-events.ts` — 新增 event name
- `apps/web/` — 新增 handler，channel state 可能新增 token usage 欄位
