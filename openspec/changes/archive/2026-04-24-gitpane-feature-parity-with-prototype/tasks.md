# tasks

## Tier 1 — small UX wins (no server work)

### Changes count in header
- [ ] Red test: `GitPane` renders "Changes (3)" when data has 3
  `changedFiles`; renders "Changes (0)" or no header when clean.
- [ ] Update `GitPane.tsx` section header to include
  `{status.changedFiles.length}`.

### Commit button label with count
- [ ] Red test: `CommitComposer` button text is `Commit 3` when
  `count=3`; `Commit` (or disabled "no changes") when `count=0`.
- [ ] Pass `count` prop (or derive from `changedFiles.length` inside
  GitPane) and render it in the button.

### In-pane branch switcher
- [ ] Red test: `GitPane` has a "switch" affordance next to branch
  name; clicking opens `BranchPopover`.
- [ ] Red test: selecting a branch from the popover fires
  `git.checkout` with the pane's cwd + selected branch.
- [ ] Import `BranchPopover`; mount on click; wire `onSelect` →
  `useGitActions().checkout(cwd, branch)`; toast success/error.

## Tier 2 — Fetch / Pull RPCs

### Shared schemas
- [ ] Add `gitFetchPayloadSchema` / `gitFetchResultSchema` and
  `gitPullPayloadSchema` / `gitPullResultSchema` to
  `shared/src/schemas/git.ts`.
- [ ] Register `git:fetch` / `git:pull` events in
  `shared/src/socket-events.ts`.

### Summoner GitService
- [ ] Add `fetch(cwd): Promise<{ updated: number }>` to GitService
  interface.
- [ ] Add `pull(cwd): Promise<{ fastForwarded: boolean }>` to
  GitService interface; throw tagged error for non-FF.
- [ ] Implement in `LocalGitService` (shell out to `git fetch` /
  `git pull --ff-only`).
- [ ] Add `FakeGitService.fetch` / `pull` helpers + error knobs for
  tests.

### Server handler
- [ ] Red test: `git.test.ts` → `git:fetch` happy path returns
  `{ ok: true, updated }`.
- [ ] Red test: non-FF pull returns `{ error: 'non-ff' }`.
- [ ] Implement handlers in `server/src/socket/handlers/git.ts`.

### Client wiring
- [ ] Add `fetch(cwd)` / `pull(cwd)` to `useGitActions()`.
- [ ] Red test: `GitPane.test.tsx` — clicking Fetch triggers
  `git:fetch` RPC.
- [ ] Red test: clicking Pull on non-FF shows the "resolve manually"
  toast.
- [ ] Replace `GitPane`'s Fetch/Pull `disabled` placeholders with
  real onClick handlers + toasts.

## Verify
- [ ] Full client vitest + tsc green.
- [ ] Full server vitest + tsc green.
- [ ] Manual smoke: open a worktree with a changed file and a remote
  branch ahead; confirm count, switcher, fetch, pull all work.

## Out (separate change later)
- `gitpane-diff-discard`: Discard (per-file) + Stage hunk in DiffModal.
