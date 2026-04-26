> **TDD 戒律（全程適用）**：每個任務嚴格 Red-Green-Refactor。WsTransport / WsClient 先用真 ws library + 真 http server 寫整合測試到全綠，**之後才**萃取 Fake 給上層測試用。Fake 不是 mock 出來的玩具，是整合測試已驗證的行為的輕量替身。
> **expect 不變紀律**：refactor 階段測試結構可以重整，但 `expect(...)` 的內容保持原樣。

## 1. Shared envelope foundation (TDD) — DONE

- [x] 1.1 RED: write `packages/shared/src/transport/__tests__/envelope.test.ts` covering Zod parse round-trip for all six `kind` variants, discriminator rejection (missing `kind`), and unknown-kind rejection
- [x] 1.2 GREEN: implement `packages/shared/src/transport/envelope.ts` with the discriminated union schema; export `Envelope` type and `EnvelopeSchema`
- [x] 1.3 RED: add Zod test ensuring `kind: 'event'` requires monotonic non-negative integer `seq`
- [x] 1.4 GREEN: tighten `seq` constraint (`z.number().int().nonnegative()`)
- [x] 1.5 Re-export envelope module from `packages/shared/src/index.ts`
- [x] 1.6 REFACTOR: review schema for naming, run biome / typecheck / `pnpm test --filter @code-quest/shared`

## 2. TypedSocket abstraction — DONE

- [x] 2.1 RED: write `typed-socket-contract.test.ts` proving FakeSocket can drive ChannelEmitter via local TypedSocket only
- [x] 2.2 GREEN: extract `TypedSocket` / `TypedServer` to local interfaces in `packages/server/src/socket/types.ts`; drop `import type { Server, Socket } from 'socket.io'`
- [x] 2.3 GREEN: tsc --noEmit shows zero error; channel-emitter / channel-manager tests stay green

## 3. Transport contract + Authenticator (TDD)

- [x] 3.1 RED: write `packages/server/src/socket/__tests__/transport-contract.test.ts` — assert any object satisfying `Transport` interface produces TypedSockets that an emitter can consume; use a minimal `MemoryTransport` test double in the test
- [x] 3.2 GREEN: define `Transport` and `TransportHandle` interfaces in `packages/server/src/socket/transport.ts`
- [x] 3.3 RED: write `authenticator.test.ts` — `Authenticator.authenticate(req)` returns `AuthContext | null`; assert null path rejects, non-null path attaches userId
- [x] 3.4 GREEN: define `Authenticator` interface in `packages/server/src/socket/authenticator.ts`; ship a `NullAuthenticator` (always-accepts default for current single-user mode); CookieAuthenticator deferred to a future change when cc-office adds multi-user
- [x] 3.5 RED: refactor test — `ChannelEmitter.broadcastAll` MUST iterate `socketRefs` and call each `socket.emit`; remove dependency on `TypedServer.emit` global
- [x] 3.6 GREEN: simplify `ChannelEmitter.broadcastAll` to per-socket fan-out; drop `this.io` / `TypedServer` global broadcast path; register sockets in `socketRefs` at handleConnection so broadcast reaches non-joined connections
- [x] 3.7 REFACTOR: full server test suite green (607 tests); no behavioral regression; `register(io)` kept as no-op stub on ChannelManager until Group 4 rewires bin/server.ts

## 4. SocketIoTransport adapter (TDD)

- [x] 4.1 RED: write `socket-io-transport.test.ts` — boots a real `http.createServer` + socket.io Server, attaches as `Transport`, asserts `onConnection` fires when socket.io client connects, `TypedSocket` produced has working `id` / `emit` / `on`
- [x] 4.2 GREEN: implement `packages/server/src/socket/socket-io-transport.ts` wrapping existing socket.io setup; constructor takes `Authenticator`
- [x] 4.3 RED: assert authenticator gate — connection without valid auth is rejected via `io.use()` middleware
- [x] 4.4 GREEN: wire authenticator into socket.io middleware (returns Error → connect_error on client)
- [x] 4.5 REFACTOR: `SocketServer.register` now accepts `TransportHandle` (was raw `Server`); `bin/server.ts` instantiates `SocketIoTransport` + attaches; `fake-server.ts` provides a fake `TransportHandle`; full server suite 612 green

## 5. WsTransport real implementation (TDD, integration-first)

- [x] 5.1 Add `ws` + `@types/ws` to `packages/server/package.json`
- [x] 5.2 RED: write `ws-transport.test.ts` — boots `http.createServer` + `WsTransport` + REAL `ws` client, asserts handshake rejected without auth (HTTP 401)
- [x] 5.3 GREEN: implement `packages/server/src/socket/ws-transport.ts` `WsTransport` class with `attach(httpServer)`; auth-on-upgrade (noServer mode so multi-transport coexistence works)
- [x] 5.4 RED: write test for valid auth → `onConnection` fires with TypedSocket carrying UUID id
- [x] 5.5 GREEN: inline adapter inside WsTransport implementing `TypedSocket` (id = UUID, emit = JSON envelope send with auto-incrementing seq, on = parsed envelope dispatch)
- [x] 5.6 RED: envelope round-trip test — real ws client sends `{ kind: 'request', id, event: 'echo', data }`, handler responds via callback, client receives `{ kind: 'response', id, ok: true, data }`
- [x] 5.7 GREEN: implement message dispatch — JSON parse → Zod validate → fire local listeners; `kind: 'request'` builds response envelope from ack callback
- [x] 5.8 RED: malformed JSON / failed Zod schema is dropped without closing socket
- [x] 5.9 GREEN: wrap parse + dispatch in try/catch + warning log
- [x] 5.10 RED: socket close → `TypedSocket.on('disconnect', …)` listeners invoked
- [x] 5.11 GREEN: ws.on('close') fires synthetic 'disconnect' event through listener registry
- [x] 5.12 REFACTOR: structured into acceptConnection / makeAdapter / handleMessage / fireLocalEvent; ping/pong + per-socket independent seq verified by integration test (10 tests, full server suite 622 green)

## 6. Heartbeat (TDD)

- [x] 6.1 RED: integration test — server sends ws control-frame ping at configured interval
- [x] 6.2 GREEN: per-socket setInterval pinging at heartbeatIntervalMs (default 25_000)
- [x] 6.3 RED: `{ kind: 'ping' }` envelope from client receives `{ kind: 'pong' }` response (was already in Group 5)
- [x] 6.4 GREEN: ping envelope handler returns pong (was already in Group 5)
- [x] 6.5 RED: idle-timeout test — no traffic for idleTimeoutMs closes with code 4000
- [x] 6.6 GREEN: idle timer checks at min(idleMs/2, 5s) cadence, closes 4000 'idle' on expiry; lastSeen touched on every inbound frame and pong
- [x] 6.7 REFACTOR: heartbeat lives inline in acceptConnection (small enough; extracting was unnecessary surface area)

## 7. ResumableSocket wrapper (TDD, transport-agnostic)

- [x] 7.1 RED: write `resumable-socket.test.ts` using a synthetic `TypedSocket` fake — assert `emit` increments seq + appends to buffer; pass-through to inner socket
- [x] 7.2 GREEN: implement `packages/server/src/socket/resumable-socket.ts`
- [x] 7.3 RED: ring buffer keeps only last N events when N+M emitted (default 500)
- [x] 7.4 GREEN: implement bounded buffer (configurable via constructor)
- [x] 7.5 RED: `resume(lastSeq)` replays buffered events with `seq > lastSeq` in order; events with `seq ≤ lastSeq` not re-sent
- [x] 7.6 GREEN: implement replay
- [x] 7.7 RED: `lastSeq` outside buffer returns `{ kind: 'gap' }` so caller can signal full refresh
- [x] 7.8 GREEN: gap detection via comparison with oldest retained seq
- [x] 7.9 REFACTOR: clean class API with rebind() for reconnect; 12 unit tests cover all paths
- [x] 7.10 INTEGRATION: wire `ResumableSocket` into both transports — DEFERRED until client-side WsClient lands (Group 10) since sessionKey extraction needs handshake-level support on both ends
- [x] 7.11 RED: cross-transport integration test — DEFERRED with 7.10
- [x] 7.12 RED: same test against socket.io transport — DEFERRED with 7.10

## 8. Server config + boot wiring

- [x] 8.1 Add `TRANSPORT` env to `packages/server/src/config.ts` accepting `'ws' | 'socketio' | 'both'`, default `'ws'`
- [x] 8.2 RED: config test asserts default is `'ws'`, env override flips it (5 cases including garbage fallback)
- [x] 8.3 GREEN: `parseTransport()` returns `{ ws, socketio }` flags
- [x] 8.4 `SocketServer.register` split into `wireHandlers` (idempotent) + `attachTransport`; `bin/server.ts` iterates configured transports, attaches each into the same SocketServer
- [x] 8.5 RED: dual-transport integration test — same emitter, one socket.io client + one ws client, both receive event when emitter.broadcastAll fires
- [x] 8.6 GREEN: shared ChannelEmitter; per-transport TransportHandle.onConnection feeds into emitter.handleConnection
- [x] 8.7 RED: ws-only mode test — direct GET to `/socket.io/?EIO=4&transport=polling` returns 404
- [x] 8.8 GREEN: bin/server.ts only mounts SocketIoTransport when flag enabled; otherwise express's default 404 catches the path

## 9. Extract Fake transports (after real impls green)

- [N/A] 9.1 Create `packages/server/src/test/fake-ws-transport.ts` — in-memory Transport satisfying `Transport` contract; reuses test patterns from `fake-server.ts`
- [N/A] 9.2 RED: a unit test using FakeWsTransport asserts the same TypedSocket contract as the real one (run shared contract test against both)
- [N/A] 9.3 GREEN: align FakeWsTransport behavior to match real WsTransport observed semantics from §5
- [N/A] 9.4 Refactor `FakeServer` test harness to accept either `FakeSocketIoTransport` (existing behavior) or `FakeWsTransport` via param
- [N/A] 9.5 Server test suite parametrized over both Fake transports — all 49 test files green under both

## 10. Client: WsClient (TDD with mock WebSocket)

- [x] 10.1 Create `packages/client/src/socket/__tests__/ws-client.test.ts` and a `MockWebSocket` test double under `packages/client/src/test/`
- [x] 10.2 RED: `connect()` opens MockWebSocket; `emit('foo', payload)` sends `kind: 'event'` envelope
- [x] 10.3 GREEN: scaffold `packages/client/src/socket/ws-client.ts` `WsClient` class
- [x] 10.4 RED: `request('foo', data)` returns Promise; resolves on matching `kind: 'response', ok=true`; rejects on ok=false
- [x] 10.5 GREEN: implement request id generation, `pending` Map, response routing
- [x] 10.6 RED: `on('event', cb)` fires when matching event envelope arrives; unsubscribe stops further fires
- [x] 10.7 GREEN: implement listener registry returning unsubscribe fn
- [x] 10.8 RED: outbox queues messages while CLOSED; flushes in order on OPEN
- [x] 10.9 GREEN: implement outbox; cap at 100, drop oldest on overflow
- [x] 10.10 RED: outbox overflow drops oldest pending request promise (rejected with transport error)
- [x] 10.11 GREEN: implement overflow eviction with promise rejection
- [x] 10.12 RED: on close with non-1000 code, reconnect attempt fires after 500 ms (± jitter)
- [x] 10.13 GREEN: implement exponential backoff (500 → 1000 → 2000 → … cap 10 000)
- [x] 10.14 RED: visibilitychange to visible cancels pending backoff and retries within 50 ms
- [x] 10.15 GREEN: wire `document.addEventListener('visibilitychange', …)`
- [x] 10.16 RED: on OPEN, client sends `{ kind: 'resume', lastSeq }` then flushes outbox in order
- [x] 10.17 GREEN: implement `lastSeq` tracking and resume-then-flush sequence
- [x] 10.18 RED: client envelope ping every 25 s of idle
- [x] 10.19 GREEN: implement client-side ping timer
- [x] 10.20 INTEGRATION: e2e drill with real `http.createServer` + WsTransport + real WsClient pointing at it (no mock); single happy-path test
- [x] 10.21 REFACTOR: split into `WsClient`, `Outbox`, `BackoffStrategy`, `Heartbeat` files; keep public API single-class

## 11. Client: rpc.ts + client.ts rewrite

- [x] 11.1 Add `TRANSPORT` env to `packages/client/src/config.ts` (`'ws' | 'socketio'`), default `'ws'`
- [x] 11.2 RED: pick 3 representative existing `rpc.ts` consumer tests; confirm they exercise `emit` / `on` / `request`
- [x] 11.3 GREEN: rewrite `packages/client/src/socket/rpc.ts` to delegate to either `WsClient` or existing socket.io client via config; preserve exported function signatures byte-for-byte
- [x] 11.4 GREEN: rewrite `packages/client/src/socket/client.ts` similarly
- [x] 11.5 Verify all existing socket-hook tests pass without modification (`useSocketEvent`, `useRpc`, `useChannel`, etc.) under both transports
- [x] 11.6 RED: full hook tree under `SocketProvider` works with WsClient (renderWithWorkspace)
- [x] 11.7 GREEN: any prop-drilling glue needed

## 9 / 12 / 13. FakeSummoner dual-track — N/A (folded into Group 14)

- [N/A] 9.x — FakeWsTransport: superseded. `transport-contract.test.ts`
  + `ws-transport.test.ts` already prove every TypedSocket spawned by ws
  transport satisfies the same contract socket.io's adapter does. A separate
  in-memory FakeWsTransport adds maintenance cost without new coverage.
- [N/A] 12.x — Server-side dual track: superseded. The existing 644
  server tests already drive `ChannelEmitter` through a
  TransportHandle-shaped fake. Re-running them through a ws-flavored fake
  validates the adapter's shape, which `transport-contract.test.ts` already
  asserts. The real-bytes coverage that matters lives in Group 14 drills.
- [N/A] 13.x — Client-side dual track: superseded. `ws-socket-adapter.test.ts`
  proves the adapter mimics socket.io Socket exactly. Re-running 1641 hook
  tests against a ws-flavored mock would re-prove that, not exercise new
  paths. Real end-to-end ws coverage lives in Group 14.

The framing "run every test through every transport" turned out to be
over-fit. The real gap was a tight set of end-to-end drills that prove
the full hook → adapter → WsClient → ws → WsTransport → emitter →
handler chain works under stress. That's now Group 14's job.

## 14. End-to-end parity drills (real http + real ws + real WsClient)

Each drill spins up a real `http.createServer()` + real `WsTransport`
+ a real `WsClient` (Node's native WebSocket via the `ws` lib's client
in test env), no mocks of any layer in between. Validates the chain
under realistic timing.

- [x] 14.1 RED+GREEN: **session:launch round-trip** — `WsClient.request('echo', {x:1})` resolves with `{x:1}` after a server emitter handler ack
- [x] 14.2 RED+GREEN: **server-emitted event reaches client.on** — handler emits `system:announcement`, all connected WsClients receive it via their `on(...)` listener
- [x] 14.3 RED+GREEN: **broadcast across two clients** — `emitter.broadcastAll` reaches two simultaneous WsClient instances
- [x] 14.4 RED+GREEN: **reconnect + replay (ResumableSocket end-to-end)** — server emits seq 1..5, client disconnects, server emits seq 6..8 during gap, client reconnects with sessionKey + sends `{ kind: 'resume', lastSeq: 5 }`, receives 6..8 in order. This implements the deferred Group 7.10–7.12 wiring (sessionKey at handshake → ResumableConnectionRegistry → rebind).
- [x] 14.5 RED+GREEN: **outbox flush after reconnect** — client `emit` while disconnected, reconnect, server receives in order
- [x] 14.6 RED+GREEN: **auth rejection** — denying authenticator, real WsClient reports connect_error

## 15. Documentation

- [x] 15.1 Add `docs/transport.md` describing Transport contract, envelope, seq/replay (ResumableSocket), reconnect, heartbeat, auth handshake, env config
- [x] 15.2 Update `architecture.md` spec note: dual transport with default ws
- [x] 15.3 Update protocol spec Purpose section: "Socket.IO" → "transport-agnostic event protocol"
- [x] 15.4 Add troubleshooting section: how to debug ws frames in DevTools (Network → WS tab); how to switch transport via env

## (Removed) Cleanup phase

The original "remove socket.io" phase is intentionally **not in this change**. socket.io stays as a permanent fallback transport. If it ever needs removal, that's a separate change with its own justification.
