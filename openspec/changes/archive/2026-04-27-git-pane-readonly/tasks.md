## 1. Shared diff parser (if extracting)

- [x] 1.1 Audit existing `DiffViewer.tsx` parse logic; decide extract vs duplicate.
- [x] 1.2 If extracting: Red → add `parse-unified-diff.test.ts` with cases (single file, multiple files, binary marker, rename header, empty diff, truncation).
- [x] 1.3 Green: move pure parse into `apps/web/src/utils/parse-unified-diff.ts`; update `DiffViewer.tsx` to import from there.
- [x] 1.4 Run affected tests — green.

## 2. DiffModal

- [x] 2.1 Red: new `DiffModal.test.tsx`:
  - renders parsed lines with add/del/hunk styling
  - header shows path + `+N -M` stats
  - binary marker → fallback panel
  - >5000 lines in a file → truncation notice + first 500 lines + Copy-path
  - Copy-path writes to clipboard
  - close actions (Esc, backdrop, button)
- [x] 2.2 Green: implement `DiffModal.tsx` using Dialog + parseUnifiedDiff + line components.
- [x] 2.3 Run modal tests — green.

## 3. GitPane core

- [x] 3.1 Red: new `GitPane.test.tsx` cases (use FakeSummoner for socket):
  - `cwd={null}` → EmptyState
  - `cwd="/repo"` + `not_a_repo` response → not-a-repo EmptyState with Init CTA
  - `cwd="/repo"` + clean status → "No changes" in Changes section
  - `cwd="/repo"` + dirty status → file rows with correct marks
  - Branch display: up-to-date / ahead / behind / both / no upstream
  - Click a file row → DiffModal opens with correct chunk
  - Init CTA calls `worktree:initRepo`
  - Placeholder buttons (Fetch/Pull/Push) render with `aria-disabled="true"`; clicking does not RPC
- [x] 3.2 Green: implement `GitPane.tsx`:
  - `useGitStatus(cwd)` hook (small wrapper around `git:status` RPC)
  - render Branch / Changes / Actions sections
  - reuse `<BranchPopover>` for the switch button
  - Changes rows call `openDiffModal(path)` which fetches `git:diff` once per open
- [x] 3.3 Run GitPane tests — green.

## 4. Live refresh

- [x] 4.1 Red: in GitPane.test.tsx, add:
  - `git:dirty` broadcast for matching cwd → `git:status` refetched (assert via FakeSummoner mock fire count)
  - `worktree:branchChanged` broadcast → same refetch
  - broadcast for non-matching cwd → no refetch
  - unmount cleans up listeners
- [x] 4.2 Green: wire `useEffect` + `socket.on(EVENTS.fs.gitDirty, ...)` / `EVENTS.worktree.branchChanged` in `GitPane.tsx`.
- [x] 4.3 Run tests — green.

## 5. Wire into RightPane

- [x] 5.1 Red: update `RightPane.test.tsx` — Git tab body renders `GitPane` (sentinel `data-testid="git-pane"`).
- [x] 5.2 Green: swap placeholder for `<GitPane cwd={useActiveCwd()} />` in RightPane's Git tab.
- [x] 5.3 Run RightPane tests — green.

## 6. Verify

- [x] 6.1 `pnpm --filter @code-quest/client exec tsc --noEmit` clean.
- [x] 6.2 `pnpm --filter @code-quest/client exec vitest run` — all pass.
- [x] 6.3 biome check on touched files.

## 7. Manual QA (deferred)

- [~] 7.1 Open cc-office dev server; RightPane Git tab shows current branch + change list.
- [~] 7.2 Click a changed file → DiffModal renders correct add/del highlighting.
- [~] 7.3 Switch branch via popover → pane refreshes with new branch.
- [~] 7.4 Externally `git commit` → pane updates within ~200ms (with `fs-git-watch-service` merged).
- [~] 7.5 Open RightPane on a non-git folder → "Initialize as git repo" works.

## 8. Finalize

- [x] 8.1 Commit: `feat(git-pane): read-only status + diff for active worktree`.
- [x] 8.2 Ready to `/opsx:archive git-pane-readonly` once merged.
