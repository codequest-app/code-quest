## Context

Server 端有三個程式碼品質問題需要處理：

1. `CompositeSessionStore` 沒有任何測試覆蓋 — fan-out 寫入、部分失敗、AggregateError、非對稱讀取邏輯都未驗證
2. `message-handler.ts` 的 `interruptedChannels` Set 在 channel 結束後不清理，長連線累積 stale channelId
3. `channel-hooks.ts` 的 `onExit` 重複 reject `pendingRequests`，但 `channel.ts` 的 `onExit`（line 327-332）已經全部 reject 並 delete，hooks 拿到的 map 已經是空的

## Goals / Non-Goals

**Goals:**
- CompositeSessionStore 完整測試覆蓋
- 修復 interruptedChannels 記憶體洩漏
- 移除 channel-hooks.ts 中冗餘的 pendingRequests rejection

**Non-Goals:**
- 不改 CompositeSessionStore 的 production code（只補測試）
- 不重構 message-handler 的整體架構

## Decisions

### 1. CompositeSessionStore 測試策略
使用 in-memory fake SessionStore 來測試。測試案例：
- 空 stores 陣列 → throw Error
- persist 全部成功
- persist 部分失敗 → console.warn
- persist 全部失敗 → throw AggregateError
- list/getById/rename/updateStatus 只委派給 stores[0]
- delete fan-out，任一成功即回傳 true

### 2. interruptedChannels 清理方式
在 `message-handler.ts` 的 `register()` 中監聽 channel 的 destroy/exit 事件。最簡單的做法是在現有的 socket disconnect 或 channel manager 的 channel-destroyed 事件中清理。但考慮到 `interruptedChannels` 是 per-socket 的局部變數，最直接的方式是：當收到 `session:closed` 事件時從 Set 中移除對應 channelId。或者在 `chat:send` 時如果 channel 不存在就順便清理。

實際上最乾淨的方案：監聯 socket 上的 `session:closed` 事件（server → client 也會廣播），在 handler 內部做清理。

### 3. channel-hooks.ts onExit 清理
直接移除 `onExit` 中的 `for...of pendingRequests` 迴圈和 `ch.pendingRequests.clear()`。`channel.ts` 的 `wireRunner` onExit 已在呼叫 hook 之前完成 reject + delete。

## Risks / Trade-offs

- [Risk] 移除 hooks onExit 的 pendingRequests 清理後，如果 channel.ts 的行為改變可能遺漏 → Mitigation: channel.ts 的 onExit 有明確的 reject 邏輯，且有獨立測試覆蓋
- [Risk] interruptedChannels 清理時機 — session:closed 事件可能在某些異常情況下不觸發 → Mitigation: 即使不觸發，Set 中只是多了一個 string，影響極小
