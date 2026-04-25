# filetree-fine-grained-invalidation

## Why

`FilesPane` currently passes `fsWatch[cwd]?.version` as React `key` to
`FileTree`. Every `fs:dirty` bumps the version → React unmounts and
remounts the whole tree. Side effects:

- All expanded directories collapse back to root
- Scroll position resets
- Even branches that didn't change are forced through full re-fetch
- Selection / highlight state lost

The dirty event already carries `paths: string[]` (relative file paths
that changed). headless-tree's `asyncDataLoaderFeature` exposes
`item.invalidateChildrenIds(optimistic?)` per item — refetch only that
node's children, leaving everything else intact.

## What changes

- `FsProvider` state grows: `fsWatch[cwd]` becomes
  `{ version: number; lastPaths: string[] }`. Dirty handler bumps
  version and replaces `lastPaths` with the event's `paths`.
- `FileTree` subscribes to `fsWatch[rootCwd]` and on version change,
  walks `lastPaths`, computes each path's parent directory (absolute),
  and calls `invalidateChildrenIds(true)` on the matching tree item.
  - Optimistic = true: the tree shows old data while refetching, no
    "Loading..." flash.
  - If the parent's absolute path equals `rootCwd`, invalidate
    `tree.getRootItem()` (the synthetic `'root'` id).
  - If `getItemInstance(parentDir)` returns null/undefined (parent not
    expanded → not in tree state), skip — when user later expands, the
    dataLoader fetches fresh.
- `FilesPane` drops `key={refreshKey}`. FileTree is now responsible
  for its own invalidation lifecycle.

## Out of scope

- Cross-directory moves (a file appearing in dir A and disappearing
  from dir B) — handled correctly because both A's and B's parents end
  up in `lastPaths`.
- Renames at the file level — server emits two events (one per side),
  same handling.
- Add/remove of the watched root itself (cwd disappears) — out of
  scope; would need a higher-level signal.
- Throttling at the FileTree side — server already debounces 200ms.

## Design notes

- `lastPaths` is **replaced** on each dirty event (not appended). The
  consumer reads it once via `useEffect` keyed on `version`. Risk: if
  two dirty bumps happen between renders, paths from the earlier batch
  could be lost. With server's 200ms debounce + React's render cadence
  this is unlikely in practice; if it ever bites, upgrade to a
  consume-and-clear queue API.
- `getItemInstance` for an unloaded parent: headless-tree returns the
  shell instance even for paths it hasn't fetched, but `invalidate*`
  only matters for items that *have* been fetched. Calling invalidate
  on a never-loaded item is safe (no-op) per the headless-tree
  semantics — verify in tests.
- Computing parent path: use `path.slice(0, path.lastIndexOf('/'))`
  joined with `rootCwd`. Avoid Node's `path` module on the client.

## TDD approach

`expect 不變或等價`: existing FilesPane tests assert that the file
listing renders. They should remain green.

New tests:

1. `FsContext.test.tsx` — `fs:dirty { cwd, paths: ['src/foo.ts'] }`
   updates `fsWatch[cwd].lastPaths` to `['src/foo.ts']`.
2. `FileTree.test.tsx` — when an expanded directory's child is in the
   dirty paths, that directory's `invalidateChildrenIds` is called
   (spy on the mock's children loader).
3. `FileTree.test.tsx` — root-level dirty path triggers root
   invalidation (refetch via dataLoader called again with `'root'`).
4. `FilesPane.test.tsx` — across a `fs:dirty` event, an expanded
   directory STAYS expanded (regression test for the current `key`
   remount behavior).

Steps:
1. Extend FsProvider state + dirty handler. Test #1 first.
2. Wire FileTree to consume Context, drop FilesPane's `key` prop.
   Tests #2, #3, #4.
3. Verify all client tests green.
