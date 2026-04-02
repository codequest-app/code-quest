## 規則

- Server 399 test + Client 615 test 全部 pass
- 測試不變：不修改任何測試檔案的 expect
- TDD：FakeClaude + real JSON + testing-library，先寫測試再寫 code
- **Client 不直接 import config** — projectRoot 透過 ChannelProvider prop 傳入，context 提供給子 component

## 1. Client 設定 projectRoot

- [ ] 1.1 packages/client/src/config.ts 新增 `projectRoot`（`import.meta.env.VITE_PROJECT_ROOT ?? '../'`）
- [ ] 1.2 ChannelProvider 加 `projectRoot` prop（從 config 讀取後傳入）
- [ ] 1.3 ChannelMessagesContext（或新 context）暴露 projectRoot 給子 component
- [ ] 1.4 615 test pass

## 2. Client git/file events 帶 cwd

GitProvider 從 channel context 取 projectRoot，送 git 請求時帶 cwd。
不直接 import config — 從 context 取。

- [ ] 2.1 GitProvider 改為從 context 取 projectRoot
- [ ] 2.2 git:status, git:checkout, git:log, git:diff 帶 `cwd: projectRoot`
- [ ] 2.3 確認 file:list 已帶 channelId（server 用 ch.sessionState.cwd）
- [ ] 2.4 615 test pass

## 3. Shared schema 更新

git events 的 payload schema 加 optional cwd 欄位。

- [ ] 3.1 shared 的 git schema 加 `cwd: z.string().optional()`
- [ ] 3.2 399 + 615 test pass

## 4. Server git handler 用 payload 的 cwd

- [ ] 4.1 git.ts handleStatus/handleCheckout/handleLog/handleDiff — 從 payload 取 cwd，fallback process.cwd()
- [ ] 4.2 git.ts handleExec — 從 payload 取 cwd，fallback process.cwd()
- [ ] 4.3 exec-git.ts checkoutBranch 加 cwd 參數
- [ ] 4.4 399 + 615 test pass

## 5. Server file handler 用 channel cwd

file:read 已用 ch.sessionState.cwd。
file:list 改用 ch.sessionState.cwd。

- [ ] 5.1 file.ts handleList — 改用 ch.sessionState.cwd ?? process.cwd()，改為 withChannel
- [ ] 5.2 399 + 615 test pass

## 6. Server 其他 process.cwd() 確認

- [ ] 6.1 terminal.ts — fallback 保留 process.cwd()（合理：新 terminal 沒有 session cwd 時用 server cwd）
- [ ] 6.2 connect.ts — session persist cwd 保留 process.cwd()（記錄 server 啟動目錄）
- [ ] 6.3 claude/plugin.ts — cache key 保留 process.cwd()（plugin 是 per-server，不是 per-session）
- [ ] 6.4 確認剩餘 process.cwd() 都是合理用途
- [ ] 6.5 399 + 615 test pass
