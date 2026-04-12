## Why

The client needs a stable, scoped `sessionId` available to React components for upcoming UI flows (git history, session identity, rewind). The server already emits it in the `session:init` socket event (`sessionInitPayloadSchema.sessionId`) but the client currently drops it.

Naively adding `sessionId` to one of the existing rich contexts (`ChannelMessagesContext`, `ChannelControlContext`, `ChannelConfigContext`, `ChannelComposeContext`) would mean every consumer of that context re-renders the first time `sessionId` flips from `null` to its value — even consumers that only care about unrelated fields.

We want `sessionId` reactive, scoped per channel, and isolated from other channel state.

## What Changes

- **Add `ChannelIdContext`**: a tiny context whose value is the `channelId: string`. Exposes `useChannelId()`. Stable for the lifetime of a channel provider instance.
- **Add `SessionIdContext`**: a tiny context whose value is `sessionId: string | null`. Exposes `useSessionId()`. Starts `null`; flips once when `session:init` arrives for this channel.
- **Add `SessionIdProvider`**: subscribes to the `session:init` socket event scoped to its `channelId` and updates internal state on each event.
- **Wrap `ChannelProvider`'s existing sub-provider stack** with `<ChannelIdContext.Provider>` (outer) and `<SessionIdProvider>` (inner) so every descendant can call the new hooks.
- **Non-breaking**: the four existing rich contexts (`ChannelMessagesContext`, etc.) are untouched. They still expose `channelId` on their context values as they do today. Cleaning up that duplication is a later, separate change.

## Capabilities

### New Capabilities
- `client-channel-id-context`: Stable, single-value React context publishing the current `channelId` to descendants.
- `client-session-id-context`: Per-channel React context publishing the server-assigned `sessionId` once it arrives over the socket, without forcing re-renders of `channelId`-only consumers.

### Modified Capabilities
<!-- None. This change is additive. -->

## Impact

- **Client code**: `packages/client/src/contexts/channel/ChannelContext.tsx` (wrap in two new providers), plus two new files under `packages/client/src/contexts/channel/` for the new contexts.
- **Client tests**: new test files for `ChannelIdContext` and `SessionIdContext`; no changes to existing tests.
- **Server**: no changes — `session:init` already carries `sessionId`.
- **Protocol / schemas**: unchanged.
- **Breaking**: none. This change is purely additive.
