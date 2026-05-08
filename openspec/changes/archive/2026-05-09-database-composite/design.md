## Context

目前 container 用 `sqliteDatabase` 和 `mysqlDatabase` 兩個獨立欄位，每個 composite store 各自實作 primary/secondary 邏輯。5 個 composite stores 有大量重複的 fan-out code。

## Goals / Non-Goals

**Goals:**
- Config 產出有序 URL 陣列，不綁定特定 DB 類型
- `createDatabaseFromUrl` 根據 protocol 選 driver
- Container 用 `databases: DatabaseEntry[]` 取代分開的欄位
- 抽象 composite store 的 read/write 邏輯

**Non-Goals:**
- 不加 PostgreSQL driver（只加 parseDatabaseType 識別，throw unsupported）
- 不改 Drizzle schema 結構

## Decisions

### 1. Config database 結構

```ts
// 之前
database: { url: string; sqliteUrl: string }

// 之後
database: string[]  // unique, 有序, 第一個是 primary
```

解析規則：
```
urls = unique([DATABASE_URL, DATABASE_SQLITE_URL || DEFAULT].filter(truthy))
```

### 2. DatabaseEntry interface

```ts
interface DatabaseEntry {
  db: unknown;
  schema: typeof mysqlSchema | typeof sqliteSchema;
}
```

`createDatabaseFromUrl(url)` 根據 protocol 回傳 `DatabaseEntry`。

### 3. StoreConfig 簡化

```ts
// 之前
interface StoreConfig {
  sqliteDatabase?: DrizzleDatabase;
  mysqlDatabase?: MysqlDatabase;
}

// 之後
interface StoreConfig {
  databases: DatabaseEntry[];
}
```

### 4. Composite Store 抽象

```ts
class CompositeStore<T> {
  protected readonly primary: T;
  constructor(protected readonly stores: T[]) {
    this.primary = stores[0];
  }
  protected async fanOut(op: (store: T) => Promise<void>): Promise<void> {
    // 全部跑，primary 之外的失敗只 log
  }
}
```

5 個 composite stores 繼承這個基底。

## Risks / Trade-offs

- **[Risk] 型別安全** → `db: unknown` 失去型別資訊，但 Drizzle stores 本來就是 generic
- **[Trade-off] 抽象成本** → 多一個基底類別，但消除 5 處重複
