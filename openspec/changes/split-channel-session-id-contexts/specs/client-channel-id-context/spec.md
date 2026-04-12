## ADDED Requirements

### Requirement: `ChannelIdContext` publishes a stable `channelId`

The client SHALL provide a React context named `ChannelIdContext` whose value is the `channelId: string` of the enclosing channel scope. The context value MUST be the raw string (not an object), so its reference identity equals the `channelId` itself and never changes for the lifetime of a channel's provider instance.

The client SHALL expose a `useChannelId(): string` hook that reads this context.

#### Scenario: Reading channelId inside a provider

- **WHEN** a descendant component of `<ChannelIdContext.Provider value="ch-1">` calls `useChannelId()`
- **THEN** the hook returns `"ch-1"`

#### Scenario: Calling the hook outside any provider

- **WHEN** a component calls `useChannelId()` without being wrapped in `<ChannelIdContext.Provider>`
- **THEN** the hook throws an Error whose message identifies the missing provider (e.g. `"useChannelId must be used within a ChannelIdContext provider"`)
