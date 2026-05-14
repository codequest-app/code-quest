## Why

Claude CLI process 莫名消失，既沒有 log 也無法 resume：

1. **WS 斷線就砍 process** — `agent.dispose()` 在任何 WS 斷線時立即殺死所有 CLI process，包含網路抖動
2. **exit code 永遠是 null** — `runner.ts` 的 `emit('exit', null)` 硬寫 null，server 無從得知 process 真正的結束原因
3. **LineStream 訂閱消失** — `RpcChannel.handleClose()` 呼叫 `listeners.clear()`，讓 server 端的 LineStream 失去 stdout/stderr/exit 訂閱，重連後無法恢復
4. **SIGTERM 沒有 fallback** — `child-process.ts` 的 `abort()` 只送 SIGTERM，如果 process 卡住不死就會 zombie

## What Changes

### Summoner
- `agent.ts` — Agent 改為 singleton，WS 斷線後不立即 dispose；等待 2 分鐘 grace period，reconnect 時 reattach
- `agent.ts` — stdout/stderr buffer：WS 斷線期間暫存輸出，reconnect 時 flush
- `runner.ts` — `emit('exit', code)` 傳真實 exit code（從 close event）
- `child-process.ts` — `abort()` 先送 SIGTERM，5 秒後無回應再送 SIGKILL
- reconnect handshake：summoner 回報每個 session 的 `{ alive: string[], dead: { sessionId, code }[] }`

### Server
- `process-provider.ts` — 引入 SummonerBus 作為 stable event intermediary，解耦 ephemeral RpcChannel 與 LineStream
- `process-provider.ts` — reconnect 時 reattach LineStream 到新 RpcChannel

### Shared
- `methods.ts` — 新增 `session:reconnect-ack` handshake protocol

## Capabilities

### New Capabilities
- `ws-resilience`: WS 斷線不殺 process，2 分鐘 grace period + 自動 reattach
- `stdout-buffer`: WS 斷線期間 buffer stdout，重連後 flush
- `summoner-bus`: 穩定的 event 中介層，解耦 WS 生命週期與 process 生命週期

### Modified Capabilities
- `process-exit`: 傳真實 exit code
- `process-kill`: SIGTERM + 5s + SIGKILL

## Impact

- `apps/summoner/src/connection/agent.ts` — singleton + grace period + buffer + reattach
- `apps/summoner/src/runner.ts` — fix exit code
- `apps/summoner/src/transports/child-process.ts` — SIGKILL fallback
- `apps/server/src/remote/process-provider.ts` — SummonerBus + reattach
- `packages/shared/src/remote/methods.ts` — reconnect-ack protocol
