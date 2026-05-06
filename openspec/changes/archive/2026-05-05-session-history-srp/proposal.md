## Why

`session-history.ts` 的兩個函式各自混合多個職責：

- `replayParsedEvents`：「要不要用 stdin 事件」的策略判斷與迭代分派混在一起
- `replayPendingControlRequests`：載入歷史 + parse control events + dedup（cancel 消除 pending）+ emit 給 socket，四個步驟無法獨立測試

## What Changes

- 抽出 `filterReplayEvents(parsed, hasStdoutUserEcho)` pure function — 只負責過濾策略
- 抽出 `extractPendingControlRequests(messages, respondedIds)` pure function — 只負責 dedup 邏輯
- 兩者可獨立單元測試，replay 函式縮減為純 orchestration

## What Moves

`session-history.ts` 目前放在 `socket/` 根層，與 `socket/handlers/session/` 結構不一致。隨本 change 一併移至 `socket/handlers/session/history.ts`，對齊 client 的 `handlers/history.ts` 位置。

## Impact

- `packages/server/src/socket/session-history.ts` → 移至 `packages/server/src/socket/handlers/session/history.ts`
- `packages/server/src/socket/handlers/session/connect.ts`（更新 import）
- `packages/server/src/__tests__/session-connect.test.ts`（expect 不變）
