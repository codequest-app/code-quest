## Why

When a CLI session ends, the channel status gets incorrectly overridden back to `'busy'` by periodic `session:states` broadcasts, and the "CLI session has ended." message renders as a plain system text rather than a visually distinct error — making session termination easy to miss.

## What Changes

- `onSessionStates` in `ChannelMessagesContext.tsx` will guard against overriding `'disconnected'` status, in addition to the existing `'processing'` and `'cancelling'` guards.
- `onSessionClosed` in `ChannelControlContext.tsx` will insert the "CLI session has ended." message as `type: 'error'` instead of `type: 'text'`, so it renders with the danger `AlertBanner` style.

## Capabilities

### New Capabilities

- `session-closed-ux`: Visual and state correctness for channel session-closed events — ensures disconnected status persists and the end message is shown as an error banner.

### Modified Capabilities

- `processing-state-sync`: The guard in `onSessionStates` that prevents overriding local statuses is extended to include `'disconnected'`.

## Impact

- `packages/client/src/contexts/channel/ChannelMessagesContext.tsx` — `onSessionStates` function
- `packages/client/src/contexts/channel/ChannelControlContext.tsx` — `onSessionClosed` function (partial fix already applied in working tree)
- `packages/client/src/contexts/channel/__tests__/` — test files for both contexts
