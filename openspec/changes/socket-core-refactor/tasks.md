## 1. SessionHistory 抽出

- [x] 1.1 建立 `socket/session-history.ts`，將 `convertRawToSocketEvents`、`getSessionHistory`、`getPendingReplayEvents`、`resolveSessionId` 從 ChannelManager 搬入，建構子注入 `RawEventStore`、`SessionStore`、`ProviderAdapter`、`getChannel` callback
- [x] 1.2 ChannelManager 移除 history 相關方法與 `SessionStore` 依賴
- [x] 1.3 更新所有呼叫端（`session/lifecycle.ts`、`session/fork.ts`、`session/index.ts`、`git.ts`）改用 `ctx.sessionHistory`
- [x] 1.4 HandlerContext 新增 `sessionHistory: SessionHistory`，container.ts 建立並注入
- [x] 1.5 typecheck + test 全過（397/397）

## 2. RawRecorder 抽出

- [x] 2.1 建立 `socket/raw-recorder.ts`，將 `wireRawPersistence` 邏輯搬入，提供 `wire(channel)` method
- [x] 2.2 ChannelManager.create()/join() 改為呼叫 `rawRecorder.wire(channel)`，移除內部 `wireRawPersistence`
- [x] 2.3 typecheck + test 全過（397/397）

## 3. SocketServer state 移進 ChannelManager

- [x] 3.1 `socketChannelsMap`、`addSocketToChannel` 移到 ChannelManager，新增 `removeSocketFromAll(socketId)` method
- [x] 3.2 `broadcastSessionState` 移到 ChannelManager（注入 `io` reference）
- [x] 3.3 刪除 `emitToSession`，所有呼叫端改用 `channel.emit()`
- [x] 3.4 更新 `connection.ts` disconnect handler 改用 `channelManager.removeSocketFromAll(socket.id)`
- [x] 3.5 HandlerContext 移除 `socketChannelsMap`、`emitToSession`、`addSocketToChannel`
- [x] 3.6 typecheck + test 全過（397/397）

## 4. Channel 包裝 runner methods

- [x] 4.1 Channel 新增 `sendMessage`、`respondToRequest`、`abort`、`write`、`kill` methods
- [x] 4.2 更新 `message.ts` 改用 Channel methods
- [x] 4.3 更新 `settings.ts`、`mcp.ts`、`speech.ts`、`terminal.ts`、`session/lifecycle.ts`、`channel-manager.ts` 改用 Channel methods
- [x] 4.4 typecheck + test 全過（397/397）

## 5. HandlerContext 最終瘦身

- [x] 5.1 移除 `runnerFactory` 從 HandlerContext 和 SocketServer（改用 `channelManager.runnerCommand/runnerArgs`）
- [x] 5.2 `rawEventStore` 保留在 HandlerContext（session/index.ts、git.ts 仍需直接存取）
- [x] 5.3 最終 typecheck + test 全過（397/397）

## 6. Schema 整理：移除 `.passthrough()` + 統一命名 + 集中管理

- [x] 6.1 `.passthrough()` → `z.looseObject()` 轉換：`schemas.ts`、`session-history.ts`、`shared/schemas/socket-event-payload.ts`
- [x] 6.2 重新命名：`errorPayload` → `errorMessageEventSchema`、`sessionInitPayload` → `sessionInitEventSchema`、`sessionStatusPayload` → `sessionStatusEventSchema`、`replayRequestPayload` → `controlRequestEventSchema`
- [x] 6.3 重新命名並移入 schemas.ts：`protocolEventBase` → `typedJsonObjectSchema`、`userMessagePayload` → `userMessageInputSchema`
- [x] 6.4 `channelSummarySchema` + `ChannelSummary` type 從 channel-manager.ts 移入 schemas.ts
- [x] 6.5 `initResponseResultSchema` + `InitResponseResult` type 從 lifecycle.ts 移入 schemas.ts
- [x] 6.6 typecheck + test 全過（397/397）
