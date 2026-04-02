## 全部完成

- [x] 1-9. ChannelEmitter + Channel socket 移除 + 統一 on 簽名 + middleware
- [x] 10. handleConnection — emitter 持有 socket
- [x] 11. 所有 handler 移除 register → emitter.on（統一簽名，adapter pattern / withChannel / withSocket / withError）
- [x] 11.5 SocketHandler interface 移除
- [x] 12. server.ts 無 handlers array、無 register loop
- [x] 13. 399 server + 615 client test pass
