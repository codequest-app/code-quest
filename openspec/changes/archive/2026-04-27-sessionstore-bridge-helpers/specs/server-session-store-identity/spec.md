## ADDED Requirements

### Requirement: SessionStore exposes channelId-keyed mutation helpers

The `SessionStore` interface SHALL provide `deleteByChannelId`, `renameByChannelId`, and `updateStatusByChannelId` — each taking a `channelId: string` (plus any operation-specific arguments) and returning `Promise<boolean>`. A return of `true` means a row was found and mutated; `false` means no row matched the given channelId.

Implementations SHALL NOT throw when no row matches — they return `false` instead, matching the existing `delete` / `rename` / `updateStatus` contract.

#### Scenario: deleteByChannelId removes a row

- **GIVEN** a `sessions` row exists with `channelId = 'ch-1'`
- **WHEN** server code calls `sessionStore.deleteByChannelId('ch-1')`
- **THEN** the call returns `true`
- **AND** the row is removed from the `sessions` table

#### Scenario: renameByChannelId returns false for unknown channelId

- **GIVEN** no `sessions` row has `channelId = 'ch-missing'`
- **WHEN** server code calls `sessionStore.renameByChannelId('ch-missing', 'new title')`
- **THEN** the call returns `false`
- **AND** no error is thrown

#### Scenario: updateStatusByChannelId updates the status column

- **GIVEN** a `sessions` row exists with `channelId = 'ch-2'` and `status = 'active'`
- **WHEN** server code calls `sessionStore.updateStatusByChannelId('ch-2', 'dead')`
- **THEN** the call returns `true`
- **AND** re-reading via `getByChannelId('ch-2')` returns a record with `status = 'dead'`

#### Scenario: Handlers no longer perform the two-step bridge

- **WHEN** the server delete / rename / dead-marking / title-rename handler fires
- **THEN** it invokes a single `*ByChannelId` call on `SessionStore`
- **AND** does NOT call `getByChannelId` followed by `<op>(record.id, ...)` at the handler layer
