## Context

`raw_events` 和 `raw_deltas` 表有一個 `seq` 欄位，原意是作為每個 session 內的排序依據。但實際上 `seqCounter` 是在 `wire()` 呼叫時（即每次 WebSocket 連線）重置為 0，導致同一 session 跨重連後會產生重複的 seq 值。現有查詢已改用 `(createdAt, id)` 排序，`seq` 完全沒有被正確使用。

注意：transport layer（`resumable-socket.ts` / `envelope.ts`）也有 `seq`，但這是完全不同的概念（用於 WebSocket 重連 replay），不在本次變更範圍內。

## Goals / Non-Goals

**Goals:**
- 移除 DB schema 中的 `seq` 欄位（`raw_events` / `raw_deltas`）
- 移除應用層所有引用 DB seq 的程式碼
- 新增正確的 `(sessionId, createdAt, id)` 複合索引
- 所有變更均有 TDD 保護

**Non-Goals:**
- 修改 transport-layer seq（`resumable-socket.ts` / `envelope.ts`）
- 改變現有的查詢語意或 API 行為（除了移除 seq 欄位）

## Decisions

**索引策略：使用 `(sessionId, createdAt, id)` 複合索引**

uuidv7 的 id 已經是時間排序，`createdAt` 提供毫秒級精度，`id` 作為 tiebreaker。這個組合可以覆蓋所有現有查詢（按 session 過濾 + 時間排序），不需要額外的 `createdDate` 欄位。

**移除策略：一次性清理，不保留 backward compatibility**

`seq` 從未正確運作（per-connection 而非 per-session），所以沒有 consumer 真正依賴它的值。直接移除，不需要 deprecation 期。

**Migration 方式：新增 migration 檔案，不修改現有 migration**

在 `packages/db-schema/src/migrations/` 新增一個 migration，執行 ALTER TABLE DROP COLUMN 與 CREATE INDEX。

## Risks / Trade-offs

- [SQLite 不支援 ALTER TABLE DROP COLUMN（舊版）] → 使用 recreate table migration pattern（rename → create new → copy → drop old）；或確認目標 SQLite 版本 ≥ 3.35.0（2021-03-12，支援 DROP COLUMN）
- [API breaking change：response 移除 seq] → 檢查 web/summoner client 是否有使用 `seq` 欄位，若有則一併清理
