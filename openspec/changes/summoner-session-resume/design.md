## Context

Summoner 透過 `createConnectionLoop` 連到 server `/summoner` endpoint。Server 端掛了 `resumable()` middleware，以 `sessionKey` query param 為 key 維護 `ResumableSocket` registry。但目前：

1. Summoner 重連後 `createConnectionLoop` 直接 `new RpcChannel(socket)`，從未送 `RESUME_EVENT`，`ResumableSocket.resume()` 從未被觸發。
2. `RemoteProcessProvider.rpc.request()` 在 `ReconnectableRpc.current === null` 時立即 reject，沒有排隊機制。

Web → server 方向已有 `WsClient` 完整解決同樣問題（outbox + pending queue + RESUME_EVENT）。目標是讓 summoner 端對稱。

## Goals / Non-Goals

**Goals:**
- Summoner 斷線期間 `rpc.request()` 排隊不 reject，重連後重送
- Summoner 重連後送 `RESUME_EVENT { lastSeq }`，觸發 server replay 漏掉的 emit
- `sessionKey` 正式生效：同一 summoner process 重連時 rebind 同一個 `ResumableSocket`
- 移除 grace period：WS 斷線不殺 claude process，只有使用者主動停止才殺
- 移除 `STDOUT_BUFFER_CAP`：buffer 無上限，重連後全部 flush

**Non-Goals:**
- 跨 summoner process 重啟的 session 恢復（sessionKey 是 per-process UUID）
- 修改 web → server 方向（已完整）

## Decisions

### 1. 在 `createConnectionLoop` / `WsTransport` 層加入 reliable transport，不在 `ReconnectableRpc` 層

**決定**：reliable transport（outbox、pending、lastSeq）放在 `packages/shared/src/transport/` 層，讓 summoner 端 WS connection 本身具備 `WsClient` 等價能力。`ReconnectableRpc` 繼續做「穩定 event bus」的定位，不承擔 transport 責任。

**替代方案**：在 `ReconnectableRpc` 加 outbox — 缺點是把 transport 責任混進 RPC 層，且 `ResumableSocket.resume()` 仍然無法被觸發（因為 RESUME_EVENT 需要在 socket 層送出）。

### 2. 將 `WsClient` 移至 `packages/shared`，summoner 直接共用

**決定**：`WsClient` 現有兩個 browser 依賴：
- `new WebSocket(url)`：Node.js 18+ 已有原生全域 `WebSocket`，無需 adapter
- `document.visibilitychange`：`bindVisibilityChange()` 開頭已有 `if (typeof document === 'undefined') return` guard，Node.js 環境自動跳過

因此直接將 `apps/web/src/socket/ws-client.ts` 移至 `packages/shared/src/transport/ws-client.ts`，從 `packages/shared/src/node.ts` export。Summoner 的 `createConnectionLoop` 改用 `WsClient` 取代 raw `transport.connect()`，web 端改從 shared import（不改行為）。

**替代方案**：新增獨立 `SummonerWsClient` — 缺點是兩份幾乎相同的程式碼，維護兩份 outbox / pending / resume 邏輯。直接共用同一份更乾淨。

### 3. 刪除 `createConnectionLoop`，summoner 直接用 `WsClient`

**決定**：`createConnectionLoop` 的所有功能都被 `WsClient` 覆蓋：

| createConnectionLoop | WsClient |
|---|---|
| retry loop with backoff | 內建 |
| connectAndWait() | 自動管理 |
| createAgent(rpc) on connect | `setLifecycleListener({ onOpen })` |
| onDisconnect callback | `setLifecycleListener({ onClose })` |
| close() | `disconnect()` |

移除後 `main.ts` 改為：
```ts
const client = new WsClient(url); // url 含 sessionKey
client.setLifecycleListener({
  onOpen: () => agent.attach(client),
  onClose: () => logger.warn('disconnected, reconnecting...'),
});
client.connect();
```

`createConnectionLoop` 整個刪除，`packages/shared/src/transport/connection-loop.ts` 移除。

**替代方案**：保留 `createConnectionLoop` 作為薄 wrapper — 不必要的間接層，直接用 `WsClient` 更清楚。

### 4. `RemoteProcessProvider` 移除靜默 `.catch()`

**決定**：`fireSpawn` / `send` / `abort` 的 `.catch()` 移除。transport 層保證送達後，這些 catch 變成掩蓋真正錯誤。改由 `WsClient` 的 outbox overflow 統一處理（超過上限才 reject，log 明確）。

## Risks / Trade-offs

- **outbox overflow**：斷線超過 outbox 上限時，最舊的 request 會被丟棄（同 `WsClient` 行為）。`process.spawn` 被丟棄時 server 端 `ProcessRunner` 會啟動但 response 永遠不來 → 需要 `controller.abort()` 確保 `LineStream` 結束。現有邏輯已有此處理。
- **stdoutBuffer 無上限 OOM 風險**：移除 `STDOUT_BUFFER_CAP` 後，若斷線時間極長（例如 server 掛掉數小時），claude process 持續輸出，buffer 會無限成長。可接受：實務上 summoner 跟 server 通常在同一台機器或區網，長時間斷線代表更大的問題，此時 OOM 不是主要考量。
- **RESUME_EVENT gap**：若 `ResumableSocket` buffer（500 筆）溢出，server 會送 `state:refresh_required`。目前 summoner 端沒有處理這個 event 的機制，需要 log warning 提示。
- **pending request 無限等待**：移除 grace period 後，若 server 永遠不回來，pending request 永遠不 resolve。可接受：使用者可以直接停掉 summoner process 來中止。

## Migration Plan

1. 將 `WsClient` 從 `apps/web/src/socket/ws-client.ts` 移至 `packages/shared/src/transport/ws-client.ts`
2. 從 `packages/shared/src/node.ts` export；web 端改從 shared import
3. 更新 `createConnectionLoop` 使用 `WsClient` 取代 raw `transport.connect()`
4. 更新 `apps/summoner/src/main.ts`：`sessionKey` per-process 不變，傳給 `WsClient` constructor
5. 移除 `RemoteProcessProvider` 的靜默 catch
6. 加單元測試：斷線排隊、重連 flush、RESUME_EVENT 觸發

無 breaking change，rollback 只需還原 `createConnectionLoop` 和 `WsClient` import 路徑。
