## Why

`server/socket/handlers/fs.ts` (cwd-scoped) and `server/socket/handlers/file.ts` (channel-scoped) call the same `FilesystemService` methods through different protocol surfaces:

| | `fs.ts` (`fs:*`) | `file.ts` (`file:*`) |
|---|---|---|
| Scope | cwd-scoped (`{path}` / `{cwd}`) | channel-scoped (`{channelId, ...}`) |
| Used by | FilesPane / FileTree | Chat `open_file` tool preview, mention picker |
| Service call | `readFileAbsolute(path)` (validates `isWithinRoots`) | `readFile(cwd, filePath)` (validates `..` traversal) |

Two protocol events for the same operation exists only because **`ChannelProvider` receives `cwd` as a prop but doesn't propagate it through the channel context tree**. Deep consumers inside `ChannelMessagesProvider` only have `channelId` available, so they round-trip through the server (`channelId → Channel → ch.cwd → fs operation`) instead of calling the cwd-scoped handler directly.

While auditing the channel context, three related issues surfaced:

1. **Resume + fork cwd is silently dropped on the client.** `Server` correctly broadcasts `session:states` and `session:created` with `cwd`, and `SessionContext` stores it in `sessions[].cwd`. But `TabContext.tsx:194` calls `actions.addTab(s.channelId)` instead of `actions.addTab(s.channelId, s.cwd)` — the `cwd?` parameter is in the signature but never passed. Result: every tab restored from history (resume) or created via fork has `cwd === undefined`. The current `file.ts` handler papers over this by resolving cwd server-side.

   **Sentinel coupling**: `cwd === undefined` is currently overloaded as a signal to `ChannelProvider`: "don't call `session:launch`, the channel already exists on the server". Two distinct paths conflate via this sentinel:

   | Tab origin | `tab.cwd` | ChannelProvider behavior |
   |---|---|---|
   | `createNewTab({cwd})` (local new) | set | calls `session:launch` |
   | sessions sync (resume / fork) | undefined | does NOT launch |

   Naively populating `tab.cwd` from sync would trigger redundant `session:launch` for already-running channels — server `handleLaunch` would call `channelManager.create(existingChannelId, ...)` and double-spawn / error. So the fix needs to **separate `cwd` from "should-launch"**.

2. **`open_file` paths outside cwd are wrongly rejected.** Real Claude CLI fixtures show `file_path` is always **absolute** (e.g. `/tmp/test.txt`). The current `file:read` handler runs `fs.readFile(cwd, filePath)` which normalizes through `resolve(cwd, filePath)` — for absolute paths outside cwd this returns a path whose `relative(cwd, abs)` starts with `..`, triggering `'Path traversal not allowed'`. The "right" check is `isWithinRoots(filePath)` (broader, project-aware), which is exactly what `fs:read` already does.

3. **`ListFilesResponse` and `FsSearchResponse` schemas are 1:1 identical** (same `{path, name, type}` shape, same envelope). The fs.ts comment literally says "was channel-scoped file:list — now cwd-scoped". The migration was started but never finished.

Fixing the TabContext line unlocks plumbing cwd through channel context, which unlocks deleting the duplicate `file.ts` handler.

## What Changes

### Client

- **Add `launchOnMount: boolean` to `TabMeta`** — disambiguates "needs spawn" (true: createNewTab) from "channel already exists on server" (false: sessions sync). Default false; `createNewTab` sets true.
- **`TabContext` sessions sync**: `actions.addTab(s.channelId, s.cwd)` populates cwd from server data. `launchOnMount` stays false (default).
- **`ChannelProvider`** stops using `cwd` as the "should I launch" sentinel. Switches to a new `launchOnMount?: boolean` prop (or equivalent flag from tab meta), so `cwd` is now purely identity/context.
- **New `ChannelMetaContext`**: exposes `{channelId, cwd}` to the entire channel context subtree. `ChannelProvider` already receives `cwd` as a prop — this just propagates it.
- **`channel/handlers/file.ts`**: drop `searchFiles` channel-scoped impl; consume `useChannelMeta()` to get cwd, call `fs:search` with `{cwd, pattern}`.
- **`channel/handlers/streaming.ts:166`**: replace `socket.emit(EVENTS.file.read, {channelId, filePath})` with `socket.emit(EVENTS.fs.read, {path: filePath})`. Drop schema import for `fileReadResponseSchema`, use `fsReadResponseSchema`.

### Server

- **Delete `server/src/socket/handlers/file.ts`** — every callsite has a cwd-scoped equivalent.
- **Drop `EVENTS.file.read` / `EVENTS.file.list`** from `socket-events.ts`.
- **Drop `fileListPayloadSchema` / `fileReadPayloadSchema` / `fileSearchResultSchema` / `listFilesResponseSchema` / `fileReadResponseSchema`** from `shared/schemas/file.ts` (delete the file).
- **Server `socket.ts` registration**: remove `file.create(ctx)` line.

### Bonus bug fix

The `open_file` "Path traversal not allowed" failure on out-of-cwd absolute paths disappears for free — `fs:read` validates against `fsRoots` (broader scope), which correctly accepts `/tmp/...` etc. as long as it's within the configured roots.

## Impact

**Modified:**
- `packages/client/src/contexts/TabContext.tsx` — `TabMeta` adds `launchOnMount: boolean`; `createNewTab` sets it true; sync `addTab` passes `s.cwd` and leaves flag false
- `packages/client/src/components/TabContainer.tsx` — forwards `launchOnMount` from tab meta to `<ChannelProvider>`
- `packages/client/src/contexts/channel/ChannelContext.tsx` — wrap children in new `ChannelMetaProvider`
- `packages/client/src/contexts/channel/ChannelMessagesContext.tsx` — drop `channelId` arg to `createFileActions`
- `packages/client/src/contexts/channel/handlers/file.ts` — `searchFiles` uses `fs:search`
- `packages/client/src/contexts/channel/handlers/streaming.ts` — `fetchFileContentIfNeeded` uses `fs:read`
- `packages/server/src/socket/server.ts` — drop `file.create(ctx)` registration
- `packages/shared/src/socket-events.ts` — drop `'file:read'` / `'file:list'` event names
- `packages/shared/src/schemas/index.ts` — drop file schema re-exports

**New:**
- `packages/client/src/contexts/channel/ChannelMetaContext.tsx` — `{channelId, cwd}` provider + `useChannelMeta()` hook

**Deleted:**
- `packages/server/src/socket/handlers/file.ts`
- `packages/server/src/socket/handlers/__tests__/file.test.ts` (covered by fs handler tests)
- `packages/shared/src/schemas/file.ts`

**Tests:**
- `TabContext.test.tsx` — assert `addTab` is called with cwd from `sessions[]` in resume path
- `ChannelMetaContext.test.tsx` — new test for the context
- Fork integration test — assert post-fork `tabs[newChannelId].cwd === parentRow.cwd`
- Migrate any existing `file.test.ts` assertions to the `fs.ts` test file
- Out-of-cwd absolute-path read no longer rejects (regression test for the open_file bug)

**Risk:** medium-low.
- TabContext one-liner: high confidence (signature already supports it, just unused).
- Channel meta context: small isolated addition, doesn't touch state semantics.
- Protocol delete: backward-incompat at the wire level, but cc-office is the only consumer of its own socket events. CLI/extension don't see these.
- The "open_file out-of-cwd" change is a behavior expansion (more reads succeed) — verify with security review that `fsRoots` is the correct boundary for these paths (it is: same boundary FilesPane uses today).
