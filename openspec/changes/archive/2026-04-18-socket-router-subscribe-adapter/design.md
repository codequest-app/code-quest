## Context

After the map-merge refactor (`9136725a`), `ChannelSocketRouter` is
structurally sound: one `events: Map<string, EventRegistration>`,
clear lifecycle methods, single responsibility for channel-scoped
socket event dedup + guard + fan-out.

Three residual smells are small but coherent, and share a solution:

1. `router.on()` and inside `router.register()` each contain an
   independent copy of the guard-wrap pattern:
   ```ts
   (payload) => { if (!matchesChannel(...)) return; /* invoke */ }
   ```
2. Router class body contains `this.socket.on(event as never, ... as never)`
   (and `.off`) at five call sites — a workaround for socket.io's
   TypedSocket rejecting `string` as an event key.
3. Router has no unit tests. It can only be exercised via full channel
   context integration tests with a live FakeSocket.

Items 1–3 form a chain: (1) solved by a private `subscribe` helper;
(2) solved by a thin adapter interface; (3) enabled once (2) is in
place (because then a 10-line fake adapter replaces the cost of
mocking the full TypedSocket surface).

## Decisions

### Private `subscribe(event, listener, guarded?)` helper

```ts
private subscribe(
  event: string,
  listener: SocketListener,
  guarded = true,
): () => void {
  const wrapped: SocketListener = guarded
    ? (payload) => {
        if (matchesChannel(this.channelId, payload)) listener(payload);
      }
    : listener;
  this.addListener(event, wrapped);
  return () => this.removeListener(event, wrapped);
}
```

Both `on()` and `register()` become thin adapters:

```ts
on<E>(event, listener): () => void {
  return this.subscribe(event as string, (p) => listener(p as Payload<E>));
}

register(handlers, setState, options?): () => void {
  const offs = [...events].map((event) => {
    const handleEvent: SocketListener = (payload) => {
      beforeUpdate?.(event, payload);
      if (stateHandler) setState((prev) => stateHandler(prev, payload as never));
      if (effectHandler && effectDeps !== undefined) effectHandler(effectDeps, payload as never);
    };
    return this.subscribe(event, handleEvent, !skipGuard?.has(event));
  });
  return () => offs.forEach(off => off());
}
```

**Why not Express-style middleware (`next`-based)?** Pipeline has 3
stages max with heterogeneous semantics (guard halts, beforeUpdate
observes, handler reduces state). Middleware infrastructure costs ~10
lines per stage; inline is 1 line per stage. Break-even is ~5 stages.

**Why not `Array.reduce` pipe?** `reduce` is for same-type value
transforms. Our stages have different signatures and need a halt
mechanism. Shoehorning into reduce requires a `Ctx + halted` wrapper
(~8 extra lines) with no readability gain for 3 stages.

### `SubscriptionAdapter` interface + `createSocketAdapter` factory

```ts
export interface SubscriptionAdapter {
  on(event: string, fn: SocketListener): void;
  off(event: string, fn: SocketListener): void;
}

export function createSocketAdapter(socket: TypedSocket): SubscriptionAdapter {
  return {
    on: (event, fn) => socket.on(event as never, fn as never),
    off: (event, fn) => socket.off(event as never, fn as never),
  };
}

export class ChannelSocketRouter {
  constructor(
    private adapter: SubscriptionAdapter,
    private channelId: string,
  ) {}
  // all this.socket.on/off → this.adapter.on/off (no casts)
}
```

**Why interface + factory in the same file?** Router owns the contract
(`SubscriptionAdapter`); the default socket.io implementation is
naturally grouped with it. Tests import the interface from here and
roll their own fake. Splitting to a separate `socket-adapter.ts` would
add a file without gaining clarity (no alternative implementations).

**Why not a constructor option like `socket: TypedSocket | SubscriptionAdapter`?**
Union of incompatible shapes; the router would need runtime
discrimination. Cleaner to have one input type and require the caller
to wrap.

### Unit tests with fake adapter

```ts
function fakeAdapter() {
  const reg = new Map<string, Set<(p: any) => void>>();
  return {
    on(event: string, fn: any) { reg.get(event)?.add(fn) ?? reg.set(event, new Set([fn])); },
    off(event: string, fn: any) { reg.get(event)?.delete(fn); },
    emit(event: string, payload: any) { reg.get(event)?.forEach((fn) => fn(payload)); },
    listenerCount(event: string) { return reg.get(event)?.size ?? 0; },
  };
}
```

Test coverage targets (each assertion gets 1 `it`):

1. **Dedup**: 3 `router.on('X', fn)` → `fakeAdapter.listenerCount('X') === 1`
2. **Fan-out**: all 3 registered listeners fire on `adapter.emit('X', ...)`
3. **Guard match**: `emit('X', { channelId: 'A' })` fires listener on router for channel `A`
4. **Guard reject**: `emit('X', { channelId: 'B' })` does NOT fire listener on router for channel `A`
5. **Guard broadcast**: `emit('X', { channelId: '' })` fires (empty string = broadcast-to-all)
6. **skipGuard bypass**: `register({ disconnect: fn }, ..., { skipGuard: new Set(['disconnect']) })` fires on any payload
7. **Last removeListener triggers adapter.off**: when last listener for event X is removed, `listenerCount('X') === 0`
8. **dispose removes all**: after `router.dispose()`, `listenerCount(any)` is 0

## Risks / Trade-offs

- **Public API shape unchanged** for router consumers — only
  constructor signature changes (`TypedSocket` → `SubscriptionAdapter`).
  Only caller is `ChannelSocketRouterProvider`.
- **Test additions are additive** — zero existing tests modified.
- **Guard wrapping is now single-sourced** in `subscribe` — if a future
  change needs to disable guard under more conditions than per-event
  `skipGuard`, that's a one-place edit.

## Migration

Three sequential steps, each passing tests independently:

1. Add private `subscribe`; refactor `on` and `register` to use it
   (internal only, no API change).
2. Add `SubscriptionAdapter` + factory; change constructor signature;
   update Provider to wrap.
3. Add `socket-router.test.ts` with fake adapter covering the 8
   scenarios above.
