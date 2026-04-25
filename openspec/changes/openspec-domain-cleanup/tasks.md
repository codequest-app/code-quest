## Strategy

Hard-cut migration. tsc + tests guard misses. Per "expect 不變或等價" —
test assertions preserved (renames mechanical).

Order: shared schema/EVENTS → server (handler + reader + broadcaster) →
client (hook + pane subscribe) → verify.

## 1. Shared — rename + schema fix
- [x] 1.1 Rename `schemas/spec.ts` → `schemas/openspec.ts`. Identifiers:
  - `SpecChangeSummary` → `OpenspecChangeSummary` (drop `hasTasks`, replace `taskProgress: [n,m]` with `tasks: { done, total } | null`)
  - `SpecCapabilitySummary` → `OpenspecSpecSummary` (rename to avoid "spec spec" confusion)
  - `SpecListPayload/Result` → `OpenspecListPayload/Result`
  - `SpecReadPayload/Result` → `OpenspecReadPayload/Result`
  - `SpecArtifactKind` → `OpenspecArtifactKind`
- [x] 1.2 EVENTS map: `EVENTS.spec.{list, read}` → `EVENTS.openspec.{list, read, dirty}`.
- [x] 1.3 ClientToServerEvents: rename entries.
- [x] 1.4 ServerToClientEvents: add `openspec:dirty` broadcast `(payload: { cwd: string }) => void`.
- [x] 1.5 `schemas/index.ts` re-exports updated.
- [x] 1.6 `pnpm --filter @code-quest/shared exec tsc --noEmit` clean.

## 2. Server — handler + reader + broadcaster (TDD)
- [x] 2.1 Red: extend `services/__tests__/openspec-reader.test.ts` — assert summary returns `tasks: null` for missing tasks.md, `{done, total}` for present.
- [x] 2.2 Green: update `summarizeChange` to return `tasks` union; drop `hasTasks` field.
- [x] 2.3 Red: extend `services/__tests__/fs-git-dirty-broadcaster.test.ts`:
  - openspec/changes/foo/proposal.md change → both `files:dirty` AND `openspec:dirty` fire to subscribers
  - openspec/specs/auth/spec.md → both fire
  - openspec/changes/archive/x/foo.md → also fires (archive/ classification handled at SpecPane data layer, not at watcher)
  - .git/HEAD → only `git:dirty` (unchanged)
  - src/foo.ts → only `files:dirty` (unchanged)
- [x] 2.4 Green: change `classify(path)` to return `Set<'git' | 'openspec' | 'files' | 'drop'>`. Path inside `^openspec/` → add `'openspec'` to set. Same path also still triggers `'files'` (file tree refresh).
- [x] 2.5 Update `flush()` to iterate set and emit per kind. Buffers: gitDirty boolean stays; add openspecDirty boolean (no paths needed — payload is just {cwd}).
- [x] 2.6 Rename `handlers/spec.ts` → `handlers/openspec.ts`, update event references.
- [x] 2.7 `socket/server.ts`: register `openspec.create(ctx)` (rename).
- [x] 2.8 Server tsc + vitest green.

## 3. Client — hook + SpecPane subscription
- [x] 3.1 Rename `hooks/useSpecList.ts` → `hooks/useOpenspecList.ts`; switch EVENTS reference.
- [x] 3.2 SpecPane: subscribe to `EVENTS.openspec.dirty`; on match (cwd === pane's cwd) call `refetch()`.
- [x] 3.3 SpecModal: render task progress from `tasks` union (`tasks ? `${tasks.done}/${tasks.total}` : '—'`).
- [x] 3.4 Component file names (SpecPane / SpecModal) stay — UI doesn't surface "openspec" terminology to user.

## 4. Verify
- [x] 4.1 client + server + shared tsc green.
- [x] 4.2 client + server vitest green; test assertions preserved per "expect 不變或等價".
- [x] 4.3 biome check on touched files.

## 5. Finalize
- [x] 5.1 Commit.
