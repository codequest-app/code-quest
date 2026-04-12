## Why

The live production MySQL `sessions` table (verified by `DESCRIBE sessions`) has a materially different shape than our Drizzle schema. Someone manually ALTER'd the live table after our migrations landed, and the actual shape — `id` varchar(64) PK (holds sessionId) + `channel_id` varchar(36) indexed non-PK (holds channelId) — turns out to better match the architectural model we've been aligning toward: **sessionId is the durable identity (CLI-provider-owned, survives resume/restart); channelId is the ephemeral Channel wrapper**. The durable thing should be the PK.

Our Drizzle / code is still tracking the older model where `channel_id` is PK and `session_id` is a nullable column. This diverges from reality in production and from the architectural direction. Align code with the live table — not the other way around.

## What Changes

**DB schema** (both SQLite + MySQL):
- `sessions.channelId` (current PK) → split into two columns:
  - `id` varchar(64) PK — holds sessionId (the durable CLI identifier)
  - `channelId` varchar(36) indexed non-PK — holds channelId (Channel wrapper UUID)
- **Drop** the existing `sessionId` column — the `id` PK now carries that value directly.
- Add index on `channel_id` to match live MySQL's `idx_sessions_channel_id`.

**Migration 0012** — hand-written to avoid destructive diff. Reversible rename + add + drop sequence.

**Zod schema** (`sessionRecordSchema`):
- `channelId: z.string()` (required, was PK-valued) → `id: z.string()` (required, is the sessionId) + `channelId: z.string().nullable().optional()` (indexed column)
- Drop the old `sessionId: z.string().nullable().optional()` field.

**SessionStore interface**:
- `getById(id)` — now keys by sessionId (PK). Semantic change.
- **Add** `getByChannelId(channelId)` — new lookup by the indexed channel_id column. Used by server handlers that have a channelId and need the persisted row.
- Mutation operations that today take channelId (`rename`, `updateStatus`, `delete`) — add `*ByChannelId` variants. The PK-keyed versions stay available for future use.

**Server callers** (5 files):
- `connect.ts` persist payload: `{ id: ch.sessionId, channelId: ch.channelId, ... }`.
- `connect.ts` dead-resume: `updateStatusByChannelId(resumeChannelId, 'dead')`.
- `query.ts` handleGet: `getByChannelId(channelId)`.
- `command.ts` delete/rename: `deleteByChannelId` / `renameByChannelId`.
- `session-history.ts resolveSessionId`: `sessionStore.getByChannelId(channelId)?.id`.
- `routes/sessions.ts /api/sessions/:id`: `:id` is now sessionId (durable identifier), consistent with REST convention. Tests already pass `'s1'`-style values that are shape-agnostic.

**Tests**: update fixture builders to set `{ id, channelId }`; adjust any `.get()`/`.persist()` call site that previously used channelId as the PK. No `expect(...)` modified — this is a schema rename / subject-path change, same class as previous renames.

## Capabilities

### Modified Capabilities
- `server-session-store-identity`: Change the persistence-key field from `channelId` (PK) back to `id` (holding sessionId), and make `channelId` a separate non-PK column. Aligns schema with architectural model (durable sessionId as PK, ephemeral channelId as FK-like reference).

## Impact

- **DB**: both SQLite and MySQL. Migration 0012 authors the PK change + column restructuring. Existing dev-data rows with a null `session_id` won't have an `id` — documented as destroy-and-recreate for dev DBs (acceptable; only event log .jsonl data is user-owned and it's independent).
- **Server**: 5 handler files, 3 service files (store interface + drizzle impl + composite).
- **Tests**: `drizzle-session-store.test.ts`, `session-connect.test.ts`, `session-fork.test.ts`, `session-query.test.ts`, `session-command.test.ts`, `sessions-route.test.ts`, `response-schemas.test.ts`.
- **Shared / client**: no changes — `SessionSummary` wire type stays `{ channelId, ... }` because that's what the client needs. Server projects `sessionRecord.channelId ?? sessionRecord.id` (or similar) into the wire shape if needed. Concrete wire mapping decided during implementation.
