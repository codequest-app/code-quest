## ADDED Requirements

### Requirement: ChannelMetaContext exposes channelId AND cwd
The channel context tree SHALL expose `{channelId, cwd}` via a `ChannelMetaContext` so that descendants of `ChannelProvider` can perform cwd-scoped operations without round-tripping through the server to resolve `channelId → cwd`.

#### Scenario: Provider exposes both fields
- **WHEN** a component calls `useChannelMeta()` inside a `ChannelProvider channelId="c1" cwd="/repo"`
- **THEN** it receives `{channelId: 'c1', cwd: '/repo'}`.

#### Scenario: Hook outside provider throws
- **WHEN** `useChannelMeta()` is called outside any `ChannelMetaProvider`
- **THEN** it throws a clear "must be used within ChannelProvider" error (matches `useChannelId` semantics).

#### Scenario: Existing useChannelId continues to work
- **WHEN** a component already on `useChannelId()` is mounted under the new `ChannelMetaProvider`
- **THEN** it returns the same `channelId` value (no migration required for channelId-only consumers).

### Requirement: Tab cwd is preserved on session sync
`TabContext` SHALL store `cwd` for every tab created from the `sessions` prop, so that resume and fork flows yield tabs whose `ChannelProvider` receives the correct cwd as a prop.

#### Scenario: Resume hydrates tab cwd
- **WHEN** `sessions` prop contains `[{channelId: 'c1', cwd: '/repo', state: 'active'}]` after server resume
- **THEN** the resulting `tabs['c1'].cwd === '/repo'`.

#### Scenario: Fork hydrates tab cwd
- **WHEN** `session:created` event arrives with `{channelId: 'newC', cwd: '/projA'}` after a fork
- **THEN** the resulting `tabs['newC'].cwd === '/projA'`.

#### Scenario: Add-tab signature already supports cwd
- **WHEN** `actions.addTab(channelId, cwd)` is called
- **THEN** the resulting `tabs[channelId]` includes `cwd` (the bug was the sync effect omitting the second argument; the action itself was correct).
