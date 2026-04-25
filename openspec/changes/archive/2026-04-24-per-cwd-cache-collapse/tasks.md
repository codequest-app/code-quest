# tasks

## Phase 1 — Git per-cwd status cache

- [ ] Red test: two consumers ensuring `'/repo'` produce one
  `git:status` RPC (use a spy on FakeGitService.status).
- [ ] Red test: `git:dirty { cwd: '/unfetched' }` does not fetch.
- [ ] Red test: `worktree:branchChanged` for a cached cwd refetches
  via Provider's central subscription.
- [ ] In `GitProvider`: add `gitStatus` state + inflight ref +
  `ensureGitStatus` / `refetchGitStatus` actions.
- [ ] Move `git:dirty` and `worktree:branchChanged` subscriptions into
  Provider; invalidate cached entries only.
- [ ] Update existing `useGitState` test (`state exposes only domain
  data`) to expect `gitStatus` alongside `listing`.
- [ ] Rewrite `GitPane` and `FilesPane` to consume Context directly.
- [ ] Delete `useGitStatus` from `GitContext.tsx`.
- [ ] Verify: `vitest run` green.

## Phase 2 — Openspec per-cwd list cache

- [ ] Create `OpenspecContext.test.tsx` with red tests (RPC dedup +
  no-prefetch on dirty).
- [ ] In `OpenspecProvider`: add `openspecList` state + inflight ref +
  `ensureOpenspecList` / `refetchOpenspecList` actions; central
  `openspec:dirty` subscription.
- [ ] Add `useOpenspecState` selector (mirror `useGitState`).
- [ ] Rewrite `SpecPane` to consume Context directly.
- [ ] Delete `useOpenspecList` from `OpenspecContext.tsx`.
- [ ] Verify: `vitest run` green.

## Phase 3 — Cleanup + commit boundary

- [ ] Re-run server tsc + client tsc.
- [ ] Two commits:
  - `refactor(git): per-cwd status cache in GitProvider, drop useGitStatus`
  - `refactor(openspec): per-cwd list cache in OpenspecProvider, drop useOpenspecList`

## Out (separate change later)

- `fs-watch` — server `fs:dirty` event + debounced watcher; client
  Provider cache + central subscription; FileTree subtree invalidation.
- Extract shared `usePerCwdCache<T>` helper if/when 3rd caller appears.
