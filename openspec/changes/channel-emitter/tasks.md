## 規則

- Server 399 test + Client 615 test 全部 pass
- **測試原則不變**：expect 要不變或等價
- **先重構 production code，再重構測試**
- 測試使用 FakeClaude + real JSON + testing library
- Handler 使用 named function
- TDD 重構

## 1-7. ChannelEmitter + Channel socket 移除 + bindRunner（已完成）

- [x] 全部完成

## 8. 統一 handler — 移除 subscribe（已完成）

- [x] 8.1 settings.ts, usage.ts: subscribe → factory emitter.on
- [x] 8.2 permission.ts, file.ts, mcp.ts, message.ts, connect.ts: emitterRef/subscribe → factory emitter.on
- [x] 8.3 SocketHandler interface 移除 subscribe，保留 register（用於 client socket events）
- [x] 8.4 server.ts 移除 handler.subscribe loop
- [x] 399 server + 615 client test pass

## 9. 最終狀態

- [x] Channel 純 CLI — 零 socket 引用
- [x] ChannelEmitter: on/emit/emitToOthers + socket tracking + broadcastAll
- [x] 所有 handler 透過 factory 接收 emitter，直接 emitter.on() 訂閱
- [x] SocketHandler interface 只剩 register(socket)
- [x] ChannelManager 無 socketChannelsMap，socket tracking 完全由 emitter 管理
- [x] wireRunner → bindRunner
