## 1. Update schemas (types + DB)

- [x] 1.1 `packages/server/src/services/session-store.ts`: rewrite `sessionRecordSchema` — `id: z.string()` required, `channelId: z.string()` required (both must be set at persist time; SQL column stays nullable to match live MySQL, application-level enforces required). Drop `sessionId`.
- [x] 1.2 Same file: update `SessionStore` interface. All mutations are **PK-keyed by `id` (sessionId)**. Add `getByChannelId(channelId)` as the bridge lookup. Shape:
  ```ts
  persist(record)
  list(opts?)
  getById(id): by sessionId PK
  getByChannelId(channelId): bridge lookup; returns full record, caller reads .id
  rename(id, title)
  updateStatus(id, status)
  delete(id)
  ```
- [x] 1.3 `packages/server/src/db/schema-columns.ts`: `SESSION_COLUMNS` = `['id', 'channelId', 'parentId', 'provider', 'command', 'args', 'cwd', 'mode', 'role', 'title', 'status', 'createdAt']`
- [x] 1.4 `packages/server/src/db/schema-sqlite.ts`: `sessions` — `id: text('id').primaryKey()`, `channelId: text('channel_id')` nullable at DB level, `index('idx_sessions_channel_id').on(table.channelId)`; drop `sessionId`
- [x] 1.5 `packages/server/src/db/schema-mysql.ts`: analogous with `varchar(64)` PK / `varchar(36)` channel, same index

## 2. Migration 0012 (hand-authored)

- [x] 2.1 Run `pnpm --filter server db:generate:sqlite` / `:mysql` to get snapshot + journal entries.
- [x] 2.2 Replace generated SQLite `0012_*.sql` with table-recreate preserving data. New columns: `id` (from old `session_id`, fallback old `channel_id` for rows with null sessionId), `channel_id` (from old PK value). Create `idx_sessions_channel_id`.
- [x] 2.3 Replace generated MySQL `0012_*.sql` with safe rename sequence. Handle NULL session_id rows via `UPDATE sessions SET session_id = channel_id WHERE session_id IS NULL;` BEFORE the CHANGE step that makes it the NOT NULL PK. Final shape: `id` varchar(64) PK, `channel_id` varchar(36) indexed.
- [x] 2.4 `schema-consistency.test.ts` passes.

## 3. DrizzleSessionStore impl (all mutations keyed by `id`)

- [x] 3.1 Update `SessionsTable` interface type — `id` PK column, `channelId` non-PK column, no `sessionId`.
- [x] 3.2 Implement `persist(record)` — insert; existing check via `getById(record.id)`.
- [x] 3.3 Implement `getById(id)` — `where(eq(sessions.id, id))`.
- [x] 3.4 Implement `getByChannelId(channelId)` — `where(eq(sessions.channelId, channelId))`.
- [x] 3.5 Implement `rename(id, title)`, `updateStatus(id, status)`, `delete(id)` — all queries `where(eq(sessions.id, id))`.

## 4. CompositeSessionStore impl

- [x] 4.1 Mirror. `persist` + mutations fan out; `list` / `getById` / `getByChannelId` go to `stores[0]`.

## 5. Fix server callers (channelId → sessionId bridge at the handler)

- [x] 5.1 `socket/session-history.ts resolveSessionId`: change `sessionStore.getById(channelId)` → `getByChannelId(channelId)`; change `record?.sessionId` → `record?.id`.
- [x] 5.2 `socket/handlers/session/connect.ts` persist payload: `{ id: ch.sessionId, channelId: ch.channelId, ... }`. Guard `if (ch.sessionId)` stays — both fields required.
- [x] 5.3 Same file: dead-resume `updateStatus`. Caller has `resumeChannelId`. Bridge:
  ```ts
  const dead = await sessionStore.getByChannelId(resumeChannelId);
  if (dead) await sessionStore.updateStatus(dead.id, 'dead').catch(...);
  ```
- [x] 5.4 `socket/handlers/message.ts` onGenerateTitle (title persistence): has `channelId`, bridge → `rename(dead.id, title)` via `getByChannelId`.
- [x] 5.5 `socket/handlers/session/command.ts` handleDelete / handleRename: client sent channelId, bridge to sessionId, then call `delete(record.id)` / `rename(record.id, title)`. Preserve the existing "Session not found" error semantics.
- [x] 5.6 `socket/handlers/session/query.ts handleGet`: `getByChannelId(channelId)` (semantically unchanged — client still looks up by channelId).
- [x] 5.7 Same file, list projection: `channelId` field in `SessionSummary` comes from `row.channelId` (not a fallback to id).
- [x] 5.8 `routes/sessions.ts /api/sessions/:id`: `:id` is sessionId (REST convention, PK lookup). Keep `getById`.
- [x] 5.9 Same file `/api/sessions` list preview: `rawEventStore.getPreview(s.id)` — preview keyed by sessionId (raw events are session-keyed already).

## 6. Fix tests (fixture inputs only, no expects)

- [x] 6.1 `drizzle-session-store.test.ts`: `makeRecord(sessionId, overrides)` builds `{ id: sessionId, channelId: 'ch-' + sessionId, ... }`. Tests of `delete`/`rename`/`updateStatus` now call with `.id`. Tests that specifically exercise `getByChannelId` keep using channelId.
- [x] 6.2 `session-connect.test.ts`: persist fixtures `{ id: 'sess-dead', channelId: 'ch-dead', ... }`. `getById('sess-dead')` for assertions (PK lookup). The dead-resume test flow: client sends `resumeChannelId: 'ch-dead'`; server bridges; assertion reads `getById('sess-dead').status === 'dead'` or `getByChannelId('ch-dead').status === 'dead'` — whichever keeps expect intent unchanged.
- [x] 6.3 `session-fork.test.ts`: `persistedArgs.find` predicates check the right key (`channelId` or `id` depending on what's inspected).
- [x] 6.4 `session-query.test.ts`: handler tests — inputs & projections.
- [x] 6.5 `session-command.test.ts`: same.
- [x] 6.6 `sessions-route.test.ts`: `mockSession({ id: 's1', channelId: 'ch-1' })`. URL `/api/sessions/s1` → PK lookup.
- [x] 6.7 `response-schemas.test.ts`: wire sessionSummarySchema unchanged; `sessionRecordSchema` fixture (if constructed) needs `id` + `channelId`.

## 7. Verify

- [x] 7.1 `pnpm --filter server exec tsc -p tsconfig.build.json --noEmit` — clean.
- [x] 7.2 `pnpm --filter server test` — green.
- [x] 7.3 Server lint clean vs baseline.
- [x] 7.4 Grep `sessions\.sessionId|record\.sessionId|record\?\.sessionId` — expect zero hits.
- [x] 7.5 Grep `sessionStore\.(rename|updateStatus|delete)\(channelId|.*ChannelId\)` — expect zero (all mutations should use sessionId now).

## 8. Wrap up

- [x] 8.1 Single commit.
