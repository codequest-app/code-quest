# Tasks: fix-review-findings

**TDD discipline**: tests + fixtures as oracle. `expect` unchanged (rule: expect 不變或等價 — mechanical rename OK, behavioral change NOT). Commit after each section green.

## 1. High priority — functional bugs

- [x] 1.1 `server/socket/handlers/message.ts`: `interruptedChannels` Set leak. Add cleanup on `channel:exit` (consume existing event or wire via emitter). Verify via: write a test that fills the set with 100 channelIds then triggers exits, asserts set is empty. Then fix.
- [x] 1.2 `summoner/filesystem/local.ts:69`: path.resolve cwd before startsWith comparison. Check fixtures — filesystem tests already cover listFiles/readFile; add one for a cwd with trailing slash or relative input to RED-verify the hole, then fix.
- [x] 1.3 `summoner/runner.ts:58-101`: add `rawEventSchema` to `ProtocolMessage` discriminated union + registry. Remove `as unknown` cast at the synthesis site. Verify adapter.ts line 337-341 no longer relies on dead branch.
- [x] 1.4 `client/contexts/channel/handlers/streaming.ts:203`: fix `isThinkingStreaming.current = true` when creating a thinking block in `handleAssistantContent`. Existing streaming tests should cover — if not, add one that sends an assistant content block with a thinking item then a thinking delta, expects a SINGLE thinking message (not duplicate).
- [x] 1.5 `client/contexts/PluginContext.tsx:69`: `refreshPlugins` swallowed error — propagate so callers know install/uninstall/toggle result is stale. Either throw or surface via toast with distinct message. Verify tests cover plugin install error paths.
- [x] 1.6 Full test suite green after 1.1–1.5.

## 2. Medium priority — structure

### 2a. Dead exports / visibility

- [x] 2a.1 `server/socket/channel-manager.ts:91 getAllChannelIds`: verify zero consumers (`grep -r getAllChannelIds packages`), delete.
- [x] 2a.2 `shared/schemas/common.ts`: drop `SuccessResponse`, `ClientMessageWire`, `MessageContent` if zero consumers (verify).
- [x] 2a.3 `server/socket/channel.ts:203 resolveControlResponse`: make private.
- [x] 2a.4 Run tsc + tests.

### 2b. Handler deduplication

- [x] 2b.1 `server/socket/handlers/settings.ts`: extract `createSettingHandler({ schema, apply, persist, broadcast })` factory. Apply to `handleSetModel` / `handleSetPermissionMode` / `handleSetThinkingLevel` / `handleApply`. Verify tests unchanged.
- [x] 2b.2 `server/socket/handlers/message.ts`: extract `safeParseAndLog(label, schema, payload, fn)` for the 6+ try/catch-with-log blocks. Keep exact log message text.
- [x] 2b.3 Run tests.

### 2c. Misplaced / inline schemas

- [x] 2c.1 `server/handlers/git.ts:86 handleUpdateSkippedBranch`: move to `handlers/session/fork.ts` (teleport concern). Update emitter.on registration.
- [x] 2c.2 `server/socket/claude/plugin.ts:73,84`: replace hand-rolled `parsePluginJson`/`parseAvailablePluginJson` shape guards with zod schemas (define in `shared/schemas/plugin.ts` or local first). Align with project "zod for all external data" policy.
- [x] 2c.3 `shared/socket-events.ts`: replace inline `RpcResult<Record<string, never>>` / `RpcResult<{ authUrl?: string }>` / `RpcResult<{ response: { type: 'ask_debugger_help_response' } }>` with references to existing shared schemas (mcpAuthResultSchema, askDebuggerHelpResponseSchema, sessionResumeResponseSchema) where they match.
- [x] 2c.4 Run tests after each.

### 2d. Performance / test infra

- [x] 2d.1 `server/services/drizzle-raw-store.ts:85 cloneEvents`: batch insert via `db.insert(...).values(rows)`. Existing raw-event-store tests cover — run to verify semantics preserved.
- [x] 2d.2 `server/services/settings-store.ts:55 InMemorySettingsStore`: move to `server/src/test/in-memory-settings-store.ts`. Update test container import.
- [x] 2d.3 Run tests.

### 2e. Summoner cleanup

- [x] 2e.1 `summoner/transforms/user.ts` + `assistant.ts`: extract shared `buildMessagePayload(blocks, parentToolUseId, uuid)` helper (to transforms/helpers.ts or similar).
- [x] 2e.2 `summoner/git/local.ts:117,164,170,184`: replace `(err as Error).message` with `err instanceof Error ? err.message : String(err)` — prefer a local `errMsg(err)` helper (already exists in server utils; may be worth sharing via summoner utils).
- [x] 2e.3 Run tests.

## 3. Validation

- [x] 3.1 `pnpm -r tsc --noEmit` clean.
- [x] 3.2 Full test suite: shared 41, summoner 305, server 464, client 773 green.
- [x] 3.3 `knip` count stable or lower (no new dead exports).
- [x] 3.4 `openspec validate fix-review-findings` passes.
