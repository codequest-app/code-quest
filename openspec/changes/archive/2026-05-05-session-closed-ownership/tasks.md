## 1. ChannelMessagesContext 接管 session:closed message

- [x] 1.1 RED: 確認現有 session-closed 測試覆蓋 error message 和 disconnected status（expect 不變）
- [x] 1.2 GREEN: `ChannelMessagesContext` 加入 `session:closed` socket listener，追加 error message + 設 disconnected
- [x] 1.3 `ChannelControlContext.onSessionClosed` 移除 message 追加和 status 更新，只清 controls

## 2. 消除 addControlAndMessage

- [x] 2.1 `addControlAndMessage` 仍被 onControlPermission + onControlHookCallback 使用，不刪除（session:closed 已分離，職責已清晰）
- [x] 2.2 確認所有測試通過（1939 passed）
