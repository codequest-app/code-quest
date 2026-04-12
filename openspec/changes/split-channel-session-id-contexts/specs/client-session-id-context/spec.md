## ADDED Requirements

### Requirement: `SessionIdContext` publishes the server-assigned `sessionId`

The client SHALL provide a React context named `SessionIdContext` whose value is `sessionId: string | null`. The value MUST start as `null` for a freshly mounted provider and MUST be updated to the `sessionId` field from the most recent `session:init` socket event scoped to the enclosing `channelId`.

The client SHALL expose a `useSessionId(): string | null` hook that reads this context. The hook MUST return `null` before the first `session:init` arrives; it MUST NOT throw.

A `SessionIdProvider` component SHALL take the current `channelId` (either via prop or via `useChannelId()`) and subscribe to `session:init` events for that channel only, updating its internal state on each event. The subscription MUST be cleaned up on unmount and re-established when `channelId` changes.

#### Scenario: Initial value before any socket event

- **WHEN** `SessionIdProvider` mounts and no `session:init` event has yet arrived for its `channelId`
- **THEN** `useSessionId()` returns `null` for descendants

#### Scenario: sessionId becomes available after session:init

- **GIVEN** a mounted `SessionIdProvider` for `channelId = "ch-1"`
- **WHEN** a `session:init` socket event is dispatched with payload `{ channelId: "ch-1", sessionId: "sess-abc", ... }`
- **THEN** `useSessionId()` returns `"sess-abc"` on the next render for descendants
- **AND** components that consume only `useChannelId()` do NOT re-render as a consequence

#### Scenario: session:init for a different channel is ignored

- **GIVEN** a mounted `SessionIdProvider` for `channelId = "ch-1"` with current value `null`
- **WHEN** a `session:init` event fires with payload `{ channelId: "ch-2", sessionId: "sess-xyz", ... }`
- **THEN** `useSessionId()` still returns `null` for descendants of the `ch-1` provider

#### Scenario: Subsequent session:init overwrites with latest sessionId

- **GIVEN** a mounted `SessionIdProvider` whose current value is `"sess-abc"`
- **WHEN** a second `session:init` event for the same `channelId` arrives with `sessionId: "sess-def"`
- **THEN** `useSessionId()` returns `"sess-def"` on the next render

#### Scenario: Listener cleanup on unmount

- **GIVEN** a mounted `SessionIdProvider`
- **WHEN** the provider unmounts
- **THEN** it removes its `session:init` listener from the socket
- **AND** subsequent `session:init` events for that channel do not cause updates on the unmounted tree
