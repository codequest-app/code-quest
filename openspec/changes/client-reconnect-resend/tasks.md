## 1. Status 管理

- [ ] 1.1 disconnect handler 將 status 從 processing 改為 connecting
- [ ] 1.2 reconnect（session:join ACK）後 status 恢復 idle
- [ ] 1.3 測試：斷線 → status=connecting → 重連 → status=idle

## 2. Queue flush on reconnect

- [ ] 2.1 reconnect callback 檢查 messageQueueRef 並逐一送出
- [ ] 2.2 flush 後清空 queue
- [ ] 2.3 測試：斷線時 queue 有訊息 → 重連後自動送出
- [ ] 2.4 測試：斷線時 queue 為空 → 重連後不送任何訊息

## 3. 驗證

- [ ] 3.1 全部 tests green
