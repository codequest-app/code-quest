# Tasks: tighten-cwd-l1

**TDD discipline:**

- Expects not modified. Setups can adjust to reflect real invariants.
- tsc + tests after every step.

## 1. Test helper default (so launch without cwd still works in tests)

- [x] 1.1 `render-with-channel.tsx`: `claude.initialize` launch payload defaults to `'/test/cwd'` when `options.cwd` unset. Keep `ChannelProvider.cwd = options.cwd` (undefined → skip React launch).

## 2. Channel.cwd: string

- [x] 2.1 Constructor accepts `cwd: string`. Field type `cwd: string`.
- [x] 2.2 `channel-manager.ts`: `setupChannel(channelId, runner, cwd)`. `CreateChannelOptions.cwd: string` required, opts itself required. `create()` passes cwd through. `join()` uses injected `resolveCwd(channelId)` callback.
- [x] 2.3 `container.ts`: wire `resolveCwd`.
- [x] 2.4 Fix all callers — each must supply cwd or reject.

## 3. Production callers tighten

- [x] 3.1 `handleLaunch`: reject with error if no cwd (no shim).
- [x] 3.2 `handleResume`: existing guard (done).
- [x] 3.3 `handleFork`: done (a2a17d64).
- [x] 3.4 `handleTeleport`: keep `ch?.cwd ?? process.cwd()` with L3-pending comment.
- [x] 3.5 `handleTerminal`: existing guard (done).
- [x] 3.6 `git.ts`: drop `?? process.cwd()` (ch.cwd now `string`).

## 4. Test setup corrections

- [x] 4.1 `channel.test.ts`: 8 `new Channel(...)` add `'/test/cwd'`.
- [x] 4.2 `session-connect.test.ts`: upserts + session:resume calls that rely on a valid row — add cwd where missing.
- [x] 4.3 `ComposeInput.test.tsx`: pass `cwd: serverCwd` explicitly.

## 5. Validation

- [x] 5.1 `pnpm tsc --noEmit` clean (summoner + server + client).
- [x] 5.2 Full test suites green.
- [x] 5.3 `git diff main..HEAD -- '**/__tests__/**'` — no expect line modifications.
- [x] 5.4 `openspec validate tighten-cwd-l1` passes.
