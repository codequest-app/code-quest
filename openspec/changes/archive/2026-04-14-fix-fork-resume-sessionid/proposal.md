# Proposal: fix-fork-resume-sessionid

## Why

`handleFork` in `packages/server/src/socket/handlers/session/fork.ts` has three compounding bugs:

1. It feeds the parent **channelId** (wrapper UUID) into `launchOptions.resumeSessionId`, which becomes CLI argv `--resume <channelId>`. CLI expects the durable JSONL sessionId, so it looks up a non-existent JSONL and errors with "No conversation found".
2. It never sets `forkSession: true`, so even if the sessionId were correct, CLI would overwrite the parent's JSONL instead of forking.
3. It does not pass the parent's `cwd` to the spawn, so the CLI process inherits the server's cwd and fails to resolve the JSONL path `~/.claude/projects/<cwd>/<sid>.jsonl`.

On top of that, fork's history survives only in the fork RPC ack — on reload (`session:join`), `sessionHistory.replaySession(newSessionId)` reads only the post-fork events because rawEventStore never received the parent's history. The parent chain isn't walked. Users lose history the moment they refresh a forked tab.

The previous resume rework (archived 2026-04-13) established the correct pattern for durable session identity (`channelManager.resolveSessionId`, cwd recovery, pre-setting `ch.sessionId`). Fork must adopt the same discipline, plus one additional trick the official VS Code extension uses: **pre-generate the fork's sessionId server-side, pass it via `--session-id`, and clone parent raw events into the new sessionId so reload works from a single sessionId lookup**.

Teleport has the same argv bug but is scoped out — separate change.

## What Changes

Server (`packages/server/src/socket/handlers/session/fork.ts`):

- `handleFork`: resolve the parent's real sessionId via `channelManager.resolveSessionId(forkedFromChannelId)`. If resolution yields the input channelId (no row, no live channel), ack `{ success: false, error: 'parent session not found' }` without spawning.
- Recover parent `cwd` via `sessionStore.getById(parentSessionId)` and pass it to `channelManager.create`.
- Generate the fork's new sessionId server-side: `const newSessionId = crypto.randomUUID()`.
- Clone parent raw events: `rawEventStore.cloneEvents(parentSessionId, newSessionId)` BEFORE spawn. This keeps `sessionHistory.replaySession(newSessionId)` returning the full lineage on reload.
- Set `launchOptions: { resumeSessionId: parentSessionId, forkSession: true, sessionId: newSessionId }`. Keep `initOptions.resumeSessionAt` unchanged (message-scoped, CLI uses it for its own JSONL truncation).
- In `onBeforeSpawn`, pre-set `ch.sessionId = newSessionId` (verified: CLI 2.1.104 respects `--session-id` + `--fork-session` and emits that exact sessionId in `system:init`).
- Simplify ack: still return `{ success, channelId, parentChannelId }` but DROP the `events` field — reload reads the cloned rawEventStore directly, so client no longer needs history in the ack.

Services:

- `RawEventStore` interface (`packages/server/src/services/raw-event-store.ts`): add `cloneEvents(fromSessionId: string, toSessionId: string): Promise<void>`. The Drizzle impl SHALL copy all rows from `fromSessionId`, rewrite their `sessionId` to `toSessionId`, and re-sequence `seq` monotonically from 1. `CompositeRawStore` SHALL delegate to every inner store.
- **Remove `FileRawStore`** (`packages/server/src/services/file-raw-store.ts`) and its test file. The file-backed raw event store was an optional mirror of CLI stdout and is unused in practice — sqlite is sufficient. `FileSettingsStore` is retained (different concern). `CompositeRawStore` tests replace the file-backed inner store with a second in-memory Drizzle store.

Client / shared schemas: UNCHANGED. Payload remains `{ forkedFromChannelId, resumeSessionAt?, newChannelId }`. `forkConversationResponseSchema`'s `events` field is retained (backwards-compat) but will be unused on the client fork path — client reads history via `session:join` after tab creation.

`handleTeleport` is UNCHANGED in this change — still broken, tracked separately.

## Scope — out of scope

- Teleport argv fix.
- Truncating cloned raw events to match `resumeSessionAt`. CLI truncates its JSONL internally; our DB will retain full parent history. Acceptable for v1: UI shows slightly more history than CLI's context. A follow-up change can add parsing to truncate at the message uuid boundary.
- Migrating the existing fork ack `events` field out of the response schema (deferred cleanup).

## Impact

- Affected specs: `protocol` (fork requirement expanded with preset sessionId + clone semantics).
- Affected code: `packages/server/src/socket/handlers/session/fork.ts`, `packages/server/src/services/raw-event-store.ts` (interface + Drizzle + Composite impls + tests). FileRawStore deleted.
- Risk: medium — introduces DB write on fork (clone cost scales with parent size); mitigated by single INSERT ... SELECT.
- Rollout: direct merge after TDD green.
