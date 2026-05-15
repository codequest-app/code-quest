## Why

現有的 `DirtyBroadcaster` + `WatchService` 架構把「偵測變更」和「讀取資料」分成兩層，前端收到 dirty signal 後還要自己 re-fetch，造成兩段式 round-trip，且快取、remote mode 支援都難以統一處理。需要一個更根本的架構：讓每個資料域（files、git、openspec）自己封裝讀取 + 快取 + 變更偵測，透過統一的 `Broadcaster` 介面 push 完整狀態給前端。

## What Changes

- 新增 `DataSource<T>` 介面：`read(): Promise<T>` + `onChange(cb): Unsubscribe`，封裝快取與變更偵測
- 新增 `Broadcaster<T>`：依賴注入 `DataSource<T>`，subscriber 連線時立即 push 當前值，變更時 push 新值
- 新增三個 DataSource 實作：`FilesDataSource`、`GitDataSource`、`OpenspecDataSource`
  - 每個各自管理自己的快取策略與 watcher（local 用 chokidar，remote 透過 RPC）
- 移除現有的 `DirtyBroadcaster` + 三個 matcher (`matchesFs`/`matchesGit`/`matchesOpenspec`)
- 移除 `WatchService` 注入到 broadcaster 的模式（改由各 DataSource 內部管理）
- **BREAKING**：前端不再收到 `EVENTS.fs.dirty` / `EVENTS.git.dirty` / `EVENTS.openspec.dirty` signal 後自行 re-fetch，改為直接收到完整資料

## Capabilities

### New Capabilities
- `broadcaster-datasource`: 通用 Broadcaster + DataSource 介面，files/git/openspec 各自實作 DataSource，統一由 Broadcaster 管理 subscriber lifecycle 與 push

### Modified Capabilities

## Impact

- `apps/server/src/services/dirty-broadcaster.ts` — 移除，以 `Broadcaster<T>` 取代
- `apps/server/src/socket/dirty-matchers.ts` — 移除（matcher 邏輯移入各 DataSource）
- `apps/server/src/socket/dirty-subscriber.ts` — 移除或大幅重寫
- `apps/server/src/container.ts` — 改為注入三個 DataSource 給對應 Broadcaster
- `apps/summoner/src/fs-watch/local.ts` (`LocalWatchService`) — 保留，由 DataSource 內部使用
- `apps/web/src/contexts/FsContext.tsx`、`GitContext.tsx`、`OpenspecContext.tsx` — 移除 dirty handler + re-fetch 邏輯，改為 subscribe 直接收值
