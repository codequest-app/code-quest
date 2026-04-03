## 1. ControlResponseEvent → ResolvedControlResponse

- [x] 1.1 Rename interface and all references (types.ts, adapter.ts, index.ts, channel.ts)
- [x] 1.2 Rename channel.ts params: `event: ControlResponseEvent` → `response: ResolvedControlResponse`
- [x] 1.3 Run summoner + server tests

## 2. ParseOk.event → ParseOk.message

- [x] 2.1 Rename field in types.ts ParseOk interface
- [x] 2.2 Update all `result.event` / `parsed.event` references in runner, protocol, adapter tests, pipeline tests, helpers
- [x] 2.3 Update snapshots if needed
- [x] 2.4 Run summoner + server tests

## 3. Transform params event → raw

- [x] 3.1 Rename param in all 6 transform files (system, assistant, user, result, stream, control) and update all `event.xxx` → `raw.xxx` within each
- [x] 3.2 Rename stream.ts `se` → `streamData`
- [x] 3.3 Run summoner tests

## 4. Remaining renames

- [x] 4.1 `parseEvent` → `parseMessage` in test helper + all imports
- [x] 4.2 `resultEvent` → `resultMessage` in transforms/result.ts
- [x] 4.3 `userEvent` → `userMessage` in session-connect test
- [x] 4.4 `onMcpControlEvent` → `onMcpControl` in server/handlers/mcp.ts
- [x] 4.5 Run all tests (summoner + server + client)
