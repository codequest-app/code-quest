## 1. Summoner: is_error result handling

- [x] 1.1 `transformResult` — `is_error=true` + `result.result` string (no errors array) → emit `error:message`
- [x] 1.2 補測試：`is_error=true` + result string 產生 `error:message`

## 2. Client: onResult skip divider on error

- [x] 2.1 `systemHandlerOn` `onResult` — `isError=true` 時不插入 result divider
- [x] 2.2 補測試：error result 不產生 `data-type="result"` divider

## 3. Client: session:history handler uses same handlers as live

- [x] 3.1 `ChannelMessagesContext` session:history handler — reduce `messageHandlerOn` + `systemHandlerOn` + `planHandlerOn` + `notificationHandlerOn`（排除 `sessionHandlerOn`）
- [x] 3.2 `message:assistant` 在 history 中用 `onMessageAssistant` 直接呼叫

## 4. Server: denylist replaces allowlist

- [x] 4.1 `session-history.ts` — `HISTORY_NAMES` allowlist 改為 `HISTORY_EXCLUDE` denylist
- [x] 4.2 denylist 包含所有 `control:*` events + `session:status`

## 5. Tests

- [x] 5.1 server `session-connect.test.ts` — 補 two-client history tests（B receives history, denylist excludes permission, pending control arrives directly）
- [x] 5.2 client `session-history.test.tsx` — 補 two-client history tests（B sees conversation, error banner, permission excluded）
