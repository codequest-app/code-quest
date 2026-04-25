# gitpane-feature-parity-with-prototype

## Why

`docs/prototype/F.html` (the direction we picked) defines a Git pane
with three sections: Branch, Changes, Actions. The current
`GitPane.tsx` implements most of Changes + Push, but is missing or
degraded on the rest:

| Feature | Prototype | Current |
|---|---|---|
| Branch switcher (popover → `git checkout`) | ✅ | ❌ no entry point |
| Fetch / Pull | ✅ mock | ❌ disabled "Coming soon" |
| Changes count in header `Changes (N)` | ✅ | ❌ just "Changes" |
| Commit button label `Commit N` | ✅ | ❌ just "Commit" |
| Diff modal — Stage hunk / Discard | ✅ | ❌ only Close |

## What changes

Split into two tiers by risk, so we can ship the low-risk ones
independently if higher-risk ones need more design work.

### Tier 1 — small UX wins (low risk, no server work)

- **Changes count in header**: `Changes (N)` where N = changed files.
- **Commit button label**: `Commit N` instead of just "Commit"
  (update `CommitComposer`).
- **Branch switcher in-pane**: a "switch ⌄" affordance next to the
  branch name opens a popover listing branches (reuse existing
  `BranchPopover` component + `git.branches` + `git.checkout` RPCs
  already wired through `GitProvider`).

### Tier 2 — new server RPCs (medium risk)

- **Fetch**: new `git:fetch` RPC. Minimal: fetches all remotes; no
  credential prompts (use default ssh-agent / system config).
  Result: `{ ok: true, updated: number } | { error }`.
- **Pull**: new `git:pull` RPC. Strict fast-forward-only to sidestep
  merge-conflict UX. On non-FF, return `{ error: 'non-ff' }` and toast
  telling user to resolve manually. Result mirrors fetch's shape plus
  a `{ error: 'non-ff' }` variant.

GitPane activates Fetch/Pull buttons (dropping the "Coming soon"
placeholder).

### Tier 3 — diff-modal enhancements (deferred; design work first)

- **Discard** (per-file): `git checkout -- <file>` RPC. One RPC,
  straightforward.
- **Stage hunk**: requires parsing the diff, selecting a hunk,
  generating a sub-patch, piping to `git apply --cached`. Complex
  UX (which hunk, can multiple be selected, …). Defer.

We'll scope this change to Tiers 1 + 2. Tier 3 is out — flagged for a
separate `gitpane-diff-discard` change after Tier 2 ships.

## Out of scope

- Stage hunk (Tier 3 above).
- Per-file discard (pull into `gitpane-diff-discard` after Tier 2).
- Branch create from popover (existing `CreateWorktreeDialog` handles
  new branches via worktrees; in-pane branch creation would duplicate).
- Credential / auth prompts for fetch/pull.
- Pull with merge/rebase — FF-only intentional.

## Design notes

### Branch switcher placement

Prototype puts "switch ⌄" inline on the Branch section header.
WorktreeChildList already has a `BranchPopover` triggered from each
worktree row's branch badge. That popover is tied to worktree
identity (changing a worktree's branch). The in-pane switcher in
GitPane is the SAME operation from a different entry point — clicking
either should end in the same `git.checkout` RPC on the pane's cwd.
Reuse `BranchPopover` component as-is, mount with the pane's cwd.

### Fetch / Pull failure surfaces

- Network error: toast "Fetch failed: \<message\>"
- Non-FF on pull: toast "Pull rejected (non-FF). Run `git pull
  --rebase` manually." — no auto-retry.
- Auth required: toast "Auth required. Configure credentials
  manually." (don't prompt in-UI.)

### Wire protocol

```
git:fetch  { cwd }            → { ok: true; updated?: number } | { error }
git:pull   { cwd }            → { ok: true; fastForwarded: boolean }
                              | { error: 'non-ff' | 'no-upstream' | string }
```

## TDD approach

Tier 1 (client-only):
- `GitPane.test.tsx`: "Changes (3)" appears when 3 files changed.
- `CommitComposer.test.tsx` (or inline in GitPane): button label
  tracks count.
- `GitPane.test.tsx`: clicking "switch ⌄" opens BranchPopover and
  selecting a branch calls `git.checkout`.

Tier 2:
- Server `git.test.ts`: fetch handler returns `{ ok, updated }`;
  error mapping for network failures.
- Server `git.test.ts`: pull handler FF happy path; non-FF error
  mapping.
- `GitPane.test.tsx`: clicking Fetch / Pull triggers the right RPC
  and shows appropriate toast.

Steps:
1. Tier 1, smallest first (count labels).
2. Tier 1 branch switcher (mostly wiring existing BranchPopover).
3. Tier 2 server handlers + GitService methods.
4. Tier 2 client buttons.
