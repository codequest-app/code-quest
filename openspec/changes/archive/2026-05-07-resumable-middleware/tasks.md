## 1. ResumableSocket

- [x] 1.1 新增 `packages/shared/src/transport/__tests__/resumable-socket.test.ts` — 從 main 還原測試（emit/seq、ring buffer、resume、rebind）
- [x] 1.2 新增 `packages/shared/src/transport/resumable-socket.ts` — 從 main 還原實作，移到 shared

## 2. WsTransport transformSocket hook

- [x] 2.1 新增 `apps/server/src/socket/__tests__/ws-transport.test.ts` 測試案例 — transformSocket wraps TypedSocket
- [x] 2.2 修改 `packages/shared/src/transport/ws-transport.ts` acceptConnection — 加 transformSocket hook（3 行）

## 3. resumable middleware

- [x] 3.1 新增 `packages/shared/src/transport/middleware/__tests__/resumable.test.ts` — 首次連線、reconnect rebind、resume replay、gap refresh、TTL 過期清理、TTL 取消、匿名連線
- [x] 3.2 新增 `packages/shared/src/transport/middleware/resumable.ts` — middleware factory 實作

## 4. 接線與 export

- [x] 4.1 修改 `packages/shared/src/index.ts` — export resumable middleware 和 ResumableSocket
- [x] 4.2 修改 `apps/server/src/bin/server.ts` — browser route 加上 `resumable()` middleware
- [x] 4.3 全部測試通過驗證
