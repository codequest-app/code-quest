## Why

`seq` 欄位在 `raw_events` / `raw_deltas` 表中是一個 per-connection 的計數器（每次 `wire()` 重置為 0），無法跨重連保持唯一順序，導致同一 session 內存在重複值，完全無法作為排序依據。移除它可以簡化 schema 與應用層程式碼，並以正確的 `(sessionId, createdAt, id)` 複合索引取代。

## What Changes

- 從 `raw_events` / `raw_deltas` 移除 `seq` 欄位與相關 dead indexes
- 新增 `(sessionId, createdAt, id)` 複合索引以支援所有現有查詢
- 移除 `raw-recorder.ts` 中的 `seqCounter` 邏輯與 `PendingEvent.seq`
- 移除所有 TypeScript interface / schema 中的 `seq` 欄位
- 移除 `query.ts` / `history.ts` API response 中的 `seq` 欄位
- **BREAKING**: `session/query` 與 `session/history` socket API 回傳資料不再包含 `seq`

## Capabilities

### New Capabilities

- `raw-event-ordering`: 以 `(sessionId, createdAt, id)` 作為 raw events 排序的唯一依據，取代原本失效的 `seq`

### Modified Capabilities

<!-- 無 spec-level behavior 變更 -->

## Impact

- **DB schema**: SQLite + MySQL 均需 migration
- **Server**: `drizzle-raw-event-store.ts`, `drizzle-raw-delta-store.ts`, `raw-delta-store.ts`, `raw-recorder.ts`, `session/query.ts`, `session/history.ts`, `session/fork.ts`
- **Shared schema columns**: `packages/db-schema/src/schema-columns.ts`
- **Transport seq 不受影響**: `resumable-socket.ts` / `envelope.ts` 的 transport-layer seq 是完全不同的概念，不動
