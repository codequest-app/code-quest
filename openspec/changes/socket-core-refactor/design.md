## Context

`ChannelManager`（282 行）目前混合四種職責：Channel CRUD、raw I/O persistence 接線、session history replay/轉換、sessionId 解析。`SocketServer`（172 行）持有 socket-channel tracking 和 broadcast 邏輯，但這些 state 本該屬於已持有 channels map 的 ChannelManager。`Channel`（376 行）讓 handler 直接存取 `channel.runner`，無法統一攔截。

受影響的核心檔案：
- `socket/channel-manager.ts` — 要拆出兩個 service
- `socket/channel.ts` — 要加 runner 包裝 methods
- `socket/server.ts` — 要把 state 移出
- `socket/context.ts` — HandlerContext 要瘦身
- 所有直接存取 `channel.runner` 的 handler

## Goals / Non-Goals

**Goals:**
- ChannelManager 只負責 Channel CRUD + socket tracking
- Session history 邏輯獨立成可單獨測試的 service
- Raw persistence 接線獨立成可替換的 service
- Handler 透過 Channel methods 操作 runner，不直接存取 `channel.runner`
- HandlerContext 只暴露各 handler 實際需要的成員
- 所有 397 tests 通過，不改 expect

**Non-Goals:**
- 不拆分 handler 到子資料夾（handler 已經夠小）
- 不改 Socket.IO event 簽名（純內部重構）
- 不改 hooks chain 為 event map（留給後續 change）
- 不拆分 Channel class（它是 cohesive unit）

## Decisions

### D1: 從 ChannelManager 抽出 SessionHistory service

**選擇**：獨立 `socket/session-history.ts` class，注入 `RawEventStore` + `SessionStore` + `ProviderAdapter`。

**理由**：ChannelManager 目前為了 history replay 而依賴 `RawEventStore` 和 `ProviderAdapter.transform()`，這些是 protocol 轉換邏輯，與 channel CRUD 無關。抽出後 ChannelManager 的建構子參數從 4 個減為 2 個（`RunnerFactory` + `ProviderAdapter`，只用 adapter 的 command/clientConfig）。

**包含方法**：
- `resolveSessionId(channelId)` — 需要查 channels map，改為接收 `channel: Channel | undefined` 參數
- `getSessionHistory(channelId)` — 同上
- `getPendingReplayEvents(sessionId)`
- `convertRawToSocketEvents(sessionId)` — private

### D2: 從 ChannelManager 抽出 RawRecorder

**選擇**：獨立 `socket/raw-recorder.ts`，`wire(channel)` method 掛載 stdout/stdin/stderr listener。

**理由**：`wireRawPersistence` 是 60 行的 closure-heavy 邏輯（含 buffering、flush、seq counter），與 channel 管理無關。抽出後 ChannelManager.create()/join() 只需呼叫 `rawRecorder.wire(channel)`。

### D3: SocketServer state 移進 ChannelManager

**選擇**：`socketChannelsMap`、`addSocketToChannel`、`removeSocketFromAll` 移到 ChannelManager。`broadcastSessionState` 移到 ChannelManager（需注入 `io` reference）。刪除 `emitToSession`（handler 已能透過 `channel.emit()` 達成同樣效果）。

**替代方案**：建立獨立的 `SocketTracker` class — 但 socket-channel 關聯與 channel 生命週期緊密耦合（create 時 add、disconnect 時 remove），分離反而增加協調成本。

### D4: Channel 包裝 runner methods

**選擇**：Channel 新增 `sendMessage(text)`、`respondToRequest(requestId, response)`、`abort()`、`write(data)`，handler 改用這些 methods。`runner` property 改為 private（或至少不在 handler 中直接使用）。

**理由**：目前 `message.ts`、`speech.ts`、`mcp.ts`、`settings.ts` 等 7+ 處直接呼叫 `channel.runner.sendMessage()` / `channel.runner.respondToControlRequest()`。包裝後可在 Channel 層統一加 logging、validation 等攔截。

**注意**：`runner` 仍需 public 給 `wireRunner()` 和 `RawRecorder` 使用，但 handler 層級不應直接存取。

### D5: HandlerContext 瘦身

**選擇**：移除 `runnerFactory`（只有 lifecycle 用，但實際上是透過 channelManager.create()）、`rawEventStore`（移到 SessionHistory）、`socketChannelsMap`（移到 ChannelManager）、`emitToSession`（刪除）、`addSocketToChannel`（移到 ChannelManager）。

新增 `sessionHistory: SessionHistory` 成員。

## Risks / Trade-offs

- **[循環依賴]** SessionHistory 需要 channels map 來做 resolveSessionId → **緩解**：SessionHistory 接收 `getChannel: (id: string) => Channel | undefined` callback，不直接依賴 ChannelManager
- **[runner 仍是 public]** 無法在 TypeScript 層面強制 handler 不碰 runner → **緩解**：code review + lint rule（後續可加）
- **[搬遷順序]** 多個 core 檔案同時改有互相覆蓋風險 → **緩解**：嚴格按 phase 順序，每 phase 一個 commit，typecheck + test 通過才下一步
