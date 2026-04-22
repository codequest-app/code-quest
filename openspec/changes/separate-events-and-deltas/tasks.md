## Tasks

### 1. Hand-written migration (sqlite + mysql)
- [x] `packages/server/drizzle/sqlite/0016_separate_events_and_deltas.sql` — create raw_deltas, copy delta rows from raw_entries, delete from raw_entries, rename raw_entries → raw_events, rename index.
- [x] `packages/server/drizzle/mysql/0017_separate_events_and_deltas.sql` — same plan, RENAME TABLE + ALTER TABLE RENAME INDEX.
- [x] Update both `_journal.json`.

### 2. Schema code rename + new rawDeltas
- [x] `packages/server/src/db/schema-sqlite.ts` — rename `rawEntries` → `rawEvents`; add `rawDeltas`.
- [x] Same for `schema-mysql.ts`.
- [x] `schema-columns.ts`: `RAW_ENTRY_COLUMNS` → `RAW_EVENT_COLUMNS`; add `RAW_DELTA_COLUMNS`.
- [x] `RawEntryColumnName` → `RawEventColumnName`; add `RawDeltaColumnName`.
- [x] `pnpm db:migrate` runs cleanly on both drivers; counts verified (25,788 events / 117,487 deltas post-migration).

### 3. Types + zod
- [x] `packages/summoner/src/types.ts`: `rawEntrySchema` → `rawEventSchema`; `RawEntry` → `RawEvent`.
- [x] `packages/server/src/services/drizzle-raw-event-store.ts`: point at `rawEvents`; rename row schema and types.
- [x] All source sites migrated (grep-clean).

### 4. `RawEventStore.append` returns id
- [ ] Red: test append returns the row's PK id.
- [ ] Green: `DrizzleRawEventStore.append` returns the generated `uuidv7()`.
- [ ] `CompositeRawEventStore.append` generates id once, passes to all inner stores, returns it.

### 5. Classifier
- [ ] `packages/server/src/socket/raw-classifier.ts`: `export function isDelta(raw: string): boolean`.
- [ ] Unit tests: delta subtypes → true; non-delta + malformed → false.

### 6. `DrizzleRawDeltaStore`
- [ ] New file `packages/server/src/services/drizzle-raw-delta-store.ts`.
- [ ] Interface `RawDeltaStore` with `append(entry: RawDeltaEntry)` and `getBySession(sessionId)`.
- [ ] Unit tests (round-trip, parent_id preservation, order).

### 7. Config: `persistDeltas`
- [ ] Add `persistDeltas: boolean` to `config.rawEvents` in `loadConfig`.
- [ ] Parse `RAW_EVENTS_PERSIST_DELTAS` (default `false`).
- [ ] Unit test.

### 8. RawRecorder routing (closure-local state)
- [ ] Inject `rawDeltaStore` + `persistDeltas` into `RawRecorder`.
- [ ] Inside `wire(channel)`, add `let currentTurnRootId: string | null = null;`.
- [ ] Branch logic for delta vs non-delta; stamp `parent_id`; update `currentTurnRootId` when user stdin lands.
- [ ] Unit tests with mock stores (all four branches).

### 9. Container wiring
- [ ] `buildStores` returns `rawDeltaStores[]`.
- [ ] IoC bind `RawDeltaStore`.
- [ ] `RawRecorder` constructor takes both stores + config flag.

### 10. RawEventPanel RPC merge
- [ ] `session:raw_events` handler: if `config.rawEvents.persistDeltas` → UNION + merge by seq.
- [ ] Integration test.

### 11. `.env` / `.env.example`
- [ ] Uncomment `RAW_EVENTS_PERSIST_DELTAS=false` in `.env.example` with doc.

### 12. Full regression
- [ ] `pnpm -r test` green.
- [ ] `pnpm tsc --noEmit` clean.

### 13. Smoke (manual, user-run)
- [ ] Boot server. Send a user message with and without the flag to verify persistence split.
