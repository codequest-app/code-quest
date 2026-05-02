# tasks

## Phase 1 — (skipped)

`WatchService` (the LocalWatchService and FakeWatchService) already
refcounts subscribers internally — one chokidar per cwd shared across
N subscribers. A separate WatchManager would be redundant: each
broadcaster calls `watchService.subscribe(cwd, cb)` directly and stores
the returned Unsubscribe. Three broadcasters with the same cwd → three
calls → still one chokidar.

## Phase 2 — FsDirtyBroadcaster

- [ ] Red: `fs-dirty-broadcaster.test.ts` — non-git, non-openspec path
  → fs:dirty after 200 ms with paths.
- [ ] Red: ignored paths (node_modules, .git/objects, etc.) → no emit.
- [ ] Red: same `subscriberId` subscribing twice → one delivery.
- [ ] Red: storm test — 100 events collapse to one batch.
- [ ] Red: no subscribers → no chokidar subscribe.
- [ ] Implement `FsDirtyBroadcaster` using `TopicEmitter<string, string[]>`.
- [ ] Commit: `feat(server): FsDirtyBroadcaster — per-cwd file-change pub/sub`.

## Phase 3 — GitDirtyBroadcaster

- [ ] Red mirror: .git/HEAD → git:dirty; non-git paths → no emit.
- [ ] Implement `GitDirtyBroadcaster` using `TopicEmitter<string, void>`.
- [ ] Commit: `feat(server): GitDirtyBroadcaster`.

## Phase 4 — OpenspecDirtyBroadcaster

- [ ] Red mirror: openspec/* path → openspec:dirty; otherwise no emit.
- [ ] Implement.
- [ ] Commit: `feat(server): OpenspecDirtyBroadcaster`.

## Phase 5 — fs.ts handler rewires

- [ ] Update `fs.ts` to subscribe via 3 broadcasters under `socket.id`.
- [ ] Verify existing fs.ts tests stay green.
- [ ] Commit: `refactor(server): fs:watch handler subscribes via 3 broadcasters`.

## Phase 6 — ChannelManager rewires

- [ ] Add socket-join/leave hooks to `ChannelManager` (or thread through
  `ChannelEmitter`).
- [ ] On socket join channel-with-cwd → register 3 subscribes under
  `socket.id`. On leave / session-end / disconnect → release.
- [ ] Commit: `refactor(server): ChannelManager subscribes 3 broadcasters per socket`.

## Phase 7 — Cleanup

- [ ] Delete `FsGitDirtyBroadcaster`, its tests, container wiring.
- [ ] Delete `ChannelEmitter.emitExcluding` (no callers left); revert
  `emit` / `emitToOthers` to inline impl.
- [ ] Server tsc + vitest green; client tsc + vitest green.
- [ ] Commit: `refactor(server): drop FsGitDirtyBroadcaster + dedup-via-exclude`.

## Out

- Client-side pub/sub change (next change: `client-fs-pubsub`).
