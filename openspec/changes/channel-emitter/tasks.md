## 規則

- Server 401 test pass + Client 615 test pass
- Handler 使用 named function
- expect 不變
- TDD 重構

## 1. 建立 ChannelEmitter

合併 ChannelEventRouter 的 dispatch + socket tracking + broadcast。
handler 透過 emitter.on 訂閱，透過 emitter.emit/emitToOthers 廣播。

- [x] 1.1-1.6 ChannelEmitter 建立完成（on/emit/emitToOthers + socket tracking + dispatch + 自動廣播）
- [x] 2.1-2.7 ChannelEventRouter → ChannelEmitter 替換完成，router 刪除，test 更名

## 3. Handler 廣播改用 emitter.emit

handler 的 ch.emit / ch.emitToOthers 改為 emitter.emit / emitter.emitToOthers。
handler subscribe(emitter) 拿到 emitter 引用後直接呼叫。

- [ ] 3.1 permission.ts：ch.emit → emitter.emit
- [ ] 3.2 message.ts：ch.emitToOthers + ch.emit → emitter.emitToOthers + emitter.emit
- [ ] 3.3 connect.ts：ch.emit → emitter.emit
- [ ] 3.4 plan.ts：channelManager.get()?.emitToOthers → emitter.emitToOthers
- [ ] 3.5 file.ts：ch.emit → emitter.emit
- [ ] 3.6 typecheck + 401 test pass

## 4. Channel 移除 socket API

- [ ] 4.1 Channel 移除 sockets, addSocket, removeSocket, removeSocketById, emit, emitToOthers, emitToSockets
- [ ] 4.2 ChannelManager.addSocketToChannel 改為只呼叫 emitter.addSocketToChannel
- [ ] 4.3 ChannelManager.removeSocketFromAll 改用 emitter.getSocketCount 判斷 unbind
- [ ] 4.4 Channel.destroy() 移除 sockets.clear()
- [ ] 4.5 typecheck + 401 test pass

## 5. ChannelManager broadcast 移至 emitter

- [ ] 5.1 ChannelManager broadcast* 方法改為 delegate 給 emitter.broadcastAll
- [ ] 5.2 ChannelManager 移除 socketChannelsMap
- [ ] 5.3 typecheck + 401 test pass

## 6. wireRunner 改名 bindRunner

- [ ] 6.1 Channel.wireRunner() → bindRunner()（移除自動廣播，由 emitter 處理）
- [ ] 6.2 Channel.unwireRunner() → unbindRunner()
- [ ] 6.3 Channel.isWired → isBound
- [ ] 6.4 ChannelManager.ensureWired → ensureBound
- [ ] 6.5 更新 connect.ts 呼叫
- [ ] 6.6 typecheck + 401 test pass

## 7. 清理

- [ ] 7.1 確認 Channel 不再持有任何 socket 引用
- [ ] 7.2 確認所有 handler 透過 emitter.on/emit 操作
- [ ] 7.3 biome check + typecheck + 401 server test pass + 615 client test pass
