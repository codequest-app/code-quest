## 規則

- Server 399 test + Client 615 test 全部 pass
- **測試原則不變**：expect 要不變或等價
- **先重構 production code，再重構測試**
- 測試使用 FakeClaude + real JSON + testing library
- Handler 使用 named function
- TDD 重構

## 1-7. ChannelEmitter + Channel socket 移除 + bindRunner（已完成）

- [x] 全部完成，詳見 git history

## 8. 統一 handler 為 factory + emitter.on — 移除 subscribe/register/SocketHandler interface

所有 handler factory 直接接收 emitter 參數，內部 emitter.on() 訂閱。
移除 SocketHandler interface 的 register(socket) 和 subscribe(emitter)。
server.ts 不再 loop handler.subscribe / handler.register。

### 8.1 有 subscribe 但沒用 emitter.on 的 handler（只用 onEvent/onAction/onExit）

這些 handler 的 subscribe 只做 emitter.on/onAction/onExit，改成 factory 傳 emitter：

- [ ] 8.1a settings.ts：subscribe 移到 factory，emitter 改由參數傳入
- [ ] 8.1b usage.ts：同上
- [ ] 8.1c 399 + 615 test pass

### 8.2 已有 emitter 但還有 subscribe 的 handler

這些 handler factory 已經接收 emitter，但 subscribe 裡還有 emitter.on 呼叫。統一到 factory 內：

- [ ] 8.2a permission.ts：移除 emitterRef，改用 factory 參數 emitter
- [ ] 8.2b file.ts：移除 emitterRef，改用 factory 參數 emitter
- [ ] 8.2c mcp.ts：移除 emitterRef，改用 factory 參數 emitter
- [ ] 8.2d message.ts：subscribe 內的 emitter.on 移到 factory
- [ ] 8.2e session/connect.ts：subscribe 內的 emitter.on 移到 factory
- [ ] 8.2f 399 + 615 test pass

### 8.3 純 register（沒有 subscribe）的 handler

這些 handler 只有 register(socket)，沒有 runner events。
register 內的 socket.on 保留，但不透過 SocketHandler interface：

- [ ] 8.3a speech.ts：移除 SocketHandler return，改為 factory 內直接操作
- [ ] 8.3b terminal.ts：同上
- [ ] 8.3c git.ts：同上
- [ ] 8.3d app.ts：同上
- [ ] 8.3e session/command.ts：同上
- [ ] 8.3f session/query.ts：同上
- [ ] 8.3g session/fork.ts：同上
- [ ] 8.3h claude/auth.ts、claude/mcp-servers.ts、claude/plugin.ts：同上
- [ ] 8.3i 399 + 615 test pass

### 8.4 移除 SocketHandler interface + server.ts 重構

- [ ] 8.4a 移除 SocketHandler interface（types.ts）
- [ ] 8.4b server.ts：移除 handler.subscribe 和 handler.register loop
- [ ] 8.4c server.ts：handler factory 建立時傳入 emitter，handler 自己 on
- [ ] 8.4d server.ts：io.on('connection') 改為 handler 自己管 socket registration（或 server.ts 保留統一接線）
- [ ] 8.4e 399 + 615 test pass

## 9. 最終清理

- [ ] 9.1 確認無殘留 subscribe/register 引用
- [ ] 9.2 biome check + typecheck + 399 server + 615 client test pass
