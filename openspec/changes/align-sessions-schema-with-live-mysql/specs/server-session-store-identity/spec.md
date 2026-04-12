## MODIFIED Requirements

### Requirement: Session store row identity is the durable sessionId

The `sessions` database table SHALL use `id` as the name of its primary-key column, holding the CLI-provider's sessionId (a durable conversation identifier that survives resume across multiple server-side `Channel` lifetimes). The Drizzle schema property for this column SHALL be named `id` (`text('id')` for SQLite, `varchar('id', { length: 64 })` for MySQL).

The `sessions` table SHALL also have a non-PK column `channel_id` (Drizzle: `channelId`, `varchar('channel_id', { length: 36 })` for MySQL, `text('channel_id')` for SQLite, nullable). This column holds the current live `Channel.channelId`. It MUST be covered by an index (name: `idx_sessions_channel_id`). The value MAY be updated when a session is resumed under a new channel.

The `SessionRecord` Zod type SHALL declare `id: z.string()` (required) and `channelId: z.string().nullable().optional()`. The type MUST NOT declare a separate `sessionId` field.

The `SessionStore` interface SHALL expose:
- `persist(record)` — insert or no-op if exists; keyed by `id`.
- `getById(id)` — lookup by PK sessionId.
- `getByChannelId(channelId)` — lookup by the indexed `channel_id` column; returns the most recent row with that channelId (at most one is expected).
- `list(opts?)` — unchanged.
- `renameByChannelId(channelId, title)`, `updateStatusByChannelId(channelId, status)`, `deleteByChannelId(channelId)` — mutation operations keyed by channelId for server handlers that hold a live-channel reference.

#### Scenario: Persisting a record writes both id and channel_id

- **WHEN** server code calls `sessionStore.persist({ id: 'cli-session-abc', channelId: 'ch-uuid-1', provider: 'claude', ... })`
- **THEN** the row is written with `id = 'cli-session-abc'` as PK and `channel_id = 'ch-uuid-1'`
- **AND** `sessionStore.getById('cli-session-abc')` returns the record
- **AND** `sessionStore.getByChannelId('ch-uuid-1')` returns the same record

#### Scenario: Resume updates channelId without changing identity

- **GIVEN** a persisted session with `id = 'sess-1'` and `channelId = 'ch-old'`
- **WHEN** the session is resumed under a new Channel `'ch-new'` (implementation detail: the server may update the row's `channel_id` to `'ch-new'`)
- **THEN** `sessionStore.getById('sess-1')` still returns the row with PK `'sess-1'`
- **AND** `sessionStore.getByChannelId('ch-new')` returns the same row

#### Scenario: Schema column consistency

- **WHEN** the schema-consistency test runs
- **THEN** both SQLite and MySQL schemas report the same set of session column names
- **AND** that set includes `'id'` and `'channelId'` (and does NOT include `'sessionId'` as a separate column)

#### Scenario: SessionRecord TypeScript shape

- **WHEN** a server module constructs a `SessionRecord` literal
- **THEN** the TypeScript compiler requires an `id: string` property
- **AND** accepts an optional `channelId: string | null` property
- **AND** rejects a `sessionId` property
