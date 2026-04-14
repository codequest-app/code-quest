# tighten-production-casts

## Why

After unify-rpc-ack, scanning showed casts remaining across the codebase:

- **Production: 13 casts** — leftover shortcuts where a proper schema parse, generic, or named type would do the job.
- **Tests: ~120 `any` / `as any` sites** — almost all trace to two API design gaps:
  1. `FakeClaude.events(name: string): unknown[]` — does not bind event name to payload type, forcing 55+ `(e: any)` callbacks.
  2. `ClientMessage = { name: string; payload: Record<string, unknown> }` — payload is a loose record, forcing 25+ `(result as any).payload.X` accesses.

Both gaps have well-known TS solutions (generic constraint over the event-name union; discriminated union over name → payload). Fixing the root cause eliminates the cast pressure naturally — no per-callsite hack.

## What Changes

### Root-cause typings (eliminates ~80 test casts)

- **`FakeClaude.events()` generic over event name**: introduce `events<E extends keyof ServerToClientEvents>(name: E): Array<PayloadOf<E>>`. Same for related accessors (`received`, `last`, etc.) where applicable. Removes all `(e: any)` filter callbacks.
- **`ClientMessage` discriminated union**: change from `{ name: string; payload: Record<string, unknown> }` to a mapped type indexed by message name. Each test that narrows on `msg.name === 'X'` then reads `msg.payload.foo` directly without cast.

### Production code (13 casts → ≤4)

- **`summoner/claude/protocol.ts:130`** `as Record<string, unknown>` → zod parse with `z.record(z.string(), z.unknown())`.
- **`server/socket/channel-emitter.ts:181`** inline `as { on: ... }` → `import type { Socket } from 'socket.io'`.
- **`server/socket/channel-emitter.ts:101 + 197`** `as Record<string, unknown>` → typed `data` parameter at signature; `channelId` access via `channelIdPayloadSchema.safeParse`.
- **`client/contexts/channel/handlers/settings.ts:48`** `(update as Record<...>)[stateKey] = ...` → typed `Partial<UpdatePayload>` keymap.
- **`client/socket/rpc.ts:80, 84`** two `as never` → proper generic `call<E extends keyof ClientToServerEvents, T>(socket, event: E, ...args)` with `Parameters<...>` for args.
- **LEAVE `client/contexts/channel/handlers/guard.ts:51-60`** four `as never` — Socket.IO dynamic event-name dispatch is a known TS limitation when the event-map type is wider than the runtime string. Document with a comment.

### Test follow-through (the residue after root fixes)

- After `events()` generic + `ClientMessage` discriminated union land, sweep tests to drop now-unnecessary `(e: any)` / `(result as any)` casts and the per-file `biome-ignore-all noExplicitAny` pragmas where the file becomes any-free.
- The single intentional `claude.send<any>` in `mcp.test.ts:257` (mixed-shape loop) stays — document with a comment.

## Impact

- Production code: any-free except 4 documented Socket.IO limitations.
- Tests: ~80 casts removed by typing, ~5 documented as intentional, rest re-evaluated as the root-cause fixes ripple.
- No behavior change. Existing tests are the safety net (rule: expect 不變).
- Test signatures match production wire schema end-to-end.
