# tasks

- [ ] Replace `FsContext.tsx`: add `subscribeFsDirty(cwd, cb): () => void`
  using TopicEmitter from shared; refcounted watch lifecycle; central
  socket.on('files:dirty') publishes; drop `useFsState`/`ensureFsWatch`/
  `releaseFsWatch`/`fsWatch` state.
- [ ] Rewrite `FsContext.test.tsx`: subscribe-based tests (one fs:watch
  per cwd, one fs:unwatch on last release, partial release no-op,
  callback fires with paths, idempotent unsubscribe, different cwds
  isolated).
- [ ] Rewrite `FileTree`: `useEffect` calls `subscribeFsDirty(rootCwd,
  paths => …)` and per-path invalidate; remove `useFsState()` import.
- [ ] Rewrite `FilesPane`: subscribeFsDirty(cwd, () => {}) to keep
  watcher alive; remove ensure/release calls. (FileTree owns the
  invalidation cb.)
- [ ] Rewrite `GitPane`: same — subscribeFsDirty(cwd, () => {}).
- [ ] Verify client tsc + vitest green; server unchanged.
- [ ] Single commit:
  `refactor(client): FsContext goes pub/sub for fs:dirty events`
