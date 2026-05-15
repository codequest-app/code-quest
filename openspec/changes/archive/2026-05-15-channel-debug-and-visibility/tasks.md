## 1. 修正 SessionLookup + join() 補 projectRoot

- [x] 1.1 `channel-manager.ts`：`SessionLookup` interface 新增 `resolveProjectRoot(channelId: string): Promise<string>` 方法
- [x] 1.2 `container.ts`：`sessionLookup` 物件新增 `resolveProjectRoot` 實作 — 從 `resolveCwd` 同樣的 DB row 取 `row.projectRoot ?? row.cwd`
- [x] 1.3 `channel-manager.ts`：`join()` 在 `setupChannel` 後呼叫 `this.sessions.resolveProjectRoot(channelId)` 並設 `channel.projectRoot`

## 2. 修正 handleInit fallback

- [x] 2.1 `handlers/app.ts`：`handleInit` 的 session mapping 將 `...(ch.projectRoot ? { projectRoot: ch.projectRoot } : {})` 改為 `projectRoot: ch.projectRoot ?? ch.cwd`

## 3. Debug endpoint

- [x] 3.1 `bin/server.ts`：在 `/health` 附近新增 `GET /debug/channels` route，僅在 `config.debug`（或 `NODE_ENV !== 'production'`）時掛載
- [x] 3.2 route handler 從 `container.get<ChannelManager>(TYPES.ChannelManager)` 取得 instance，回傳 `{ channels: [...] }` — 每個 channel 包含 `channelId`、`sessionId`、`exited`、`isBound`、`isProcessing`、`cwd`、`projectRoot`
- [x] 3.3 `config.ts`：新增 `debug: boolean` 欄位，讀 `DEBUG=true` 環境變數（預設 `false`）

## 4. 確認

- [x] 4.1 `pnpm --filter @code-quest/server exec tsc --noEmit` 確認 TypeScript 無誤
- [x] 4.2 `pnpm test --run` 確認全 green
