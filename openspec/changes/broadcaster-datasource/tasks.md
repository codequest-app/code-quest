## 已完成（維持不動）

- [x] 建立 `packages/broadcaster/` package（types.ts、cached.ts、datasources/）
- [x] 實作 `DataSource<T>`、`CachedDataSource<T>`
- [x] 實作 `FilesDataSource`、`GitDataSource`、`OpenspecDataSource`
- [x] Server local / remote 訂閱流程串接
- [x] 前端 dirty event + snapshot 串接
- [x] fs:watch subscriberId 重構

## 1. 重新設計 Broadcaster API

- [ ] 1.1 修改 `packages/broadcaster/src/broadcaster.ts`：
  - 移除泛型 `Broadcaster<T>`
  - 新增 `add(type: string, createSource: (cwd: string) => DataSource<unknown>): this`
  - `subscribe(cwd, subscriberId, cb: (type: string, data: unknown) => void): Unsubscribe`
  - 內部 per-cwd entry 持有 `Map<type, { source, lastValue }>` 和共用的 `subs`
  - 新訂閱者加入時對每個 type 立即推 lastValue（或發起 read()）
  - 最後一個 unsubscribe 時 dispose 所有 DataSource 並刪除 entry

- [ ] 1.2 更新 `packages/broadcaster/src/index.ts`：調整 export

## 2. 重新設計 Agent Handler 介面

- [ ] 2.1 新增 `AgentHandler` interface（`apps/summoner/src/connection/agent-handler.ts`）：
  ```ts
  interface AgentHandler {
    attach(rpc: AgentTransport): void;
  }
  ```

- [ ] 2.2 修改 `apps/summoner/src/connection/agent.ts`：
  - Constructor 改為 `(processProvider: ProcessProvider, handlers: AgentHandler[])`
  - `attach()` iterate handlers 呼叫 `handler.attach(rpc)`
  - 移除所有個別 service 參數（filesystem、git、watchService、openspec）

- [ ] 2.3 將現有 `registerFsHandlers` 包成 `FsHandler implements AgentHandler`
- [ ] 2.4 將現有 `registerGitHandlers` 包成 `GitHandler implements AgentHandler`
- [ ] 2.5 新增 `BroadcasterHandler implements AgentHandler`：
  - Constructor 接收 `Broadcaster`
  - `attach()` 處理 `watch.start` → `broadcaster.subscribe(cwd, 'agent', (type, data) => rpc.emit(watch.snapshot, { cwd, type, data }))`
  - `watch.stop` → unsubscribe；guard：cwd 已有訂閱直接 return

- [ ] 2.6 更新 Summoner 啟動組裝：
  - 建立單一 `Broadcaster` 並 `.add()` 三種 DataSource（共用一個 `LocalWatchService`）
  - `new Agent(processProvider, [new FsHandler(fs), new GitHandler(git), new BroadcasterHandler(broadcaster)])`

## 3. 統一 Server 訂閱介面

- [ ] 3.1 修改 `apps/server/src/remote/remote-broadcaster.ts`：
  - 移除泛型，介面對齊新 `Broadcaster`
  - `subscribe(cwd, subscriberId, cb: (type: string, data: unknown) => void): Unsubscribe`
  - 第一個 subscriber → `rpc.request(watch.start, { cwd })`
  - snapshot 到來 → `cb(type, data)`
  - 最後一個 unsubscribe → `rpc.request(watch.stop, { cwd })`

- [ ] 3.2 修改 `apps/server/src/container.ts`：
  - 移除 `TYPES.FilesBroadcaster`、`TYPES.GitBroadcaster`、`TYPES.OpenspecBroadcaster`
  - 新增 `TYPES.Broadcaster`
  - Local mode：bind 單一 `Broadcaster` 實例（`.add()` 三種 DataSource）
  - Remote mode：bind `RemoteBroadcaster` 實例

- [ ] 3.3 修改 `apps/server/src/types.ts`：更新 `TYPES` 常數和 `HandlerContext`

- [ ] 3.4 新增或修改 server watch socket handler：
  - `watch { cwd, subscriberId }` → `broadcaster.subscribe(cwd, subscriberId, (type, data) => socket.emit('snapshot', { cwd, type, data }))`
  - `unwatch { subscriberId }` → unsubscribe

- [ ] 3.5 修改 `apps/server/src/socket/server.ts`：移除舊的三個 broadcaster，改用 `TYPES.Broadcaster`

## 4. 統一 Web 訂閱介面

- [ ] 4.1 統一 web 送出 `watch { cwd, subscriberId }` / `unwatch { subscriberId }`（取代 `fs:watch` / `fs:unwatch`）
- [ ] 4.2 統一收 `snapshot { cwd, type, data }` 並按 type 路由：
  - `'files'` → `FsContext`
  - `'git'` → `GitContext`
  - `'openspec'` → `OpenspecContext`
- [ ] 4.3 移除各 context 原有的個別 dirty event handler，改為從統一 snapshot 路由

## 5. 更新測試

- [ ] 5.1 更新 `packages/broadcaster/` 下的測試：驗證新 multi-type Broadcaster 行為
- [ ] 5.2 更新 summoner handler 測試（FsHandler、GitHandler、BroadcasterHandler）
- [ ] 5.3 更新 server 相關測試（container、watch handler）
- [ ] 5.4 更新 web context 測試（FsContext、GitContext、OpenspecContext）
