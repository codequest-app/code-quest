## Why

CLI process 死掉（SIGKILL、segfault、crash）時，UI 會卡在錯誤狀態：

1. **processing 卡死** — `message:result` 是唯一讓 processing→idle 的路徑。process 意外死掉不會發 `message:result`，UI 永遠顯示 SpinnerVerb
2. **cancelling 卡死** — 使用者按取消後 status 設為 `cancelling`，但沒有 timeout。如果 process 忽略 interrupt 或已死，UI 永遠卡在 cancelling
3. **server _isProcessing 不重置** — channel.ts 的 `onExit` handler 不會 reset `_isProcessing`，重連後 server 回報 `busy` 但 process 已死
4. **無法區分** — 使用者看到 spinner 轉，無法判斷 AI 還在處理還是 process 已經死了

## What Changes

### Server
- `channel.ts` — `onExit` handler reset `_isProcessing`，並向 client 發送 `session:closed` 或 error event
- process exit 時如果 `_isProcessing=true`，自動發一個合成的 `message:result(isError=true)`

### Client
- `cancelling` 狀態加 timeout（10-15s），超時自動轉 `idle` + 顯示 error message
- `session:closed` event 清除 processing/cancelling 狀態
- 考慮在 SpinnerVerb 超過一定時間後顯示「可能已停止」提示

## Capabilities

### New Capabilities
- `zombie-detection`: 偵測 process 已死但 UI 未更新的情況

### Modified Capabilities
- `cancel-flow`: cancelling 加 timeout
- `process-exit`: exit 時自動 reset 狀態

## Impact

- `apps/server/src/socket/channel.ts` — onExit reset _isProcessing + 合成 result
- `apps/server/src/socket/handlers/message.ts` — cancel timeout
- `apps/web/src/contexts/channel/ChannelMessagesContext.tsx` — cancelling timeout
- `apps/web/src/contexts/channel/handlers/system.ts` — session:closed 清 status
