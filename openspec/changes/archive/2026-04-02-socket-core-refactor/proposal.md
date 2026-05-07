## Why

ChannelManager（282 行）混合了四種職責：Channel CRUD、raw event persistence 接線、session history replay/轉換、sessionId 解析。SocketServer 持有本該屬於 ChannelManager 的 state（`socketChannelsMap`、`broadcastSessionState`、`emitToSession`）。Channel（376 行）讓 handler 直接存取 `channel.runner`，無法統一攔截 runner 操作。這些混合職責使得單元測試需要 mock 過多依賴，且修改一個 concern 容易波及不相關的邏輯。

## What Changes

- 從 ChannelManager 抽出 `SessionHistory` service（`convertRawToSocketEvents`、`getSessionHistory`、`getPendingReplayEvents`、`resolveSessionId`），ChannelManager 不再依賴 `RawEventStore` 和 `ProviderAdapter.transform()`
- 從 ChannelManager 抽出 `RawRecorder`（`wireRawPersistence` 的 stdout/stdin/stderr 錄製邏輯），ChannelManager.create()/join() 改為呼叫 `rawRecorder.wire(channel)`
- SocketServer 的 `socketChannelsMap`、`addSocketToChannel`、`broadcastSessionState`、`emitToSession` 移進 ChannelManager
- Channel 新增 runner 包裝 methods（`sendMessage`、`respondToRequest`、`abort`、`write`），handler 不再直接存取 `channel.runner`
- HandlerContext 移除因上述搬遷而不再需要的成員（`runnerFactory`、`rawEventStore`、`socketChannelsMap`、`emitToSession`、`addSocketToChannel`）

## Capabilities

### New Capabilities

- `session-history`: session history replay 與 raw event 轉換邏輯（從 ChannelManager 抽出）
- `raw-recorder`: raw I/O persistence 接線（從 ChannelManager 抽出）

### Modified Capabilities

（無既有 spec 的 requirement 變更，此次為純內部重構）

## Impact

- **受影響檔案**：`socket/channel-manager.ts`、`socket/channel.ts`、`socket/server.ts`、`socket/context.ts`，以及所有直接存取 `channel.runner` 的 handler（`message.ts`、`speech.ts`、`mcp.ts`、`settings.ts`、`session/lifecycle.ts`）
- **API**：無外部 API 變更，所有 Socket.IO event 簽名不變
- **測試**：現有 397 tests 應全部通過，不改 expect
