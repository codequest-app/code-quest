## ADDED Requirements

### Requirement: Git pane displays branch + ahead/behind
`<GitPane>` SHALL show the current branch name and the working-tree's ahead/behind counts, derived from `git:status`.

#### Scenario: Clean tracking branch
- **WHEN** `git:status` returns `{ branch: 'main', ahead: 0, behind: 0, ... }`
- **THEN** the Branch section shows `⎇ main` and the label "up to date".

#### Scenario: Ahead of upstream
- **WHEN** status returns `ahead: 3, behind: 0`
- **THEN** the label shows `↑3`.

#### Scenario: Behind upstream
- **WHEN** status returns `ahead: 0, behind: 2`
- **THEN** the label shows `↓2`.

#### Scenario: Both ahead and behind
- **WHEN** status returns `ahead: 1, behind: 4`
- **THEN** the label shows both counters (e.g. `↑1 ↓4`).

#### Scenario: No upstream configured
- **WHEN** status omits ahead/behind
- **THEN** the label shows `(no upstream)` or an equivalent non-counting string.

### Requirement: Git pane displays changed files with per-status marks
`<GitPane>` SHALL list `changedFiles` from `git:status` with visual marks reflecting each file's state code.

#### Scenario: Dirty repo lists files
- **WHEN** status returns two modified files and one untracked
- **THEN** three rows render: two with an M mark, one with a U (or ?) mark; each row shows the monospace path.

#### Scenario: Clean repo shows empty state
- **WHEN** `changedFiles` is empty AND `isClean` is true
- **THEN** the Changes section renders "No changes" (or equivalent) instead of a file list.

### Requirement: Clicking a file opens a diff modal
Each changed-file row SHALL open `<DiffModal>` for that file on click.

#### Scenario: Click opens per-file diff
- **WHEN** the user clicks a changed-file row for path `src/foo.ts`
- **THEN** `<DiffModal>` opens, fetches `git:diff` if not yet loaded, finds the `diff --git a/src/foo.ts b/src/foo.ts` chunk, and renders its lines.

#### Scenario: Binary file diff renders fallback
- **WHEN** the per-file chunk is "Binary files a/... and b/... differ"
- **THEN** the modal body shows "Binary file changed" with Copy-path action.

#### Scenario: Oversized diff truncates
- **WHEN** a single file's diff exceeds 5000 lines
- **THEN** the modal shows the first 500 lines + a "diff truncated" notice + Copy-path action.

### Requirement: Branch switch via existing BranchPopover
The Branch section SHALL include a switch button that opens `<BranchPopover>` (from worktree-tree-ui) anchored to the button; selecting a branch invokes `worktree:checkout(cwd, branch)`.

#### Scenario: Switch triggers checkout
- **WHEN** the user picks a branch from BranchPopover
- **THEN** `worktree:checkout` is invoked; the pane refreshes on the `worktree:branchChanged` broadcast.

### Requirement: Not-a-repo handling
When `git:status` returns `not_a_repo` for the pane's cwd, `<GitPane>` SHALL render an EmptyState with an "Initialize as git repo" action that invokes `worktree:initRepo`.

#### Scenario: Init CTA initializes the repo
- **WHEN** the user clicks the Init CTA
- **THEN** `worktree:initRepo(cwd)` is invoked; on success (via broadcast), the pane re-fetches `git:status` and switches out of the not-a-repo state.

### Requirement: Live refresh on dirty signals
`<GitPane>` SHALL subscribe to `EVENTS.fs.gitDirty` and `EVENTS.worktree.branchChanged` and refetch `git:status` when the event's cwd matches the pane's cwd.

#### Scenario: git:dirty triggers refetch
- **WHEN** the server broadcasts `git:dirty { cwd }` matching the pane's cwd
- **THEN** `git:status` is refetched; the Branch + Changes sections update.

#### Scenario: branchChanged triggers refetch
- **WHEN** the server broadcasts `worktree:branchChanged { cwd }` matching the pane's cwd
- **THEN** `git:status` is refetched.

#### Scenario: Non-matching cwd is ignored
- **WHEN** a dirty event arrives for a different cwd
- **THEN** the pane does not refetch.

#### Scenario: Subscription cleaned up on unmount
- **WHEN** the pane unmounts OR the cwd changes
- **THEN** the previous listeners are removed.

### Requirement: Actions row is a disabled placeholder
`<GitPane>` SHALL render an Actions section containing `Fetch`, `Pull`, `Push` buttons as placeholders (`aria-disabled="true"`, tooltip "Coming soon"), visually present but non-functional in this change.

#### Scenario: Placeholder buttons do nothing
- **WHEN** the user clicks a placeholder button (Fetch / Pull / Push)
- **THEN** no RPC is issued; a tooltip or toast indicates the feature is not yet available.

#### Scenario: Placeholder buttons are focusable for keyboard a11y
- **WHEN** the user tabs through the pane
- **THEN** the placeholder buttons receive focus and screen readers announce their disabled state.
