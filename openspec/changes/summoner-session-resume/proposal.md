## Why

Summoner 斷線重連時存在兩個設計缺陷：

1. **WS 層不對稱**：server 對 summoner 的 `rpc.request()` 斷線直接 reject；`sessionKey` 雖已存在且 server `resumable()` 已建立 registry，但 summoner 從未送 `RESUME_EVENT`，整個 resume 機制形同虛設。web → server 方向已有完整保護（`WsClient`），summoner 方向是對稱缺口。

2. **grace period 設計錯誤**：WS 斷線後 2 分鐘若未重連則殺掉所有 claude process，這把「網路問題」和「使用者主動停止」混為一談。Summoner 只要 process 還活著就應該讓它繼續跑，重連後把 buffer 同步回 server；`STDOUT_BUFFER_CAP = 5000` 的硬限制也因此不合理。

## What Changes

- **`WsClient` 移至 `packages/shared`**：summoner 直接共用，獲得 outbox、pending queue、RESUME_EVENT、自動重連能力
- **`sessionKey` 正式生效**：summoner 重連帶同一 key，server `ResumableSocket` rebind + replay
- **移除 grace period**：WS 斷線不殺 process；`Agent.graceTimer` 和 `dispose()` on timeout 移除
- **移除 `STDOUT_BUFFER_CAP`**：buffer 無上限，直到重連後全部 flush 給 server
- **移除 `RemoteProcessProvider` 的靜默 `.catch()`**：transport 層保證送達

## Capabilities

### New Capabilities

- `summoner-reliable-transport`：summoner 端 WS transport 具備 outbox、pending request queue、RESUME_EVENT 三項能力，與 `WsClient` 對稱

### Modified Capabilities

- `transport`：`WsClient` 從 web-only 移至 shared，summoner 與 browser 共用同一實作

## Impact

- `packages/shared/src/transport/ws-client.ts`：從 `apps/web` 移入，export 從 `packages/shared/src/node.ts`
- `apps/web/src/socket/client.ts`：改從 `@code-quest/shared/node` import `WsClient`
- `apps/summoner/src/connection/agent.ts`：移除 `graceTimer`、`GRACE_PERIOD_MS`、timeout 觸發的 `dispose()`；移除 `STDOUT_BUFFER_CAP` 上限檢查
- `apps/server/src/remote/process-provider.ts`：移除 `fireSpawn` / `send` / `abort` 的靜默 `.catch()`
