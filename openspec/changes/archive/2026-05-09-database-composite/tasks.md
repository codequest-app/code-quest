## 1. Database URL 解析

- [x] 1.1 新增 `create-database.ts`（parseDatabaseType + createDatabaseFromUrl + DatabaseEntry interface）
- [x] 1.2 寫 tests for parseDatabaseType and createDatabaseFromUrl

## 2. Config 重構

- [x] 2.1 改 config.test.ts — database 改為 `string[]`
- [x] 2.2 改 config.ts — `database` 產出 unique URL 陣列
- [x] 2.3 改 AppConfig interface

## 3. Container 重構

- [x] 3.1 改 StoreConfig 為 `{ databases: DatabaseEntry[] }`
- [x] 3.2 改 buildStores — iterate databases 陣列
- [x] 3.3 改 buildProjectStores — iterate databases 陣列
- [x] 3.4 改 TYPES.Database binding
- [x] 3.5 移除 MysqlDatabase import

## 4. Composite Store 抽象

- [x] 4.1 新增 CompositeStore 基底類別 + tests
- [x] 4.2 重構 CompositeSessionStore 繼承基底
- [x] 4.3 重構 CompositeProjectStore 繼承基底
- [x] 4.4 重構 CompositeRawEventStore 繼承基底
- [x] 4.5 重構 CompositeRawDeltaStore 繼承基底
- [x] 4.6 重構 CompositeSettingsStore 繼承基底

## 5. Server.ts + Test Container

- [x] 5.1 改 server.ts — 用 config.database.map(createDatabaseFromUrl)
- [x] 5.2 改 create-test-container.ts — 用新 StoreConfig
- [x] 5.3 更新 banner 顯示 database URLs
- [x] 5.4 跑全部 tests 確認 green
