## Why

資料庫層目前用 `sqliteDatabase` 和 `mysqlDatabase` 分開管理，container 裡有兩套 if/else 建 stores，5 個 composite stores 各自實作 fan-out 邏輯。命名綁死 MySQL（但 `DATABASE_URL` 可以是任何 DB），composite 邏輯重複 5 次。

## What Changes

- Config 產出 `database: string[]`（URL 陣列，unique、有序）
- 新增 `createDatabaseFromUrl(url)` 根據 URL protocol 選 driver + schema
- Container 的 `StoreConfig` 改為 `databases: DatabaseEntry[]`
- 抽象 `CompositeStore<T>` 基底類別：read → `stores[0]`、write → fan-out all
- 移除 `mysqlDatabase`/`sqliteDatabase` 分開的概念
- 簡化 `buildStores`/`buildProjectStores` 為 iterate databases

## Capabilities

### New Capabilities
- `database-url-resolver`: 根據 connection string protocol 自動選擇 DB driver 和 schema

### Modified Capabilities

## Impact

- `apps/server/src/config.ts` — `database` 型別改為 `{ urls: string[] }`
- `apps/server/src/container.ts` — `StoreConfig` 改為 `{ databases: DatabaseEntry[] }`
- `apps/server/src/db/create-database.ts` — 新增 URL 解析 + factory
- `apps/server/src/services/composite-*.ts` — 抽象化為共用基底
- `apps/server/src/bin/server.ts` — 簡化 DB 初始化
- `apps/server/src/test/create-test-container.ts` — 改用新 StoreConfig
