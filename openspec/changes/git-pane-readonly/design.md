## Context

All server-side primitives exist:
- `git:status(cwd) → { branch, isClean, changedFiles[], ahead, behind }`  
- `git:diff(cwd) → string` (unified diff for the whole working tree)
- `worktree:initRepo(cwd) → { ok, branch } | { error }`
- Broadcasts: `worktree:branchChanged`, and (after `fs-git-watch-service`) `git:dirty`

All reused client pieces exist:
- `<BranchPopover>` — worktree-tree-ui
- `<DiffViewer>` — ModifiedFilesPanel (though different intent; see Decision 3)
- `useActiveCwd` — shell change

The Git pane is **composition + click-to-diff UI** on top of these.

## Goals / Non-Goals

**Goals:**
- Branch badge + ahead/behind + switch button (reuse BranchPopover).
- Changes list with mark + path; click → DiffModal with rendered unified diff.
- Live refresh on `git:dirty` and `worktree:branchChanged`.
- Empty states: no cwd, not-a-repo (+ Init CTA), clean repo.
- Actions row is rendered but disabled (placeholder for future writes).

**Non-Goals:**
- Any write: stage, unstage, commit, discard — future.
- Fetch / pull / push.
- Inline diff editing / hunk operations.
- Branch creation (already in worktree-create flow).
- Stash UI.

## Decisions

### 1. Ahead/behind source

`git:status` returns `ahead: number` / `behind: number` fields. We display:
- `ahead === 0 && behind === 0` → `up to date`
- `ahead > 0 && behind === 0` → `↑N`
- `ahead === 0 && behind > 0` → `↓N`
- both > 0 → `↑N ↓M`
- `ahead`/`behind` undefined (no upstream) → `(no upstream)`

Already available from simple-git; no server-side work.

### 2. Changed file status marks

Simple-git returns status codes per file (e.g. `M`, `A`, `D`, `R`, `?`). We map to short visual marks:
- `M` → modified (amber)
- `A` → added (green)
- `D` → deleted (red)
- `R` → renamed (blue)
- `?` or `U` → untracked (green, fainter)
- Others → neutral grey

Colors come from existing semantic tokens (`text-warning`, `text-success`, `text-danger`).

### 3. DiffViewer reuse vs DiffModal fresh

Current `DiffViewer`:
- Parses a unified-diff string and renders colored lines.
- Exposes Accept / Reject / Edit buttons (AI-modification workflow).

Git-pane DiffModal needs:
- The same line parsing + coloring.
- No Accept/Reject — instead: Copy path / Open file / (future) Stage hunk.

**Decision:** extract pure parse function (`parseUnifiedDiff(input: string): DiffLine[]`) into `packages/client/src/utils/parse-unified-diff.ts` if the existing implementation has ≥80% of what we need. Otherwise, duplicate (small) and revisit.

`<DiffModal>` composes:
```
<Dialog>
  <Header>📄 path  +N -M  [close]</Header>
  <Body>
    {lines.map(line => <DiffLine ... />)}
  </Body>
  <Actions>[Copy path] [Open file]</Actions>
</Dialog>
```

### 4. Large diff handling

`git:diff` returns the full working-tree diff as one string. For 1000+ line diffs we must not render all lines in one modal. Strategy:
- **Pre-split** the diff by `diff --git` headers into per-file chunks.
- Modal renders one file at a time (the clicked file's chunk).
- If a single file's chunk exceeds 5000 lines: render the first 500 lines + 400 char tail snippet + a "diff truncated" hint with `Copy path` to open externally.

### 5. Not-a-repo state — reuse existing Init flow

`<GitPane>` handles `git:status` returning `not_a_repo`:
```
┌─────────────────────────────┐
│  ⎇                          │
│  Not a git repository       │
│  [Initialize as git repo]   │
└─────────────────────────────┘
```

Button invokes `worktree:initRepo(cwd)` (already wired in the project sidebar for `NOT_A_REPO` listings). Broadcast `worktree:added` / `git:dirty` will cause the pane to re-render with real state.

### 6. Refresh triggers

```
useEffect(() => {
  const off1 = socket.on(EVENTS.fs.gitDirty, ({ cwd: c }) => c === cwd && refetch());
  const off2 = socket.on(EVENTS.worktree.branchChanged, ({ cwd: c }) => c === cwd && refetch());
  return () => { off1(); off2(); };
}, [cwd, socket, refetch]);
```

Both events trigger `refetch()` which fires `git:status` again. Simple, idempotent.

### 7. Query layer

Same approach as Files pane — a small `useGitStatus(cwd)` hook that wraps the socket RPC and exposes `{ data, refetch, isLoading, error }`. Could use existing query infra if it fits; otherwise a ~30-line hook is enough.

### 8. Placeholder Actions row

Three disabled `<button>`s with tooltips "Coming soon":
- Fetch
- Pull  
- Push

Renders grey and has `aria-disabled="true"`. Explicitly **not** `<button disabled>` because disabled buttons aren't focusable and we want keyboard users to discover the tooltip. Use `onClick` no-op + `aria-disabled`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Huge repo `git:diff` returns megabytes | Per-file chunking + 5000-line truncation. Future work: server-side per-file diff. |
| Renames (`R`) rendered as delete+add in raw diff | `git:status` already surfaces renames as `R`; the row shows `oldPath → newPath`. Diff modal uses simple-git's unified-diff which handles the rename header. |
| Binary files | `git:diff` emits "Binary files ... differ"; we detect that header and render a short "Binary file changed" panel in the modal. |
| Diff parse divergence between AI-modification flow and git flow | Shared pure parse function with unit tests; divergent UI (accept/reject vs copy/open) lives in the wrappers. |
| Live refresh flickers (fetch in flight when a new dirty event arrives) | Simple debounce-cancel: new refetch cancels prior in-flight; last-write-wins semantics acceptable for displayed status. |
| Without `fs-git-watch-service`, pane goes stale | Accepted gap. Branch-change still covered by `worktree:branchChanged`. Users can toggle the pane or switch tabs to force refresh. |

## TDD Order

1. Red → Green: `parseUnifiedDiff` util + tests (if extracted).
2. Red → Green: `<DiffModal>` — renders parsed lines, header, copy-path; handles binary-file marker; handles 5000-line truncation.
3. Red → Green: `<GitPane>` core states:
   - null cwd → EmptyState
   - not-a-repo → Init CTA wiring
   - clean repo → "no changes" empty state inside Changes section
   - dirty repo → file rows with correct marks; click opens DiffModal
4. Red → Green: `<GitPane>` refresh — `git:dirty` and `worktree:branchChanged` trigger refetch.
5. Red → Green: Actions row renders 3 disabled buttons with tooltips.
6. Red → Green: wire GitPane into RightPane's Git tab; update RightPane test.
7. Verify: full client suite green; biome + tsc clean.
