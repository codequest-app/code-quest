## Why

Server 端有三個待處理的程式碼品質問題：`composite-session-store.ts` 完全沒有測試覆蓋、`message-handler.ts` 的 `interruptedChannels` Set 在 channel 結束後不會清理造成記憶體洩漏、`channel-hooks.ts` 的 `onExit` 重複執行 pending-request rejection（`channel.ts` 已經處理過）。

## What Changes

- 為 `CompositeSessionStore` 新增完整單元測試，覆蓋 fan-out 寫入、部分失敗 AggregateError、非對稱讀取行為
- 修復 `message-handler.ts` 中 `interruptedChannels` Set 的記憶體洩漏，在 channel 結束時移除對應 channelId
- 移除 `channel-hooks.ts` `onExit` 中多餘的 pending-request rejection 邏輯

## Capabilities

### New Capabilities
- `composite-session-store-tests`: CompositeSessionStore 單元測試覆蓋

### Modified Capabilities

## Impact

- `src/services/composite-session-store.ts` — 新增測試（不改 production code）
- `src/socket/handlers/message-handler.ts` — 新增 channel exit 時的清理邏輯
- `src/socket/hooks/channel-hooks.ts` — 移除冗餘的 pending-request rejection
