## ADDED Requirements

### Requirement: Channel exposes its identifier as `channelId`

The server `Channel` class SHALL expose its unique identifier as a readonly property named `channelId` (string). All server-side consumers (socket handlers, channel manager, channel emitter, and test helpers) SHALL read the identifier via `channel.channelId` and MUST NOT reference a property named `id` on a `Channel` instance.

#### Scenario: Reading the identifier from a Channel

- **WHEN** a server module holds a `Channel` instance named `channel`
- **THEN** `channel.channelId` returns the string identifier assigned at construction
- **AND** `channel.id` is not defined on the class

#### Scenario: Emitting events keyed by the identifier

- **WHEN** a handler emits a socket event scoped to a channel (e.g. `emitter.emit(channel.channelId, ...)` or broadcasts `channelId` in a payload)
- **THEN** the handler reads the identifier via `channel.channelId`
- **AND** the emitted payload's `channelId` field equals `channel.channelId`

#### Scenario: Test helpers constructing a fake Channel

- **WHEN** a unit test fabricates a `Channel`-shaped object (e.g. `fakeChannel` in `channel-emitter.test.ts`)
- **THEN** the fabricated object sets its identifier on the `channelId` property, not `id`
