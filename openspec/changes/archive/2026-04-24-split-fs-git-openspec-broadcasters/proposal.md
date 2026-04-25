# split-fs-git-openspec-broadcasters

## Why

`FsGitDirtyBroadcaster` couples three independent concerns into one
class: chokidar lifecycle/refcount, path classification across three
domains, and per-cwd subscriber fanout for fs/git/openspec.

After `topic-emitter-primitive`, each domain can own itself: its own
matcher, its own debounce buffer, its own subscriber list backed by a
`TopicEmitter`. The chokidar lifecycle becomes a separate `WatchManager`
that knows nothing about domains.

Goal: each domain class is self-contained — adding a 4th domain (or
modifying git's classification rules) doesn't touch the others.

## What changes

### New components

`WatchService` already refcounts chokidar subscribers internally — one
chokidar per cwd shared across N subscribe() calls — so each
broadcaster can call `watchService.subscribe(cwd, cb)` directly and
store the returned Unsubscribe. No separate WatchManager needed.

- `FsDirtyBroadcaster(watchService)` — owns `TopicEmitter<cwd, paths>`,
  matcher (`!ignored && !gitMeta`), 200 ms debounce buffer per cwd.
  `subscribe(cwd, subscriberId, cb): () => void`. First subscriber per
  cwd → `watchService.subscribe(cwd, onEvent)`; last release calls the
  stored Unsubscribe.

- `GitDirtyBroadcaster(watchService)` — `TopicEmitter<cwd, void>`,
  matcher = `.git/(HEAD|index|packed-refs|refs/.*)`, 200 ms debounce.

- `OpenspecDirtyBroadcaster(watchService)` — `TopicEmitter<cwd, void>`,
  matcher = `openspec/`, 200 ms debounce.

### Removed

- `FsGitDirtyBroadcaster` and its tests.
- `ChannelEmitter.emitExcluding` (the dedup-via-exclude path is no
  longer needed — see below).

### Subscription wiring

Both consumer types (`fs:watch` socket handler and `ChannelManager`)
subscribe **per socket** under that socket's id. Multiple subscriptions
for the same `(cwd, socket.id)` collapse to one TopicEmitter entry
(emergent dedup — replaces the explicit exclude-set logic shipped in
`broadcaster-dedup-channel-vs-socket`).

- `fs.ts` handler — on `fs:watch { cwd }`:
  ```ts
  const subId = socket.id;
  const offFs   = fs.subscribe(cwd, subId, paths => socket.emit('fs:dirty', { cwd, paths }));
  const offGit  = git.subscribe(cwd, subId, () => socket.emit('git:dirty', { cwd }));
  const offOps  = openspec.subscribe(cwd, subId, () => socket.emit('openspec:dirty', { cwd }));
  // store [offFs, offGit, offOps] keyed by (socket.id, cwd) for fs:unwatch
  ```

- `ChannelManager` — when a socket joins a channel that has a cwd,
  register the same three subscriptions under the joining socket's id.
  When a socket leaves the channel (or the session ends, or the socket
  disconnects), release them. Hooks into `ChannelEmitter`'s
  add/remove socket lifecycle.

  Same socket having both fs:watch + channel sub → both calls use the
  same `socket.id` subscriberId → TopicEmitter keeps one entry. One
  delivery. Dedup is automatic.

### Wire protocol

Unchanged. `fs:watch` / `fs:unwatch` from client; `fs:dirty` /
`git:dirty` / `openspec:dirty` to client.

## Out of scope

- Splitting `fs:watch` into per-domain watch RPCs.
- Client-side pub/sub change (separate change `client-fs-pubsub`).
- Fine-grained debounce tuning (200 ms preserved).

## Design notes

- `WatchManager` only knows `WatchService` (chokidar interface). No
  knowledge of debounce, classification, or subscribers — pure
  refcount + lifecycle.
- Each broadcaster's debounce buffer is independent. An openspec/* path
  fires both fs and openspec broadcasters; each independently debounces
  200 ms. Two `setTimeout` per cwd vs one previously — negligible cost,
  cleaner ownership.
- `ChannelManager` socket-join/leave hooks: `ChannelEmitter` already
  tracks `addSocketToChannel` / `removeSocketFromChannel`; ChannelManager
  needs callbacks on those. Either ChannelEmitter exposes events or
  ChannelManager wraps the add/remove calls. Wrap-via-method (cleaner
  ownership) preferred.
- Disconnect handling: server's `disconnect` listener (currently in
  `fs.ts`) covers fs:watch lifecycle. ChannelManager tracks its own
  socket subs alongside its existing channel-join state.

## TDD

Order — bottom up so each layer is green before depending on it:

1. **WatchManager** — refcount, single chokidar per cwd, fan-out.
2. **FsDirtyBroadcaster** — matcher, debounce, TopicEmitter delivery,
   refcount via WatchManager.
3. **GitDirtyBroadcaster** — same shape, git matcher.
4. **OpenspecDirtyBroadcaster** — same shape, openspec matcher.
5. **fs.ts handler** — wire up the three subscribes per `fs:watch`.
6. **ChannelManager** — wire up per-socket subs on join/leave/end.
7. Delete `FsGitDirtyBroadcaster` and `emitExcluding`.

`expect 不變或等價`: existing tests for fs.ts, ChannelManager,
ChannelEmitter, and end-to-end client tests pass without modification.
The dedup-channel-vs-socket invariant (4 broadcaster tests) re-asserted
via the new architecture but expressed as TopicEmitter-id collapse.
