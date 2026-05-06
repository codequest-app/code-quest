## 0. 搬移 session-history.ts 至 handlers/session/

- [x] 0.1 將 `socket/session-history.ts` 移至 `socket/handlers/session/history.ts`
- [x] 0.2 更新 `connect.ts` 及所有 import 來源
- [x] 0.3 確認所有測試通過

## 1. filterReplayEvents

- [x] 1.1 RED: 為 `filterReplayEvents` 寫單元測試（hasStdoutUserEcho=true/false 兩種情境）
- [x] 1.2 GREEN: 抽出 `filterReplayEvents(parsed, hasStdoutUserEcho): ParsedEvent[]` pure function
- [x] 1.3 `replayParsedEvents` 改用 `filterReplayEvents`，確認整合測試 expect 不變

## 2. extractPendingControlRequests

- [x] 2.1 RED: 為 `extractPendingControlRequests` 寫單元測試（含 cancel 消除邏輯）
- [x] 2.2 GREEN: 抽出 `extractPendingControlRequests(messages, respondedIds)` pure function
- [x] 2.3 `replayPendingControlRequests` 改用，確認整合測試 expect 不變
