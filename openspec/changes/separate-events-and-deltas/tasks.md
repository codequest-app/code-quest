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

### 4. `DrizzleRawEventStore.append` returns id
- [x] Interface returns `Promise<string>`.
- [x] Drizzle impl generates `uuidv7()` or honours caller-supplied id.
- [x] Composite generates id once, passes to inner stores.
- [x] Tests covering both behaviours.

### 5. Classifier
- [x] `packages/server/src/socket/raw-classifier.ts` `isDelta(raw)`.
- [x] Unit tests covering delta subtypes, non-delta, malformed.

### 6. `DrizzleRawDeltaStore` + `RawDeltaStore` interface
- [x] `packages/server/src/services/raw-delta-store.ts` interface + entry type.
- [x] `packages/server/src/services/drizzle-raw-delta-store.ts` impl.
- [x] Unit tests (round-trip, parent_id preservation, order).
- [x] `CompositeRawDeltaStore` for multi-driver fan-out (symmetric with events).

### 7. Config: `persistDeltas`
- [x] `RAW_EVENTS_PERSIST_DELTAS` boolean in `loadConfig`; default `false`.
- [x] Unit tests covering default / `'true'` / `'1'` / unset.

### 8. Facade `RawEventService` (consolidates `RawEventStore` public interface)
- [x] New file `packages/server/src/services/raw-event-service.ts`.
- [x] Wraps `RawEventStore` (low-level events) + `RawDeltaStore`.
- [x] Public methods: `appendEvent`, `appendDelta`, `getBySession(id, opts?)`, `getPreview`, `cloneEvents`.
- [x] `getBySession(id, { includeDeltas: true })` UNIONs both tables, sorted by `seq`.
- [x] Unit tests covering all routing + union behaviours.
- [x] Promote `RawEventService` to be bound as `TYPES.RawEventStore` — consumers see only one type; `TYPES.RawDeltaStore` removed.

### 9. RawRecorder routing
- [x] `RawRecorder` takes a single `RawEventStore` service + `persistDeltas` flag.
- [x] Inside `wire(channel)`, closure-local `currentTurnRootId`.
- [x] Delta branch → `service.appendDelta({ parentId, ... })` when flag on; drop otherwise.
- [x] Non-delta branch → `id = await service.appendEvent(...)`; stamp `currentTurnRootId` when user stdin.
- [x] Integration test covers delta on/off via real RawRecorder + FakeClaude pipeline (`raw-delta-persistence.integration.test.ts`).

### 10. Container wiring
- [x] `buildStores` returns `eventStores` + `deltaStores` arrays.
- [x] Compose each into `CompositeRaw*Store`.
- [x] Construct `RawEventService` from the two composites; bind as `TYPES.RawEventStore`.
- [x] Drop `TYPES.RawDeltaStore`.
- [x] `RawRecorder` receives the service.

### 11. RawEventPanel RPC
- [x] `session:raw_events` handler calls `service.getBySession(sessionId, { includeDeltas: config.rawEvents.persistDeltas })`.
- [x] Integration test verifying deltas show up when flag is on, not when off.

### 12. `.env` / `.env.example`
- [x] Uncomment `RAW_EVENTS_PERSIST_DELTAS=false` in `.env.example` with doc.

### 13. Full regression
- [x] `pnpm -r test` green.
- [x] `pnpm tsc --noEmit` clean.

### 14. Smoke (manual, user-run)
- [ ] Boot server. Send a user message with and without the flag to verify persistence split.
