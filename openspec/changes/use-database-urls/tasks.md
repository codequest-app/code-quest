## Tasks

### 1. Red — config tests for new shape
- [x] URL-presence cases for DATABASE_URL / DATABASE_SQLITE_URL / both / neither / empty string.
- [x] `resolveSqlitePath` helper tests covering `file:` prefix, `:memory:`, bare paths.

### 2. Green — config.ts refactor
- [x] `loadConfig` returns `database: { url, sqliteUrl }` and `rawEvents: { persistDeltas }`.
- [x] `resolveSqlitePath` exported.
- [x] Dropped `parseRawEventsDrivers`, `DRIVERS` const, `RawEventsDriver` type.

### 3. StoreConfig refactor
- [x] `StoreConfig` now `{ sqliteDatabase?, mysqlDatabase? }` with undefined = disabled.
- [x] `buildStores` consumes handles directly; throws when neither supplied.

### 4. container.ts wiring
- [x] `ContainerOptions` drops `database` / `dbPath`; consumers pass handles via `storeConfig`.
- [x] No default sqlite file created; in-memory fallback only for test containers that pass nothing.

### 5. bin/server.ts boot wiring
- [x] Reads `config.database.url` + `config.database.sqliteUrl`.
- [x] Constructs `StoreConfig` handles via `createDatabase` / `createMysqlDatabase`.
- [x] Fail-fast with actionable error message when both unset.

### 6. Migration scripts
- [x] `migrate-sqlite.ts` reads `config.database.sqliteUrl`; errors if unset.
- [x] `migrate-mysql.ts` reads `config.database.url`; errors if unset.
- [x] `pnpm db:migrate` runs clean on both.

### 7. `.env.example` rewrite
- [x] Dropped `RAW_EVENTS_DRIVERS`, `RAW_EVENTS_SQLITE_PATH`.
- [x] Added `DATABASE_URL`, `DATABASE_SQLITE_URL` with canonical defaults.

### 8. Dev `.env` update
- [x] Local `.env` migrated to new variable names.

### 9. Existing test fixtures
- [x] `config.test.ts` rewritten for new shape.
- [x] `settings.test.ts` and `raw-delta-persistence.integration.test.ts` configMocks updated to `database.{url,sqliteUrl}` + slim `rawEvents`.
- [x] `create-test-container.ts` switches to `sqliteDatabase` handle.

### 10. Regression
- [x] `pnpm -r test` all green (server 533, client 1314, summoner 326).
- [x] `pnpm tsc --noEmit` clean.

### 11. Smoke (manual, user-run)
- [ ] `DATABASE_SQLITE_URL` only — verify boot works, writes go to SQLite.
- [ ] `DATABASE_URL` only — verify boot works, writes go to MySQL.
- [ ] Both unset — verify clear error message.
- [ ] Both set — verify dual-write.
