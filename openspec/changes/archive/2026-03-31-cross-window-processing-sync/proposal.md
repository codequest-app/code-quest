## Why

A 視窗送出 prompt 後顯示 spinner + stop 按鈕，但 B 視窗沒有任何狀態變化。Server 已經 broadcast `session:states { state: 'busy' }` 給所有 client，但 B 的 `ChannelMessagesContext` 不監聽 `session:states`，只在自己的 `chat:send` 和 `session:join` 才更新 status。

## What Changes

- `ChannelMessagesContext` 或 `ChannelConfigContext` 監聽 `session:states` 的 `state` 欄位
- 當收到 `state: 'busy'` → 更新 `channelState.status` 為 `'busy'`（spinner + stop 出現）
- 當收到 `state: 'idle'` → 更新為 `'idle'`（spinner 消失）
- 當收到 `state: 'exited'` → 更新為 `'disconnected'`

## Capabilities

### New Capabilities
- `processing-state-sync`: B 視窗的 channel status 根據 session:states broadcast 同步

### Modified Capabilities

## Impact

- `apps/web/src/contexts/channel/ChannelMessagesContext.tsx` — 監聽 `session:states` 更新 status
- 或 `apps/web/src/contexts/channel/ChannelConfigContext.tsx` — 在現有 `onSessionStates` handler 中加 status 更新
