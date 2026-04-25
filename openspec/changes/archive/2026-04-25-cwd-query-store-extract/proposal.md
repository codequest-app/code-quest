## Why

Three client contexts — `GitContext`, `OpenspecContext`, `FsContext` — each implement a near-identical "external store with TopicEmitter + per-cwd cache + inflight-request dedup + refetch on dirty event" scaffolding. Roughly 80 lines of pattern duplicated three times.

Drift risk is real: an inflight-dedup bug was fixed in one context last month; the other two still carry the bug. Every future fix or behavior tweak must be hand-replicated in three places, and we have no compile-time guarantee they stay aligned.

## What Changes

- Extract a `createCwdQueryStore({ fetch, dirtyEvent, parse })` factory in `packages/client/src/contexts/lib/createCwdQueryStore.ts`.
- The factory returns:
  - `useStoreValue(cwd)` — external-store hook (`subscribe` + `getSnapshot`) that triggers the first fetch on mount and returns `{ data, loading, error }`.
  - `refetch(cwd)` — imperative refetch action (deduped against any inflight request).
  - `clear(cwd)` — drops the cwd entry from the internal cache (for unmount cleanup).
- The factory subscribes to `dirtyEvent` internally; the consumer provides the event name plus a `payload → cwd` extractor. When the event fires, the matching cwd's entry is invalidated and refetched (if any subscriber is mounted).
- Migrate `useGitStatus` (in `GitContext`) and `useOpenspecList` (in `OpenspecContext`) to consume the factory. Per-context bookkeeping (TopicEmitter, cache map, inflight map, dirty-event subscribe) is deleted from those contexts.
- Evaluate whether `useFsBrowse` (in `FsContext`) fits the pattern. Fs may be query-on-demand rather than cached-per-cwd; if it doesn't fit, leave it as-is and note the decision in the migration task.

Explicitly out of scope:
- Worktree listing in `GitContext` — that store is **project-keyed**, not cwd-keyed, and has a different shape. Possible future migration.
- No behavior change. Cache TTL, refetch trigger semantics, error shape, and loading semantics SHALL remain identical to today.
- No public API rename for `useGitStatus` / `useOpenspecList`.

## Capabilities

- **client-context-stores**: A shared `createCwdQueryStore` factory provides the per-cwd cached external-store pattern; `GitContext` and `OpenspecContext` consume it instead of hand-rolling their own bookkeeping.
