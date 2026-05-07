## Why

Server has two handlers for the same underlying service (`GitService`), with overlapping events and an abstraction that doesn't match git's own model:

```
worktree handler (9 events)              git handler (8 events)
─────────────────────────────            ─────────────────────────
list / create / delete                   status / diff / log / checkout    (per-channel)
rename / archive / initRepo              statusByCwd / diffByCwd           (per-cwd)
listBranches                             stageAll / commit / push          (per-cwd)
checkout    ← duplicates git:checkout
status      ← duplicates git:status (smaller payload)
```

Three sources of pain:

1. **Abstraction leak** — `worktree` is a git subtopic (`git worktree add ...`), not a peer entity. The split implies "tree management" and "git ops" are different concerns; they aren't.
2. **Three `checkout` events**, three `status` events. Clients have to remember which one to call from which UI surface.
3. **Channel-scoped variants** are vestigial — they exist because early git ops were called from inside chat handlers. Now most consumers want cwd-based access (RightPane, sidebar), and the cwd contract (`right-pane-cwd-scope`) makes channel-scoping unnecessary.

The result feels like a domain we built up event-by-event instead of designed once. Time to consolidate.

## What Changes

### Single `git` handler, event names mirror `git` CLI

```
git:init({cwd})                              ← was worktree:initRepo

git:worktree:list({cwd})                     ← was worktree:list
git:worktree:add({cwd, name?, existingBranch?, newBranch?, baseBranch?, path?})
                                             ← was worktree:create
git:worktree:remove({cwd, name, force?})    ← merges worktree:delete + archive
git:worktree:rename({cwd, name})             ← was worktree:rename

git:branches({cwd})                          ← was worktree:listBranches
git:checkout({cwd, branch})                  ← consolidates 3 entries

git:status({cwd})                            ← full payload (was statusByCwd)
git:statusSummary({cwd})                     ← {branch, isClean, changedFilesCount}; was worktree:status
git:diff({cwd})                              ← was diffByCwd
git:log({cwd, limit?})
git:stageAll({cwd})
git:commit({cwd, message})
git:push({cwd})
```

### Migration plan
- Server: keep `worktree` handler file as a thin alias layer for one release (forwards old events to new), then remove. Or hard-cut if confident — see below.
- Client: rename event calls + payload field tweaks. Mostly mechanical.
- Tests: rename event constants, fix payload shapes, no behavior changes.

### Removed
- `worktree:list / create / delete / archive / rename / initRepo / listBranches / checkout / status` (9)
- `git:status / diff / log / checkout` channel-scoped variants (4)
- `git:statusByCwd / diffByCwd` (renamed to `git:status / diff` since channel variants gone)

### Out of scope
- File / explorer handler boundary (separate discussion).
- Git pull / fetch / merge UI (deferred — non-FF UX needs design).
- Hunk-level staging.

## Capabilities

### Modified Capabilities
- `git-operations` (new name for the consolidated capability; was split between `worktree-management` and `git-pane-readonly` capabilities). All git CLI parity events live under one namespace.

## Impact

**Modified — server:**
- `apps/server/src/socket/handlers/git.ts` — absorbs all worktree ops; renames internal handlers to match new event names
- `apps/server/src/socket/handlers/worktree.ts` — **deleted** (or kept as alias layer for one release; see Migration)
- `apps/server/src/socket/server.ts` — drops `worktree.create(ctx)` registration

**Modified — shared:**
- `packages/shared/src/schemas/git.ts` — payload schemas for all consolidated events
- `packages/shared/src/schemas/worktree.ts` — **deleted** (move types into `git.ts`)
- `packages/shared/src/socket-events.ts` — `EVENTS.git.*` map gains nested `worktree` namespace; `EVENTS.worktree.*` removed

**Modified — client:**
- `apps/web/src/contexts/WorktreeContext.tsx` — actions call new event names
- `apps/web/src/hooks/useGitStatus.ts` — `EVENTS.git.statusByCwd` → `EVENTS.git.status`
- `apps/web/src/components/GitPane.tsx` — same renames
- `apps/web/src/components/WorktreeRow.tsx` (consumers of dirty count) — switch from `worktree:status` to `git:statusSummary`
- `apps/web/src/components/BranchPopover.tsx` (or its callers) — `worktree:listBranches` → `git:branches`, `worktree:checkout` → `git:checkout`

**Test impact:** all client + server tests touching event names need rename. ~30-40 test cases mechanical edits. Behavior tests stay valid.

**Risk:** medium.
- Large surface (rename across many files) — easy to miss a consumer; tsc + tests catch this
- One-shot migration is cleaner than alias layer; I recommend hard-cut + commit-per-event if branch hygiene matters
- Channel-scoped variants removal may surprise chat-side git consumers — verify they're already migrated or migrate them as part of this change
