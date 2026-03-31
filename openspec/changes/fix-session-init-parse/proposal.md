## Why

`channel.ts` 的 `session:init` handler 用 `sessionInitPayload.parse(se.payload)` — 如果 CLI 回傳的 payload 不符 schema（例如 `config` 為 null、mcpServers 有額外欄位），zod throw 會導致 `sessionId` 不被設定，`sessions` 表不寫入。

## What Changes

- `session:init` handler 改用 `safeParse` 取代 `parse`，失敗時 fallback 到安全處理
- 或讓 schema 更寬鬆（所有欄位 optional + passthrough）
- 同理檢查所有 channel.ts 的 zod parse 是否會阻斷關鍵流程

## Impact

- `packages/server/src/socket/channel.ts` — session:init, session:status, error:message 的 parse
- `packages/server/src/socket/hooks/channel-hooks.ts` — 所有 event payload parse
