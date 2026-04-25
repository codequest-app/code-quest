## Why

`packages/server/src/socket/` carries two real, mechanical duplications around dirty-event subscription wiring — but they are NOT the same duplication, and forcing them through one shared registry would trade one smell for another.

1. **Matchers live in the wrong file.** `matchesFs` / `matchesGit` / `matchesOpenspec` are each defined in their respective `handlers/<x>.ts`, but their *only consumer* is `container.ts` (which imports all three to construct the three `DirtyBroadcaster` instances). Worse, `handlers/fs.ts` cross-imports `GIT_META_RE` from `handlers/git.ts` because the `matchesFs` body needs it. Handlers shouldn't own predicates that they don't use, and they shouldn't import from each other.
2. **Broadcaster wiring is duplicated.** The 9-line subscribe block (three `dirty.X.subscribe(cwd, socket.id, ...)` calls plus identical emit callbacks for `files:dirty` / `git:dirty` / `openspec:dirty`) appears verbatim in both `socket/channel-manager.ts` (line ~126) and `socket/handlers/fs.ts` (line ~153).

We considered a `WatchSubscriptionRegistry` shared service to also dedupe the two bookkeeping `Map`s, and rejected it: the channel-manager Map is keyed by `channelId` and cleaned on `leaveChannel`, while the fs handler Map is keyed by `cwd` and cleaned on socket disconnect / `fs:unwatch`. Different keys, different lifecycles. Forcing them to share would require an adapter that's worse than the duplication. Each consumer's bookkeeping stays where it is.

## What Changes

- Add `packages/server/src/socket/dirty-matchers.ts` exporting `matchesFs`, `matchesGit`, `matchesOpenspec`, `IGNORE_RES`, and `GIT_META_RE`. `container.ts` imports the three predicates from here.
- Remove the matcher exports and `GIT_META_RE` / `IGNORE_RES` definitions from `handlers/fs.ts`, `handlers/git.ts`, `handlers/openspec.ts`. Handlers no longer cross-import each other.
- Add `packages/server/src/socket/dirty-subscriber.ts` exporting `subscribeDirtyForSocket(socket, cwd, dirty): Unsubscribe[]`. The function calls `dirty.files.subscribe` / `dirty.git.subscribe` / `dirty.openspec.subscribe` with identical emit callbacks (`socket.emit('files:dirty', ...)`, etc.) and returns the three unsubscribe handles.
- Replace the 9-line subscribe block in `socket/channel-manager.ts` with a single call to `subscribeDirtyForSocket(...)`; store returned unsubs in the existing channel-manager Map.
- Replace the 9-line subscribe block in `socket/handlers/fs.ts` with a single call to `subscribeDirtyForSocket(...)`; store returned unsubs in the existing fs handler Map.
- Tasks split into two phases (matcher relocation, then subscribe util extraction) executed sequentially because they share touched files.

Explicitly out of scope:
- No `WatchSubscriptionRegistry` shared service. The two consumers' Maps stay separate (different keys, different lifecycles).
- No changes to chokidar configuration or watch debounce tuning.
- No wire event renames.

## Capabilities

- **server-dirty-subscriptions**: dirty-event predicates and ignore regexes live in `socket/dirty-matchers.ts`; socket-to-broadcaster wiring is centralized in `subscribeDirtyForSocket`; per-consumer bookkeeping (channel-manager vs fs handler) remains independent.
