## 規則

- Server 399 test + Client 615 test 全部 pass
- **測試不變**：不修改任何測試檔案的 expect
- **先重構 production code，再處理因 API 移除導致的編譯錯誤**
- Handler 使用 named function
- TDD 重構

## 1-8. 已完成

- [x] ChannelEmitter 建立 + Channel socket 移除 + subscribe 移除

## 9. 統一 emitter.on 簽名

統一 on handler 簽名為 `(ch: Channel | null, payload: unknown, socket?: TypedSocket, cb?: SocketCallback)`。
移除 onAction / onExit / dispatchAction / dispatchExit，改為 `on('server:action')` / `on('channel:exit')`。
移除 ChannelEventFn / ChannelActionFn / ChannelExitFn type aliases。

- [ ] 9.1 定義統一的 handler type：`(ch: Channel | null, payload: unknown, socket?: TypedSocket, cb?: SocketCallback) => void`
- [ ] 9.2 on() 改用統一 handler type
- [ ] 9.3 dispatchEvent 改用統一簽名 dispatch（payload 為 se.payload，不再傳 SocketEvent wrapper）
- [ ] 9.4 onAction → on('server:action')，dispatchAction → dispatch('server:action', ch, action)
- [ ] 9.5 onExit → on('channel:exit')，dispatchExit → dispatch('channel:exit', ch, { code })
- [ ] 9.6 更新 ChannelManager hooks 呼叫（dispatchEvent/Action/Exit → dispatch）
- [ ] 9.7 更新所有 handler 的 emitter.on 簽名（runner events：舊 (channelId, ch, se) → 新 (ch, payload)）
- [ ] 9.8 更新 connect.ts emitter.onExit → emitter.on('channel:exit')
- [ ] 9.9 更新 permission.ts / settings.ts / file.ts emitter.onAction → emitter.on('server:action')
- [ ] 9.10 移除舊 type aliases + onAction / onExit / dispatchAction / dispatchExit methods
- [ ] 9.11 399 + 615 test pass

## 10. handleConnection — emitter 持有 socket

emitter.handleConnection(socket, resolveChannel) 接管 socket.on。
client events 走 dispatch → on subscribers。
handler 不再有 register(socket)。

- [ ] 10.1 ChannelEmitter 新增 handleConnection(socket, resolveChannel)
  - socket.onAny → 解析 channelId → resolveChannel → dispatch(event, ch|null, payload, socket, cb)
  - socket disconnect → removeSocketFromAll + unbind channels with 0 sockets
- [ ] 10.2 server.ts io.on('connection') 改為呼叫 emitter.handleConnection
- [ ] 10.3 399 + 615 test pass

## 11. Handler 移除 register — 改用 emitter.on

### 11.1 不需要 channelManager 的 handler

- [ ] 11.1a permission.ts：register 移除，socket events 改用 emitter.on
- [ ] 11.1b usage.ts：register 已空，移除
- [ ] 11.1c plan.ts：socket events 改用 emitter.on
- [ ] 11.1d 399 + 615 test pass

### 11.2 只用 channelManager.get() 查 channel 的 handler（emitter.on 已傳 ch）

- [ ] 11.2a speech.ts：移除 channelManager 依賴
- [ ] 11.2b terminal.ts：移除 channelManager 依賴
- [ ] 11.2c mcp.ts：移除 channelManager 依賴
- [ ] 11.2d file.ts：移除 channelManager 依賴
- [ ] 11.2e settings.ts：register socket events 改用 emitter.on，評估 channelManager 依賴
- [ ] 11.2f 399 + 615 test pass

### 11.3 需要 channelManager 的 handler（生命週期/查詢）

- [ ] 11.3a message.ts：register 改用 emitter.on
- [ ] 11.3b session/connect.ts：register 改用 emitter.on
- [ ] 11.3c session/command.ts：register 改用 emitter.on
- [ ] 11.3d session/fork.ts：register 改用 emitter.on
- [ ] 11.3e session/query.ts：register 改用 emitter.on
- [ ] 11.3f app.ts：register 改用 emitter.on
- [ ] 11.3g claude/auth.ts, claude/mcp-servers.ts, claude/plugin.ts：register 改用 emitter.on
- [ ] 11.3h 399 + 615 test pass

### 11.4 移除 SocketHandler interface

- [ ] 11.4a types.ts 移除 SocketHandler interface
- [ ] 11.4b server.ts 移除 handler.register loop
- [ ] 11.4c handler factory 回傳 void（不回傳 SocketHandler）
- [ ] 11.4d 399 + 615 test pass

## 12. ChannelManager 清理

- [ ] 12.1 移除 addSocketToChannel（emitter.handleConnection 處理）
- [ ] 12.2 移除 removeSocketFromAll（emitter.handleConnection 處理 disconnect + unbind）
- [ ] 12.3 broadcast* 保留在 ChannelManager（需要讀 channel.sessionState 組 payload）
- [ ] 12.4 399 + 615 test pass

## 13. Client handler 對齊新簽名（如需要）

- [ ] 13.1 確認 client handler 不受 server 內部重構影響（socket event names + payload 不變）
- [ ] 13.2 615 test pass

## 14. 最終驗證

- [ ] 14.1 handler 只認識 emitter（+ 少數需要 channelManager 做生命週期的除外）
- [ ] 14.2 ChannelManager 只管 Channel 生命週期 + broadcast（讀 state + 廣播）
- [ ] 14.3 ChannelEmitter 持有所有 socket、統一 on/emit/dispatch
- [ ] 14.4 SocketHandler interface 不存在
- [ ] 14.5 biome check + typecheck + 399 server + 615 client test pass
