# client-fs-pubsub

## Why

`FsProvider` packages `fs:dirty` events as React state
(`fsWatch[cwd] = { version, lastPaths }`). Consumers `useEffect` on
`version` to react. This is "event masquerading as state":

- Race window: two dirty events between renders → the earlier `lastPaths`
  is overwritten and lost.
- Render storm: every `fs:dirty` for any cwd triggers `setFsWatch`,
  re-rendering every `useFsState()` consumer (even those for unrelated
  cwds). React Compiler usually catches the no-op, but the indirection
  is noisy.
- Lifecycle is split across two APIs: `ensureFsWatch` (refcounted
  watcher), `useFsState` (data read), plus the version `useEffect`.
  Three things to coordinate for what's fundamentally "tell me when
  this directory changes."

Files changing is an **event**, not state. Use pub/sub.

## What changes

`FsProvider` exposes one action and removes the state model:

```ts
interface FsActions {
  browse(path?): Promise<...>;            // unchanged
  /** Subscribe to fs:dirty events for `cwd`. First subscriber per cwd
   *  emits fs:watch to the server (refcounted); last release emits
   *  fs:unwatch. Returned unsubscribe is idempotent. */
  subscribeFsDirty(cwd: string, onDirty: (paths: string[]) => void): () => void;
}
// useFsState() removed — fsWatch state is gone.
```

Internal: a single `TopicEmitter<cwd, string[]>` instance, a refcount
map per cwd, and one central `socket.on('files:dirty', …)` handler that
publishes to the emitter.

### Consumer rewrites

- **`FileTree`** — `useEffect`: `subscribeFsDirty(rootCwd, paths => …
  invalidateChildrenIds(parent) per path)`. No more
  `useFsState()`/version dance.
- **`FilesPane`** — drops the `fsWatch` lookup; either subscribes with
  empty cb (just to keep watcher alive for sibling GitPane/SpecPane
  below the same panel), or relies on FileTree's own subscribe inside
  its mount tree (FileTree always renders inside FilesPane).
- **`GitPane`** — `subscribeFsDirty(cwd, () => {})` to keep server
  watcher alive so `git:dirty` keeps firing into GitProvider's central
  handler.

### Behavior preserved

- Same wire protocol (`fs:watch` / `fs:unwatch` / `files:dirty`).
- Same observable refresh behavior on file changes.
- FileTree per-node invalidation logic unchanged (just consumes paths
  through callback instead of `lastPaths` state).
- Server-side dedup (channel + socket sub on same socket) still
  emergent from the `subscribe-fs-git-openspec-broadcasters` change.

## Out of scope

- Switching Git/Openspec to pub/sub. They're state-Context for a
  reason: consumers display the cached `gitStatus[cwd]` /
  `openspecList[cwd]`. The "events trigger refetch" wiring already
  lives inside their Providers' central `socket.on` handlers — that's
  effectively private pub/sub, no consumer-facing API change needed.

## TDD

`expect 不變或等價`: existing component tests (FileTree, FilesPane,
GitPane) assert renderable behavior. They must stay green after the
consumer rewrites — UI behavior is unchanged.

New tests in `FsContext.test.tsx` (replace existing fsWatch-state tests):

1. Two consumers `subscribeFsDirty('/repo', cb)` → only one `fs:watch`
   emitted to socket.
2. Both unsubscribe → one `fs:unwatch`.
3. Partial release → no unwatch.
4. `files:dirty { cwd, paths }` from server → callback fired with paths.
5. Different cwds → only matching subscriber fires.
6. Idempotent unsubscribe.

`FileTree.test.tsx` per-node invalidation tests stay; their setup may
need a tiny tweak if they previously mounted a `FsWatchKeeper` consumer.

## Steps

1. Update `FsContext.tsx`: add `subscribeFsDirty`, drop fsWatch state /
   ensure / release. (Will break FileTree / FilesPane / GitPane
   compilation — fix immediately.)
2. Rewrite `FileTree`: subscribe in useEffect, invalidate per path.
3. Update `FilesPane`, `GitPane`: replace ensure/release with
   subscribeFsDirty.
4. Replace fsWatch tests in `FsContext.test.tsx` with subscription tests.
5. Verify FileTree per-node invalidation tests pass via the new path.
