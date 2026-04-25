## 1. Broadcaster socket API (TDD)
- [x] 1.1 Red: extend FsGitDirtyBroadcaster test — `subscribeSocket(id, cwd, emit)` → fs change → emit called; refcount across channel + socket; unsubscribeSocket cleans up; chokidar started once / closed when refcount hits 0 across both APIs.
- [x] 1.2 Green: add socket subscription Map + generalize internal subscriber tracking; preserve existing subscribeChannel behavior.

## 2. Shared schema + events
- [x] 2.1 Add `explorerWatchPayloadSchema { cwd }` + `explorerUnwatchPayloadSchema { cwd }` (no response — fire-and-ack).
- [x] 2.2 Re-export + add `EVENTS.explorer.watch` / `unwatch` + ClientToServerEvents entries.

## 3. Server handler (TDD)
- [x] 3.1 Red: handler test — explorer:watch wires socket subscription; emits `files:dirty` to that socket only on cwd match; explorer:unwatch removes; socket disconnect auto-cleans all subs for that socket.
- [x] 3.2 Green: implement watch / unwatch handlers in explorer.ts; track per-socket subscription IDs; hook socket.on('disconnect') for cleanup.

## 4. FileTree gitMarks (TDD)
- [x] 4.1 Red: FileTree test — given `gitMarks={ '/repo/foo.ts': 'M' }`, file node 'foo.ts' renders badge with M class.
- [x] 4.2 Green: add `gitMarks` prop; render small `<span>` next to file name when path matches.

## 5. FilesPane live + marks (TDD)
- [x] 5.1 Red: FilesPane test — mounts → fires explorer:watch; unmounts → fires explorer:unwatch; gitMarks prop populated from useGitStatus.
- [x] 5.2 Green: add useEffect for watch lifecycle; compute gitMarks Map from useGitStatus(cwd).changedFiles; pass to FileTree.

## 6. GitPane live (no longer relies on channel-driven watch)
- [x] 6.1 GitPane test passes after change (it already uses useGitStatus which subscribes to git:dirty); add explicit watch lifecycle effect so refresh works without active session.

## 7. Verify
- [x] 7.1 server + client tsc + vitest green; biome clean.

## 8. Finalize
- [x] 8.1 Commit.
