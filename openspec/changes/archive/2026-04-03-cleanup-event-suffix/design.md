## Context

純 rename 重構，不改行為。Protocol 產出的欄位名（`.event`、`.hook_event`、`type: "stream_event"` 等）不動。

## Goals / Non-Goals

**Goals:**
- 消除所有非 protocol 的 `Event` 後綴殘留

**Non-Goals:**
- 不改 CLI protocol 欄位名
- 不改對應 socket event name 的 handler（`onRawEvent` 等）
- 不改 segment builder（`rateLimitEvent()` 等）

## Decisions

### Transform 參數改 `raw`（不是 `message`）
Transform 函數接收 `Record<string, unknown>`（從 ProtocolMessage cast 來的 raw JSON），叫 `raw` 精確反映它不是 typed ProtocolMessage。

### `ControlResponseEvent` → `ResolvedControlResponse`
避免與 shared 的 `ControlResponse`（socket callback type）撞名。`Resolved` 反映它是 adapter 從 CLI raw response resolve 出的結構。

### channel.ts 用 `clientMessage` 避免與解構衝突
`handleInternalMessage` 已用 `clientMessage` 參數名（因 `{ message }` 解構衝突），保持一致。

## Risks / Trade-offs

- [ParseOk.event → message 影響 snapshot tests] → 需要更新 snapshots
