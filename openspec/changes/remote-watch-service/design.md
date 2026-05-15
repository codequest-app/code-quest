## Context

`DirtyBroadcaster` 已透過 constructor 注入 `WatchService`，subscribe/unsubscribe 都走介面，設計上已支援替換實作。

`AgentTransport` 介面有：
- `onRequest(event, handler)` — summoner 處理 server 的 request
- `emit(event, data)` — 單向 push（summoner → server 或 server → summoner）
- `on(event, fn)` — 監聽對方 push 的事件

現有 `REMOTE_METHODS` 在 `packages/schemas` 集中管理所有 RPC method 名稱。

## Goals / Non-Goals

**Goals:**
- Remote mode 下 dirty broadcast 正常運作
- `DirtyBroadcaster` 不需要改，只換注入的 `WatchService`

**Non-Goals:**
- 改變 local mode 行為
- 處理 summoner 斷線重連時的事件補發（已有 reconnectable-rpc 處理連線恢復）

## Decisions

**RPC 協定：**

新增三個 method 到 `REMOTE_METHODS.watch`：
- `watch/subscribe` — server → summoner request：開始 watch 某個 cwd
- `watch/unsubscribe` — server → summoner request：停止 watch 某個 cwd
- `watch/event` — summoner → server emit：推送 watch 事件

**Server 端 — `RemoteWatchService`：**

```
implements WatchService
subscribe(cwd, cb):
  rpc.request(REMOTE_METHODS.watch.subscribe, { cwd })
  rpc.on(REMOTE_METHODS.watch.event, (ev) => {
    if (ev.cwd === cwd) cb(ev.event)
  })
  return unsubscribe fn → rpc.request(REMOTE_METHODS.watch.unsubscribe, { cwd })
```

放在 `apps/server/src/remote/watch-service.ts`。

**Summoner 端 — `registerWatchHandlers`：**

```
rpc.onRequest(REMOTE_METHODS.watch.subscribe, ({ cwd }) => {
  const unsub = localWatchService.subscribe(cwd, (ev) => {
    rpc.emit(REMOTE_METHODS.watch.event, { cwd, event: ev })
  })
  // 記錄 unsub，等 unsubscribe request 再呼叫
})
rpc.onRequest(REMOTE_METHODS.watch.unsubscribe, ({ cwd }) => {
  // 呼叫先前記錄的 unsub
})
```

放在 `apps/summoner/src/connection/watch-handlers.ts`，在 `agent.ts` 中 register。

**Container 注入：**

```ts
// remote mode
const watchService = remoteRpc
  ? new RemoteWatchService(remoteRpc)
  : new LocalWatchService();
```

## Risks / Trade-offs

- summoner 有多個 cwd 被 watch 時，`watch/event` push 帶著 cwd 讓 server 端 dispatch 到正確的 callback
- summoner 斷線重連後，server 端的 `RemoteWatchService` 需要重新 subscribe（reconnectable-rpc 重連後應重新 register handlers，需確認）
