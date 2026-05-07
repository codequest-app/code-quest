## Tasks

### 1. Red — config tests for new shape
- [x] `config.test.ts`:
  - `RAW_EVENTS_WRITE_DELTAS=true` populates `config.rawEvents.writeDeltas=true`.
  - `RAW_EVENTS_READ_DELTAS=true` populates `config.rawEvents.readDeltas=true`.
  - Both unset → both false.
  - `true/1` accepted; anything else falsy.
- [x] Old `RAW_EVENTS_PERSIST_DELTAS` no longer read (removed).

### 2. Green — config.ts refactor
- [x] `config.rawEvents.persistDeltas` → `{ writeDeltas, readDeltas }` in `loadConfig`.

### 3. Container rewiring
- [x] `buildStores` gains a flags object `{ readDeltas }`.
- [x] `readDeltas` → decides whether `deltaTable` is passed to `DrizzleRawEventStore`.
- [x] `deltaStores` always populated (RawRecorder gates writes by flag).
- [x] `createContainer` reads flags from `config.rawEvents` and threads them.
- [x] `RawRecorder` now takes `writeDeltas` (constructor param renamed).

### 4. Boot-time warning
- [x] In `bin/server.ts`, after `config` loaded, emit `logger.warn` when `readDeltas && !writeDeltas`.

### 5. `.env` / `.env.example`
- [x] Rename `RAW_EVENTS_PERSIST_DELTAS` → `RAW_EVENTS_WRITE_DELTAS` in `.env.example` (commented).
- [x] Add `RAW_EVENTS_READ_DELTAS` (commented) with description.
- [x] Update local `.env` accordingly.

### 6. Test fixtures
- [x] `settings.test.ts` configMock: `rawEvents.persistDeltas` → `rawEvents.{writeDeltas, readDeltas}`.
- [x] `raw-delta-persistence.integration.test.ts`:
  - Quadrant 1: `writeDeltas=false, readDeltas=false` — nothing persisted, getBySession returns events-only.
  - Quadrant 2: `writeDeltas=true, readDeltas=false` — deltas persisted but **not** surfaced by getBySession (UNION skipped).
  - Quadrant 3: `writeDeltas=true, readDeltas=true` — deltas persisted + surfaced.
  - Quadrant 4: `writeDeltas=false, readDeltas=true` — no deltas, UNION harmless.

### 7. Regression
- [x] `pnpm -r test` all green.
- [x] `pnpm tsc --noEmit` clean.

### 8. Smoke (manual, user-run)
- [x] Boot with both flags unset — default clean mode, DB unchanged.
- [x] Boot with `RAW_EVENTS_WRITE_DELTAS=true` only — send a message; verify `raw_deltas` has rows; verify RawEventPanel does NOT show them.
- [x] Boot with both `true` — verify RawEventPanel shows deltas.
- [x] Boot with `RAW_EVENTS_READ_DELTAS=true` only — verify warning logged.
