## Why

With the right-column shell shipping (`files-git-right-pane-shell`) and dirty broadcasts arriving (`fs-git-watch-service`), the Git tab can show **live worktree git state**: current branch + ahead/behind, list of changed files, per-file diff. The goal stated during exploration was simply **"先看變化"** — make it easy to see what's changed, not yet to commit or push.

Today the server already exposes everything we need:
- `git:status` → branch, isClean, `changedFiles` (with file-level status)
- `git:diff` → unified diff string
- `worktree:branchChanged` / `git:dirty` broadcasts

What's missing is the UI: a Git tab that consumes the hooks, renders the section structure F.html prescribes (Branch / Changes / Actions placeholder), and presents structured diffs per file.

Write operations (stage / unstage / commit / fetch / pull / push) are deliberately deferred to `git-stage-commit` and `git-remote` future changes. This keeps the scope tight and ships user value — live status + diff viewing — without the GitService stage/commit API lift.

## What Changes

- Add **`<GitPane>`** component rendered inside RightPane's Git tab. Takes `cwd` from the shell's `useActiveCwd`.
- Render the **Branch section**: current branch badge (`⎇ name`), ahead/behind counters (`↑N` / `↓N` / `up to date`), branch-switch trigger reusing the existing `<BranchPopover>` (from worktree-tree-ui).
- Render the **Changes section**: each modified file as a row (mark badge M/U/A/D + monospace path), clicking opens `<DiffModal>`.
- Render the **Actions section** as a **disabled placeholder row** (Fetch / Pull / Push buttons rendered but disabled with a tooltip "Coming soon"). Explicit placeholder gives a preview of where writes will land without faking capability.
- Add **`<DiffModal>`** — renders the unified diff from `git:diff` with add/del/hunk styling, file header, stats (`+N / -M`), close action. Reuses `<DiffViewer>` logic where sensible (note: existing `DiffViewer` is for AI-modified files; extract a shared diff-rendering util if the overlap warrants).
- Handle `cwd === null` → EmptyState "No active project".
- Handle `git:status` returning `not_a_repo` for cwds that aren't git → show "Not a git repository" + reuse the existing "Initialize as git repo" action (already wired in the project sidebar).
- Subscribe to `EVENTS.fs.gitDirty` → re-fetch `git:status` when the pane's cwd is signaled.
- Subscribe to `EVENTS.worktree.branchChanged` → re-fetch `git:status` (or update in place).

Explicitly out of scope:
- Stage / unstage / commit UI → `git-stage-commit`.
- Remote operations (fetch / pull / push) → `git-remote`.
- Inline diff editing / applying hunks.
- Conflict resolution UI.
- Per-file git blame / history.

## Capabilities

### New Capabilities
- `git-pane`: the Git tab content inside `RightPane`. Covers branch display, changed-file list, diff modal, live refresh on dirty broadcasts.

### Modified Capabilities
- `workspace-right-pane`: the Git tab body changes from a placeholder to the real `<GitPane>`. Spec tab remains a placeholder.

## Impact

**Affected code (new):**
- `apps/web/src/components/GitPane.tsx`
- `apps/web/src/components/DiffModal.tsx`
- `apps/web/src/components/__tests__/GitPane.test.tsx`
- `apps/web/src/components/__tests__/DiffModal.test.tsx`
- Maybe: `apps/web/src/utils/parse-unified-diff.ts` — extracted if we share logic with the existing `DiffViewer`.

**Affected code (modified):**
- `apps/web/src/components/RightPane.tsx` (from shell change) — render `<GitPane cwd={cwd} />` inside the Git tab body.
- Existing `DiffViewer.tsx` — if we extract parse logic, update imports; no behavior change to the ModifiedFilesPanel flow.

**Dependencies on other changes:**
- Requires `files-git-right-pane-shell` (for RightPane + useActiveCwd).
- Benefits from `fs-git-watch-service` (`git:dirty` broadcast) — without it, status only refreshes on pane remount or branch-change broadcast.
- Reuses `<BranchPopover>` already shipped in worktree-tree-ui.

**Risk:** low-to-medium.
- `git:diff` returns a raw string for the whole working tree; for large diffs (thousands of lines) we either paginate by file or truncate. Decision: truncate per-file at 5000 lines, show "truncated — open externally" hint.
- `DiffViewer` (existing) is built around AI-modification events. Extracting parse logic might ripple; we'll keep changes local and only share pure parse if the overlap is >50% of lines.
- `not_a_repo` state must be handled distinctly; we reuse the existing `worktree:initRepo` RPC and broadcast for the Init action — no new server code.
