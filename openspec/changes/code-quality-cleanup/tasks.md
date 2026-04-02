## 規則

- TDD：FakeClaude + real JSON + testing-library
- 每步改完跑 test，expect 不變或等價
- named function（不用 arrow），包含 map/dispatch table 裡的 handler
- inline type assertion（`as {}`）改用 zod schema
- 注意測試執行時間，不要引入不必要的延遲
- 小步前進，一次只改一件事

## summoner (CLI adapter)

- [x] S.1 isRecord() 重複定義 → 抽到 utils.ts
- [x] S.2 control.ts 巨型 switch → HANDLERS map + named helpers
- [x] S.3 adapter.ts convertOtherEvent if chain → switch + extracted helpers
- [x] S.4 protocol.ts buildArgs — 跳過（已有 comment 分組，每組都短，抽 method 過度設計）
- [x] S.5 result.ts errors cast → filter(typeof === 'string')
- [x] S.6 runner.ts JSON.parse → 加 try-catch

## server — handler 層

- [x] H.1 mcp.ts 8 個重複 handler → createRequestHandler factory
- [x] H.2 settings.ts — 跳過（之前評估差異太大不適合 factory）
- [x] H.3 message.ts generateTitleIfNeeded — 跳過（已拆成獨立 subscriber onMessageResultTitle）
- [x] H.4 channel-manager.ts broadcastSessionState → 移除重複 channel lookup

## server — core 層

- [x] C.1 channel.ts public fields → private + getter/setter
- [x] C.2 channel.ts sendNotification stub → 刪除
- [x] C.3 channel-emitter.ts removeSocketFromAll → O(1) socketRefs lookup
- [ ] C.4 drizzle-session-store.ts 兩次 DB round-trip — 延後（DB 層改動大）
- [x] C.5 magic numbers — 跳過（重要的已有常數名，一次性使用的不值得搬）
- [x] C.6 config.ts invalid driver → 加 log warning
- [ ] C.7 file-raw-store.ts validateSessionId — 延後（影響小）

## shared — schema 重整

- [x] SH.1 socket-event-payload.ts 拆分到各 domain file → 刪除

## client

- [x] CL.4 onStreamChunk switch → named handler functions per chunk kind
- [x] 補 streaming + message:result pipeline tests（+3 tests）
- [x] CL.1 message:result 合進 auto-wiring — reverted（效益不大，增加複雜度）
- [x] CL.2 ChannelControlContext — 跳過（搬 code 不改行為）
- [x] CL.3 Context state/actions 分離 — 跳過（consumer 全部讀 state，拆了也一樣 re-render）
### CL.5 handlers 搬到 channel/ + 重命名 + inline streamingHelpers

handlers 只服務 channel context，搬到 `contexts/channel/handlers/`。
去掉 `Handler` suffix 對齊 server 命名。
streamingHelpers.ts 只有 ChannelMessagesContext 消費，inline 回去。

步驟（每步跑 test）：

- [ ] CL.5a streamingHelpers.ts inline 回 ChannelMessagesContext，刪除檔案
- [ ] CL.5b 搬 handlers：`contexts/handlers/channel/*.ts` → `contexts/channel/handlers/*.ts`
- [ ] CL.5c 重命名去掉 Handler suffix：fileHandler→file, messageHandler→message, etc.
- [ ] CL.5d 更新所有 import path
- [ ] CL.5e 622 client test pass + typecheck

- [ ] CL.0 依功能規畫資料夾結構 — 延後（另開 change）

## Round 2: Code Review 修正

### R2.1 `.passthrough()` → `z.looseObject()`（Zod v4 deprecated）

shared ~30 處 + summoner schemas.ts ~46 處。

- [ ] R2.1a shared schemas：逐檔替換
- [ ] R2.1b summoner schemas.ts：逐檔替換
- [ ] R2.1c 全量 test pass

### R2.2 inline type assertion → zod schema

- [ ] R2.2a server auth.ts: 2 處 `payload as { ... }`
- [ ] R2.2b server plugin.ts: 1 處 `payload as { ... }`
- [ ] R2.2c client components: 5 處 `as { ... }`
- [ ] R2.2d 全量 test pass

### R2.3 空 catch block → 至少 log

- [ ] R2.3a server channel-manager.ts
- [ ] R2.3b server session-history.ts
- [ ] R2.3c test pass

### R2.4 summoner: `asRecord()` helper

control.ts + system.ts 重複 `isRecord(x) ? x : undefined`。

- [ ] R2.4a utils.ts 新增 `asRecord()`
- [ ] R2.4b 替換所有 `isRecord(x) ? x : undefined`
- [ ] R2.4c test pass

### R2.5 server: async/await 改善

- [ ] R2.5a settings.ts `onGetSettings` promise chain → async/await
- [ ] R2.5b permission.ts `onOpenDiff` Promise chain → async/await
- [ ] R2.5c test pass

## 驗證

- [x] 400 server + 622 client + 276 summoner test pass
- [x] typecheck pass
