## Completed

- [x] 1.1-1.5 WsTransport + WsAdapter shell
- [x] 2.1-2.6 搬 WsTransport 內臟 + wsAdapter
- [x] 3.1-3.3 換接 server.ts + 刪舊 WsTransport
- [x] 5.1-5.6 提煉 RpcChannel to shared
- [x] 6.1-6.4 Summoner Agent → RpcChannel
- [x] 7.1-7.6 Remote*Service → RemoteRpc + ReconnectableRpc
- [x] 8.1-8.4 刪 Connection + upgrade-handler
- [x] Auth middleware, Heartbeat, Bearer auth (timing-safe)
- [x] Resume: ws-transport-e2e.test.ts 驗證
- [x] Rename WsServer → WsTransport
- [x] 9.1-9.10 Onion middleware refactor (Pipeline, ctx.terminate(), Middleware type)
- [x] 10.1-10.3 WsAdapter client mode (createSocket)
- [x] 11.1-11.5 WsTransport.connect() client mode
- [x] 12.1-12.4 Summoner daemon migration (createConnectionLoop replaces createDaemonClient)
- [x] 13.1-13.3 Cleanup (remove shared createHeartbeat, remove daemon/connection.ts, rename daemon→connection)

## Remaining

### 14. Move WsTransport to shared

- [x] 14.1 Move Pipeline, PipelineContext, PipelineMiddleware to shared/src/transport/
- [x] 14.2 Move WsAdapter interface + wsAdapter() impl to shared/src/transport/
- [x] 14.3 Move WsTransport, ConnectionContext, Middleware to shared/src/transport/
- [x] 14.4 Add `ws` as shared dependency
- [x] 14.5 Update server imports → from @code-quest/shared
- [x] 14.6 Update summoner imports → from @code-quest/shared (remove @code-quest/server dep)
- [x] 14.7 Remove server/src/socket/index.ts export (no longer needed)
- [x] 14.8 Verify all tests pass
