## 1. Package 建立

- [x] 1.1 建立 `packages/broadcaster/` 目錄結構，新增 `package.json`、`tsconfig.json`
- [x] 1.2 在 pnpm workspace 加入 `packages/broadcaster`，執行 `pnpm install`

## 2. Core Types 與 DataSource 介面

- [x] 2.1 建立 `packages/broadcaster/src/types.ts`：`DataSource<T>`、`Unsubscribe` type
- [x] 2.2 建立 `packages/broadcaster/src/cached.ts`：`CachedDataSource<T>` 實作（lazy invalidation）
- [x] 2.3 建立 `packages/broadcaster/src/broadcaster.ts`：`Broadcaster<T>` 實作（Map<cwd, entry>，lazy source 建立，lastValue 快取）

## 3. DataSource 實作

- [x] 3.1 建立 `packages/broadcaster/src/datasources/files.ts`：`FilesDataSource`（watchService subscribe + matchesFs 過濾，read 呼叫 filesystemService.listFiles）
- [x] 3.2 建立 `packages/broadcaster/src/datasources/git.ts`：`GitDataSource`（GIT_META_RE 過濾，read 呼叫 gitService.status）
- [x] 3.3 建立 `packages/broadcaster/src/datasources/openspec.ts`：`OpenspecDataSource`（openspec/ 路徑過濾，read 呼叫 openspecService.list）
- [x] 3.4 建立 `packages/broadcaster/src/index.ts`：export 所有型別與實作

## 4. Summoner 整合

- [x] 4.1 在 summoner 建立三個 Broadcaster 實例（filesBroadcaster、gitBroadcaster、openspecBroadcaster），注入 LocalWatchService 與各 Service
- [x] 4.2 新增 `watch.start` RPC handler：呼叫對應 Broadcaster.subscribe，以 subscriberId = connectionId+cwd
- [x] 4.3 新增 `watch.stop` RPC handler：呼叫對應 Broadcaster 的 unsubscribe
- [x] 4.4 Broadcaster callback 觸發時，summoner push `watch.snapshot({ cwd, type, data })` 給 server

## 5. Server 整合（Local Mode）

- [x] 5.1 Local mode：server container 直接持有 summoner Broadcaster 的 in-process reference
- [x] 5.2 socket `watch` 事件 handler：呼叫對應 Broadcaster.subscribe(cwd, socketId, cb)
- [x] 5.3 socket `unwatch` 事件 / disconnect handler：呼叫 unsubscribe，若該 cwd 無訂閱者不需額外動作（local mode Broadcaster 自行清理）
- [x] 5.4 cb 觸發時 emit `EVENTS.fs.dirty / git.dirty / openspec.dirty` 並帶上 `snapshot` 欄位

## 6. Server 整合（Remote Mode）

- [x] 6.1 Remote mode：server 記錄 `Map<cwd, Set<socketId>>` 訂閱表
- [x] 6.2 socket `watch` 事件：加入訂閱表，若為 cwd 第一個訂閱者則向 summoner 發 `watch.start({ cwd })` RPC
- [x] 6.3 socket `unwatch` / disconnect：移除訂閱表，若 cwd 無訂閱者則向 summoner 發 `watch.stop({ cwd })` RPC
- [x] 6.4 接收 summoner `watch.snapshot` push：依 cwd 查訂閱表，emit dirty event + snapshot 給所有訂閱 socket

## 7. 移除舊邏輯

- [x] 7.1 刪除 `apps/server/src/services/dirty-broadcaster.ts`
- [x] 7.2 刪除 `apps/server/src/socket/dirty-matchers.ts`
- [x] 7.3 刪除 `apps/server/src/socket/dirty-subscriber.ts`（或重寫為新 watch handler）
- [x] 7.4 刪除 `packages/watch/src/remote.ts`（RemoteWatchService 不需要）
- [x] 7.5 更新 `packages/watch/src/index.ts`：移除 RemoteWatchService export

## 8. 前端更新

- [x] 8.1 `FsContext.tsx`：dirty handler 改為直接使用 `snapshot` 欄位，保留 re-fetch fallback（snapshot 不存在時）
- [x] 8.2 `GitContext.tsx`：同上，使用 git snapshot
- [x] 8.3 `OpenspecContext.tsx`：同上，使用 openspec snapshot
- [x] 8.4 確認所有 dirty event handler 在有 snapshot 時不觸發額外 re-fetch

## 9. fs:watch subscriber ID 重構

- [x] 9.1 Schema：`fsWatchPayloadSchema` 加入 `subscriberId: string`；`fsUnwatchPayloadSchema` 改為只帶 `subscriberId`（移除 `cwd`）
- [x] 9.2 Server `fs.ts` handler：`subsBySocket` 改為 `Map<socketId, Map<subscriberId, { cwd, off }>>` ；`handleWatch` 用 subscriberId 訂閱 Broadcaster；`handleUnwatch` 用 subscriberId 查找並取消
- [x] 9.3 Server `fs.ts` handler：disconnect 清理改為 iterate 所有 subscriberId 逐一 off()
- [x] 9.4 移除 ChannelManager 的 snapshot broadcaster 自動訂閱邏輯（`subscribeBroadcastersForSocket` / `releaseBroadcastersForSocket` / `socketChannelSubs`）
- [ ] 9.5 移除 `HandlerContext` 中的 `filesBroadcaster / gitBroadcaster / openspecBroadcaster`，改由 `fs.ts` handler 直接從 container 取得（skipped — keeping in HandlerContext for now）
- [x] 9.6 前端 `FsContext`：`subscribeFsDirty` 移除 ref count，每次 subscribe 產生唯一 subscriberId，送 `fs:watch { cwd, subscriberId }`；unsubscribe 送 `fs:unwatch { subscriberId }`
- [x] 9.7 刪除 `useKeepFsWatcherAlive` hook，移除 `FilesPane` / `GitPane` 中的呼叫
