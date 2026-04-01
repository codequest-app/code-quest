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

## 7. ChannelEventRouter + SocketHandler 基礎設施

- [x] 7.1 `types.ts` 新增 `SocketHandler` interface + `ChannelEventFn`/`ChannelActionFn`/`ChannelExitFn`
- [x] 7.2 建立 `channel-event-router.ts`
- [x] 7.3 ChannelManager 接收 router，共用 hooks，`CreateChannelOptions` 移除 `hooks`
- [x] 7.4 server.ts 用 `subscribeHandlersToRouter()` 橋接現有 handler functions 到 router
- [x] 7.5 HandlerContext 移除 `buildChannelHooks`
- [x] 7.6 lifecycle.ts / fork.ts / terminal.ts 移除 `ctx.buildChannelHooks()` 呼叫
- [x] 7.7 typecheck + test 全過（397/397, ~5.6s）

## 8. Handler 遷移到 factory pattern（逐檔）

每個 handler：`export function register(socket, ctx)` → `export function create(ctx): SocketHandler`，onRunnerEvent/onServerAction/onExit 移到 subscribe()，anonymous closure → named function。

- [ ] 8.1 `handlers/speech.ts`（最小，驗證 factory pattern）
- [ ] 8.2 `handlers/usage.ts`（只有 subscribe，無 register）
- [ ] 8.3 `handlers/plan.ts`
- [ ] 8.4 `handlers/git.ts`
- [ ] 8.5 `handlers/terminal.ts`
- [ ] 8.6 `handlers/file.ts`（register + subscribe onEvent + onAction）
- [ ] 8.7 `handlers/mcp.ts`（register + subscribe onEvent）
- [ ] 8.8 `handlers/settings.ts`（register + subscribe onAction）
- [ ] 8.9 `handlers/message.ts`（register + subscribe onEvent）
- [ ] 8.10 `handlers/control.ts` → `handlers/permission.ts`（改名，只有 subscribe）
- [ ] 8.11 `handlers/connection.ts` → `handlers/app.ts`（改名）
- [ ] 8.12 `handlers/session/`（lifecycle + crud + fork 組合成一個 SocketHandler）
- [ ] 8.13 `claude/auth.ts`、`claude/mcp-servers.ts`、`claude/plugin.ts`（factory，留在 claude/）
- [ ] 8.14 typecheck + test 全過

## 9. 核心層命名與職責修正

- [ ] 9.1 `channel.ts`：`wireRunner.onSocketEvent` 拆出 `handleInternalEvent(se)` private method（state update 與 broadcast 分離）
- [ ] 9.2 `channel.ts`：`replayPendingControlRequests` 移到 `session-history.ts`（只有 lifecycle session:join 用）
- [ ] 9.3 `channel.ts`：確認 `nextSeq()` 是否 dead code，是就刪除
- [ ] 9.4 `channel-manager.ts`：`broadcastSessionState` 的 key 映射（`model` → `modelSetting`、`permissionMode` → `initialPermissionMode`）不應在 ChannelManager 裡，移到呼叫端或獨立 broadcast utility
- [ ] 9.5 `channel-manager.ts`：`removeSocketFromAll` 的迴圈找 socket → Channel 新增 `removeSocketById(socketId)` method
- [ ] 9.6 `channel-manager.ts`：消除 `_sessionHistory` setter injection + `!` assertion — 改為 constructor 參數（解決循環依賴需調整 container.ts 建構順序）
- [ ] 9.7 `session-history.ts`：消除 `getChannel` callback 注入 — `resolveSessionId` 只查 sessionStore，不依賴 in-memory channel
- [ ] 9.8 `session-history.ts`：修復 `getPendingReplayEvents` 重複查詢 DB（`rawEventStore.getBySession` 呼叫兩次）
- [ ] 9.9 `raw-recorder.ts`：`channel.lastError = line` 直接修改 → 改用 callback 或讓 Channel 自行處理 stderr
- [ ] 9.10 `context.ts`：`io` 不應暴露在 HandlerContext — handler 透過 `ctx.io?.emit()` 直接操作 io 的地方改用 ChannelManager 的 broadcast 或新增專屬 method
- [ ] 9.11 `context.ts`：`authState` / `cachedModels` 是 mutable global state — 評估是否需要獨立管理
- [ ] 9.12 typecheck + test 全過

## 10. Handler 內部品質提升

- [ ] 10.1 `message.ts`：`chat:respond` 拆成 response strategy（notification / mcp / elicitation / permission，各自 named function）
- [ ] 10.2 `message.ts`：title generation 邏輯從 `onResult` 移到 session handler
- [ ] 10.3 `message.ts`：`interruptedChannels` 清理（socket disconnect 時清除，或改為 per-channel tracking）
- [ ] 10.4 `message.ts`：移除 L34 多餘的 `channel?.` optional chain（L28 已 guard）
- [ ] 10.5 `settings.ts`：前三個 handler 合併成 generic setter pattern
- [ ] 10.6 `settings.ts`：`DEFAULT_THINKING_TOKENS` 移到 `schemas.ts`，消除 settings → lifecycle 跨模組 import
- [ ] 10.7 `mcp.ts`：8 個重複 handler 改成 data-driven registration
- [ ] 10.8 `file.ts`：`file:list` 拆出 `listWithRg()`、`listWithWalk()`、`listTerminals()` named function
- [ ] 10.9 `session/lifecycle.ts`：`persistNewSession` 移到共用位置（fork.ts 也用），修正 L39 的 import 位置
- [ ] 10.10 `session/lifecycle.ts`：`handleInitResponse` 拆分 models caching 和 account broadcasting
- [ ] 10.11 `session/fork.ts`：git checkout retry 抽成 `utils/exec-git.ts` 的 `checkoutBranch(branch)` 共用
- [ ] 10.12 `terminal.ts`：`terminal:open_claude` 重用 session launch 共用邏輯（避免重複 create + wire + broadcast）
- [ ] 10.13 typecheck + test 全過

## 11. types.ts 清理 + 檔案搬遷

- [ ] 11.1 `types.ts`：`ensureChannel` 移到 mcp.ts 內部（只有它用）
- [ ] 11.2 `types.ts`：`pickDefined`、`errMsg` 移到 `utils/` 或 shared（generic utility，不屬於 socket types）
- [ ] 11.3 `types.ts`：`WireRunnerHooks`、`RunnerListeners` 評估是否移入 channel.ts 內部
- [ ] 11.4 `handlers/exec-git.ts` + `handlers/rg.ts` 移到 `utils/`
- [ ] 11.5 `handlers/session/index.ts` 原 CRUD handlers 改名 `crud.ts`，index.ts 只做 factory 組合
- [ ] 11.6 server.ts 加 provider 條件載入（claude handlers 只在 provider === 'claude' 時註冊）
- [ ] 11.7 移除 channel.ts 已無人使用的 re-export
- [ ] 11.8 最終 typecheck + test 全過
- [ ] 11.9 確認 test 執行時間無顯著退化（baseline: 397 tests, ~6.5s）
