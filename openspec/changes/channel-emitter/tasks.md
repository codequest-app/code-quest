## 規則

- Server 399 test + Client 615 test 全部 pass
- **測試不變**：不修改任何測試檔案的 expect
- **先重構 production code，再處理因 API 移除導致的編譯錯誤**
- Handler 使用 named function
- TDD 重構

## 1-9. 已完成

- [x] ChannelEmitter + Channel socket 移除 + subscribe 移除 + 統一 on 簽名 + withChannel/withSocket middleware

## 10. handleConnection — emitter 持有 socket

handleConnection 接管 socket connection。
針對 emitter.on 有 subscriber 的 event，設 socket.on dispatch 到 emitter。
不用 onAny（避免和尚未遷移的 handler.register 衝突）。

- [ ] 10.1 handleConnection：遍歷 eventMap keys → 對應的 socket.on → dispatch(event, ch|null, payload, socket, cb)
- [ ] 10.2 server.ts io.on('connection') 呼叫 emitter.handleConnection
- [ ] 10.3 399 + 615 test pass

## 11. Handler 移除 register — 改用 emitter.on

handler 分三類：
- **不需要 channel**（plan）：直接用 `(ch, payload, socket?, cb?)` 忽略 ch
- **需要 channel**：用 `withChannel(handler)`
- **需要 channel + socket**：用 `withSocket(handler)`

### 11.1 不需要 channelManager 且不需要 channel 的 handler

- [x] plan.ts：emitter.on 直接用統一簽名（不用 withChannel/withSocket），ch 忽略
- [ ] 399 + 615 test pass

### 11.2 不需要 channelManager 的 handler（emitter.on 已傳 ch）

- [ ] 11.2a speech.ts：register 改用 emitter.on + withChannel
- [ ] 11.2b terminal.ts：register 改用 emitter.on + withChannel
- [ ] 11.2c 399 + 615 test pass

### 11.3 只用 channelManager.get() 查 channel 的 handler

emitter.on 已傳 ch，不需要自己查。移除 channelManager 依賴。

- [ ] 11.3a mcp.ts：register 改用 emitter.on，移除 channelManager
- [ ] 11.3b file.ts：register 改用 emitter.on，移除 channelManager
- [ ] 11.3c settings.ts：register 改用 emitter.on，評估 channelManager
- [ ] 11.3d 399 + 615 test pass

### 11.4 需要 channelManager 的 handler（生命週期/查詢/broadcast）

- [ ] 11.4a message.ts：register 改用 emitter.on
- [ ] 11.4b session/connect.ts：register 改用 emitter.on（launch/join 是 broadcast event，ch=null）
- [ ] 11.4c session/command.ts：register 改用 emitter.on
- [ ] 11.4d session/fork.ts：register 改用 emitter.on
- [ ] 11.4e session/query.ts：register 改用 emitter.on
- [ ] 11.4f app.ts：register 改用 emitter.on（app:init 是 broadcast event，ch=null）
- [ ] 11.4g claude/auth.ts, claude/mcp-servers.ts, claude/plugin.ts
- [ ] 11.4h 399 + 615 test pass

### 11.5 移除 SocketHandler interface + server.ts register loop

- [ ] 11.5a types.ts 移除 SocketHandler interface
- [ ] 11.5b server.ts 移除 handler.register loop
- [ ] 11.5c 所有 handler factory 回傳 void（除了有 API 的如 plan:PlanApi）
- [ ] 11.5d 399 + 615 test pass

## 12. ChannelManager 清理

- [ ] 12.1 移除 addSocketToChannel（emitter.handleConnection 處理）
- [ ] 12.2 移除 removeSocketFromAll（emitter.handleConnection 處理 disconnect + unbind）
- [ ] 12.3 399 + 615 test pass

## 13. 最終驗證

- [ ] 13.1 handler 只認識 emitter（+ 少數需要 channelManager 做生命週期的除外）
- [ ] 13.2 ChannelManager 只管 Channel 生命週期 + broadcast
- [ ] 13.3 ChannelEmitter 持有所有 socket、統一 on/emit/dispatch
- [ ] 13.4 SocketHandler interface 不存在
- [ ] 13.5 399 server + 615 client test pass
