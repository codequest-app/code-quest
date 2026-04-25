# tasks

## Phase 1 — FsProvider extends fsWatch with lastPaths

- [ ] Red test: `fs:dirty { cwd, paths: ['src/foo.ts'] }` for a watched
  cwd → `fsWatch[cwd].lastPaths === ['src/foo.ts']` and version bumps.
- [ ] Update `FsState.fsWatch` type and dirty handler to carry paths.
- [ ] Verify: existing FsContext tests still green (lastPaths defaults
  to `[]`; version semantics unchanged).

## Phase 2 — FileTree consumes invalidation signal

- [ ] Red test: expanded dir whose child is in dirty paths gets its
  `invalidateChildrenIds` called.
- [ ] Red test: root-level path triggers root invalidate.
- [ ] Red test: FilesPane keeps expansion state across a dirty event.
- [ ] In `FileTree`: subscribe to `useFsState().fsWatch[rootCwd]` and
  `useEffect` on `version` to walk paths and invalidate.
- [ ] In `FilesPane`: drop the `key={refreshKey}` prop.
- [ ] Verify: full client `vitest run` green.

## Phase 3 — Cleanup

- [ ] Re-run server tsc + client tsc.
- [ ] Single commit:
  `refactor(filetree): per-node invalidation instead of full remount`
