# topic-emitter-primitive

## Why

`FsGitDirtyBroadcaster` couples three concerns: (1) chokidar lifecycle
+ refcount, (2) path classification into domains, (3) per-cwd subscriber
fanout. The third — keyed-topic fanout — is a generic primitive that
will be reused when we split fs/git/openspec into self-contained
broadcasters and again on the client to dispatch socket events to
per-cwd subscribers.

Pull the primitive out first, in isolation, so each later refactor only
imports a small tested piece instead of inventing its own subscriber
map.

## What changes

`@code-quest/shared` gains:

```ts
export class TopicEmitter<Topic, Payload> {
  subscribe(topic: Topic, subscriberId: string, cb: (p: Payload) => void): () => void;
  publish(topic: Topic, payload: Payload): void;
  hasSubscribers(topic: Topic): boolean;
}
```

- `subscriberId` keyed (not by callback identity) → multiple subscribes
  with the same id collapse to one delivery; idempotent dedup falls
  out for free (the server-side dedup-channel-vs-socket logic will
  later become emergent).
- Returned `unsubscribe` is idempotent.
- `hasSubscribers` lets owners (e.g. WatchManager) refcount external
  resources.

Naming: matches `ChannelEmitter` (existing socket-broadcast class) —
"emitter" reads as "publishes to subscribers", consistent vocab.

## Out of scope

- Async callbacks / error handling beyond letting one subscriber's
  throw not block the others (use try/catch in publish).
- Wildcard / pattern subscriptions.
- Backpressure / bounded queues.

## TDD

1. Red: `subscribe + publish → callback fires with payload`.
2. Red: two subscribers same topic → both fire; different topics → only
   matching fires.
3. Red: same `subscriberId` subscribing twice → only one delivery.
4. Red: unsubscribe → no further calls; idempotent (second call no-op).
5. Red: `hasSubscribers` reflects current state.
6. Red: subscriber throws → other subscribers still fire.
