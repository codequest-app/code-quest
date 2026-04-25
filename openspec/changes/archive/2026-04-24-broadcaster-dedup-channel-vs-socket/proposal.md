# broadcaster-dedup-channel-vs-socket

## Why

`FsGitDirtyBroadcaster` has two parallel subscription paths for the same
underlying signal:

- `subscribeChannel(channelId, cwd)` — registered by `ChannelManager` on
  chat-session start. Routes dirty events through `ChannelEmitter` to all
  sockets joined to that channel.
- `subscribeSocket(socketId, cwd, emit)` — registered by the `fs:watch`
  handler on FsProvider's `ensureFsWatch`. Routes directly to that one
  socket.

When the same window has both a chat session AND a RightPane viewing
the same cwd (the normal "I'm coding in this repo" workflow), the
window's socket is both:
- joined to the chat channel → receives event via channel emit
- subscribed via fs:watch → receives event via socket emit

Result: every `files:dirty` / `git:dirty` / `openspec:dirty` for that
cwd is delivered to the same socket twice. Visible effects:

- `FsProvider.fsWatch[cwd].version` bumps twice → FileTree re-renders
  twice
- `GitProvider`'s central git:dirty handler fires twice → two
  `git:status` RPCs (the second is a no-op once cached, but still
  network round-trip)
- `OpenspecProvider` same thing for openspec:dirty
- Wire load: 2× the dirty events for the most common usage pattern

## What changes

`FsGitDirtyBroadcaster.flush(cwd)` builds a per-cwd recipient set:

1. Collect the socket IDs that have a direct `socketSub` for this cwd.
2. When emitting via channel, exclude those socket IDs (channel emit
   already covers them via the direct path).
3. When emitting via socket sub, emit normally.

Concretely:

- Extend `EmitFn` to accept an optional `excludeSocketIds: Set<string>`.
- Extend `ChannelEmitter.emit` (or add a sibling) to honor that exclude
  set, mirroring the existing `emitToOthers(channelId, excludeSocketId)`
  but for a set.
- Track `socketId` on `SocketSub` (currently the broadcaster keys by
  composite `${socketId}:${cwd}` but doesn't keep the raw socket id).
- In `flush`, compute excludes once and pass to `deps.emit`.

## Out of scope

- Removing the channel sub entirely (it's still needed for the
  chat-only / no-RightPane case so the chokidar watcher is kept alive
  and the chat's window socket gets the events).
- Watcher refcount changes (already correct; this only changes
  delivery routing).

## Design notes

- The `socketSub` key remains `${socketId}:${cwd}` to preserve the
  multi-cwd-per-socket contract. The new `socketId` field on
  `SocketSub` is metadata for dedup, not a key change.
- Edge: if a window has chat at `/repo` but no RightPane → no
  socketSub → exclude set is empty → channel emit delivers
  unchanged. ✅
- Edge: window has RightPane at `/repo` but no chat → no channelSub
  for `/repo` → channel emit not invoked → socket emit delivers
  unchanged. ✅
- Edge: two windows, A has chat, B has RightPane (different sockets) →
  channel emit covers A, socket emit covers B; no exclude needed.
  Exclude set contains only B's socketId, channel emit's audience is
  only A → no overlap. ✅
- Edge: same window, BOTH chat and RightPane → exclude set contains
  the window's socket; channel emit skips it; socket emit delivers
  once. ✅

## TDD approach

`expect 不變或等價`: existing `fs-git-dirty-broadcaster.test.ts` covers
single-path delivery. Those tests must stay green.

New tests (red first):

1. `fs-git-dirty-broadcaster.test.ts` — when both `subscribeChannel` and
   `subscribeSocket` are registered for the same cwd targeting the
   same socket, exactly one `files:dirty` is delivered to that socket.
2. Same for `git:dirty` and `openspec:dirty`.
3. Two-window scenario stays unchanged (each window receives once).

Steps:
1. Extend `ChannelEmitter` with exclude-set support; existing tests
   stay green.
2. Add `socketId` to `SocketSub` and update `subscribeSocket` callers.
3. Wire excludeSocketIds through `flush` → `deps.emit`.
4. Write the dedup tests; verify red → green.
