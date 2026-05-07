## Why

`packages/client/src/contexts/GitContext.tsx` exposes both `archive(projectCwd, name, opts)` and `remove(cwd, name)` actions — two names for the same `EVENTS.git.worktree.remove` RPC. They diverge in two subtle ways:

1. **Options forwarding.** `archive` accepts `{ skipBranchDelete, force }` and forwards them; `remove` hardcodes `force: true` and never deletes the branch.
2. **Local cache update.** `remove` updates the in-memory `listing` cache after success; `archive` does not, so any UI bound to listing goes stale until the next refetch.

Two names for one RPC with divergent local-cache behavior is a footgun: callers must guess which one to pick, and picking wrong leaves stale UI. The worktree row context menu uses `archive`; the ChannelManager teardown path uses `remove`. Both want the same thing — fire the RPC and refresh the listing — but only one path actually does.

## What Changes

- Collapse `archive` and `remove` into a single `removeWorktree(projectCwd, name, opts?: { force?: boolean; deleteBranch?: boolean })` action on `GitContext`.
- `removeWorktree` forwards `opts` to `EVENTS.git.worktree.remove` unchanged and updates the local `listing` cache on success in all cases.
- Migrate the worktree row context menu (currently calling `archive`) to `removeWorktree(projectCwd, name, { deleteBranch: !skipBranchDelete, force })`.
- Migrate the ChannelManager teardown path (currently calling `remove`) to `removeWorktree(projectCwd, name, { force: true, deleteBranch: false })`.
- Delete the `archive` alias from `GitContext`.

Explicitly out of scope:
- No server-side handler change. The RPC is already unified at `EVENTS.git.worktree.remove`.
- No component / dialog rename — the user-facing "Archive" label stays.
- No new opt fields beyond `force` and `deleteBranch`.

## Capabilities

- **client-git-state**: `GitContext` exposes a single `removeWorktree` action that forwards options to the RPC and updates the local listing on success; the legacy `archive` alias is removed.
