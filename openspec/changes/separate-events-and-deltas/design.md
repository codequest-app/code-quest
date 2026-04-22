## Context

`raw_entries` currently stores every stdin/stdout/stderr line from the CLI. ~82% of rows are `content_block_delta` stream events driving token-level streaming animations; these do not contribute to chat replay (CLI also emits fully-assembled `type: "assistant"` snapshots, and client dedup prefers those). The table name itself is also out of step with the codebase's domain vocabulary (every other concept is called "event").

Since we already need a migration to split deltas out, a one-shot rename + split is strictly cheaper than two separate migrations.

DB shape (one representative dev DB):

```
raw_entries total rows:                143,212
  content_block_delta rows:            117,477   (82%)
  terminal events:                      25,735   (18%)
```

End state after this PR:

```
raw_events:    ~26k rows  (renamed from raw_entries, deltas purged)
raw_deltas:    0 rows     (new; populated going forward only if RAW_EVENTS_PERSIST_DELTAS=true)
```

## Goals / Non-Goals

**Goals:**
- One migration atomically (a) renames `raw_entries` → `raw_events`, (b) drops delta rows, (c) creates `raw_deltas`.
- Code renames: `RawEntry`/`rawEntries`/`RAW_ENTRY_COLUMNS` → `RawEvent`/`rawEvents`/`RAW_EVENT_COLUMNS`.
- `RAW_EVENTS_PERSIST_DELTAS=false` by default — DB stays lean unless debug mode.
- Zero client / protocol change.
- Chat replay behaviour identical (it's already snapshot-driven).

**Non-Goals:**
- TTL / retention policy on `raw_deltas` (follow-up).
- Cross-DB delta storage (same DB, new table).
- Preserving existing delta rows — they're unused and purged by the migration.
- Touching `compaction_delta` filtering in summoner (CLI never emits it in practice).

## Decisions

### Decision 1: Rename + split in one migration, not two

Benefits:
- Single schema change moment for ops.
- Drizzle snapshot regenerated once — no intermediate state where `raw_entries` has been dropped but `raw_events` hasn't been created.
- Easier to reason about: after this PR, old name never reappears anywhere.

### Decision 2: Hand-written migration (not `db:generate` for the rename)

drizzle-kit's diff strategy emits `DROP TABLE` + `CREATE TABLE` for renames, which would lose data. Hand-write the migration so `ALTER TABLE RENAME` + `DELETE` + `CREATE TABLE` are deterministic. `db:generate` is then run **after** the rename is applied so its snapshot matches the new schema name.

```sql
-- sqlite 0017_separate_events_and_deltas.sql
ALTER TABLE raw_entries RENAME TO raw_events;

DELETE FROM raw_events
WHERE raw LIKE '%"type":"stream_event"%'
  AND raw LIKE '%"content_block_delta"%';

CREATE TABLE raw_deltas (
  id text PRIMARY KEY NOT NULL,
  parent_id text NOT NULL,
  session_id text NOT NULL,
  dir text NOT NULL,
  raw text NOT NULL,
  seq integer NOT NULL DEFAULT 0,
  created_at text NOT NULL
);
CREATE INDEX idx_raw_deltas_session_seq ON raw_deltas (session_id, seq);
CREATE INDEX idx_raw_deltas_parent      ON raw_deltas (parent_id);
```

MySQL equivalent uses `RENAME TABLE` + `DELETE` + `CREATE TABLE ... ENGINE=InnoDB`.

### Decision 3: `parent_id` → `raw_events.id`

```
raw_events                raw_deltas
┌──────────────┐          ┌──────────────┐
│ id (PK)      │◄────┐    │ id (PK)      │
│ session_id   │     └────┤ parent_id    │   → raw_events.id of user stdin
│ dir          │          │ session_id   │
│ raw          │          │ dir          │
│ seq          │          │ raw          │
│ created_at   │          │ seq          │
└──────────────┘          │ created_at   │
                          └──────────────┘
```

- Anchored to a real row (not a synthetic UUID): `JOIN raw_deltas d ON d.parent_id = e.id` gets the user's message text.
- Pre-turn deltas (CLI emits events before first user stdin) use `parent_id = ''` as the "unattributed" marker.

### Decision 4: `RawEventStore.append()` returns the inserted id

```ts
interface RawEventStore {
  append(entry: RawEvent): Promise<string>;  // was Promise<void>
  // ...
}
```

Required so `RawRecorder` knows which id to stamp as `parent_id` on subsequent deltas. `uuidv7()` is generated inside `append` and returned. `CompositeRawEventStore` generates the id once and reuses it across all inner stores — composite copies share the id.

No current caller consumes the return value; grep shows zero references.

### Decision 5: `currentTurnRootId` as closure-local in `RawRecorder.wire(channel)`

```ts
wire(channel: Channel): void {
  let seqCounter = 0;
  let currentTurnRootId: string | null = null;   // sibling of seqCounter
  // ...
}
```

Same rationale as `seqCounter` — per-channel state private to the recorder. No `Channel` field needed; no other consumer.

### Decision 6: Classification lives in `RawRecorder`, not the stores

```ts
function isDelta(raw: string): boolean {
  try {
    const d = JSON.parse(raw);
    return d?.type === 'stream_event' && d?.event?.type === 'content_block_delta';
  } catch {
    return false;
  }
}
```

Stores stay dumb (persist what they're given); routing policy lives next to `currentTurnRootId`.

### Decision 7: `RAW_EVENTS_PERSIST_DELTAS` default `false`

Single-dev repo baseline is "clean DB". Power users turn it on for debugging. Live socket forward is independent of this flag, so UI-level streaming animations still work either way.

### Decision 8: RawEventPanel reads UNION when flag is on

```ts
async function handleRawEvents(channelId, callback) {
  const events = await rawEventStore.getBySession(sessionId);
  if (config.rawEvents.persistDeltas) {
    const deltas = await rawDeltaStore.getBySession(sessionId);
    return callback({ events: mergeBySeq(events, deltas) });
  }
  callback({ events });
}
```

`seq` is globally incremented per channel (across both tables), so a single `ORDER BY seq` reconstructs original event order.

## Risks / Trade-offs

- **[Risk]** Migration deletes 117k rows of existing delta data. **Mitigation**: data is unused (no reader). If a user wants to preserve it, they can back up `raw_entries` before running the migration.
- **[Risk]** `append()` return-type change is a small interface churn. **Mitigation**: grep confirmed zero callers read the value; adding a value on top of `Promise<void>` is a widening change.
- **[Risk]** drizzle-kit might later regenerate the migration at drift. **Mitigation**: run `db:generate` after the rename and commit the new snapshot so drizzle's meta tracks post-rename state.
- **[Risk]** Pre-turn events accumulate `parent_id=''` rows. **Mitigation**: bounded and filterable; `WHERE parent_id != ''` excludes them when needed.
- **[Risk]** `seq` resets on server restart (pre-existing bug). **Mitigation**: unchanged by this PR; proper fix deferred to a future refactor.

## Migration Plan

1. Ship 0017 migration (hand-written) for both drivers.
2. Run `db:migrate` → rename + delta-row purge + new table creation in one atomic transaction per driver.
3. Run `db:generate` → drizzle writes a new snapshot that matches the code.
4. Code + env ship together. `RAW_EVENTS_PERSIST_DELTAS` default `false` means new deltas are dropped until someone opts in.
5. No rollback plan — the table rename is the migration. If something fails, restore from DB backup and revert code.
