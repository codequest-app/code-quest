## Why

Three small openspec-domain issues surfaced during the domain audit:

1. **Wrong namespace name** — handler is `spec` but it serves both `changes/` and
   `specs/`. The actual tool name is `openspec`. Naming undersells and misleads.
2. **Schema split** — change summary has both `hasTasks: boolean` and
   `taskProgress: [n, m]`. Two sources of truth for "does this change have
   tasks?". Client has to combine them. A `tasks: null | {done, total}` union
   is single-source.
3. **No live update** — when openspec/* files change (user edits a proposal,
   AI commits via Edit tool, `openspec new` creates a dir), SpecPane doesn't
   refresh. User has to switch tab to see updates.

All three are openspec-domain concerns; one change.

## What Changes

### Rename `spec:*` → `openspec:*` (CLI alignment)
- `EVENTS.spec.list / read` → `EVENTS.openspec.list / read`
- `handlers/spec.ts` → `handlers/openspec.ts` (still uses OpenspecReader internally)
- `schemas/spec.ts` → `schemas/openspec.ts`
- Client: `useSpecList` → `useOpenspecList`, `SpecPane` / `SpecModal` keep names (UI doesn't surface "openspec" terminology to user)

### Schema: `tasks: null | { done, total }`
```diff
 SpecChangeSummary {
   name
   hasProposal
   hasDesign
-  hasTasks: boolean
-  taskProgress: [number, number]
+  tasks: { done: number; total: number } | null  // null = no tasks.md
 }
```
Client renders `tasks ? `${tasks.done}/${tasks.total}` : '—'` — single check.

### New `openspec:dirty` broadcast
- `FsGitDirtyBroadcaster.classify(path)` returns `Set<'git' | 'openspec' | 'files' | 'drop'>` (was single value).
- Path under `<cwd>/openspec/` matching `proposal.md|design.md|tasks.md|spec.md` (or any md inside openspec dir) returns `{files, openspec}` — fires both events. FilesPane still refreshes the tree, SpecPane refreshes the summary.
- New `EVENTS.openspec.dirty` (broadcast event, payload `{cwd}` — keep symmetric with `git:dirty`).
- SpecPane subscribes via socket to `openspec:dirty` filtered by cwd, refetches `openspec:list` on match.
- Add `openspec:dirty` test cases in `fs-git-dirty-broadcaster.test.ts`.

## Impact

**Modified — server:**
- `services/openspec-reader.ts` — `summarizeChange` returns `tasks: {done,total} | null`; drop `hasTasks` field.
- `services/fs-git-dirty-broadcaster.ts` — classifier returns Set; flush emits per-domain.
- `socket/handlers/spec.ts` → `socket/handlers/openspec.ts` — rename event refs.
- `socket/server.ts` — register `openspec.create(ctx)` (rename from spec).

**Modified — shared:**
- `schemas/spec.ts` → `schemas/openspec.ts` — schema rename + `tasks` union.
- `socket-events.ts` — `EVENTS.spec.*` → `EVENTS.openspec.{list, read, dirty}`; ClientToServerEvents entries renamed; `openspec:dirty` added to ServerToClientEvents.
- `schemas/index.ts` — re-export rename.

**Modified — client:**
- `hooks/useSpecList.ts` — rename to `useOpenspecList.ts`, use new event name.
- `components/SpecPane.tsx` — rename hook import; subscribe `openspec:dirty` for refetch.
- `components/SpecModal.tsx` — use `tasks` union instead of `taskProgress` + `hasTasks`.

**Tests:**
- Existing assertions preserved per "expect 不變或等價".
- New: openspec classify cases in broadcaster test.
- New: SpecPane refetch on `openspec:dirty`.

**Risk:** low.
- All renames mechanical; tsc + tests catch misses.
- `openspec:dirty` is purely additive; existing `files:dirty` consumer (FilesPane) keeps working.
- Schema change has 1 server emitter + 1 client consumer (SpecModal); minimal blast radius.

## Deferred follow-ups (do NOT bundle here)

1. **`openspec-write-ops`** — `openspec:new`, `openspec:archive` (and maybe
   `validate`). Settle first: shell-out vs bundle openspec, UI entry placement,
   error UX (CLI missing / name conflict).
2. **`broadcaster-dedup-channel-vs-socket`** — when the same browser has both
   a chat channel and a socket subscription on the same cwd, dirty events fire
   twice (channel emit + direct socket emit). Wasteful but harmless. Independent
   from openspec.
