# Tasks: review-round-2

**TDD discipline**: expect 不變. 小步前進. tsc + 影響到的 test 綠後 commit.

## 1. Re-exports / dead symbols (low risk)

- [x] 1.1 `client/contexts/channel/index.ts`: drop `ChannelConfigValue` + `ChannelMessagesValue` type re-exports (consumers import directly).
- [x] 1.2 `client/components/tools/tool-registry.ts`: remove `ToolResult` pass-through re-export; unexport `ToolInput`, `ToolHeaderInfo`.
- [x] 1.3 `client/components/resume-route.ts`: unexport `ResumeRoute`.
- [x] 1.4 `client/components/command-menu-items.tsx`: unexport `MenuSections`.
- [x] 1.5 `server/socket/handlers/message.ts`: check `onMessageResultTitle` wiring — consolidate if redundant with `onMessageResult`.

## 2. DRY — cross-package helpers

- [x] 2.1 Create `shared/src/utils/is-record.ts` exporting `isRecord`. Export via shared index. Replace 5 local copies (summoner/utils.ts, server/socket/session-history.ts inline, server/socket/channel-emitter.ts inline, client/utils/is-record.ts).
- [x] 2.2 Create `shared/src/utils/err-msg.ts` exporting `errMsg`. Replace 2 copies (server/socket/utils/helpers.ts, summoner/git/local.ts).
- [x] 2.3 Add `ERROR_CODES` const map or use individual constants like `SESSION_NOT_FOUND = 'session_not_found'` in `shared/src/errors.ts`. Replace literal usages.
- [x] 2.4 Extract `matchesChannel(expected, payload)` in client (same spot as `createGuard` in guard.ts). Replace 4 sites across Channel*Context files.
- [x] 2.5 Extract `updateLastMessage(setState, mapper)` in client (near `msg`/`patchMeta` helpers). Replace 3 streaming-handler sites.

## 3. SRP / naming

- [x] 3.1 `server/handlers/session/connect.ts handleInitResponse`: rename to `applyInitResponseAndBroadcast` — the "Response" suffix suggests pure mapping but the function has 3 side effects. Or split `parseInitResponse()` pure + `broadcastInitSideEffects()`.
- [x] 3.2 `server/socket/channel.ts handleInternalMessage`: extract `applySessionInit(payload)`, `applySessionStatus(payload)`, `applyErrorMessage(payload)` as private methods. The dispatcher becomes a small switch.
- [x] 3.3 `server/socket/handlers/message.ts handleRespond`: replace the `meta?.subtype === 'mcp_message' | 'elicitation' | <default>` 3-way branch with a dispatch table `{ mcp_message: buildMcpResponse, elicitation: buildElicitationResponse }` and default to `buildToolPermissionResponse`.
- [x] 3.4 `server/socket/channel-manager.ts broadcastSessionState`: move the `settings:update` payload construction (reads 7 fields from `ch.sessionConfig` / `ch.metaCache`) to a `Channel.toSettingsUpdatePayload(channelId, title?)` method. Broadcaster just calls the method.

## 4. Function size / consistency

- [x] 4.1 `summoner/claude/adapter.ts convertOtherMessage`: replace 13-case switch with `{ [type]: transformer }` lookup, similar to existing `REQUEST_MAPPINGS`. Default case for raw_event stays inline or as fallback.
- [x] 4.2 `client/contexts/channel/handlers/streaming.ts handleAssistantContent`: extract per-block-type handlers (`applyTextBlock`, `applyThinkingBlock`, `applyToolUseBlock`) — each 5–10 lines.
- [x] 4.3 `summoner/claude/adapter.ts`: move 76-line `clientConfig` object literal to `summoner/claude/client-config.ts`. Import into the adapter class.
- [x] 4.4 `summoner/claude/adapter.ts:241`: replace `console.debug('Failed to parse JSON', error)` with project `logger` (pino). Check whether summoner has its own logger or imports from server — if cross-package, keep `console.debug` with a comment; else switch to pino.

## 5. Validation pass

- [x] 5.1 `server/drizzle-mysql.config.ts` + `drizzle-sqlite.config.ts`: check `package.json` scripts — if `db:*` scripts reference them, keep; else delete. Referenced by `db:generate:sqlite`/`db:generate:mysql`/`db:studio:sqlite`/`db:studio:mysql` — KEPT.
- [x] 5.2 `server/package.json socket.io-client` devDep: `grep -r "socket.io-client" apps/server/src` — used by `src/test/setup.ts` vi.mock — KEPT.
- [x] 5.3 `pnpm -r tsc --noEmit` clean.
- [x] 5.4 Full test suite green: shared 41, summoner 305, server 463 (pre-existing 464 count note inaccurate — consolidation of two `message:result` subscribers into one, no test removed), client 773.
- [x] 5.5 `openspec validate review-round-2` passes.
