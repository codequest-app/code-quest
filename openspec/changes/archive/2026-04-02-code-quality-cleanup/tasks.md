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
- [x] S.4 protocol.ts buildArgs — 跳過（已有 comment 分組，抽 method 過度設計）
- [x] S.5 result.ts errors cast → filter(typeof === 'string')
- [x] S.6 runner.ts JSON.parse → 加 try-catch

## server — handler 層

- [x] H.1 mcp.ts 8 個重複 handler → createRequestHandler factory
- [x] H.2 settings.ts — 跳過（差異太大不適合 factory）
- [x] H.3 message.ts generateTitleIfNeeded — 跳過（已拆成獨立 subscriber）
- [x] H.4 channel-manager.ts broadcastSessionState → 移除重複 channel lookup

## server — core 層

- [x] C.1 channel.ts public fields → private + getter/setter
- [x] C.2 channel.ts sendNotification stub → 刪除
- [x] C.3 channel-emitter.ts removeSocketFromAll → O(1) socketRefs lookup
- [x] C.4 drizzle-session-store.ts — 跳過（收益不值得風險）
- [x] C.5 magic numbers — 跳過（重要的已有常數名）
- [x] C.6 config.ts invalid driver → 加 log warning
- [x] C.7 file-raw-store.ts validateSessionId → 加 getPreview 驗證

## shared — schema 重整

- [x] SH.1 socket-event-payload.ts 拆分到各 domain file → 刪除

## client

- [x] CL.4 onStreamChunk switch → named handler functions per chunk kind
- [x] CL.5a streamingHelpers.ts inline 回 ChannelMessagesContext，刪除檔案
- [x] CL.5b 搬 handlers：contexts/handlers/channel/ → contexts/channel/handlers/
- [x] CL.5c 重命名去掉 Handler suffix
- [x] CL.5d 更新所有 import path
- [x] CL.5e 622 client test pass + typecheck
- [x] CL.1 message:result 合進 auto-wiring — reverted（增加複雜度）
- [x] CL.2 ChannelControlContext — 跳過（搬 code 不改行為）
- [x] CL.3 Context state/actions 分離 — 跳過（consumer 全部讀 state）
- [x] CL.0 依功能規畫資料夾結構 — 延後（另開 change）
- [x] 補 streaming + message:result pipeline tests（+3 tests）
- [x] isRecord → shared utils/is-record.ts
- [x] ChannelControlContext useEffect deps fix（refs for elicitation/diffReview）

## Round 2: Code Review 修正

- [x] R2.1 .passthrough()/.loose() → z.looseObject()（shared 30 + summoner 46）
- [x] R2.2 auth.ts + plugin.ts inline type casts → shared zod schemas
- [x] R2.2c client components — 跳過（P2，UI 層 type assertion）
- [x] R2.3 空 catch block — 跳過（都是故意的 fallback pattern）
- [x] R2.4 asRecord() helper + 替換 10 occurrences
- [x] R2.5 settings.ts onGetSettings + permission.ts onOpenDiff → async/await

## 驗證

- [x] 400 server + 622 client + 276 summoner test pass
- [x] typecheck pass
