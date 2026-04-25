# tasks

## Phase 1 — ChannelEmitter exclude support

- [ ] Add red test in `channel-emitter.test.ts`: emit with
  excludeSocketIds skips listed sockets, delivers to others.
- [ ] Implement: extend `emit(channelId, event, ...args, opts?)` or add
  an overload — pick whichever is less ambiguous.
- [ ] Verify: existing channel-emitter tests stay green.

## Phase 2 — Broadcaster dedup

- [ ] Add red test in `fs-git-dirty-broadcaster.test.ts`: same socket
  registered via channel + socket subs for same cwd, files:dirty
  delivered exactly once.
- [ ] Same for git:dirty and openspec:dirty.
- [ ] Cross-window test: two sockets (one chat one RightPane) each
  receive exactly once.
- [ ] In `SocketSub`: add `socketId` field; update `subscribeSocket`
  callers to pass it.
- [ ] Extend `EmitFn` signature to accept `excludeSocketIds?: Set<string>`.
- [ ] In `flush`: compute exclude set from socketSubs for the cwd, pass
  to `deps.emit` calls.
- [ ] Update container.ts wiring closure to forward the exclude set.

## Phase 3 — Verify

- [ ] Re-run server vitest + tsc.
- [ ] Re-run client vitest (no client changes expected; just verifying
  contract).
- [ ] Single commit:
  `fix(broadcaster): dedup fs/git/openspec dirty when same socket has both subs`

## Out of scope

- Dropping channel sub entirely (still needed for chat-only windows).
- Coalescing across cwds (out of scope; current per-cwd buffer is fine).
