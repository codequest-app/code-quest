## Tasks

### 1. Create the factory

- [x] Add `apps/web/src/contexts/lib/createCwdQueryStore.ts` exporting `createCwdQueryStore<TRaw, TData>({ fetch, dirtyEvent, parse, getCwdFromDirtyPayload })`.
- [x] Implement the per-cwd cache map, inflight-request dedup, and TopicEmitter subscription pattern in one place.
- [x] Subscribe to `dirtyEvent` internally; on event, invalidate the matching cwd entry and refetch if any subscriber is mounted.
- [x] Return `{ useStoreValue, refetch, clear }`.

### 2. Factory unit tests

- [x] First mount triggers a fetch.
- [x] Concurrent mounts for the same cwd dedup to one inflight request.
- [x] `dirtyEvent` for the matching cwd triggers a refetch when subscribed.
- [x] `dirtyEvent` for an unrelated cwd does NOT trigger a refetch.
- [x] `clear(cwd)` drops the entry; the next `useStoreValue(cwd)` mount refetches.
- [x] `refetch` is deduped against an inflight request.
- [x] Fetch error is exposed via `error` and does NOT poison subsequent refetches.

### 3. Migrate GitContext

- [x] Replace the per-context bookkeeping (TopicEmitter / cache / inflight / dirty subscribe) inside `useGitStatus` with a `createCwdQueryStore` instance.
- [x] `useGitStatus` public API unchanged.
- [x] Existing GitContext tests pass without modification.

### 4. Migrate OpenspecContext

- [x] Replace the per-context bookkeeping inside `useOpenspecList` with a `createCwdQueryStore` instance.
- [x] `useOpenspecList` public API unchanged.
- [x] Existing OpenspecContext tests pass without modification.

### 5. Evaluate FsContext

- [x] Determine whether `useFsBrowse` matches the cached-per-cwd shape.
- [x] If yes, migrate; if no, leave a code comment in `FsContext` explaining why it doesn't fit.

### 6. Verification

- [x] `npx openspec validate cwd-query-store-extract --strict`.
