## 1. Browser client — sessionKey

- [ ] 1.1 WsClient 啟動時從 sessionStorage 讀取 sessionKey，若不存在則生成並寫入
- [ ] 1.2 `toWsUrl()` 把 sessionKey 附到 WS URL query string (`?sessionKey=<key>`)
- [ ] 1.3 測試：reconnect 時帶相同 sessionKey，server 能 replay missed events

## 2. Summoner — sessionKey

- [ ] 2.1 summoner 啟動時生成 sessionKey（記憶體，process 生命週期）
- [ ] 2.2 把 sessionKey 附到 server URL query string
- [ ] 2.3 server `/summoner` route 加上 `resumable()` middleware
- [ ] 2.4 測試：summoner 斷線重連後 server 能 replay 缺少的控制事件

## 3. ChannelProvider reconnect

- [ ] 3.1 ChannelProvider 監聽 `socket.on('connect')`，重連時把 state 重設回 `'ready'`
- [ ] 3.2 觸發 `joinSession()` 重打，server replay `session:history`
- [ ] 3.3 測試：斷線重連後 session:history 正確補回

## 4. 驗證

- [ ] 4.1 全部 tests green
- [ ] 4.2 手動驗證：手機待機後回來，streaming 內容正確補回
