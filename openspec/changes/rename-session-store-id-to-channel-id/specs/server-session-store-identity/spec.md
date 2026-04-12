## ADDED Requirements

### Requirement: Session store row identity is `channelId`

The `sessions` database table SHALL use `channel_id` as the name of its primary-key column that holds the server `Channel.channelId`. The Drizzle schema property for this column SHALL be named `channelId`. The `SessionRecord` type (Zod `sessionRecordSchema`) SHALL declare this field as `channelId: string` and MUST NOT declare a field named `id`.

The `SessionStore` interface methods (`persist`, `getById`, `rename`, `updateStatus`, `delete`) SHALL accept the channel identifier as a parameter of type `string` conceptually named `channelId`. Method names themselves are unchanged.

#### Scenario: Persisting a record writes `channel_id`

- **WHEN** server code calls `sessionStore.persist({ channelId: 'ch-1', sessionId: 's-1', provider: 'claude', ... })`
- **THEN** the row is written with `channel_id = 'ch-1'` in SQL
- **AND** `sessionStore.getById('ch-1')` returns a record whose `channelId` equals `'ch-1'`

#### Scenario: SessionRecord type rejects `id`

- **WHEN** a server module constructs a `SessionRecord` literal
- **THEN** the TypeScript compiler rejects an `id` property on that literal
- **AND** accepts a `channelId: string` property

#### Scenario: Schema column consistency

- **WHEN** the schema-consistency test runs
- **THEN** both SQLite and MySQL schemas report the same set of session column names
- **AND** that set includes `'channelId'` and does NOT include `'id'` for the `sessions` table

### Requirement: Session wire summary identity is `channelId`

The shared `sessionSummarySchema` exposed by `packages/shared` SHALL declare the row-identifier field as `channelId: z.string()` (matching `SessionRecord.channelId`) and MUST NOT declare a field named `id`. The `SessionSummary` TypeScript type follows.

#### Scenario: REST `/api/sessions` response payload

- **WHEN** the server returns a list via `GET /api/sessions`
- **THEN** each session summary in the response carries a `channelId` field equal to the underlying row's `channelId`
- **AND** no session summary carries an `id` field

#### Scenario: Client reads the identifier

- **WHEN** client code receives a `SessionSummary`
- **THEN** it reads the channel identifier as `summary.channelId`
- **AND** `summary.id` is `undefined` at the type level (i.e. the TypeScript type does not declare `id`)
