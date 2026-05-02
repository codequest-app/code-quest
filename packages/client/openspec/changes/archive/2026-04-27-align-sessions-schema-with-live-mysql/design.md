## Context

`mysql ... DESCRIBE sessions` on the live production DB shows:

```
id          varchar(64)  PK       -- holds sessionId
parent_id   varchar(36)
channel_id  varchar(36)  INDEXED  -- holds channelId
provider, command, args, cwd, mode, role, title, status, created_at
```

Our Drizzle schema tracks a different shape (post migration 0011): `channelId` PK + separate nullable `session_id` column. The journal says 0011 ran, but the live table was hand-altered to the shape above.

The live shape is architecturally correct for the model we've built: **sessionId is the durable row identity**, **channelId is the current live-Channel reference**. On resume, a new Channel is created with a new channelId, but the same sessionId — the row's PK stays stable while `channel_id` updates.

## Goals / Non-Goals

**Goals:**
- Drizzle schemas (SQLite + MySQL) match live MySQL: `id` varchar(64) PK, `channelId` varchar(36) indexed non-PK, no `session_id` column.
- Migration 0012 that transitions existing dev databases non-destructively when possible.
- `SessionStore` exposes both PK-keyed and channelId-keyed lookups / mutations.
- All server callers audit-trailed; tests updated; full suites green.
- No `expect(...)` modified.

**Non-Goals:**
- No client-facing wire changes. `SessionSummary.channelId` stays as a client-facing identifier (clients never see the sessionId PK). Server maps server-side.
- Not reconstructing destroyed data. Dev SQLite can be dropped/recreated — raw event JSONL files are independent storage and are untouched.
- Not adding cross-cutting features (e.g. session picker UI). This change is pure plumbing alignment.

## Decisions

**Decision 1 — PK is `id` (sessionId), not `channelId`.**
Matches the live production table. More importantly, it matches the architectural model where sessionId is the durable identity. A session persists across resume (new channel, new process); one row should keep identity across that, not get deleted/recreated.
*Alternative*: keep PK as channelId, add `sessionId` as UNIQUE. Rejected — doesn't match live DB, and invites confusion about "which id is the stable one".

**Decision 2 — `channelId` column is nullable.**
In the live table it's `DEFAULT NULL`. Semantically, a session row can exist without a currently-live channel (e.g. session is dead, or session exists from prior server restart with no channel spawned yet). Making it required would force us to invent placeholder channelIds.
*Alternative*: required with placeholder on null. Rejected — lies about the data.

**Decision 3 — `getByChannelId` as a distinct method, not overloading `getById`.**
`getById` means "by PK". If we overload to accept either, callers become ambiguous at the call site about which identity they're passing. Distinct methods force clarity.
*Alternative*: single polymorphic `find({ id?, channelId? })`. Rejected — heavier ergonomics for a boolean choice.

**Decision 4 — Hand-write migration 0012, not `pnpm db:generate`.**
Drizzle-kit will emit a destructive diff (rename PK + drop column + add column with copies) that doesn't preserve data relationships. Hand-write `ALTER TABLE` sequences that preserve rows: rename the current `session_id` column into a new `id` PK, drop the old PK, add `channel_id` column populated from old PK values, etc. For SQLite this is a table-recreate following the existing convention. For MySQL the live DB already has the target shape, so the migration can be a no-op guarded by `IF EXISTS` checks — or we document that production ran it manually and only dev MySQLs re-run it.

**Decision 5 — `SessionSummary` wire projection stays client-friendly.**
Client reads `summary.channelId` from `GET /api/sessions` and `session:list` responses. Server's projection logic (in `query.ts` and `routes/sessions.ts`) will map stored row fields into the wire shape; the wire fields are unchanged.

**Decision 6 — TDD order (typecheck-driven):**
1. Update `sessionRecordSchema` shape.
2. Update `SessionStore` interface.
3. `tsc --noEmit` surfaces all breaks. Fix `DrizzleSessionStore` first (get interface implementation clean), then composite, then callers.
4. Update schema files + generate migration.
5. Run test suite; fix fixtures by updating inputs (not assertions).
6. Green.

## Risks / Trade-offs

- **[Risk]** Dev database has rows with `session_id = NULL` (sessions that never got a CLI sessionId). New PK `id` can't be NULL. **Mitigation**: document as "drop dev DB and recreate"; production already has the target shape by hand-ALTER, so no production risk.
- **[Risk]** A caller still passes channelId to `getById()`. **Mitigation**: typecheck catches string-typed args with no runtime check — rename method params to `sessionId`; grep for `getById(` with channelId-shaped variables after the change.
- **[Risk]** `session-history.resolveSessionId(channelId)` — the bridge — now has one more hop (`getByChannelId` then `.id`). Still O(1) indexed lookup. **Trade-off accepted**.
- **[Risk]** Tests that assert `getById(channelId)` returns a row break because semantics flipped. **Mitigation**: those tests get migrated to `getByChannelId(channelId)`; same pattern as previous renames.

## Migration Plan

1. Branch.
2. Update Drizzle schemas (both dialects) — edit columns + indexes.
3. Update `SESSION_COLUMNS` consistency array (new field set).
4. Update `sessionRecordSchema` in session-store.ts.
5. Update `SessionStore` interface — add `getByChannelId`, `renameByChannelId`, `updateStatusByChannelId`, `deleteByChannelId`. Keep the existing methods keyed by PK.
6. Update `DrizzleSessionStore` impl.
7. Update `CompositeSessionStore` impl.
8. Typecheck — fix callers: `connect.ts`, `query.ts`, `command.ts`, `session-history.ts`, `routes/sessions.ts`.
9. Hand-write migration 0012 SQL files (MySQL + SQLite), plus the snapshot + journal entries that drizzle-kit would otherwise generate.
10. Run SQLite migrations from fresh (`:memory:` in tests); confirm schema-consistency test passes.
11. Run full server test suite; fix fixture inputs.
12. Lint clean.
13. Commit.
