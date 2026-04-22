## ADDED Requirements

### Requirement: Raw event persistence uses `raw_events` table (renamed from `raw_entries`)
Server-side persistence of non-delta CLI protocol events SHALL use a table named `raw_events`. The prior name `raw_entries` is removed from the schema.

#### Scenario: Migration renames the existing table
- **WHEN** migration 0017 runs against a DB that has `raw_entries`
- **THEN** the table SHALL be renamed to `raw_events` with all non-delta data preserved
- **AND** `raw_entries` SHALL no longer exist in the schema

#### Scenario: Migration purges existing delta rows
- **WHEN** migration 0017 runs
- **THEN** rows where `raw` matches both `stream_event` and `content_block_delta` SHALL be deleted from `raw_events`

### Requirement: `raw_deltas` table stores streaming deltas separately
A new table `raw_deltas` SHALL be created by migration 0017, with the same columns as `raw_events` plus a non-null `parent_id` text column. Indexes: `(session_id, seq)` and `(parent_id)`.

#### Scenario: Table is created by migration
- **WHEN** migration 0017 runs
- **THEN** `raw_deltas` exists with columns `id`, `parent_id`, `session_id`, `dir`, `raw`, `seq`, `created_at` and the two required indexes

### Requirement: Delta events are classified and routed
`RawRecorder.recordRaw` SHALL classify each raw line via `isDelta(raw)`. A line qualifies as delta when its parsed JSON is `{ type: "stream_event", event: { type: "content_block_delta", ... } }`.

Delta lines SHALL route to `RawDeltaStore`; all other lines SHALL route to `RawEventStore`.

#### Scenario: Delta stream events go to RawDeltaStore
- **WHEN** CLI emits `{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"..."}}}` on stdout
- **AND** `RAW_EVENTS_PERSIST_DELTAS` is `true`
- **THEN** the line SHALL be appended to `raw_deltas` with no entry in `raw_events`

#### Scenario: Non-delta events go to RawEventStore
- **WHEN** CLI emits `{"type":"assistant",...}`, `{"type":"user",...}`, `{"type":"system",...}`, or any `stream_event` whose `event.type` is `content_block_start` / `content_block_stop` / `message_start` / `message_stop`
- **THEN** the line SHALL be appended to `raw_events` with no entry in `raw_deltas`

#### Scenario: Malformed lines fall back to RawEventStore
- **WHEN** CLI emits a line that cannot be parsed as JSON
- **THEN** the line SHALL be persisted to `raw_events`

### Requirement: `RAW_EVENTS_PERSIST_DELTAS` controls delta persistence
The server SHALL read boolean env `RAW_EVENTS_PERSIST_DELTAS` (default `false`). When `false`, delta lines are classified and dropped (not persisted anywhere); the live socket forward path is unaffected.

#### Scenario: Deltas dropped when disabled
- **WHEN** `RAW_EVENTS_PERSIST_DELTAS=false` (or unset)
- **AND** CLI emits 100 `content_block_delta` lines
- **THEN** neither `raw_events` nor `raw_deltas` SHALL receive new rows from those lines
- **AND** connected sockets SHALL still receive the live events

#### Scenario: Deltas persisted when enabled
- **WHEN** `RAW_EVENTS_PERSIST_DELTAS=true`
- **AND** CLI emits 100 `content_block_delta` lines
- **THEN** `raw_deltas` SHALL have 100 new rows

### Requirement: Delta rows reference their turn root via parent_id
When a delta is persisted, its `parent_id` SHALL equal the `raw_events.id` of the most recent user stdin event on the same channel. If no user stdin event has been recorded for the channel yet, `parent_id` SHALL be `''`.

#### Scenario: Turn correlation via parent_id
- **WHEN** user sends a message → raw_events row `R` is inserted with id `abc`
- **AND** subsequent CLI stdout for that turn includes 50 `content_block_delta` lines
- **THEN** all 50 raw_deltas rows SHALL have `parent_id = "abc"`

#### Scenario: Next turn gets a fresh parent_id
- **WHEN** the user sends a second message after turn 1 completes
- **AND** a new user-stdin row `R2` is inserted with id `def`
- **AND** further deltas arrive
- **THEN** those deltas SHALL carry `parent_id = "def"` (not `"abc"`)

### Requirement: `RawEventStore.append` returns the inserted id
`RawEventStore.append(entry)` SHALL return a `Promise<string>` resolving to the row's primary-key id. This enables the recorder to stamp subsequent `raw_deltas.parent_id` with the user-stdin row's id.

#### Scenario: append returns the generated id
- **WHEN** the recorder calls `await rawEventStore.append({...})`
- **THEN** the returned string SHALL be a non-empty `uuidv7` that matches the value stored in the row's `id` column

### Requirement: Chat replay ignores raw_deltas
`SessionHistory.getBySession(sessionId)` SHALL read only from `raw_events`. Chat replay MUST NOT depend on delta rows.

#### Scenario: Replay only reads terminal events
- **WHEN** `SessionHistory.resume(sessionId)` runs
- **AND** `raw_deltas` contains 500 rows for that session
- **AND** `raw_events` contains 8 rows (1 user, 3 assistant snapshots, 1 result, 3 other)
- **THEN** replay SHALL process exactly 8 rows

### Requirement: RawEventPanel merges both tables when persistence is enabled
The server's `session:raw_events` RPC handler SHALL return `raw_deltas` rows merged with `raw_events` (sorted by `seq`) when `RAW_EVENTS_PERSIST_DELTAS` is `true`. When disabled, the handler SHALL return only `raw_events`.

#### Scenario: Panel sees deltas when enabled
- **WHEN** `RAW_EVENTS_PERSIST_DELTAS=true`
- **AND** the client issues `session:raw_events` RPC
- **THEN** the response SHALL include both terminal and delta events in seq order

#### Scenario: Panel sees no deltas when disabled
- **WHEN** `RAW_EVENTS_PERSIST_DELTAS=false`
- **AND** the client issues `session:raw_events` RPC
- **THEN** the response SHALL include only rows from `raw_events`
