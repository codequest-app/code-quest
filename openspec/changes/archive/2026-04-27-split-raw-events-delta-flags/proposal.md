## Why

`RAW_EVENTS_PERSIST_DELTAS` currently controls both the write side (whether `RawRecorder` appends `content_block_delta` rows to `raw_deltas`) and the read side (whether `DrizzleRawEventStore.getBySession` UNION-ALLs with the delta table). Two concerns, one knob.

The valuable decoupling case is **write=on, read=off**: persist deltas for offline inspection (`sqlite3 ... 'SELECT ... FROM raw_deltas'`) while keeping the live app's reads lean — chat replay and RawEventPanel RPC never pay the UNION cost, and deltas never leak into the observable UI. A single flag forces you to pick one behavior for both.

Splitting into `RAW_EVENTS_WRITE_DELTAS` and `RAW_EVENTS_READ_DELTAS` makes the intent explicit. Default both to `false` (clean mode).

## What Changes

- **Rename** `RAW_EVENTS_PERSIST_DELTAS` → `RAW_EVENTS_WRITE_DELTAS` (write side).
- **New** `RAW_EVENTS_READ_DELTAS` (read side — controls whether `DrizzleRawEventStore.getBySession` emits `UNION ALL`).
- `config.rawEvents.persistDeltas` → `config.rawEvents.{writeDeltas, readDeltas}`.
- `container.ts` `buildStores` accepts both flags:
  - `writeDeltas` controls whether `DrizzleRawDeltaStore` is wired (and by extension whether `RawRecorder` actually writes).
  - `readDeltas` controls whether `deltaTable` is passed to `DrizzleRawEventStore` (store's `getBySession` branches to single-table vs UNION ALL based on presence).
- `RawRecorder` constructor takes `writeDeltas` (was `persistDeltas`).
- No change to `RawEventService` / `SessionHistory` APIs — consumers still call `service.getBySession(sessionId)` and get config-driven behaviour.

## Capabilities

### New Capabilities

(none — internal env/config/wiring refinement; no product-visible behaviour change beyond what the two flags unlock)

### Modified Capabilities

(none)

## Impact

- `apps/server/src/config.ts` — rename field, add new field.
- `apps/server/src/container.ts` — route `writeDeltas` + `readDeltas` into `buildStores`.
- `apps/server/src/socket/raw-recorder.ts` — constructor param name change.
- `apps/server/.env`, `.env.example` — rename + add the new line.
- Tests — fixtures / mocks using the old `persistDeltas` name adjust; new assertions covering the four flag combinations.
- No DB schema change. No migration. No client change.
