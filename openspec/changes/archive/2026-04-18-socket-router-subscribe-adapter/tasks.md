## 1. Extract private subscribe() helper (guard-wrap centralization)

- [x] 1.1 Add `private subscribe(event, listener, guarded = true)` method
  to `ChannelSocketRouter`. Owns guard-wrap + `addListener` + returning
  `removeListener` cleanup.
- [x] 1.2 Refactor `on<E>(event, listener)` to call
  `this.subscribe(event as string, (p) => listener(p as Payload<E>))`.
- [x] 1.3 Refactor `register()` loop to call
  `this.subscribe(event, handleEvent, !skipGuard?.has(event))` for
  each event.
- [x] 1.4 Remove now-dead inline guard-wrap pattern from `on()` and
  `register()` bodies.
- [x] 1.5 Run `pnpm --filter client test --run` — 1147/1147 pass, no
  test changes.

## 2. Extract SubscriptionAdapter interface + createSocketAdapter factory

- [x] 2.1 In `socket-router.ts`, export
  `interface SubscriptionAdapter { on, off }` with signatures
  `(event: string, fn: SocketListener) => void`.
- [x] 2.2 In `socket-router.ts`, export factory
  `createSocketAdapter(socket: TypedSocket): SubscriptionAdapter`
  containing the two `as never` casts (one for on, one for off).
- [x] 2.3 Change `ChannelSocketRouter` constructor signature from
  `(socket: TypedSocket, channelId: string)` to
  `(adapter: SubscriptionAdapter, channelId: string)`.
- [x] 2.4 Replace every `this.socket.on(event as never, fn as never)`
  with `this.adapter.on(event, fn)` and same for `.off`.
- [x] 2.5 Remove unused `TypedSocket` import from the router class body
  (retained by `createSocketAdapter` signature only).
- [x] 2.6 Update `ChannelSocketRouterProvider` to call
  `createSocketAdapter(socket)` inside `useMemo`.
- [x] 2.7 Run tests — 1147/1147 pass.

## 3. Add unit tests for ChannelSocketRouter

- [x] 3.1 Create
  `apps/web/src/contexts/channel/__tests__/socket-router.test.ts`.
- [x] 3.2 Implement a `fakeAdapter()` helper (~15 lines) exposing
  `on`, `off`, `emit(event, payload)`, `listenerCount(event)`.
- [x] 3.3 Test: **dedup** — 3 `router.on('X', fn)` registrations
  produce exactly 1 `adapter.on` call (`listenerCount === 1`).
- [x] 3.4 Test: **fan-out** — emitting to an event fires all
  registered listeners.
- [x] 3.5 Test: **guard match** — payload with matching channelId is
  dispatched.
- [x] 3.6 Test: **guard reject** — payload with non-matching channelId
  is not dispatched.
- [x] 3.7 Test: **guard broadcast** — payload with empty-string
  channelId is dispatched (broadcast-to-all).
- [x] 3.8 Test: **skipGuard bypass** —
  `register({ disconnect: fn }, ..., { skipGuard: new Set(['disconnect']) })`
  dispatches `fn` regardless of payload.
- [x] 3.9 Test: **last unregister removes adapter.on** — after
  removing the sole remaining listener for event `X`,
  `listenerCount('X') === 0`.
- [x] 3.10 Test: **dispose detaches all** — after `router.dispose()`,
  `listenerCount` returns 0 for every previously-registered event.
- [x] 3.11 Run tests — new test file passes, plus existing 1147 still
  pass (total 1155 / 1155 or similar).

## 4. Verification

- [x] 4.1 Biome + tsc clean
- [x] 4.2 `grep -n 'as never' socket-router.ts` returns no matches in
  the router class body (only in `createSocketAdapter`)
- [x] 4.3 `git diff --stat` review — 2 files changed (router + provider),
  1 file added (unit test)

## 5. Deliberately out of scope

- [ ] 5.1 Middleware / `Array.reduce` pipeline architecture —
  evaluated and rejected (design.md for rationale)
- [ ] 5.2 Guard strategy injection — would split channel identity
  concept; no current need
- [ ] 5.3 Moving `disconnect` out of `register` — would reintroduce
  direct `socket.on` in channel context, breaking the consolidation
