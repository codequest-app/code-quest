# client-context-stores Specification

## Purpose
TBD - created by archiving change cwd-query-store-extract. Update Purpose after archive.
## Requirements
### Requirement: createCwdQueryStore factory SHALL provide the per-cwd cached external-store pattern

A factory `createCwdQueryStore<TRaw, TData>({ fetch, dirtyEvent, parse, getCwdFromDirtyPayload })` SHALL be provided in `apps/web/src/contexts/lib/createCwdQueryStore.ts`. It returns `{ useStoreValue, refetch, clear }`. The factory SHALL keep an internal per-cwd cache, dedup concurrent fetches for the same cwd, and refetch the matching entry when the named dirty event fires.

#### Scenario: First mount triggers a fetch

- **WHEN** `useStoreValue(cwd)` mounts for a cwd not present in the cache
- **THEN** the factory invokes `fetch(cwd)` exactly once and exposes `loading: true` until it resolves

#### Scenario: Concurrent mounts dedup

- **WHEN** two components mount `useStoreValue(cwd)` for the same `cwd` while a fetch is inflight
- **THEN** only one `fetch(cwd)` call is made and both components observe the same resolved value

#### Scenario: Dirty event refetches the matching cwd

- **WHEN** the configured `dirtyEvent` fires with a payload whose extracted cwd matches a mounted subscriber's cwd
- **THEN** the factory refetches that cwd's entry and notifies subscribers

#### Scenario: Dirty event for an unrelated cwd is ignored

- **WHEN** `dirtyEvent` fires with a payload whose extracted cwd does NOT match any mounted subscriber's cwd
- **THEN** no fetch is triggered

#### Scenario: clear drops the cache entry

- **WHEN** `clear(cwd)` is called and then `useStoreValue(cwd)` mounts again
- **THEN** `fetch(cwd)` is invoked again

### Requirement: GitContext and OpenspecContext SHALL consume the factory

`useGitStatus` (in `GitContext`) and `useOpenspecList` (in `OpenspecContext`) SHALL be implemented in terms of `createCwdQueryStore`. Per-context cache maps, inflight-dedup maps, TopicEmitter instances, and dirty-event subscriptions for these stores SHALL NOT exist outside the factory.

#### Scenario: GitContext has no per-context bookkeeping

- **WHEN** the `GitContext.tsx` source is inspected for the `useGitStatus` store
- **THEN** there is no hand-rolled cache map, no hand-rolled inflight map, and no direct `dirtyEvent` subscription — all of these live inside the `createCwdQueryStore` instance

#### Scenario: OpenspecContext has no per-context bookkeeping

- **WHEN** the `OpenspecContext.tsx` source is inspected for the `useOpenspecList` store
- **THEN** there is no hand-rolled cache map, no hand-rolled inflight map, and no direct `dirtyEvent` subscription — all of these live inside the `createCwdQueryStore` instance

#### Scenario: Public hook API unchanged

- **WHEN** any existing consumer of `useGitStatus(cwd)` or `useOpenspecList(cwd)` is rendered
- **THEN** the returned shape (`{ data, loading, error }` or equivalent) is identical to the pre-migration behavior and existing tests pass without modification

