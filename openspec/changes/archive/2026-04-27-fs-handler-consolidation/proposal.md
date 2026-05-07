## Why

After `git-handler-consolidation` (which collapsed worktree into git and
removed channel-scoped variants), three FS-touching server handlers remain:

```
explorer  ← cwd-scoped: browse / read / watch / unwatch
file      ← channel-scoped: list (fuzzy) / read (relative)
projects  ← DB CRUD on user-registered project paths (NOT fs ops)
```

The `explorer` and `file` handlers both perform filesystem operations. They
were split because:
- `explorer` was added later for the RightPane (cwd-scoped)
- `file` was the original chat-composer @file path (channel-scoped)

The split now causes:
1. **Duplicate read API** — `explorer:read({path})` and `file:read({channelId, filePath})` both read a file
2. **Channel-scoping drift** — same anti-pattern we removed in `git`. cwd is now sourced from sidebar selection (`useActiveCwd`); channel scoping is vestigial
3. **`explorer` is a UI-flavored name** — the actual domain is filesystem; aligns better with summoner's `FilesystemService`

`projects` stays as-is. It's a DB-state CRUD (user-registered project paths),
not an fs/git operation. Sidebar's "project + branch + worktree" view is a
**client-side composition** of `projects:list` + `git:worktree:list` + `git:statusSummary`,
not something a single handler should provide.

## What Changes

### Rename + merge: `explorer` + `file` → `fs`

```
fs:browse({path?})       ← was explorer:browse (path? = list explorerRoots)
fs:read({path})          ← was explorer:read (was also file:read, deduped)
fs:search({cwd, q})      ← was file:list (fuzzy); cwd-scoped now
fs:watch({cwd})          ← was explorer:watch
fs:unwatch({cwd})        ← was explorer:unwatch
```

### Removed
- `explorer` namespace (renamed to `fs`)
- `file:read` (use `fs:read` with absolute path; client constructs `${ch.cwd}/${filePath}`)
- `file:list` (renamed to `fs:search` and decoupled from channel)
- `file` namespace entirely (handler file deleted)

### Naming choices
- `fs:browse` vs `fs:search`: distinct operations
  - `browse` = list one dir's children
  - `search` = fuzzy match across cwd
- `fs` (not `filesystem`) — matches summoner's `FilesystemService` short form, parallel to `git`

### Channel-scoped `file:list / file:read` migration — DEFERRED

Original plan was to migrate channel-scoped `file:list` (chat composer
mention) and `file:read` (open_file tool result enrichment) to the new
cwd-based `fs:search / fs:read`. That requires exposing `cwd` to channel
handlers (via `ChannelIdContext` extension or similar).

Attempted during this change but blocked by test setup: `render-with-channel`
intentionally omits `cwd` to ChannelProvider to prevent dueling
`session:launch` calls. Untangling that needs more thought than fits this
change. Tracked as a follow-up.

For now: `file:list / file:read` keep their channel-scoped semantics.
`handlers/file.ts` server handler stays. `EVENTS.file.{list,read}` stay.

### Broadcast event re-grouping (bonus)

While reorganizing EVENTS, moved domain-aligned broadcasts:
- `EVENTS.fs.filesDirty` → `EVENTS.fs.dirty`
- `EVENTS.fs.gitDirty` → `EVENTS.git.dirty`

String IDs (`files:dirty` / `git:dirty`) unchanged. Just lookup paths.

### Out of scope
- `projects` handler unchanged
- `spec` handler unchanged (openspec domain is not fs)
- No new fs operations (write/delete/rename) — read-only stays the contract

## Impact

**Modified — server:**
- `apps/server/src/socket/handlers/fs.ts` (new) — combines explorer + file
- Delete `handlers/explorer.ts` + `handlers/file.ts`
- `socket/server.ts` — register `fs.create(ctx)` instead of explorer + file

**Modified — shared:**
- `packages/shared/src/schemas/fs.ts` (new) — combines explorer + file schemas
- Delete `schemas/explorer.ts` + `schemas/file.ts`
- `socket-events.ts` — `EVENTS.fs.{browse,read,search,watch,unwatch}`; remove `EVENTS.explorer.*` + `EVENTS.file.*`

**Modified — client:**
- Hooks: `useExplorerBrowse` → `useFsBrowse` (or inline since only FileTree uses)
- FileTree, FilePreviewModal, FilesPane, GitPane (watch lifecycle): rename event refs
- `contexts/channel/handlers/file.ts` (mention search): switch from `EVENTS.file.list` to `EVENTS.fs.search`, take cwd from channel config
- `contexts/channel/handlers/streaming.ts:166` (open_file tool result read): switch from `EVENTS.file.read` to `EVENTS.fs.read`, construct absolute path from channel cwd

**Tests:**
- All event-name renames are mechanical
- file.test.ts → fs.test.ts (or merge into existing fs cases)
- Preserve assertions per "expect 不變或等價"

**Risk:** medium.
- Touches both consumers of channel-scoped file ops (mention search, streaming open_file)
- Migration risk surfaces as tsc errors if a string literal slips through; tests catch the rest
- One-shot rename = clean history, no alias layer
