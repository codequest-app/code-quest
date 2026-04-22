## Context

`separate-events-and-deltas` introduced `RAW_EVENTS_PERSIST_DELTAS` to control both write (RawRecorder) and read (DrizzleRawEventStore UNION). This PR splits that into two independent knobs.

## Goals / Non-Goals

**Goals:**
- `RAW_EVENTS_WRITE_DELTAS` controls ONLY write behaviour.
- `RAW_EVENTS_READ_DELTAS` controls ONLY read behaviour (UNION ALL vs single-table).
- Four flag combinations all work correctly and reach the intended store wiring.
- Default both to `false` — existing "clean mode" unchanged.

**Non-Goals:**
- Runtime toggle (flags are read at boot; restart required to change).
- Migrating existing `raw_deltas` data when flags change.
- Back-compat alias for the old `RAW_EVENTS_PERSIST_DELTAS` name (same branch as introduction; no external deployers).

## Decisions

### Decision 1: Four-quadrant semantics

| write | read | raw_deltas state | getBySession behaviour |
|---|---|---|---|
| false | false | empty | single-table (events only) |
| true  | false | receives deltas | single-table — deltas invisible to live reads |
| true  | true  | receives deltas | UNION ALL — deltas visible everywhere |
| false | true  | empty | UNION ALL — query runs against empty table (harmless; warn at boot) |

The write=true/read=false case is the main motivator — quiet background persistence for offline analysis.

### Decision 2: Wire via `buildStores({writeDeltas, readDeltas})`

```ts
function buildStores(
  config?: StoreConfig,
  flags: { writeDeltas: boolean; readDeltas: boolean } = { writeDeltas: false, readDeltas: false },
) {
  if (config?.sqliteDatabase) {
    const db = config.sqliteDatabase;
    const deltaTableForRead = flags.readDeltas ? sqliteSchema.rawDeltas : undefined;
    eventStores.push(new DrizzleRawEventStore(db, sqliteSchema.rawEvents, deltaTableForRead));
    deltaStores.push(new DrizzleRawDeltaStore(db, sqliteSchema.rawDeltas));
    ...
  }
  ...
}
```

`deltaStores` is always wired (cheap handle, no side effects). `RawRecorder`'s `writeDeltas` flag decides whether to actually call `appendDelta`.

### Decision 3: Boot-time warning for unusable combinations

```
RAW_EVENTS_READ_DELTAS=true but RAW_EVENTS_WRITE_DELTAS=false — no deltas
will ever be persisted, so UNION reads an empty table. Did you mean to set
both?
```

Logged via `logger.warn` in `bin/server.ts` before spinning up the HTTP server. Non-fatal.

### Decision 4: Naming — `WRITE` and `READ` over `PERSIST` / `UNION`

Symmetric verb pair, minimum jargon. `PERSIST` implies both (already wrong); `UNION` is implementation-specific (today it's UNION ALL, tomorrow could be any merge strategy). `WRITE` / `READ` describe user intent.

## Risks / Trade-offs

- **[Risk]** Renaming `PERSIST_DELTAS` breaks any dev machine still on the feature branch. **Mitigation**: this branch is one developer's WIP; `.env` gets updated in the same commit.
- **[Risk]** Four-quadrant test matrix grows. **Mitigation**: not all four are equally important — write=true/read=false is the headline; others are sanity checks.
- **[Risk]** The warning in Decision 3 could annoy users who deliberately toggled `READ_DELTAS=true` anticipating future writes. **Mitigation**: warning is informational, not blocking.

## Migration Plan

- Rename `RAW_EVENTS_PERSIST_DELTAS` in `.env` / `.env.example` → `RAW_EVENTS_WRITE_DELTAS`.
- Add new `RAW_EVENTS_READ_DELTAS` line (commented-out default).
- No DB changes, no data migration.
