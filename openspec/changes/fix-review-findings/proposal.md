# fix-review-findings

## Why

Code review after the unify-rpc-ack / tighten-production-casts / consolidate-zod-shared / cleanup-dead-code passes surfaced 5 high-priority items (memory leak, path traversal, typing hole, streaming state bug, swallowed error) and ~11 medium items (structural duplication, dead exports, testing infra in production).

Each item has tests as safety net. TDD refactor with `expect` unchanged or equivalent.

## What Changes

### High priority (functional impact)

1. **Memory leak**: `server/socket/handlers/message.ts:33` — `interruptedChannels` Set never cleared on channel exit. Hook into `session:closed` / `channel:exit` to delete.
2. **Path traversal**: `summoner/filesystem/local.ts:69` — `cwd.startsWith()` check without `resolve()` on cwd. Fix via `path.resolve()` normalization before comparison.
3. **Typing hole**: `summoner/runner.ts:58-101` — fabricated `raw_event` ProtocolMessage bypasses union. Add `raw_event` to `ProtocolMessage` discriminated union; remove `as unknown` casts.
4. **Streaming state bug**: `client/contexts/channel/handlers/streaming.ts:203` — `handleAssistantContent` creates a thinking block but doesn't set `isThinkingStreaming.current = true`. Likely causes duplicate thinking blocks on delta/non-delta mix.
5. **Swallowed error**: `client/contexts/PluginContext.tsx:69` — `refreshPlugins().catch(console.error)` makes callers think install/uninstall/toggle succeeded. Propagate or toast.

### Medium priority (structural)

6. **Dead exports**: `server/channel-manager.ts:91 getAllChannelIds`, `shared/schemas/common.ts SuccessResponse/ClientMessageWire/MessageContent`.
7. **Visibility**: `server/socket/channel.ts:203 resolveControlResponse` public but internal → private.
8. **Duplicated handlers**: `server/socket/handlers/settings.ts` 4-handler sameness → extract `createSettingHandler` factory pattern (as `mcp.ts` already does).
9. **Duplicated try/catch**: `server/socket/handlers/message.ts` 6+ `parse-then-log` blocks → `safeParseAndLog` helper.
10. **Misplaced handler**: `server/handlers/git.ts:86 handleUpdateSkippedBranch` handles teleport concern → move to `handlers/session/fork.ts`.
11. **Raw JSON parsing**: `server/socket/claude/plugin.ts:73,84 parsePluginJson/parseAvailablePluginJson` hand-rolled shape guards → zod schema.
12. **Batch insert**: `server/services/drizzle-raw-store.ts:85 cloneEvents` N round-trips → single `db.insert().values(rows)`.
13. **Test infra in production**: `server/services/settings-store.ts:55 InMemorySettingsStore` used only by test container → move to `/test/`.
14. **Inline types over shared schemas**: `shared/socket-events.ts` several `RpcResult<Record<string, never>>` inline callback result types should reference existing shared schemas (`mcpAuthResultSchema`, `askDebuggerHelpResponseSchema`, `sessionResumeResponseSchema`).
15. **Transform duplication**: `summoner/transforms/user.ts` + `assistant.ts` share payload-assembly → `buildMessagePayload(blocks, parentToolUseId, uuid)` helper.
16. **Unsafe error narrow**: `summoner/git/local.ts:117,164,170,184` use `(err as Error).message` — use `err instanceof Error ? err.message : String(err)`.

## Impact

- Memory leak fix: sessions-long stability over hours of use.
- Path traversal fix: defense against crafted cwd input.
- Typing hole fix: TS catches future raw_event shape drift.
- No behavior change elsewhere. Existing tests as oracle.
