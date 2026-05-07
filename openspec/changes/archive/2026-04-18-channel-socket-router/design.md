## Context

Before this change, each of the four channel contexts
(`ChannelMessagesContext`, `ChannelConfigContext`, `ChannelControlContext`,
`ChannelComposeContext`) owned its own socket subscription lifecycle. Three
of them called `wireHandlers(socket, channelId, handlerMap, setState)` inside
a `useEffect`; the fourth did the same for compose events. In addition,
`session:states` was independently subscribed three times (once per context)
because the payload shape (broadcast, no top-level `channelId`) didn't fit
the handler-map shape.

The duplication made it easy to answer the question "does context X listen to
event Y?" only by reading context X — there was no single place to see the
channel event surface, and nothing to prevent a fifth context from adding its
own `socket.on(...)`.

## Goals / Non-Goals

**Goals**
- Single per-channel subscription layer. Only one `socket.on(event, ...)`
  regardless of how many contexts register handlers for the same event.
- Preserve exact observable behavior. No test `expect` changes.
- Keep registration ergonomic for both handler-map style (state reducer) and
  one-off listener style (`router.on(event, fn)`).
- Support broadcast-shaped events (no top-level `channelId`) without a
  separate API.

**Non-goals**
- No changes to payload validation. The existing handlers keep their
  current parsing logic. Zod safeParse at the router boundary is a separate
  change (deferred).
- No linting rule yet to forbid `socket.on` outside the router. Deferred
  until the router has been in production for a cycle.
- Session-level subscriptions (`SessionContext`, auth, connect) remain
  direct `socket.on`. This change scopes to channel events only.
- Streaming (`handlers/streaming.ts`) and wildcard (`handlers/session.ts`
  `onAny`) subscriptions stay as direct `socket.on` — they depend on refs
  or the wildcard shape that doesn't map cleanly to the router.

## Decisions

### Router as per-channel instance, not module singleton

The router holds `channelId` in its constructor and uses it for the
`matchesChannel` guard. A module-level singleton would force the guard
logic into every listener. A new router per channel matches the existing
per-channel provider lifecycle exactly (create on mount, dispose on
unmount). Channel switches automatically get a fresh router because the
`ChannelSocketRouterProvider` uses `useMemo(() => new Router(socket,
channelId), [socket, channelId])`.

### Router.on vs router.register

Two registration methods, intentionally kept distinct:

- `register(handlers, setState, options)` — for the existing handler-map
  shape. Handlers are pure reducers `(state, payload) => state`.
  The router owns the guard/effects/skipGuard machinery previously inside
  `wireHandlers`.
- `on(event, listener, { guard = true })` — raw typed listener for events
  that don't fit the reducer shape. Used by handlers that need to emit
  back to the socket (`message:result` re-emits `chat:send` on dequeue)
  or handlers that filter the payload themselves (`session:states`
  iterates `payload.sessions`).

Collapsing them into one API would force every caller to accept the
reducer shape or wrap their logic in a no-op setter. The overhead of two
methods is small and the intent at the call site is clearer.

### Guard flag on router.on

`session:states` is a broadcast: the server emits the same payload to all
connected sockets, and the payload contains `sessions: [{channelId, ...}]`
but no top-level `channelId`. The `matchesChannel` guard would reject the
payload because `payload.channelId` is `undefined`.

Options considered:
1. Sniff for `'channelId' in payload` and skip the guard when absent.
2. Provide a separate `onBroadcast` method.
3. `on(event, listener, { guard: false })`.

Picked option 3 (explicit opt-out). Option 1 hides intent: a typo that
removes `channelId` from a normally-guarded payload would silently become
broadcast-routed. Option 2 duplicates the API surface. Option 3 forces
the caller to declare "this event is broadcast-shaped" at the call site.

### Listener dedup per socket event

The router keeps `listeners: Map<string, Set<SocketListener>>`. The
first registration for an event triggers `socket.on(event, fanOut)`;
subsequent registrations just add to the set; the last removal triggers
`socket.off`. This is what gives us the actual behavior change — one
socket.io listener for `session:states` instead of three.

### Remove internal matchesChannel calls

After migration, `onControlPermission` / `onControlHookCallback` /
`onSessionClosed` / `onMessageResult` all had an inner
`if (!matchesChannel(channelId, payload)) return;` guard. These became
dead code once routed through `router.on` (which guards before dispatch).
They were removed to avoid drift between two copies of the guard.

## Risks / Trade-offs

**Risk**: A listener registered through `router.on({ guard: true })`
silently never fires when the payload shape has no `channelId`. The
existing test suite didn't catch this during the first `ChannelConfigContext`
migration because no test directly asserts config's `session:states`
behavior. Mitigated by the explicit `{ guard: false }` opt-out that has to
be written at the call site, making mismatches more visible.

**Trade-off**: The router is a thin abstraction — it adds indirection for
future readers who previously traced `socket.on` directly to a handler.
The payoff is de-duplication (real runtime win for `session:states`) and
a single entry point for the eventual lint rule.

**Deferred**: streaming and `onAny` handlers still call `socket.on`
directly. These can be folded in later but only at the cost of teaching
the router about ref-shaped and wildcard subscriptions, which would
widen the API significantly for two call sites.

## Migration Plan

1. Introduce `ChannelSocketRouter` class + `ChannelSocketRouterProvider`
   wrapping the existing channel provider tree. Router is available but
   nothing uses it yet.
2. Migrate the three `wireHandlers`-using contexts one at a time
   (Config → Control → Messages), running tests after each.
3. Migrate `ChannelComposeContext` (the fourth `wireHandlers` caller).
4. Delete `wireHandlers` once no callers remain.

## Open Questions

- Should session-level events (`connect_error`, `notification:auth_url`,
  `session:created`, `session:dead`, `session:states`) also move to a
  router? They share the dedup motivation but live at a different
  provider scope. Defer until the channel router pattern has settled.
- Should `router.register` internally use `router.on`? It would reduce
  the router implementation to a single subscription path, but the
  handler-map shape needs batch register/cleanup semantics that `on`
  doesn't provide today. Defer.
