## Why

`ChannelControlContext` 的 `onSessionClosed` handler 直接寫入 `ChannelMessagesContext` 的 state（追加 error message、改 status），違反 context 邊界。`ChannelControlProvider` 不應知道也不應操作 `setChannelState`。

## What Changes

- `ChannelControlContext` 的 `onSessionClosed` 只負責清 controls state
- `session:closed` 的 error message 追加和 status 改為 `disconnected`，移到 `ChannelMessagesContext` 的 handler map 處理（與現有 `onSessionStates` 等 socket handler 同層）
- `addControlAndMessage` 工具函式隨之消除，兩個 context 各自操作自己的 state

## Impact

- `packages/client/src/contexts/channel/ChannelControlContext.tsx`
- `packages/client/src/contexts/channel/ChannelMessagesContext.tsx`
- `packages/client/src/contexts/__tests__/session-closed.test.tsx`（現有測試保持 expect 不變）
