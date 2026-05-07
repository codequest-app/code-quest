## Why

當第二個 client 加入一個已有歷史訊息的 session 時，history replay 缺乏分批傳輸、去重保護與 live 事件緩衝機制，導致大型 session 可能出現重複訊息或順序錯誤。

## What Changes

- `SESSION_HISTORY_BATCH_SIZE` server config 預設從 50 改為 1000，並可透過環境變數覆寫
- Server 的 `session:history` 事件改為分批傳送（cursor-based pagination），避免單次傳送過大 payload
- Client `ChannelState` 加入 `seenUuids: Set<string>`，history handler 與 live streaming handler 共用同一套 uuid 去重邏輯
- Client 加入 `StateBuffer`：`session:join` 發出後開始 buffering live 事件，join callback 回來後 drain，確保 history 先於 live 事件套用

## Capabilities

### New Capabilities

- `session-history-batching`: server 分批 emit `session:history`，支援 historyBatchSize 設定
- `session-history-dedup`: client 用 `seenUuids` 去重，history 與 live stream 的 `message:assistant` 都不重複顯示
- `session-history-buffer`: client `StateBuffer` 工具，緩衝 join 期間的 live 事件直到 history 完成

### Modified Capabilities

## Impact

- `apps/server/src/config.ts` — historyBatchSize 預設值
- `apps/server/.env.example` / `.env`
- `apps/server/src/session/` — history emit 分批邏輯
- `apps/web/src/types/chat.ts` — `ChannelState.seenUuids`
- `apps/web/src/contexts/channel/ChannelMessagesContext.tsx` — StateBuffer 接線
- `apps/web/src/contexts/channel/handlers/streaming.ts` — seenUuidsRef
- `apps/web/src/contexts/channel/handlers/state-buffer.ts` — 新增
