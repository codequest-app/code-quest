## Context

The channel session lifecycle has two key events: `session:states` (periodic broadcast of all session states) and `session:closed` (fired once when a session terminates). `onSessionClosed` in `ChannelControlContext` sets `status: 'disconnected'` and inserts an end message. However, `onSessionStates` in `ChannelMessagesContext` — which fires periodically from the server — only guards `'processing'` and `'cancelling'` from being overridden, so a delayed broadcast can flip `'disconnected'` back to `'busy'`. Additionally, the "CLI session has ended." message is inserted as `type: 'text'`, rendering as a plain system message rather than a visually prominent error banner.

The partial fix (type: 'error' and status: 'disconnected' in onSessionClosed) is already in the working tree.

## Goals / Non-Goals

**Goals:**
- Prevent `onSessionStates` from overriding `'disconnected'` status after session ends
- Render the "CLI session has ended." message using the danger `AlertBanner` style (type: 'error')
- Keep existing `'processing'` and `'cancelling'` guard behavior unchanged

**Non-Goals:**
- Changing how session:closed is emitted by the server
- Altering any other status transition paths
- UI changes beyond the message type

## Decisions

### Guard `'disconnected'` in `onSessionStates`

**Decision**: Extend the existing early-return guard in `onSessionStates` from:
```ts
if (prev.status === 'processing' || prev.status === 'cancelling') return prev;
```
to also include `'disconnected'`:
```ts
if (prev.status === 'processing' || prev.status === 'cancelling' || prev.status === 'disconnected') return prev;
```

**Rationale**: `'disconnected'` is a terminal state — once a session ends, no server broadcast should override it. This is consistent with how `'processing'` and `'cancelling'` are treated as local-authoritative states that should not be clobbered by cross-window sync.

**Alternative considered**: Filter `session:states` events after session:closed fires (unsubscribe). Rejected — more complex, requires coordination across contexts.

### Use `type: 'error'` for session-end message

**Decision**: `onSessionClosed` inserts the end message with `type: 'error'` (already done in working tree).

**Rationale**: Session termination is an unexpected/important event that warrants visual distinction. The `AlertBanner` danger style (red border) draws user attention appropriately. Using `type: 'text'` blends into normal output.

## Risks / Trade-offs

- **[Risk] `'disconnected'` guard means a session could never recover if the frontend gets out of sync.** → Mitigation: `'disconnected'` is already truly terminal (the channel cannot reuse a closed session); the only recovery is navigating to a new session, which resets state.
- **[Trade-off] `type: 'error'` for the end message may feel alarming for graceful exits.** → Accepted: the visual prominence is desirable; the message text clarifies it's an end-of-session notice.
