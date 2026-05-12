## 1. Browser client — sessionKey ✅

- [x] 1.1 WsClient 啟動時從 sessionStorage 讀取 sessionKey，若不存在則生成並寫入
- [x] 1.2 `toWsUrl()` 把 sessionKey 附到 WS URL query string (`?sessionKey=<key>`)
- [x] 1.3 測試：reconnect 時帶相同 sessionKey，server 能 replay missed events

## 2. Summoner — sessionKey ✅

- [x] 2.1 summoner 啟動時生成 sessionKey（記憶體，process 生命週期）
- [x] 2.2 把 sessionKey 附到 server URL query string
- [x] 2.3 server `/summoner` route 加上 `resumable()` middleware

## 3. Server — channelSockets re-registration on reconnect ✅

- [x] 3.1 `resumable()` middleware 加 `onRebind(socket, previousSocketId)` callback
- [x] 3.2 `resumable()` middleware 加 `onExpire(socketId)` callback（TTL 到期時通知）
- [x] 3.3 `ChannelEmitter.removeSocketFromAll` 保留 `socketChannels` entry 供重連使用
- [x] 3.4 `ChannelEmitter.reattachSocket(newSocket, previousSocketId)` 還原 channel 訂閱
- [x] 3.5 `ChannelEmitter.expireSocket(socketId)` TTL 到期時清掉 socketChannels
- [x] 3.6 `server.ts` 接上 `onRebind` / `onExpire` callback

## 4. Client — state:refresh_required 處理 ✅

- [x] 4.1 `ChannelMessagesContext` 監聽 `state:refresh_required`
- [x] 4.2 收到後：清 messages、reset joinedRef / historyReplayIdRef、重打 joinSession
- [x] 4.3 測試（renderWithWorkspace + FakeSummoner）：
       - joinSession 重打，server 回 session:history，畫面正確補回

## 5. 驗證

- [x] 5.1 全部 tests green
- [x] 5.2 手動驗證：手機待機後回來，streaming 內容正確補回
