# per-cwd-cache-collapse

## Why

`useGitStatus(cwd)` and `useOpenspecList(cwd)` are wrapper hooks that
each component instance uses to fetch its own copy of data, hold its
own state, and subscribe to its own `*:dirty` (and for git,
`worktree:branchChanged`) broadcast. N components watching the same cwd
= N RPCs + N event handlers + N copies of the same data.

The data should live in the domain Provider's Context. Components read
it the same way they read any other domain state — via
`useGitState()` / `useOpenspecState()`. No wrapper hook in between.

This also dissolves a cross-domain leak: the old `useGitStatus` hook
subscribed to `worktree:branchChanged` (a worktree event) so it could
refetch git status. With Provider-owned invalidation, that subscription
moves into GitProvider — consumers never see the cross-domain wiring.

## What changes

- `GitProvider` state grows: `gitStatus: Record<cwd, GitStatusByCwdResult | { error: string }>`.
- `GitProvider` actions gain `ensureGitStatus(cwd)` (idempotent fetch +
  inflight de-dup) and `refetchGitStatus(cwd)` (force refetch).
- `GitProvider` central effect subscribes to `git:dirty` and
  `worktree:branchChanged`; on dirty for a cached cwd, refetch.
- `OpenspecProvider` mirrors: `openspecList: Record<cwd, OpenspecListResult>`,
  `ensureOpenspecList(cwd)` / `refetchOpenspecList(cwd)`, central
  `openspec:dirty` subscription.
- **Wrapper hooks `useGitStatus` and `useOpenspecList` are removed.**
- Consumers (`GitPane`, `FilesPane`, `SpecPane`) read directly from
  Context state and call `ensureXyz(cwd)` in a `useEffect`. Three call
  sites total.

## Out of scope

- **Fs**: handled in the next change `fs-watch` (server adds an `fs:dirty`
  event + debounced watcher; client adds Provider state + ensure/refetch
  + central subscription; FileTree integrates). Splitting the work keeps
  this change a pure client refactor (zero protocol change) and isolates
  the new-feature risk. The pattern established here is the template
  `fs-watch` will copy.
- **Server-side watcher dedup**: separate concern.

## Consumer shape

```tsx
// GitPane (was: useGitStatus(cwd))
const { gitStatus } = useGitState();
const { ensureGitStatus, refetchGitStatus } = useGitActions();
useEffect(() => { void ensureGitStatus(cwd); }, [cwd, ensureGitStatus]);
const data = gitStatus[cwd];
const refetch = useCallback(() => refetchGitStatus(cwd), [cwd, refetchGitStatus]);

// SpecPane (was: useOpenspecList(cwd))
const { openspecList } = useOpenspecState();
const { ensureOpenspecList } = useOpenspecActions();
useEffect(() => { void ensureOpenspecList(cwd); }, [cwd, ensureOpenspecList]);
const data = openspecList[cwd];
```

## Design notes

- Use `useState<Record<cwd, T>>({})` + `useRef<Map<cwd, Promise>>` for
  inflight tracking. No external state library.
- Dirty handler only refetches cwds **already** in the cache — never
  populates new entries. Same as the existing `worktree:added` handling.
- Error states encode in cache value: `{ error: 'invalid_response' }`
  alongside the success shape.
- `useGitState` adds `gitStatus` field. `useGitActions` adds
  `ensureGitStatus` + `refetchGitStatus`. Existing `useGitState`
  `state exposes only domain data (listing)` test must be updated to
  also list `gitStatus`.

## TDD approach

`expect 不變或等價`: existing tests assert public behavior. Component
tests for GitPane / FilesPane / SpecPane already pass via render-side
assertions and don't care about the hook layer — they should stay green
after consumer rewrites.

New tests (added before the refactor):

1. `GitContext.test.tsx` — two consumers reading `gitStatus['/repo']`
   and calling `ensureGitStatus('/repo')` produce exactly one
   `git:status` RPC.
2. `GitContext.test.tsx` — `git:dirty { cwd: '/unfetched' }` (cwd never
   ensured) does NOT trigger a fetch.
3. `GitContext.test.tsx` — `worktree:branchChanged` for a cached cwd
   refetches git status (proves Provider owns the cross-domain sub).
4. `OpenspecContext.test.tsx` (new file) — mirror of #1 and #2 for
   `openspec:dirty`.

Steps:
1. Write the new dedup tests (red).
2. Implement Provider state + actions + central subscriptions (green).
3. Rewrite 3 consumer call sites; delete `useGitStatus` and
   `useOpenspecList` exports.
4. Verify all 1537 existing tests still pass + the new ones.
