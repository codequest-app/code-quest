## 1. DB Schema

- [x] 1.1 新增 migration：移除 `raw_events.seq`、`raw_deltas.seq`，移除死 indexes，新增 `(sessionId, createdAt, id)` 複合索引（SQLite + MySQL）
- [x] 1.2 更新 `schema-columns.ts`：從 `RAW_EVENT_COLUMNS` / `RAW_DELTA_COLUMNS` 移除 `'seq'`
- [x] 1.3 更新 `schema-sqlite.ts`：移除 `seq` 欄位定義與相關 indexes，新增正確索引
- [x] 1.4 更新 `schema-mysql.ts`：同上

## 2. Server - Store 層

- [x] 2.1 更新 `raw-delta-store.ts`：移除 interface 中的 `seq: number`
- [x] 2.2 更新 `drizzle-raw-event-store.ts`：移除 `rawEventRowSchema`、`RawEventsTable` interface、`toRawEvent()`、`append()`、`cloneEvents()` 中的 `seq`
- [x] 2.3 更新 `drizzle-raw-delta-store.ts`：移除 `RawDeltasTable` interface、`append()`、`clone()` 中的 `seq`

## 3. Server - Socket 層

- [x] 3.1 更新 `raw-recorder.ts`：移除 `PendingEvent.seq`、`seqCounter` 變數與所有相關賦值
- [x] 3.2 更新 `session/fork.ts`：移除 `seq: 0` hardcode
- [x] 3.3 更新 `session/history.ts`：移除 return type 與 response 中的 `seq`
- [x] 3.4 更新 `session/query.ts`：移除 interface 與 response 中的 `seq`

## 4. Client 清理

- [x] 4.1 檢查 `apps/web` 與 `apps/summoner` 是否有消費 `seq` 欄位，若有則移除

## 5. 測試

- [x] 5.1 確認所有受影響的測試仍通過（或更新測試移除 seq 斷言）
- [x] 5.2 補充 `drizzle-raw-event-store` 測試：驗證 append 後無 seq 欄位，查詢結果按 `(createdAt, id)` 排序
