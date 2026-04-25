# fs-watch

## Why

Two components (`FilesPane`, `GitPane`) currently manage `fs:watch` /
`fs:unwatch` lifecycle inline:

```tsx
useEffect(() => {
  socket.emit(EVENTS.fs.watch, { cwd });
  return () => socket.emit(EVENTS.fs.unwatch, { cwd });
}, [cwd, socket]);
```

The server-side broadcaster keys subscriptions by `(socket.id, cwd)` —
a single subscription per pair. So when both panes mount for the same
cwd:

1. FilesPane mounts → `fs:watch /repo` → subscription registered
2. GitPane mounts → `fs:watch /repo` → re-registered (same id, replaces)
3. FilesPane unmounts → `fs:unwatch /repo` → subscription removed
4. **GitPane silently loses `fs:dirty` and `git:dirty` events** —
   no more refresh on file change

The server has no way to know multiple client-side observers share one
subscription. Ref counting must happen on the client.

`FilesPane` also subscribes to `fs:dirty` directly to bump a render key.
Each pane = one handler; if N panes for one cwd, N handlers fire on each
event. Same problem the per-cwd-cache-collapse change just solved for
git/openspec.

## What changes

- `FsProvider` gains a watch registry:
  - `fsWatch: Record<cwd, { version: number }>` in state. Version bumps
    on each `fs:dirty` for that cwd. Consumers read it as a render key
    or in a `useEffect` to react to changes.
  - `ensureFsWatch(cwd)` action: ref-count++; on first observer, emit
    `fs:watch` to server.
  - `releaseFsWatch(cwd)` action: ref-count--; on last release, emit
    `fs:unwatch`.
  - Central `fs:dirty` subscription bumps the version of the matching
    cwd if currently watched.
- `FilesPane`: drop inline watch/unwatch + dirty handler; replace with
  `ensureFsWatch(cwd) / releaseFsWatch(cwd)` in one `useEffect`, read
  `fsWatch[cwd]?.version ?? 0` as the FileTree key.
- `GitPane`: drop inline watch/unwatch; replace with the same
  ensure/release pair. (GitPane doesn't care about the version — it
  only needs the watcher alive so the server keeps emitting `git:dirty`,
  which GitProvider already subscribes to centrally.)

## Out of scope

- **FileTree fine-grained invalidation**: today FilesPane bumps a key
  that remounts the entire FileTree (loses expansion state). Better
  would be invalidating only the affected directory node via
  headless-tree's API. Separate concern, separate change.
- **Server-side debounce / coalescing**: server already debounces
  chokidar events somewhere upstream; not touching it here.
- **Recursive vs non-recursive watch**: current behavior preserved.

## Design notes

- Use `useState<Record<cwd, { version: number }>>({})` and
  `useRef<Map<cwd, number>>(new Map())` for ref counts (don't re-render
  on count changes, only on version changes).
- `ensureFsWatch` returns void — there's nothing to await; `fs:watch`
  is fire-and-forget on the server.
- `version` starts at 0 when the cwd is first watched. Bumping it on
  dirty events is the only state mutation. When ref count returns to 0,
  the cwd entry is removed from `fsWatch` (cleanup, not just the count).

## TDD approach

`expect 不變或等價`: existing FilesPane / GitPane tests assert render
behavior (file listing appears, git status appears). They should pass
unchanged after the consumer rewrites.

New tests (added before the refactor):

1. `FsContext.test.tsx` — two consumers ensuring `'/repo'` produce
   exactly one `fs:watch` socket emit.
2. `FsContext.test.tsx` — when both consumers release, one `fs:unwatch`
   is emitted.
3. `FsContext.test.tsx` — partial release (one consumer unmounts while
   another stays) does NOT emit `fs:unwatch`.
4. `FsContext.test.tsx` — `fs:dirty { cwd: '/repo' }` for a watched cwd
   bumps `fsWatch['/repo'].version`.

Steps:
1. Write red tests using `vi.spyOn(socket, 'emit')` filtered by event
   name.
2. Implement Provider state + ref-counted ensure/release + central
   dirty subscription.
3. Rewrite `FilesPane` and `GitPane` to consume Provider.
4. Verify all client tests green.
