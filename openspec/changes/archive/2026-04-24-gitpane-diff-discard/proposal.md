# gitpane-diff-discard

## Why

`gitpane-feature-parity-with-prototype` landed Tier 1 + 2 but deferred
Tier 3: the Discard / Stage hunk buttons in the diff modal. Prototype
`F.html` shows both. Ship the simpler half now (per-file Discard) and
keep Stage hunk separate — its UX is substantially more complex and
can ride its own design round.

| Feature | Prototype | Current | This change |
|---|---|---|---|
| Discard (per-file `git checkout -- <file>`) | ✅ | ❌ | ✅ ship |
| Stage hunk (sub-patch `git apply --cached`) | ✅ | ❌ | ❌ defer |

## What changes

### Server

- Add `GitService.discardFile(cwd, file): Promise<{ ok: true } | { error }>`
  → shells `git checkout -- <file>` (paths validated via rawGit).
- Shared schemas `gitDiscardFilePayloadSchema` / `gitDiscardFileResultSchema`.
- New RPC `git:discardFile` handler in `server/src/socket/handlers/git.ts`,
  guarded by `ensureWithinRoots`.

### Client

- `useGitActions()` gains `discardFile(cwd, file)`.
- `DiffModal` grows a **Discard** button (destructive styling: red,
  secondary variant) with `AlertConfirmDialog`-style inline confirm
  (or `window.confirm` if that pattern doesn't exist) — discarding
  local edits is irreversible.
- On success: toast `Discarded <file>`; close modal. `git:dirty`
  broadcast auto-refreshes the changes list via existing central
  handler.

### Stage hunk — why deferred

Stage hunk is a separate change because:
1. Needs hunk selection UI (which hunk are we staging? all? one?).
2. Needs to generate a sub-patch from the displayed diff and pipe to
   `git apply --cached` — non-trivial parsing.
3. UX story isn't settled — prototype shows a single "Stage hunk"
   button but the file-level diff contains multiple hunks; behavior
   when clicked is ambiguous (stage all shown? stage the one in
   viewport?).

Decision: ship Discard now (one RPC, one button, one confirm), scope
Stage hunk into its own `gitpane-stage-hunk` change later.

## Out of scope

- Stage hunk (separate change).
- Interactive hunk selection.
- Undo discard (there's no git primitive for this — the modal's
  confirm is the last-chance UX).

## Design notes

### Confirm flow

`window.confirm` is already used for `ArchiveWorktreeConfirmDialog`'s
"dirty" second step, but mostly the codebase uses proper React
dialogs. Since DiffModal is itself a Dialog, layering another Dialog
on top is noisy. Options:

- **A. Inline confirm**: clicking Discard flips the button to
  "Confirm discard?" for a brief window (3s) before reverting. One
  state, one button, no extra Dialog. Precedent: not in codebase.
- **B. Two-click**: first click swaps label to "Click again to
  confirm"; second click within 3s actually discards. Same idea as A,
  even simpler.
- **C. `ConfirmDialog`**: reuse existing `ArchiveWorktreeConfirmDialog`
  / `RemoveWorktreeConfirmDialog` style. Heaviest but most familiar
  to users.

Recommend **B** (two-click) — cheap to implement, reversible by
moving mouse away, no Dialog stacking. Will pattern-test in Tier 3.1
before generalizing.

### `discardFile` scope

`git checkout -- <file>` reverts **unstaged** changes in the working
tree to index (or HEAD if unstaged). It does NOT unstage files;
that would be `git restore --staged` or `git reset HEAD`. For now
discard = "throw away my unstaged edits to this file." If the file
has staged changes they stay staged. This matches the prototype's
`git checkout -- <file>` comment.

Edge: if the file is a new untracked file (`status === '??'`),
`git checkout --` is a no-op. We should either `git clean -f <file>`
(destructive — removes the file) or refuse to discard new files in
the UI. **Refuse** is safer: show the button disabled with tooltip
"New file — delete manually". Matches user expectation: discard =
revert, not delete.

### Wire protocol

```
git:discardFile { cwd, file }      → { ok: true } | { error: string }
```

## TDD

Server:
- `git.test.ts` → discardFile RPC happy path; `ensureWithinRoots`
  rejection; error bubbling.
- `FakeGitService.discardFile` test-knobs.

Client:
- `GitPane.test.tsx` / `DiffModal.test.tsx`: Discard button renders;
  first click swaps to "Confirm"; second click calls RPC.
- Disabled state for untracked (`??`) files.

Steps:
1. Schemas + events.
2. Summoner `discardFile` + Fake + Local.
3. Server handler + test.
4. Client action + DiffModal button + tests.
