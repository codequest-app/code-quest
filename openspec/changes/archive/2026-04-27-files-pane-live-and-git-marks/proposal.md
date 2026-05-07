## Why

Two related gaps surfaced after the `right-pane-cwd-scope` fix exposed FilesPane as an independent surface (no longer requires a chat session to be visible):

### Gap 1 — FS watch lifecycle is bound to chat channel, not RightPane mount
`FsGitDirtyBroadcaster.subscribeChannel(channelId, cwd)` is called only when `ChannelManager.create()` runs. So:
- User opens a project, hasn't started any session → no channel → no `chokidar.watch(cwd)` → no `files:dirty` / `git:dirty` events.
- User browses Files pane → tree never auto-refreshes when files change externally (npm install, git pull, editor save).

The watch should follow **right-pane visibility** (which itself follows project selection), not chat session lifecycle.

### Gap 2 — File tree shows no git status marks
F.html mockup shows `📄 README.md  [M]` style — file nodes carry a git status badge (M / A / D / U / R) so users see at-a-glance which files are modified without leaving the Files tab. Current FileTree shows only icon + name.

## What Changes

### Watch decoupling (gap 1)
- Generalize `FsGitDirtyBroadcaster` with a new socket-based subscription API alongside the existing channel-based one:
  - `subscribeSocket(socketId, cwd, emit)` / `unsubscribeSocket(socketId)`
  - Refcount across **all** subscribers (channel + socket); chokidar watcher started/closed once per cwd regardless of source.
- Add socket events `explorer:watch { cwd }` / `explorer:unwatch { cwd }`.
- Server handler registers per-socket subscription that emits `files:dirty` / `git:dirty` directly to that socket.
- Auto-cleanup on socket disconnect.
- `<FilesPane>` and `<GitPane>` emit `explorer:watch` on mount, `explorer:unwatch` on unmount. (`SpecPane` may join later if its content needs FS reactivity.)

### Git marks on file tree (gap 2)
- Extend `<FileTree>` with optional `gitMarks?: Map<string, string>` prop — `absolutePath → status` (M / A / D / R / ?).
- `<FilesPane>` calls existing `useGitStatus(cwd)`, builds the map from `changedFiles`, passes to FileTree.
- FileTree file node renders a small status mark to the right of the filename when the path appears in the map; color tokens follow the same convention as GitPane (`text-warning` for M, `text-success` for A/?, `text-danger` for D, `text-info` for R).
- Map updates automatically — `useGitStatus` already subscribes to `git:dirty` / `worktree:branchChanged`, so commits / external git ops trickle through.

## Impact

**Modified:**
- `apps/server/src/services/fs-git-dirty-broadcaster.ts` — add socket subscription API
- `apps/server/src/socket/handlers/explorer.ts` — add watch / unwatch handlers + disconnect cleanup
- `packages/shared/src/socket-events.ts` + schemas — new event payloads
- `apps/web/src/components/FilesPane.tsx` — mount-time watch, gitMarks composition
- `apps/web/src/components/GitPane.tsx` — mount-time watch (drop reliance on channel-driven watch)
- `apps/web/src/components/FileTree.tsx` — gitMarks prop + render

**Tests:**
- FsGitDirtyBroadcaster: socket subscribe/unsubscribe; refcount with mixed channel+socket; cleanup on disconnect
- explorer.ts handler: watch / unwatch dispatch
- FilesPane: gitMarks render; auto-refresh on commit; watch lifecycle (uses FakeSummoner)
- FileTree: gitMarks prop renders the badge

**Risk:** medium.
- Broadcaster API expansion — must preserve existing channel-based behavior (existing tests catch regressions).
- Socket disconnect handler must be reliable; orphaned watchers leak chokidar instances. Test via FakeSummoner disconnect flow.
- `gitMarks` Map could grow large in repos with thousands of dirty files; size is bounded by `git status` output, acceptable.
