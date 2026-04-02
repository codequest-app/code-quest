## 規則

- Server 401 test + Client 615 test 全部 pass
- **測試原則不變**：expect 要不變或等價
- **先重構 production code，再重構測試**
- 測試使用 FakeClaude + real JSON + testing library
- Handler 使用 named function
- TDD 重構

## 1-2. ChannelEmitter 建立 + 替換 ChannelEventRouter（已完成）

- [x] 1.1-1.6 ChannelEmitter 建立完成
- [x] 2.1-2.7 ChannelEventRouter → ChannelEmitter 替換完成

## 3. Handler 廣播改用 emitter.emit（已完成）

- [x] 3.1-3.8 所有 handler 的 ch.emit → emitter.emit/emitToOthers

## 4. Channel 移除 socket API

**原則：先重構 production code，再重構測試。**
**測試遷移方式：channel.test.ts 的 socket 行為測試用 FakeClaude integration test 等價覆蓋。**
**Unit test（channel.test.ts）只移除 production code 已不存在的 API 引用，expect 等價保留。**

Production code 漸進移除：
- [ ] 4.1 ChannelManager.addSocketToChannel 移除 channel.addSocket（只保留 emitter）
- [ ] 4.2 server 401 + client 615 test pass
- [ ] 4.3 ChannelManager.removeSocketFromAll 移除 channel.removeSocketById，改用 emitter.getSocketCount 判斷 unwire
- [ ] 4.4 server 401 + client 615 test pass
- [ ] 4.5 Channel.wireRunner 移除自動廣播 this.emit（已由 emitter.dispatchEvent 處理）— 已在 task 3 完成
- [ ] 4.6 Channel.sendNotification 改為 stub（保留方法簽名，不引用 sockets）
- [ ] 4.7 Channel.destroy() 移除 sockets.clear()
- [ ] 4.8 Channel 移除 sockets 欄位 + addSocket/removeSocket/removeSocketById/emit/emitToOthers/emitToSockets
- [ ] 4.9 移除 Channel 的 TypedSocket + z import
- [ ] 4.10 server 401 + client 615 test pass

測試遷移（production code 完成後）：
- [ ] 4.11 channel.test.ts 的 `socket management` describe 驗證的行為（add/remove socket + broadcast）已由 integration test 覆蓋，移除該 describe
- [ ] 4.12 channel.test.ts 的 `destroy` test 移除 channel.addSocket setup + channel.sockets.size expect（Channel 不再持有 sockets）
- [ ] 4.13 channel.test.ts 移除 fakeSocket helper（不再需要）
- [ ] 4.14 server 401 + client 615 test pass（test 數量會少 2 個，但行為由 integration test 等價覆蓋）

## 5. ChannelManager broadcast 移至 emitter

- [x] 5.1 ChannelManager broadcast* → emitter.broadcastAll
- [x] 5.2 ChannelManager 移除 io 欄位（emitter 管）
- [x] 5.3 server 399 + client 615 test pass

## 6. wireRunner 改名 bindRunner

- [x] 6.1-6.5 wireRunner/unwireRunner/isWired/ensureWired → bindRunner/unbindRunner/isBound/ensureBound
- [x] 6.6 channel-wire-runner.test.ts → channel-bind-runner.test.ts
- [x] 6.7 server 399 + client 615 test pass

## 7. 清理

- [x] 7.1 Channel socket API deprecated（sockets 欄位保留為空 Set，methods 為 no-op stub）
- [x] 7.2 所有 handler 透過 emitter.on/emit 操作
- [x] 7.3 server 399 + client 615 test pass
