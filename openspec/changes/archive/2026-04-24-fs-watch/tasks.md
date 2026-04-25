# tasks

## Phase 1 — FsProvider watch registry

- [ ] Red test: two `ensureFsWatch('/repo')` produce one `fs:watch` emit.
- [ ] Red test: matching releases produce one `fs:unwatch` emit.
- [ ] Red test: partial release leaves watch alive.
- [ ] Red test: `fs:dirty` for watched cwd bumps version; for unwatched,
  no entry created.
- [ ] In `FsProvider`: add `fsWatch` state + ref count map +
  `ensureFsWatch` / `releaseFsWatch` actions + central `fs:dirty`
  subscription.
- [ ] Add `useFsState()` selector (mirror `useGitState`).
- [ ] Verify: `vitest run src/contexts/__tests__/FsContext.test.tsx` green.

## Phase 2 — Consumer rewrite

- [ ] `FilesPane`: replace inline watch/unwatch + dirty handler with
  `ensureFsWatch / releaseFsWatch` and `fsWatch[cwd]?.version` as
  the FileTree key.
- [ ] `GitPane`: replace inline watch/unwatch with ensure/release pair.
- [ ] Verify: full client `vitest run` green.

## Phase 3 — Cleanup

- [ ] Re-run server tsc + client tsc.
- [ ] Two commits:
  - `feat(fs): centralize fs:watch lifecycle in FsProvider with refcount`
  - `refactor(panes): FilesPane/GitPane consume Fs watch registry`

## Out (not this change)

- FileTree fine-grained node invalidation (replaces remount-via-key).
- Server-side debounce tuning.
