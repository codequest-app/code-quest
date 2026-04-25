## Why

`git-pane-readonly` shipped the visual: branch label, change list, diff modal. The Actions row renders Fetch / Pull / Push as disabled placeholders. F.html's design and the explicit "missing list" both call for the write side: stage / unstage / commit / fetch / pull / push.

These are the day-to-day actions. With them, the Git pane becomes useful for self-driving work; without, the user still has to drop to a terminal.

## What Changes

### Backend (summoner GitService + server handlers)
- Add to `GitService`:
  - `stage(cwd, paths: string[])` → `git add -- <paths>`
  - `unstage(cwd, paths: string[])` → `git reset HEAD -- <paths>`
  - `commit(cwd, message)` → `git commit -m`. Returns `{ ok, hash } | { error: 'nothing-to-commit' | string }`.
  - `fetch(cwd, remote='origin')` → `git fetch <remote>`
  - `pull(cwd)` → `git pull --ff-only` (refuse non-FF). Returns `{ ok, summary } | { error: 'non-ff' | 'conflict' | string }`.
  - `push(cwd)` → `git push`. Returns `{ ok } | { error: 'rejected' | 'no-upstream' | string }`.
- New global socket events `git:stage / unstage / commit / fetch / pull / push` (ByCwd pattern, mirrors `git:statusByCwd`).
- All write paths broadcast `git:dirty { cwd }` after success so the pane refreshes.

### Frontend
- Extend GitPane:
  - File rows get a checkbox (or click-toggle) for staging selection.
  - Header above changes: "Stage all" / "Unstage all" buttons; selection count.
  - Commit composer: collapsed input that expands on focus; subject line + optional body; Commit button disabled until message + ≥1 staged file.
  - Replace Fetch/Pull/Push placeholder buttons with real handlers; show spinner while in flight; toast errors with typed messages (non-ff hint, conflict notice).
- Confirm dialogs:
  - **Pull conflict / non-FF** → small modal with "Open terminal" hint (no auto-merge UI).
  - **Push rejected (non-FF)** → modal with "Pull first?" suggestion.

Out of scope:
- Interactive rebase / merge UI.
- Discard changes (separate change — destructive needs careful UX).
- Hunk-level staging.
- Force push (intentional; high-risk action).

## Impact

**New:**
- 5 server handlers, 5 client RPC wrappers in `useGitStatus` or a new `useGitWrites`.
- `<CommitComposer>`, `<PullConflictDialog>`, `<PushRejectedDialog>`.

**Modified:**
- `GitPane.tsx` — selection state, Actions row real wiring.
- `GitService` interface + Local + Fake.
- `git.ts` handler + worktree.ts (none).

**Risk:** medium-high.
- Pull/push surface non-trivial git error states. v1 returns typed errors and shows a hint, not auto-resolve.
- Commit hooks can fail mid-run; surface stderr in a toast.
- Need to test FakeGitService behavior parity with real git carefully.
