## 1. Adapter transforms (summoner)

- [x] 1.1 `stream.ts` — `message_start` 回傳 `stream:message_start`（model + usage）
- [x] 1.2 `stream.ts` — `message_delta` 回傳 `stream:message_delta`（stopReason + outputTokens）
- [x] 1.3 `stream.ts` — `content_block_stop` 回傳 `stream:block_stop`（index）
- [x] 1.4 `stream.ts` — `compaction_delta` 回傳 `stream:compaction`（content）
- [x] 1.5 `system.ts` — `post_turn_summary` 回傳 `system:post_turn_summary`（summary）
- [x] 1.6 更新/新增 adapter transform tests

## 2. Shared event types

- [x] 2.1 `socket-events.ts` — 新增 `stream:message_start`、`stream:message_delta`、`stream:block_stop`、`stream:compaction`、`system:post_turn_summary` event 定義

## 3. Client handlers (web)

- [x] 3.1 `streaming.ts` — 處理 `stream:message_start`（更新 tokenUsage）
- [x] 3.2 `streaming.ts` — 處理 `stream:message_delta`（更新 tokenUsage + stopReason）
- [x] 3.3 `streaming.ts` — 處理 `stream:block_stop`（結束 thinking streaming）
- [x] 3.4 新增 `stream:compaction` handler（顯示 compaction 分界）
- [x] 3.5 新增 `system:post_turn_summary` handler（顯示 turn 摘要）
- [x] 3.6 Channel state 新增 `tokenUsage` 欄位
- [x] 3.7 更新/新增 client handler tests

## 4. 驗證

- [x] 4.1 跑全部 tests 確認 green
