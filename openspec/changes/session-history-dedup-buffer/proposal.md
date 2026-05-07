## Why

`session-history-improvements` 實作了分批傳輸、isConnecting 狀態、eager resume 等功能，但 uuid 去重（seenUuids）與 StateBuffer 尚未實作。當第二個 client join 一個正在 streaming 的 session 時，live 事件可能在 history replay 之前套用，或同一 uuid 的 `message:assistant` 重複顯示。

## What Changes

- 補 server 測試：`historyBatchSize=1` 時多批次都能完整傳送（驗證現有分批邏輯）
- Client `ChannelState` 加入 `seenUuids: Set<string>`，history handler 與 live streaming handler 共用 uuid 去重
- Client 加入 `StateBuffer`：`session:join` 發出後 buffer live 事件，join callback 回來後 drain，確保 history 先於 live 事件套用

## Capabilities

### New Capabilities

- `session-history-dedup`: client 用 `seenUuids` 去重，history 與 live stream 的 `message:assistant` 都不重複顯示
- `session-history-buffer`: client `StateBuffer` 工具，緩衝 join 期間的 live 事件直到 history 完成

### Modified Capabilities

- `session-history-batching`: 補測試覆蓋多批次傳輸路徑

## Impact

- `apps/server/src/__tests__/session-connect.test.ts` — 多批次 history 測試
- `apps/web/src/types/chat.ts` — `ChannelState.seenUuids`
- `apps/web/src/contexts/channel/handlers/message.ts` — uuid 去重
- `apps/web/src/contexts/channel/ChannelMessagesContext.tsx` — seenUuidsRef + StateBuffer 接線
- `apps/web/src/contexts/channel/handlers/streaming.ts` — seenUuidsRef
- `apps/web/src/contexts/channel/handlers/state-buffer.ts` — 新增
