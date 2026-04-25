## Context

Today the server has no FS watching. `FilesystemService` exposes `browse / list / read / stat` on demand; `GitService` exposes `status / diff / log / checkout`. Both are pull-based. If the Files pane or Git pane (coming in follow-up changes) wants to stay fresh, we need a push-based signal.

We deliberately picked this scope (server-only, no UI) so the signal primitive can be validated with unit tests and server integration tests **before** any pane consumes it. Follow-up changes subscribe on the client and invalidate their view.

Key constraints:
- **Linux** inotify is finite. Watching a typical `node_modules` tree blows the default limit.
- **macOS** FSEvents is recursive and essentially free — but chokidar uses it well.
- Server-side lifecycle must be airtight — fd leaks from abandoned watchers will surface after days of uptime.
- Tests must not touch the real filesystem; deterministic `FakeWatchService` is mandatory.

## Goals / Non-Goals

**Goals:**
- `WatchService` with refcounted `subscribe(cwd, cb): Unsubscribe` API.
- `FakeWatchService` with `.simulate(cwd, event)` for tests.
- Channel lifecycle auto-subscribes/unsubscribes — no manual ref tracking in handlers.
- Derived-signal broadcaster emits `files:dirty` / `git:dirty` coalesced per 200 ms.
- Correct routing: `.git/HEAD`, `.git/index`, `.git/refs/*` → `git:dirty`; everything else (with ignores) → `files:dirty`.
- Graceful handling of Linux inotify-limit errors with an informative server log (no crash).

**Non-Goals:**
- Client-side consumption of `files:dirty` / `git:dirty` — that's `files-pane-v1` / `git-pane-readonly`.
- Structured diff events (e.g. "file X was modified, hunk [10–15] changed"). We emit **dirty signals only**; clients refetch their view. Finer-grained events are a future optimization.
- Polling fallback — chokidar already degrades to polling when native FS events unavailable; we don't add our own.
- Cross-project watch (one project's changes signalling another's) — each `cwd` subscription is isolated.

## Decisions

### 1. Library — `chokidar`, installed in Summoner

Alternatives rejected:
- `node:fs.watch` / `fs.watchFile` — native API, platform-inconsistent, no recursive watch on Linux, no debouncing. We'd reimplement chokidar.
- `sane` / `watchman` — Watchman requires a daemon install; `sane` is maintenance-mode.

`chokidar` (~70 KB w/ deps) handles platform quirks, symlinks, recursion, and is the de-facto standard. Installed in `packages/summoner` (the package owning FS abstractions) — keeps dependency scope narrow.

### 2. Service location — Summoner, not Server

`WatchService` knows nothing about socket.io. Server-side `FsGitDirtyBroadcaster` consumes the service and translates to socket events. Matches the existing `FilesystemService` / `GitService` split; keeps Summoner pure-FS, Server socket-aware.

```
chokidar → WatchService (summoner) → FsGitDirtyBroadcaster (server) → socket.io
```

### 3. Refcounting — inside WatchService

Multiple subscribers on the same `cwd` share one `chokidar.FSWatcher`. The last `unsubscribe` closes the watcher.

```ts
private entries = new Map<string, { watcher: FSWatcher; subs: Set<Callback> }>;
```

Alternatives:
- One watcher per subscribe — wasteful fd-wise, easier to reason about. Rejected for fd pressure on Linux.
- External refcount in the broadcaster — leaks abstraction. Service owns its lifecycle.

### 4. Derived signals, not raw events

The broadcaster classifies each chokidar event and emits at most **two** downstream signal kinds:
- `files:dirty { cwd, paths: string[] }` — the file tree may have changed.
- `git:dirty { cwd }` — git state (branch, index, refs) may have changed.

Clients refetch their view on receipt. The classification rule:

```
if path matches /^\.git\/(HEAD|index|refs\/.*|packed-refs)$/  → git:dirty
else if path NOT ignored                                       → files:dirty
else                                                           → drop
```

Why "may have changed" rather than precise mutations? Because:
- Precise mutations require structured diffing (what changed in HEAD? which refs moved?). Too much work for the initial version.
- Client-side refetch is cheap (single `git:status` call). Premature optimization costs us simplicity now.
- `files:dirty` carries `paths[]` so a tree view can invalidate a specific subtree rather than the whole tree (minor optimization, essentially free once we have the data).

### 5. Debouncing — 200 ms window, buffered per `(cwd, signal-kind)`

Pattern: collect events in a `Map<cwd, { filesDirty: Set<string>; gitDirty: boolean }>`; on the first event, schedule a 200 ms `setTimeout`; on flush, emit one broadcast per cwd+kind and clear the buffer.

200 ms is the sweet spot: human perception threshold (<300 ms feels instant) and long enough to collapse editor-save bursts (multiple files in sequence) and tool storms (rebases, `pnpm install`).

### 6. Ignores — aggressive

```
node_modules/
.git/objects/
.git/logs/
dist/ build/ out/
.next/ .turbo/ .parcel-cache/
*.log
.DS_Store
```

The `.git/objects/` ignore is non-negotiable; git operations rewrite thousands of blob files that carry no signal. `.git/logs/` is reflog noise. Everything else is build artifact.

Explicitly **not** ignored:
- `.git/HEAD`, `.git/index`, `.git/refs/*`, `.git/packed-refs` — required for `git:dirty` detection.
- Hidden files in general (user might edit `.env`, `.prettierrc`).

### 7. Subscription lifecycle — channel-level, not project-level

When a channel (≈ a chat session) is created with a `cwd`, subscribe. When the channel closes, unsubscribe. Advantages:
- Natural ref counting: opening a tab is the only way to start watching a cwd; closing the last tab stops it.
- Sidebar/right-pane don't drive subscriptions — they just display cached data and re-fetch on `*:dirty`.
- Matches the user's mental model: "the session is watching its folder".

Edge case: right-pane open but no active session (our `useActiveCwd` fallback to `activeProjectCwd`). In this case there's **no watcher** — the pane stays fresh only via manual refresh or focus. This is acceptable for v1; subsequent changes can add "follow-mode" watches if demand materializes.

### 8. `awaitWriteFinish` — yes, but short

chokidar's `awaitWriteFinish` waits for a file to stop changing before firing. We set `stabilityThreshold: 100ms, pollInterval: 50ms` — enough to avoid half-written file notifications (editors often do atomic rename dance), short enough not to add perceptible latency.

### 9. Linux inotify limit — graceful log + continue

When `ENOSPC: System limit for number of file watchers reached` fires:
- Log a **single** server error (not per-cwd spam) with the sysctl hint.
- The affected `subscribe` call rejects or resolves with a sentinel (TBD during impl — likely the subscribe returns a `Promise<Unsubscribe | LimitError>`).
- The broadcaster treats the subscription as "never signals", so the pane just stays stale. No crash.

### 10. Tests

- **Unit tests** on `FakeWatchService` verify refcounting behavior.
- **Integration tests** on the broadcaster inject `FakeWatchService`, simulate events, and assert socket emissions on a `FakeSummoner`-wrapped channel.
- **No real chokidar** in tests. The real impl is tested via Storybook-style manual verification (documented in tasks 6.x).

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| User configures a project with giant untracked trees that trigger inotify exhaustion | Ignore list catches the common cases. Document the `max_user_watches` bump in README. |
| Race between watcher-close and pending debounce flush | Flush on close; buffered events for the closing cwd emit before the watcher is GC'd. |
| Tests miss real-world timing bugs | Acknowledged trade-off. Real-FS integration tests added only if a bug escapes (YAGNI). |
| `chokidar` breaking change in major versions | Pin to a specific major; upgrade is a deliberate change. |
| Subscriber callback throws | Wrap in try/catch inside the watcher event handler; log; don't let one bad subscriber break others. |
| Server restart loses subscriptions (obviously) | Clients auto-resubscribe on socket reconnect via the channel lifecycle. No additional work. |

## TDD Order

1. **Red**: `FakeWatchService` tests — subscribe increments ref, unsubscribe decrements, last unsubscribe triggers internal close, `.simulate()` fans out to all subs.
2. **Green**: implement `FakeWatchService`.
3. **Red**: `WatchService` interface tests (against fake): refcount semantics, idempotent unsubscribe.
4. **Green**: define `WatchService` interface in `summoner/fs-watch/types.ts`.
5. **Red**: `FsGitDirtyBroadcaster` tests using `FakeWatchService`:
   - `.git/HEAD` event → `git:dirty` emit
   - `src/foo.ts` event → `files:dirty` with paths
   - `node_modules/x/y.js` → **no** emit (ignored)
   - flood of 100 events in <50ms → ≤ 1 emit per kind per cwd
6. **Green**: implement `FsGitDirtyBroadcaster`.
7. **Red**: channel-lifecycle integration test — create channel, simulate event, see broadcast; close channel, simulate event, no broadcast.
8. **Green**: wire subscribe/unsubscribe in `channel-manager` (or equivalent).
9. **Red/Green**: real `chokidar`-backed `LocalWatchService` — single happy-path unit test using a tmpdir (opt-in via env flag, like existing `local-filesystem-service.test.ts`).
10. **Ship**: all suites green; manual smoke per tasks.md.
