---
name: vitest-testing
description: >
  Project-specific Vitest testing reference for the **server** package (apps/server). Use when writing
  or modifying server-side vitest tests, fixing failing tests, testing DB / socket.io server-side,
  choosing mocking strategies, or working with async patterns and fake timers. For frontend tests
  (apps/web) see `frontend-testing`.
---

# Vitest Testing — Server Reference

> ⚠️ **This skill is server-focused.** Frontend tests follow `frontend-testing` (Testing Library +
> six core principles). This file covers DB / socket.io server-side / CLI process patterns only.

Stack: vitest 1.x, TypeScript, ESM, better-sqlite3, socket.io-client

---

## Test Organization

- One test file per source file: `foo.ts` → `src/__tests__/foo.test.ts`
- Use `describe` to group by class or feature; `it` for individual behaviors
- Name tests as behavior assertions: `'creates a session with a unique id'`

```ts
describe('MyService', () => {
  it('returns null when not found', () => { ... });
  it('throws when input is invalid', () => { ... });
});
```

---

## Setup / Teardown

- **`beforeEach`** — use for state that must be fresh per test (DB, server, sockets)
- **`beforeAll`** — use only for truly shared, read-only fixtures (e.g. static config)
- Always clean up servers and connections in `afterEach` to prevent port leaks

**In-memory SQLite pattern (DB tests):**
```ts
beforeEach(() => {
  db = createDatabase(':memory:');
  migrate(db, { migrationsFolder });
  store = new DrizzleSessionStore(db, sessions);
});
```

**Socket.io integration pattern:**
```ts
beforeEach(async () => {
  httpServer = createServer();
  io = new Server(httpServer);
  handler.register(io);
  await new Promise<void>((r) => httpServer.listen(0, r));
  const { port } = httpServer.address() as AddressInfo;
  clientSocket = ioc(`http://localhost:${port}`, { transports: ['websocket'] });
  await new Promise<void>((r) => clientSocket.on('connect', r));
});

afterEach(async () => {
  clientSocket.disconnect();
  io.close();
  await new Promise<void>((r) => httpServer.close(r));
});
```

---

## Test Double 選擇（server）

優先選低層級 double（真實實作接近度高 → 測試信心高）：

| 層級 | 方式 | 用途 | 範例 |
|---|---|---|---|
| 1 | **真實實作** | 可用 in-memory / 真的 server/socket 時優先 | `:memory:` SQLite、真的 `http.createServer` + `socket.io` server、real repositories |
| 2 | **Spy** | 觀察真實方法呼叫但不改行為 | `vi.spyOn(logger, 'warn')` — 方法照跑，可驗證被呼叫 |
| 3 | **Fake** | 保留行為的簡化實作（共用 harness） | `createFakeSummoner().claude()` / `FakeSummoner` — 見 `fake-summoner-server` / `fake-summoner-client` skill；in-memory `DrizzleSessionStore` |
| 4 | **Stub** | 固定回傳值，無邏輯 | `vi.fn().mockResolvedValue(fixedResult)` — 窄介面、純 query |
| 5 | **vi.mock** | 整個模組替換 | 無法 inject 的依賴（`child_process`、`node-pty`、`fs/promises`） |

**原則：**

- **DB clients / session stores / socket.io** 用真實 in-memory 實例（層級 1），不 mock
- **CLI process** 用 `createFakeSummoner().claude()`（層級 3），不自行拼湊 `{ on: vi.fn(), emit: vi.fn() }`
- **Protocol 事件** 用 `segments.*()` 產生真實 JSON，不手構 `{ type: 'assistant' } as any`
- 用 `vi.spyOn` 務必 `afterEach` 呼叫 `vi.restoreAllMocks()`

Client 端 test double 選擇見 `frontend-testing` skill；五型定義見 `test-doubles` skill。

## Three Test Patterns (choose by scope)

### 1. Global Fake Socket — client→server request/response

`setup.ts` mocks `socket.io-client` globally. `createSocket()` returns an EventEmitter-based
fake socket with `addHandler`/`setJoinResult` (declared via module augmentation on `Socket`).

```ts
import { createSocket } from '../../socket/client';

const socket = createSocket();
socket.addHandler('check_git_status', () => ({ branch: 'main', isClean: true }));
// socket.emit('check_git_status', callback) → callback({ branch: 'main', isClean: true })
```

Built-in handlers: `init`, `session:launch`, `session:join`, `get_session_request`.
Override with `addHandler`. Configure join response with `setJoinResult`.

**Use for:** hooks/components that call `socket.emit(event, payload, callback)`.
**Do NOT use for:** pipeline tests (those need `vi.unmock('socket.io-client')` + real socket.io).

### 2. FakeClaude + Pipeline — CLI→server→client event flow

```ts
vi.unmock('socket.io-client');
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '@code-quest/summoner/test';
import { setupComponentPipeline } from '../../test/pipeline-component-harness';

const p = await setupComponentPipeline(
  createFakeSummoner().claude().initialize(),
);
await p.sendMessage('go');
```

**Use for:** testing CLI stdout → adapter → processRunner → channel → client handler flow.

### 3. Real JSON Fixtures — adapter/protocol parsing

```ts
import { segments as s } from '@code-quest/summoner/test';
const line = s.assistant('hello');
const result = adapter.parseLine(line);
```

**NEVER** hand-construct protocol events (`{ type: 'assistant', ... } as any`). Use `segments.*()`.

### Decision Table

| Testing what | Pattern |
|-------------|---------|
| Client calls socket.emit with ack callback | Global fake socket |
| CLI event flows through pipeline to client | FakeClaude + pipeline |
| Adapter/protocol JSON parsing | Real JSON fixtures |
| Pure React component render (no socket) | render / renderWithProviders |
| Pure function (no socket, no React) | Direct unit test |
```

---

## Async Patterns

- Wrap event-based APIs in `new Promise<T>((resolve) => emitter.on('event', resolve))`
- For timers, use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`
- Prefer `vi.advanceTimersByTimeAsync()` over the sync variant to flush microtasks and avoid deadlocks

```ts
await vi.advanceTimersByTimeAsync(5000);
```

### 用 `vi.waitFor` 同步 pipeline，避免 fixed-sleep

測試跑完一個動作（socket send / claude.emit / abort …）需要等 async 副作用落地（event 廣播 / store 寫入 / downstream push），常見陷阱是寫 `await new Promise(r => setTimeout(r, 50))`。這種做法脆弱且慢：

- 50ms 只是經驗值，排程抖動時不夠 → flaky
- 實際效果早在 <10ms 完成，固定等 50ms 就是浪費

用 `vi.waitFor` 指定**可觀察的後置條件**，事件到就繼續：

```ts
// 取代這個：
await claude.send('session:fork', { ..., newChannelId: 'fork-verify' });
await new Promise<void>((r) => setTimeout(r, 50));
const row = await sessionStore.getByChannelId('fork-verify');
expect(row).toBeDefined();

// 改成：
await claude.send('session:fork', { ..., newChannelId: 'fork-verify' });
await vi.waitFor(async () => {
  const row = await sessionStore.getByChannelId('fork-verify');
  expect(row).toBeDefined();
});
```

**absence 斷言（「不該發生」）**：用 waitFor 等一個**正向**事件證明 pipeline 已 flush，再 assert 目標事件不存在：

```ts
await vi.waitFor(() => {
  expect(windowB.events('message:assistant').length).toBeGreaterThan(0);
});
expect(windowB.events('chat:cancel_request')).toHaveLength(0);
```

**不適用情境** — 沒 observable signal 的 cleanup（例：`handle.abort()` 後只有 internal `for await` 結束，對 socket 無推播；或「N 維持不變」的 absence over a window）— 只能保留 fixed wait + 註解說明為何。

### 避免 `setTimeout(fn, 0)` / 雙 `queueMicrotask` 等待

要把「目前所有 pending microtask + I/O 回呼」flush 完畢，用 `setImmediate`：

```ts
// 不要：
await new Promise((r) => setTimeout(r, 0));
await new Promise<void>((r) => queueMicrotask(() => queueMicrotask(r)));

// 改成：
await new Promise<void>((r) => setImmediate(r));
```

`setImmediate` 排在「下一個 I/O 階段」，自然在所有 pending microtask / promise rejection handler 之後執行。語意比「猜要兩個 microtask」清楚。

### Fake timers + `userEvent` 的衝突

`vi.useFakeTimers()` 連 microtask scheduling 都換掉時，`userEvent` 內部的 promise/microtask wait 會 deadlock。對策：

- 限制 fake 範圍：`vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })` 只接管 setTimeout，userEvent 仍有實 microtask 可用
- 仍 deadlock → 改用 `fireEvent`（同步、不依賴 timer）：
  ```ts
  // user.click → fireEvent.click
  fireEvent.click(button);
  // user.type 'hi{Enter}' → fireEvent.change + keyDown
  fireEvent.change(input, { target: { value: 'hi' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  ```

---

## Isolation and Parallel Execution

- Vitest runs files concurrently by default; each file has its own module scope
- `:memory:` SQLite databases are isolated per file naturally
- Use random ports (`listen(0)`) for HTTP servers — never hardcode a port
- Avoid shared mutable state at module level; initialize everything in `beforeEach`

---

## Performance Tips

- Use `beforeAll` for expensive read-only setup (migrations on a shared DB snapshot)
- Prefer `beforeEach` with `:memory:` DBs — SQLite in-memory creation is fast enough
- Use `test.concurrent` only when tests are provably independent and stateless
- Keep individual test files focused; split large files rather than using `.skip`

---

## Common Pitfalls

- `vi.mock()` is hoisted — it runs before imports, making it hard to control per-test; prefer `vi.spyOn`
- Forgetting `afterEach` cleanup on HTTP servers causes `EADDRINUSE` in subsequent test runs
- Using `advanceTimersByTime` (sync) with promises causes hanging tests — use the `Async` variant
- Hooks inside `describe` only apply to that block; global `beforeEach` applies to the entire file
- ESM + `vi.mock`: factory functions must not reference variables defined outside the factory (temporal dead zone)

---

## Vitest v4 Breaking Changes

> Reference: https://vitest.dev/guide/migration.html

### Type Signature Changes

| v1/v3 | v4 |
|-------|----|
| `vi.fn<TArgs extends unknown[], TReturn>()` | `vi.fn<T extends (...args: any[]) => any>()` — pass the **full function type** |
| `Mock<TArgs, TReturn>` | `Mock<T>` — same shape, one type param |

```ts
// v3
const fn = vi.fn<[string, number], boolean>();
// v4
const fn = vi.fn<(s: string, n: number) => boolean>();
```

### Spy / Mock Behaviour

- **`getMockName()`** now returns `'vi.fn()'` instead of `'spy'` when no name was set — update any snapshot / assertion that matches the old string.
- **`vi.restoreAllMocks()`** only restores **manually created spies** (`vi.spyOn`). Automock replacements are **not** restored by this call; use `vi.resetModules()` or re-import if needed.
- **`mock.invocationCallOrder`** now starts at **1** (was 0). Assertions comparing the raw index need +1 adjustment.

### New API

- **`mock.settledResults`** — array of `{ type: 'fulfilled' | 'rejected', value }` entries for each call, mirroring `mock.results` but for async return values after settlement.

## 相關 skill

- Server 端 FakeSummoner harness → `fake-summoner-server`
- Fixture-driven parser/protocol 測試 → `fixture-driven-tdd`
- TDD 流程 → `tdd` / `tdd-guidelines`
- Test double 五型理論 → `test-doubles`
