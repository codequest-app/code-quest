## 1. Derive config from SessionContext.sessions

- [x] 1.1 Import `useSession` in `ChannelConfigContext`
- [x] 1.2 Remove `router.on('session:states', ..., { guard: false })`
  useEffect
- [x] 1.3 Add derivation useEffect keyed on `[channelId, sessions]` that
  finds the matching session summary and applies `modelSetting` /
  `permissionMode` / `effort` to `configState`

## 2. Clean up dead code from Config migration

- [x] 2.1 Remove `onSessionStates` function and export from
  `handlers/settings.ts`
- [x] 2.2 Remove `onSessionStates` import from `ChannelConfigContext`
- [x] 2.3 Remove `Payload` import from `ChannelConfigContext` (no longer
  used)

## 3. Session event bus for Messages (Option F)

- [x] 3.1 Add `subscribeSessionStates(cb): () => void` to
  `SessionContextValue` and `SessionActionsValue`
- [x] 3.2 In `SessionProvider`, add `sessionStatesListenersRef =
  useRef(new Set<(p: SessionStatesPayload) => void>())` and a stable
  `subscribeSessionStates` action (add to set + return remover)
- [x] 3.3 Modify the existing `session:states` socket handler to
  synchronously fan out the payload to all listeners. Listeners receive
  the raw payload cast to the schema type (preserving pre-consolidation
  channel-router behavior which did not pre-validate); `setSessions`
  only runs when schema parse succeeds
- [x] 3.4 In `ChannelMessagesContext`, replace
  `router.on('session:states', onSessionStates, { guard: false })` with
  `subscribeSessionStates(onSessionStates)` — body of `onSessionStates`
  unchanged (joinedRef check preserved, runs in same sync tick as old
  path)

## 4. Bail ChannelConfig derivation on value-equivalent updates

- [x] 4.1 In `ChannelConfigContext` derivation useEffect, compute
  `nextModel` / `nextPermissionMode` / `nextEffort` from the matching
  session summary using `?? prev.xxx` fallbacks. If all three match
  `prev.xxx` by `===`, return `prev` (React bails, no re-render).
- [x] 4.2 Remove the now-redundant `Object.keys(update).length > 0`
  check — value-level compare covers the no-op case more precisely.

Rationale: with N channels open simultaneously, every `session:states`
broadcast causes `sessions` to change reference globally, firing this
effect in every channel's ConfigContext. Most channels don't have new
values (summary fields only change on actual setting updates), so the
tight `===` bail keeps React Compiler pruning downstream consumers.

## 5. Verification

- [x] 5.1 Full client test suite passes after step 1–2 (1147/1147)
- [x] 5.2 Full client test suite passes after step 3 (1147/1147)
- [x] 5.3 Full client test suite passes after step 4 (1147/1147)
- [x] 5.4 Biome + tsc clean
- [x] 5.5 `session:states` is subscribed at socket layer exactly once
  globally (only in `SessionContext:198`); no remaining
  `router.on('session:states', ...)` call sites

## 6. Explicit non-goals (out of scope for this change)

- [ ] 6.1 Apply the same event-bus pattern to other session-level
  events (`connect`, `session:created`, `session:dead`,
  `notification:auth_url`, `connect_error`) — they have single
  consumers (SessionContext only), no dedup opportunity
- [ ] 6.2 Lint rule forbidding direct `socket.on('session:states')`
  outside `SessionContext`
- [ ] 6.3 Audit `depsProxy` / refs-based manual memoization in channel
  contexts (pre-dates React Compiler) — separate change
