## Why

New session 點擊後顯示「Session not found」，因為 `ChannelMessagesProvider` 在 mount 時立即發送 `session:join`，但 `session:launch` 尚未完成建立 channel，造成 race condition。需要統一連線狀態管理，讓 join 等 launch 完成後才觸發。

## What Changes

- `ChannelContext` 的 `launchOnMount` boolean prop 改為四段 `status`（`connecting | launched | connected | error`），launch 成功後從 `connecting` 切到 `launched`，resume 路徑初始直接為 `launched`
- `ChannelMessagesProvider` 接收外層 `status`，僅在 `status === 'launched'` 時才 fire `joinSession`
- 移除 `ChannelMessagesProvider` 內部的 `isConnecting` state，connecting 顯示統一由外層 status 控制
- `onJoinComplete` callback 改名為 `onReady`
- 所有現有測試 expect 保持不變或等價

## Capabilities

### New Capabilities

_(none — this is a refactor of existing behavior)_

### Modified Capabilities

- `client`: ChannelContext status 管理重構，join 時序保證

## Impact

- `packages/client/src/contexts/channel/ChannelContext.tsx` — status state machine 重構
- `packages/client/src/contexts/channel/ChannelMessagesContext.tsx` — 移除 isConnecting，接收外層 status，onJoinComplete → onReady
- `packages/client/src/contexts/__tests__/ChannelContext.test.tsx` — expect 不變或等價
- `packages/client/src/test/render-with-channel.tsx` — 可能需配合 prop 調整
