# review-round-2

## Why

Second code review pass (focused on re-export, 職責不清, code smell, 棄用程式碼) surfaced 20+ findings after the first review round was fixed. Main themes:

- **5 DRY violations** crossing package boundaries (isRecord ×5, errMsg ×2, session_not_found, channel-match guard, updateLastMessage pattern)
- **4 re-export deadwood** in client barrels and tool-registry
- **5 SRP/naming issues**: handlers doing parse+transform+side-effect in one function, misleading names like `handleInitResponse` that apply side effects
- **3 function-size smells** (handleInternalMessage, handleAssistantContent, convertOtherMessage)

TDD refactor: `expect` unchanged. Mechanical patches one at a time; full test suite green at each step.

## What Changes

### Section 1 — Re-exports and dead symbols (low risk)

1. `client/contexts/channel/index.ts` — drop dead `ChannelConfigValue` and `ChannelMessagesValue` type re-exports.
2. `client/components/tools/tool-registry.ts` — remove `ToolResult` pass-through re-export; unexport `ToolInput`, `ToolHeaderInfo`.
3. `client/components/resume-route.ts` — unexport `ResumeRoute`.
4. `client/components/command-menu-items.tsx` — unexport `MenuSections`.
5. `server/socket/handlers/message.ts` — remove redundant `onMessageResultTitle` double-subscription.

### Section 2 — Cross-package DRY consolidation

6. Move `isRecord` to `@code-quest/shared/utils` as single source. Remove 5 copies.
7. Move `errMsg` to `@code-quest/shared/utils`. Remove 2 copies.
8. Extract `session_not_found` error code constant.
9. Extract `matchesChannel(channelId, payload)` guard for the 4 repeated `payload.channelId !== channelId && payload.channelId !== ''` guards.
10. Extract `updateLastMessage(setState, mapper)` helper for streaming handlers' repeated `setState((prev) => ...modify last...)` pattern.

### Section 3 — SRP / naming

11. `handleInitResponse` (connect.ts) does 3 side effects → rename to `applyInitResponseAndBroadcast` OR split pure-parse from side-effect apply.
12. `handleInternalMessage` (channel.ts) — split the 3 event-type branches (`session:init`, `session:status`, `error:message`) into named `applySessionInit` / `applySessionStatus` / `applyErrorMessage` methods.
13. `handleRespond` (message.ts) — replace 3-way `subtype` branch with a dispatch table.
14. `broadcastSessionState` (channel-manager.ts) — feature-envy on `ch.sessionConfig`. Move settings-payload construction to `Channel.toSettingsUpdatePayload()`.

### Section 4 — Function size / consistency

15. `convertOtherMessage` (adapter.ts) — 13-case switch → dispatch table `{ [type]: transformer }`.
16. `handleAssistantContent` (streaming.ts) — split per-block-type branches.
17. `ClaudeAdapter.clientConfig` — extract 76-line inline object to `./client-config.ts`.
18. `adapter.ts:241` `console.debug` → `logger` (pino) for consistency.

### Section 5 — Inspection

19. `server/drizzle-{mysql,sqlite}.config.ts` — verify scripts reference them; if only `drizzle.config.ts` is used, delete stale configs. Knip flagged both.
20. `server/package.json` devDeps: verify `socket.io-client` usage; remove if truly dead.

## Impact

- Single source of truth for `isRecord` / `errMsg` — no drift.
- Handler files smaller and easier to read.
- No behavior change. Full test suite is safety net.
