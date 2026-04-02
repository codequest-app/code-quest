## 規則

- Server 399 test + Client 615 test 全部 pass
- **測試原則不變**：expect 要不變或等價
- **先重構 production code，再重構測試**
- 測試使用 FakeClaude + real JSON + testing library
- Handler 使用 named function
- TDD 重構

## 1-3. ChannelEmitter 建立 + 替換 + handler emit 遷移（已完成）

- [x] 全部完成

## 4. Channel 移除 socket API（已完成）

- [x] 4.1-4.9 Production code: Channel 移除 sockets 欄位、socket methods、emit methods、sendNotification stub、z/TypedSocket import
- [x] 4.10 mcp.ts: ch.sockets.size → emitterRef.getSocketCount(ch.id)
- [x] 4.11-4.14 Tests: channel.test.ts 移除 socket management describe + destroy 的 socket 引用 + fakeSocket helper

## 5. ChannelManager broadcast 移至 emitter（已完成）

- [x] 5.1-5.3 broadcast* → emitter.broadcastAll, 移除 io 欄位, 移除 socketChannelsMap

## 6. wireRunner 改名 bindRunner（已完成）

- [x] 6.1-6.7 全部改名完成

## 7. 清理（已完成）

- [x] 7.1 Channel 不再持有任何 socket 引用（TypedSocket import 已移除）
- [x] 7.2 所有 handler 透過 emitter.on/emit 操作
- [x] 7.3 server 399 + client 615 test pass
