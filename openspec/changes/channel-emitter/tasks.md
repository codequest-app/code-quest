## 規則

- Server 399 test + Client 615 test 全部 pass
- **測試原則不變**：expect 要不變或等價
- **先重構 production code，再重構測試**
- 測試使用 FakeClaude + real JSON + testing library
- Handler 使用 named function
- TDD 重構

## 1-8. ChannelEmitter + Channel socket 移除 + subscribe 移除（已完成）

- [x] 全部完成

## 9. ChannelEmitter 持有 socket — handleConnection

emitter 接管 socket connection，handler 不碰 socket.on。
emitter.on callback 統一簽名：(ch, socket?, payload, cb?)。

- [ ] 9.1 ChannelEmitter 新增 handleConnection(socket, channelManager)
  - socket tracking（addSocketToChannel 已有）
  - socket.onAny → 解析 channelId → channelManager.get(ch) → dispatch 給 on subscribers
  - socket disconnect → removeSocketFromAll
- [ ] 9.2 server.ts io.on('connection') 改為 emitter.handleConnection(socket, channelManager)
- [ ] 9.3 399 + 615 test pass

## 10. Handler 移除 register — 改用 emitter.on 統一訂閱

### 10.1 不需要 channelManager 的 handler

這些 handler 的 register 內的 socket.on 行為可以直接搬到 emitter.on。
移除 channelManager 依賴。

- [ ] 10.1a permission.ts：已不需要 register，移除
- [ ] 10.1b usage.ts：已不需要 register，移除
- [ ] 10.1c plan.ts：socket events 改用 emitter.on，移除 register
- [ ] 10.1d 399 + 615 test pass

### 10.2 只用 channelManager.get() 查 channel 的 handler

emitter.on 已傳入 ch，不需要自己查。移除 channelManager 依賴。

- [ ] 10.2a speech.ts：改用 emitter.on，移除 channelManager
- [ ] 10.2b terminal.ts：改用 emitter.on，移除 channelManager
- [ ] 10.2c mcp.ts：改用 emitter.on，移除 channelManager
- [ ] 10.2d file.ts：register 內的 socket.on 改用 emitter.on（handleRead 需要 channelManager.get 查 channel — emitter.on 已傳 ch）
- [ ] 10.2e settings.ts：register 內的 socket.on 改用 emitter.on
- [ ] 10.2f 399 + 615 test pass

### 10.3 需要 channelManager 的 handler（生命週期/查詢）

這些 handler 做 create/join/destroy/getAliveChannels，仍需要 channelManager。
但 register → emitter.on。

- [ ] 10.3a message.ts：register 改用 emitter.on（broadcastSessionState 暫留 channelManager）
- [ ] 10.3b session/connect.ts：register 改用 emitter.on（create/join/addSocket 仍需 channelManager）
- [ ] 10.3c session/command.ts：register 改用 emitter.on
- [ ] 10.3d session/fork.ts：register 改用 emitter.on
- [ ] 10.3e session/query.ts：register 改用 emitter.on
- [ ] 10.3f app.ts：register 改用 emitter.on
- [ ] 10.3g claude/auth.ts, claude/mcp-servers.ts, claude/plugin.ts：register 改用 emitter.on
- [ ] 10.3h 399 + 615 test pass

### 10.4 移除 SocketHandler interface + server.ts register loop

- [ ] 10.4a SocketHandler interface 移除（types.ts）
- [ ] 10.4b server.ts 移除 handler.register loop + io.on('connection') 改為 emitter.handleConnection
- [ ] 10.4c handler factory 不回傳任何東西（void）
- [ ] 10.4d 399 + 615 test pass

## 11. ChannelManager 移除 socket 相關方法

addSocketToChannel / removeSocketFromAll 搬到 emitter.handleConnection 內部。
broadcast* 評估是否搬到 emitter 或保留在 channelManager。

- [ ] 11.1 ChannelManager 移除 addSocketToChannel（emitter.handleConnection 處理）
- [ ] 11.2 ChannelManager 移除 removeSocketFromAll（emitter.handleConnection 處理 disconnect）
- [ ] 11.3 評估 broadcast* 是否搬到 emitter
- [ ] 11.4 399 + 615 test pass

## 12. 最終清理

- [ ] 12.1 確認 handler 只認識 emitter（+ 少數需要 channelManager 做生命週期的除外）
- [ ] 12.2 確認 ChannelManager 只管 Channel 生命週期
- [ ] 12.3 確認 ChannelEmitter 持有所有 socket
- [ ] 12.4 biome check + typecheck + 399 server + 615 client test pass
