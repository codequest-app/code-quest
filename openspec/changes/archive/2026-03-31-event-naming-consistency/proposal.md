## Why

Socket event 命名有 4 種風格混用：`namespace:action`（55 個）、`verb_noun`（20 個）、`noun_verb`（15 個）、bare single word（6 個）。新加的 `get_provider_config` 跟現有 `get_*` pattern 一致，但整體不一致會讓開發者難以猜測 event name。

同時 `get_provider_config` 的定位需要釐清 — 它是 adapter metadata request，不是 protocol event，但走了跟 protocol event 一樣的 socket channel。

## What Changes

- 定義 event 命名慣例，所有 bare events 遷移到 `namespace:action` 格式
- `get_provider_config` 遷移到合適的 namespace
- 保留 extension protocol 對齊的 S→C events（`message:*`、`stream:*`、`control:*`、`system:*` 等）不改
- 向下相容：server 同時監聽新舊 event name 過渡期

## Capabilities

### New Capabilities
- `event-naming-convention`: 統一 socket event 命名為 `namespace:action` 格式，定義命名規則

### Modified Capabilities

（無）

## Impact

- `packages/shared/src/socket-events.ts` — `ClientToServerEvents` + `ServerToClientEvents` event name 重新命名
- `apps/server/src/socket/handlers/*.ts` — 所有 `socket.on()` event name
- `apps/web/src/contexts/channel/*.tsx` — 所有 `socket.emit()` / `socket.on()` event name
- `apps/web/src/socket/rpc.ts` — rpc 呼叫的 event name
- `apps/server/src/__tests__/*.test.ts` — FakeClaude `send()` event name
- `apps/web/src/__tests__/*.test.tsx` — client test event name
