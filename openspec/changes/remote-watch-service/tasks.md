## 1. 新增 RPC method 名稱

- [ ] 1.1 在 `packages/schemas/src/remote/methods.ts` 的 `REMOTE_METHODS` 加入 `watch: { subscribe, unsubscribe, event }` 三個 method 字串

## 2. 清理 FilesystemService 的 WatchService

- [ ] 2.1 移除 `apps/summoner/src/filesystem/local.ts` 中的 `watch?: WatchService` constructor 參數、`listCache`、`listCacheInflight`、`getOrBuildListCache`、`buildListCacheEntry` 裡的 unsubscribe 相關邏輯，改為每次直接 `buildListCacheEntry`（或直接 inline `getAllFiles`）
- [ ] 2.2 移除 `apps/server/src/container.ts` 中傳給 `LocalFilesystemService` 的 `watchService` 參數

## 3. 實作 RemoteWatchService（server 端）

- [ ] 3.1 新增 `apps/server/src/remote/watch-service.ts`，實作 `WatchService` 介面：`subscribe(cwd, cb)` 送 `watch/subscribe` request，on `watch/event` 過濾 cwd 後呼叫 cb，unsubscribe 送 `watch/unsubscribe` request 並移除 listener

## 4. 實作 watch RPC handlers（summoner 端）

- [ ] 4.1 新增 `apps/summoner/src/connection/watch-handlers.ts`，`registerWatchHandlers(rpc, watchService)` 處理 `watch/subscribe` 和 `watch/unsubscribe` request，有事件時 `rpc.emit(watch/event, { cwd, event })`
- [ ] 4.2 在 `apps/summoner/src/connection/agent.ts` 中建立 `LocalWatchService` 並呼叫 `registerWatchHandlers`

## 5. 更新 container 注入

- [ ] 5.1 在 `apps/server/src/container.ts` 中，根據 `remoteRpc` 是否存在，分別注入 `RemoteWatchService` 或 `LocalWatchService` 給 `bindDirtyBroadcasters`

## 6. 驗證

- [ ] 6.1 跑 TypeScript build，修正所有 type error
- [ ] 6.2 跑全套測試，確認通過
