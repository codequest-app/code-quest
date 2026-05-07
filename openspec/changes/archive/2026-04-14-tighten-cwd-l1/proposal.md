# Proposal: tighten-cwd-l1

## Why

`Channel.cwd` is typed `string | undefined` but production invariant is that every channel has a cwd. Every spawn path (launch, resume, fork, teleport, terminal) must run the CLI in a specific directory — the JSONL path `~/.claude/projects/<encoded-cwd>/<sid>.jsonl` depends on it. A channel without cwd is a broken channel; CLI fails silently.

The loose type forces `ch.cwd ?? process.cwd()` / `ch.cwd ?? ''` fallbacks across handlers (git, teleport, resume, terminal), and the DB schema mirrors the looseness with a nullable column. These fallbacks pacify TypeScript but mask the real invariant.

This change tightens `Channel.cwd` to `string` and makes every `channelManager.create` caller supply a cwd (or reject the request). DB schema stays loose (L2). Socket protocol stays loose (L3). Both get tightened in follow-up changes; what this change does is make the in-memory invariant honest so the fallbacks disappear.

## What Changes

Server:

- `channel.ts`: `cwd: string | undefined` → `cwd: string`. Constructor gains a required `cwd: string` parameter.
- `channel-manager.ts`: `CreateChannelOptions.cwd: string` (was optional). `setupChannel(channelId, runner, cwd)`. `create()` makes opts itself required. `join()` fetches cwd via a new injected callback `resolveCwd(channelId)`; throws clearly if missing.
- `container.ts`: wire `resolveCwd` = look up sessionHistory.resolveSessionId → sessionStore.getById → row.cwd.
- `handlers/session/connect.ts handleLaunch`: reject `{ error: 'cwd required' }` if payload has no cwd. No `process.cwd()` shim.
- `handlers/session/connect.ts handleResume`: existing guard `if (!row?.cwd)` stays.
- `handlers/session/fork.ts handleFork`: already guards (commit a2a17d64).
- `handlers/session/fork.ts handleTeleport`: keeps `ch?.cwd ?? process.cwd()` as an L3-pending shim — teleport payload has no cwd field, and ch may be null because teleport is invoked without a channel context. Commented as "L3".
- `handlers/terminal.ts`: existing guard `if (!baseCwd)` stays.
- `handlers/git.ts`: `ch.cwd ?? process.cwd()` → `ch.cwd` after tightening. Comment removed.

Tests:

- `apps/server/src/__tests__/channel.test.ts`: 8 `new Channel(...)` calls gain a `'/test/cwd'` 4th argument. Pure setup correction.
- `apps/server/src/__tests__/session-connect.test.ts`: test setups that upsert sessionStore rows or call `session:resume` without cwd gain a cwd. Setup correction.
- `apps/web/src/test/render-with-channel.tsx`: `claude.initialize` launch payload defaults to `'/test/cwd'` when `options.cwd` not supplied (so handleLaunch doesn't reject). TabProvider default already added in earlier iteration. `ChannelProvider.cwd` stays `options.cwd` (undefined in most tests to skip React-side launch; avoids double-launch).
- `apps/web/src/components/__tests__/ComposeInput.test.tsx`: the one test that depends on `channel.cwd === apps/server` (seeded files) passes `cwd: serverCwd` explicitly. Setup correction.

## Scope — out of scope

- L2 (DB notNull + null-row migration). `handleResume`'s `if (!row?.cwd)` guard remains until L2.
- L3 (socket protocol cwd required). `handleLaunch` rejecting with "cwd required" surfaces the misuse but doesn't change the wire schema; payload still types cwd as optional.
- Teleport's `ch?.cwd ?? process.cwd()`: teleport has no cwd in its payload and ch may be null. Fixing is a design discussion (does teleport need its own cwd, or adopt caller's?). Out of scope here.

## Impact

- Affected code: `channel.ts`, `channel-manager.ts`, `container.ts`, `handlers/session/connect.ts`, `handlers/session/fork.ts` (teleport only), `handlers/terminal.ts`, `handlers/git.ts`, `channel.test.ts` (setup), `session-connect.test.ts` (setup), `render-with-channel.tsx` (helper), `ComposeInput.test.tsx` (setup).
- Test `expect(...)` assertions: NOT modified.
- Risk: low-medium. The handleLaunch rejection surfaces real misuse; tests get explicit cwd.
- Rollout: TDD per step; run full suite after each.
