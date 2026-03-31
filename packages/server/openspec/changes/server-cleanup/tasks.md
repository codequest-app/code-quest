## 1. CompositeSessionStore 測試

- [ ] 1.1 建立 `composite-session-store.test.ts`，用 fake SessionStore 測試 constructor 空陣列 throw
- [ ] 1.2 測試 persist 全部成功、部分失敗（console.warn）、全部失敗（AggregateError）
- [ ] 1.3 測試 list/getById/rename/updateStatus 只委派 stores[0]
- [ ] 1.4 測試 delete fan-out，任一成功回 true，全部失敗回 false

## 2. interruptedChannels 記憶體洩漏修復

- [ ] 2.1 在 `message-handler.ts` 監聽 `session:closed` 事件，移除對應 channelId
- [ ] 2.2 補測試驗證 session:closed 後 interruptedChannels 已清理

## 3. channel-hooks onExit 冗餘清理

- [ ] 3.1 移除 `channel-hooks.ts` onExit 中的 pendingRequests 迭代和 clear
- [ ] 3.2 確認現有 channel-wire-runner 測試仍通過
