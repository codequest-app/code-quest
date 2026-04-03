## Why

前兩輪 rename 已完成 type 和 function 名的 Message 統一，但仍有殘留的 `Event` 後綴：interface `ControlResponseEvent`、test helper `parseEvent`、變數 `resultEvent`/`userEvent`、transform 參數 `event`、`ParseOk.event` field。

## What Changes

- `ControlResponseEvent` → `ResolvedControlResponse`
- `ParseOk.event` → `ParseOk.message`
- `parseEvent` (test helper) → `parseMessage`
- transform 參數 `event: Record<string, unknown>` → `raw: Record<string, unknown>`
- channel.ts 參數 `event: ControlResponseEvent` → `response: ResolvedControlResponse`
- 變數 `resultEvent` → `resultMessage`、`userEvent` → `userMessage`、`se` → `streamData`
- `onMcpControlEvent` → `onMcpControl`

不改 protocol 產出的欄位名（`.event`、`.hook_event`、`rate_limit_event` 等）。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `adapter`: ControlResponseEvent rename, ParseOk field, transform params
- `protocol`: ParseOk.event → message

## Impact

- `packages/summoner/src/types.ts` — ControlResponseEvent, ParseOk.event
- `packages/summoner/src/claude/transforms/*.ts` — param rename
- `packages/server/src/socket/channel.ts` — param rename
- `packages/server/src/socket/handlers/mcp.ts` — function rename
- Test files
