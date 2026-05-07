## Why

`session:states` broadcasts are subscribed by multiple places. One of
those — `ChannelConfigContext` — derives `modelSetting` / `permissionMode`
/ `effort` from the matching session entry. But `SessionContext` already
maintains the full `sessions` list from the same broadcast. The config
context's independent subscription is redundant.

## What Changes

- `ChannelConfigContext` stops subscribing to `session:states` through
  the channel socket router. Instead, it reads `sessions` from
  `useSession()` and applies the same derivation in a `useEffect` keyed
  on `[channelId, sessions]`.
- The dead-code `onSessionStates` helper in `handlers/settings.ts` is
  removed.

## Not In This Change (explicit exclusion)

`ChannelMessagesContext` *also* derives state from `session:states` (its
own `status` field: busy/disconnected/idle). Migrating it to the same
derivation pattern is **not safe in a refactor-only change** because
`session:states` is semantically a delta (state transitions emitted by
the server), but `sessions` is a snapshot updated by multiple events
including `session:created` (initial `state: 'launching'`). The derivation
observes intermediate states that the old subscription never saw,
flipping `channelState.status` at times when existing tests assert it
should not have flipped. Preserving those tests unchanged requires a
larger design (separating "session snapshot" from "session state delta"
signals in `SessionContext`) that belongs in a follow-up change.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `channel-socket-router`: one less caller of
  `router.on('session:states', ..., { guard: false })` after migration —
  `ChannelConfigContext`. `ChannelMessagesContext` still uses it.

## Impact

- `apps/web/src/contexts/channel/ChannelConfigContext.tsx` —
  replace `router.on('session:states', ...)` useEffect with a derivation
  useEffect reading `useSession().sessions`.
- `apps/web/src/contexts/channel/handlers/settings.ts` —
  `onSessionStates` export removed (no remaining callers).
- No test changes, no expect changes. 1147 tests green.
