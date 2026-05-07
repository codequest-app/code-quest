## MODIFIED Requirements

### Requirement: SessionStore writes session rows via `upsert`

The `SessionStore` interface SHALL expose a method named `upsert(record: SessionRecord): Promise<void>`. When the record's primary-key `id` does not exist, `upsert` SHALL insert a new row. When the primary-key `id` already exists, `upsert` SHALL update that row: rebinding `channelId` to the new value, setting `status = 'active'`, and overwriting `parentId` when the incoming record carries a non-null `parentId`.

The interface method SHALL carry JSDoc describing these side-effects, so call-site tooling surfaces them to the reader.

The previous method name `persist` SHALL NOT appear in the interface, implementation, or callers.

#### Scenario: upsert inserts a new row

- **GIVEN** no `sessions` row has `id = 's-new'`
- **WHEN** server code calls `sessionStore.upsert({ id: 's-new', channelId: 'ch-1', status: 'active', ... })`
- **THEN** a row is inserted with `id = 's-new'`, `channelId = 'ch-1'`, `status = 'active'`

#### Scenario: upsert rebinds channelId on duplicate id

- **GIVEN** a `sessions` row with `id = 's-1'`, `channelId = 'ch-old'`, `status = 'dead'`
- **WHEN** server code calls `sessionStore.upsert({ id: 's-1', channelId: 'ch-new', status: 'dead', ... })`
- **THEN** the row is updated to `channelId = 'ch-new'`
- **AND** the row's `status` is reset to `'active'`
- **AND** no duplicate row is inserted

#### Scenario: upsert preserves parentId when absent from new record

- **GIVEN** a `sessions` row with `id = 's-1'`, `parentId = 's-parent'`
- **WHEN** server code calls `sessionStore.upsert({ id: 's-1', channelId: 'ch-new', ... })` without a `parentId` field
- **THEN** the existing `parentId = 's-parent'` is preserved
