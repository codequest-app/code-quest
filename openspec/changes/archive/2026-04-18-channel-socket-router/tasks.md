## 1. Router core

- [x] 1.1 Add `ChannelSocketRouter` class with `register` / `on` / `dispose`
  and per-event listener dedup
  (`apps/web/src/contexts/channel/socket-router.ts`)
- [x] 1.2 Add `router.on(event, fn, { guard })` with `guard: true` default

## 2. React wiring

- [x] 2.1 Add `ChannelSocketRouterContext` + `ChannelSocketRouterProvider`
  (`apps/web/src/contexts/channel/ChannelSocketRouterContext.tsx`)
- [x] 2.2 Insert provider in `ChannelContext.tsx` between
  `ChannelIdProvider` and the channel context tree so all four channel
  contexts share one router

## 3. Migrate contexts

- [x] 3.1 `ChannelConfigContext`: replace `wireHandlers` + special
  `socket.on('session:states')` with `router.register` + `router.on(...,
  { guard: false })`
- [x] 3.2 `ChannelControlContext`: replace `wireHandlers` + direct
  `socket.on` for `control:permission` / `control:hook_callback` /
  `session:closed` with `router.register` + `router.on`; remove inner
  `matchesChannel` guards
- [x] 3.3 `ChannelMessagesContext`: replace `wireHandlers` + direct
  `socket.on('session:states')` + `socket.on('message:result')` with
  `router.register` + `router.on(..., { guard: false })` + `router.on`;
  remove inner channelId guard from `onMessageResult`
- [x] 3.4 `ChannelComposeContext`: replace `wireHandlers` with
  `router.register`; remove now-unused `useSocket` import

## 4. Cleanup

- [x] 4.1 Delete `wireHandlers` from `handlers/guard.ts`; keep
  `matchesChannel` (still used by `handlers/message.ts`) and the
  `Payload<E>` type alias
- [x] 4.2 Verify no remaining channel-scoped `socket.on` / `socket.off`
  outside `streaming.ts` and `session.ts onAny`

## 5. Verification

- [x] 5.1 Full client test suite passes (1147/1147) with no test changes
- [x] 5.2 Biome + tsc clean
- [ ] 5.3 Manual smoke: start two channel tabs, verify session:states
  cross-window sync still works (one underlying socket listener)

## 6. Deferred (explicit non-goals — do not do in this change)

- [ ] 6.1 Zod safeParse at router boundary (drop `as never` casts) —
  separate change
- [ ] 6.2 Lint rule forbidding `socket.on` outside the router —
  after router bakes for a cycle
- [ ] 6.3 Session-level router for `SessionContext` events —
  separate scope, different provider tree
- [ ] 6.4 Fold `streaming.ts` / `session.ts onAny` into router —
  requires ref-shape / wildcard API that doubles router surface
