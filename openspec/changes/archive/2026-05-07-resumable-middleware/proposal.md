## Why

Browser WebSocket 連線不穩定時（網路切換、筆電休眠喚醒），server→client 的事件會丟失，導致 UI 狀態不同步。需要在 server 端 buffer 近期 outbound events，client reconnect 時自動 replay 遺漏的部分。

## What Changes

- 新增 `ResumableSocket`：包裝 TypedSocket，加上 ring buffer + seq tracking + replay
- 新增 `resumable()` middleware：以 WsTransport middleware 形式管理 ResumableSocket 生命週期，含 TTL 自動清理
- 修改 `WsTransport.acceptConnection`：支援 `context.transformSocket` hook，讓 middleware 能包裝 TypedSocket
- 接線：browser route 加上 `resumable()` middleware

## Capabilities

### New Capabilities

- `resumable-socket`: ResumableSocket 核心 — ring buffer、seq tracking、rebind、resume replay
- `resumable-middleware`: resumable() middleware — session registry、TTL cleanup、transformSocket hook integration

### Modified Capabilities

- `transport`: WsTransport.acceptConnection 新增 transformSocket hook
- `ws-server`: browser route 加上 resumable middleware

## Impact

- `packages/shared/src/transport/` — 新增 resumable-socket.ts、middleware/resumable.ts
- `packages/shared/src/transport/ws-transport.ts` — acceptConnection 加 3 行
- `packages/shared/src/index.ts` — 新增 export
- `apps/server/src/bin/server.ts` — browser route 加 middleware
- Client 端 sessionKey 傳遞可獨立後續處理
