## Why

Three small follow-ups surfaced after the `ChannelSocketRouter` map
merge (commit `9136725a`):

1. **Duplicated guard-wrap logic** — both `router.on()` and
   `router.register()` contain the same
   `if (!matchesChannel(...)) return; listener(payload)` pattern.
   Changing guard behavior requires touching two places.
2. **Socket.io type gymnastics leak into business logic** — the router
   class contains 5 `as never` casts because socket.io's typed event
   surface requires literal string keys, not `string`. This noise is
   scattered through the class body.
3. **No unit tests for the router** — the current 1147 tests exercise
   it only indirectly through channel-context integration tests. Direct
   assertions (dedup, guard, dispose semantics) are not possible without
   a testable seam.

All three have a natural joint solution: extract a private `subscribe`
helper (fixes #1), extract a `SubscriptionAdapter` interface with a
`createSocketAdapter` factory (fixes #2), then add unit tests using a
fake adapter (fixes #3).

## What Changes

1. Add private `subscribe(event, listener, guarded?)` method to
   `ChannelSocketRouter`. It owns: guard-wrap + `addListener` +
   returning a cleanup that calls `removeListener`. Both `on()` and
   `register()` delegate to it.
2. Introduce `SubscriptionAdapter` interface and `createSocketAdapter`
   factory in `socket-router.ts`. Router constructor accepts the
   adapter instead of a raw `TypedSocket`. All 5 `as never` casts in
   the router class body move into the adapter factory's 3-line
   implementation.
3. Update `ChannelSocketRouterProvider` to wrap the socket with
   `createSocketAdapter(socket)` at construction time.
4. Add `socket-router.test.ts` with unit tests covering:
   dedup (N `on()` → 1 adapter.on), channelId guard (accept match and
   empty string, reject non-match), `register` skipGuard bypass,
   last-unregister removes adapter.on, `dispose` detaches all.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `channel-socket-router` — adds a testable seam (`SubscriptionAdapter`)
  and consolidates the per-subscription guard-wrap pipeline into
  `subscribe()`. No behavior change visible to consumers.

## Impact

- `apps/web/src/contexts/channel/socket-router.ts` —
  + `SubscriptionAdapter` interface, `createSocketAdapter()` factory,
  private `subscribe()` method; `on()` and `register()` become thin
  adapter layers; constructor signature changes
  (`TypedSocket` → `SubscriptionAdapter`)
- `apps/web/src/contexts/channel/ChannelSocketRouterContext.tsx` —
  calls `createSocketAdapter(socket)` when constructing the router
- `apps/web/src/contexts/channel/__tests__/socket-router.test.ts` —
  new file, ~6 unit tests with an inline fake adapter
- No test changes in existing 1147 tests; all must continue to pass.

## Deliberately out of scope

- **Middleware / `Array.reduce` pipeline architecture** — evaluated
  and rejected. Our listener flow has 3 sequential stages max with
  heterogeneous signatures (guard=halt, beforeUpdate=observe,
  handler=setState, effect=side-effect). A uniform middleware pipeline
  would require a Context+halted wrapper adding ~8 lines of boilerplate
  with no current payoff. Revisit when cross-cutting concerns reach
  5+ stages or require dynamic composition (e.g., dev vs prod middleware).
- **Guard strategy injection** (passing a custom guard fn at
  construction) — would split the "channel identity" concept across
  the router and its caller without concrete need.
- **Removing `disconnect` from `register`'s skipGuard** — moving it out
  would reintroduce direct `socket.on('disconnect', ...)` in channel
  context, violating the "all channel events go through router" rule.
