## Why

前一輪已將 type 從 `SocketEvent`/`ProtocolEvent` 改為 `ClientMessage`/`ProtocolMessage`，但函數名、參數名、interface field 仍殘留 `Event` 和 `se`（socketEvent 縮寫），造成命名不一致。

## What Changes

- 函數名帶 `Event` → 移除或改 `Message`（`convertEvent` → `convertMessage`，`transformAssistantEvent` → `transformAssistant` 等）
- 參數/變數名 `se` → `message`，`protocolEvent` → `protocolMessage`，`event` (指 ClientMessage 時) → `message`
- Interface field `AdapterOutput.events` → `AdapterOutput.messages`
- `dispatchRunnerEvent` → `dispatchRunnerMessage`

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `adapter`: AdapterOutput field rename, transform 函數 rename
- `protocol`: 變數名對齊

## Impact

- `apps/summoner/src/types.ts` — AdapterOutput.events → messages
- `apps/summoner/src/claude/adapter.ts` — method + variable renames
- `apps/summoner/src/claude/transforms/*.ts` — function name renames
- `apps/summoner/src/runner.ts` — variable rename
- `apps/server/src/socket/channel.ts` — parameter renames
- `apps/server/src/socket/channel-emitter.ts` — method rename
- `apps/server/src/socket/channel-manager.ts` — parameter rename
- `apps/server/src/socket/session-history.ts` — variable rename
- 所有相關 test files
