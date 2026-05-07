# Tasks: tighten-production-casts

**TDD discipline:**

- Pure typing refactor — existing tests are the safety net. No `expect()` change allowed (rule: expect 不變).
- One change per commit, full test suite green at each boundary.
- After each root-cause typing change, the cast count should drop measurably; verify with `grep -rE "as any\b|: any\b" packages/<pkg>/src | wc -l`.

## 1. FakeClaude.events() generic over event name (root fix #1)

- [x] 1.1 Locate `FakeClaude.events()` signature and related accessors (`received`, `last`, etc.).
- [x] 1.2 Introduce generic `events<E extends keyof ServerToClientEvents>(name: E): Array<PayloadOf<E>>` where `PayloadOf<E>` derives from the socket-events.ts type map.
- [x] 1.3 If `ServerToClientEvents` callbacks aren't shaped to extract payload directly, add a small `PayloadOf<E>` helper in shared/test.
- [x] 1.4 Run full server + client tests — green.
- [x] 1.5 Sweep `(e: any) => e.foo` callsites in tests; drop cast where TS now infers. Expect ~50+ removals.
- [x] 1.6 Drop `biome-ignore-all noExplicitAny` from files that become any-free post-sweep.

## 2. ClientMessage discriminated union (root fix #2)

- [x] 2.1 Locate `ClientMessage` definition (`apps/summoner/src/...` or `packages/shared/src/...`).
- [x] 2.2 Identify the message-name → payload mapping (likely scattered across adapter transforms).
- [x] 2.3 Build a single `MessagePayloadMap` interface keyed by `name`, then derive `ClientMessage` as a discriminated union: `{ [K in keyof MessagePayloadMap]: { name: K; payload: MessagePayloadMap[K] } }[keyof MessagePayloadMap]`.
- [x] 2.4 Update producers (adapter transforms) to emit values that satisfy the new type — TS will surface mismatches.
- [x] 2.5 Run full tests — green.
- [x] 2.6 Sweep `(result as any).payload.X` in test files; replace with proper `if (result.name === 'X') { result.payload.foo }` narrowing. Expect ~20+ removals.
- [x] 2.7 Drop now-unneeded biome-ignore pragmas.

## 3. Production casts — proper-type fixes (no hacks)

- [x] 3.1 `summoner/claude/protocol.ts:130` — read the surrounding context to determine the actual JSON shape; if it's a known protocol event, parse with the existing event schema; otherwise add a minimal zod schema for the discriminator and parse.
- [x] 3.2 `server/socket/channel-emitter.ts:181` — replace inline `as { on: ... }` with `import type { Socket } from 'socket.io'`. Verify the type is structurally compatible at the callsite.
- [x] 3.3 `server/socket/channel-emitter.ts:101` — narrow `data` parameter type at function signature so spreading needs no cast.
- [x] 3.4 `server/socket/channel-emitter.ts:197` — locate or add a zod schema covering the payload shape (likely `channelIdPayloadSchema` already exists). Use `safeParse` instead of cast.
- [x] 3.5 `client/contexts/channel/handlers/settings.ts:48` — define a typed key-map (`Record<PayloadKey, StateKey>`) and use typed assignment instead of cast.
- [x] 3.6 `client/socket/rpc.ts:80, 84` — refactor `call<T>` so `args` derives from `Parameters<ClientToServerEvents[E]>` and `result.data` is typed `T` after the err-throw narrow. No `as never` should remain.
- [x] 3.7 Run full test suite after each — green.

## 4. Document leave-alones

- [x] 4.1 Add a single-line comment to `client/contexts/channel/handlers/guard.ts` near the four `as never` casts explaining the Socket.IO dynamic-event-name TS limitation.
- [x] 4.2 Add a single-line comment above `mcp.test.ts:257` `claude.send<any>` explaining the mixed-shape loop intent.

## 5. Validation

- [x] 5.1 `grep -rE "\bas (any|never|Record<|\{)" packages/*/src --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v /test/` returns only the 4 documented `guard.ts` lines.
- [x] 5.2 `grep -rE "send<any>|: any\b|as any\b" packages/*/src/__tests__ | wc -l` is significantly lower than starting count of ~120; ideally <10.
- [x] 5.3 `pnpm -r tsc --noEmit` clean.
- [x] 5.4 Full test suite green: server 464, client 773, shared 41, summoner 305.
- [x] 5.5 `openspec validate tighten-production-casts` passes.

## 6. Re-investigation pass (lesson: tests + fixtures = safety net, no "documented limitation" cop-outs)

After Tasks 1–5 landed, an audit of remaining 58 casts + 28 `:any` showed several "documented limitations" actually have proper-type fixes. Re-attack:

- [x] 6.1 `client/contexts/channel/handlers/guard.ts` 4 `as never` — the `wireHandlers` API takes `Record<string, (state, payload) => state>`. Make the handler map generic over `ServerToClientEvents` so each handler binds its event's payload type. Drop all 4 `as never`.
- [x] 6.2 `server/socket/channel-emitter.ts:185` `as unknown as DynamicOn` — type the loop key as `keyof ClientToServerEvents` (the eventMap is keyed by it) so socket.io's typed `on()` accepts it. Drop the cast.
- [x] 6.3 `FakeClaude.received(name)` generic over `ClientToServerEvents` (mirror Task 1 pattern for `events()`). Inferred `r.request` becomes typed; eliminates ~14 `(r.request as any)?.subtype` casts in mcp/settings/message tests.
- [x] 6.4 Type `claude.send<E>()`'s ack callback per `ControlResponse` shape so `(res.response as any).X` becomes typed. ~7 sites in mcp.test.ts.
- [x] 6.5 `mcp.test.ts:257` `claude.send<any>` mixed-shape loop — replace with per-event branch using a small typed dispatch helper. Drop `<any>`.
- [x] 6.6 `summoner/__tests__/claude/helpers.ts:10-11` two `as any` — make the helper signature generic so callers get typed return.
- [x] 6.7 `channel-manager.test.ts` — the 4 `as any` are leftover from earlier session join migration; tighten with `SessionJoinResponse`.
- [x] 6.8 `fake-server.test.ts:9` `as any` for serverSocket access — expose typed accessor on FakeSocket.
- [x] 6.9 Sweep all remaining `(p: any) => ...` lambdas in tests — most are `claude.events()` fallouts or `received()` fallouts already covered above.

After 6.x, target: production code has ≤2 documented Socket.IO `as never` (genuinely unsolvable), tests have <10 `any`, all `biome-ignore-all noExplicitAny` pragmas dropped.

- [x] 6.10 Final tally: `grep -rE "as any\b|: any\b" packages/*/src --include="*.ts" --include="*.tsx"` returns ≤15 hits, each with a one-line comment explaining why it's necessary.

## 7. Holistic re-investigation (lesson reapplied: tests + fixtures = safety net)

After the 6.x sweep, an audit of all production `interface` (71), `type` aliases (43), `enum` (0) + every `as` cast (~100 site-level) flagged three structural concerns to address before declaring done.

### 7a. Hold-the-line patterns (recur beyond ClientMessage)

The two patterns from `ClientMessage` discriminated union work likely apply elsewhere:

- [x] 7a.1 **Producer ↔ wire `Omit<X, 'channelId'>`**: scan all S2C `*Payload` types and check whether their producers (server handlers, summoner transforms) emit them WITH or WITHOUT channelId. Document the boundary and unify (either inject channelId at one named layer, or strip at consumer).
- [x] 7a.2 **Scaffolding override**: scan for places where a producer adds extra fields beyond the wire shape (auto-respond `response: { type }` was the obvious one). Find others (likely in `transforms/control.ts` or `handlers/permission.ts`).

### 7b. interface → zod migration candidates

Production interfaces fall into two buckets:

**TS-only (keep)**: React context values, DI containers, service interfaces (function shapes, not data), generic adapter scaffolding, socket-event maps.

**Wire/external data (zod candidates)**:
- [x] 7b.1 `summoner/claude/launch-options.ts` `LaunchOptions` — sent to CLI argv. Convert to zod for safer CLI input validation.
- [x] 7b.2 `summoner/filesystem/types.ts` `DirectoryEntry` — filesystem listing result; arrives via different filesystem implementations. Add zod for safer cross-impl contract.
- [x] 7b.3 `server/services/raw-event-store.ts` `SessionPreview` — DB result projected to JSON. Add zod for safer DB→wire boundary.
- [x] 7b.4 `client/types/ui.ts` `*Meta` types (Hook/Image/Document/RateLimit) — message metadata that arrives over wire as `Record<string, unknown>`. Add zod for safer narrowing in `utils/message.ts`.
- [x] 7b.5 `client/types/chat.ts` `InitOptions` — initial settings config; sent as RPC payload AND arrives back via `settings:update`. Should be a single zod schema.

### 7c. enum candidates

Codebase has 0 native TypeScript `enum` declarations (good — the project already uses `z.enum(...)` in schemas and string union types in TS). No migration needed.

### 7d. Verify my settings.ts regression is properly fixed

- [x] 7d.1 Restore SETTINGS_KEY_MAP-style table-driven design (extensible for unknown payload keys) using a typed `Copier<P>` map. NO `as Record<>` cast. NO hardcoded if-statements per key.

### 7e. Final sweep

After 7a–7d:

- [x] 7e.1 Re-run `grep -rE "\\bas (any|never|unknown|Record<|\\{)" packages/*/src --include='*.ts' --include='*.tsx'` excluding tests/internal helpers. Target: ≤4 sites, each with one-line comment.
- [x] 7e.2 `grep -rcE "^export interface " packages/*/src --include='*.ts' --include='*.tsx'` should have dropped by ~5 (the wire-data ones converted to zod-derived).
- [x] 7e.3 Full test suite green.
- [x] 7e.4 `openspec validate tighten-production-casts` passes.
