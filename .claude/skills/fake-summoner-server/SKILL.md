---
name: fake-summoner-server
description: >
  FakeSummoner test harness for **server-side** tests — socket handlers, channel integration, pipeline, DB, CLI process. Use when writing or debugging server tests that need real socket.io + in-memory DB + fake CLI process. For client tests see `fake-summoner-client` skill.
---

# FakeSummoner — Server Tests

## 核心概念

`FakeSummoner` = 一個 **測試用的 window/連線**，同時擁有：
- 真的 socket.io client（連到測試用 FakeServer）
- 一個 FakeClaude（模擬 CLI 過程）
- FilesystemService / GitService 的記憶體 fake 實作

每個 FakeSummoner 代表「一個 UI window」。多 window 測試建立多個 summoner 共用同一 server。

## Import 來源

| 東西 | 從哪 import |
|---|---|
| `createFakeSummoner` / `createFakeServer` / `createTestContainer` | `../test/index`（server 專用版，會 wire DI container） |
| `segments as s` | `@code-quest/summoner/test` |

Server tests 一律從 `../test/index.ts` import — 那是包過 DI container 的版本。`@code-quest/summoner/test` 的同名 export 是 summoner base 版，給 summoner package 本身測試用。

## 最小 Setup

```ts
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

const claude = createFakeSummoner().claude();
const channelId = await claude.initialize();
```

`initialize()` 跑完整 CLI 啟動流程：spawn → ready → init segment。

## 含 DI container（存取 services）

```ts
import { createFakeServer, createFakeSummoner, createTestContainer } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const container = createTestContainer();
  const server = createFakeServer(container);
  const summoner = createFakeSummoner(server);
  const claude = summoner.claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { container, claude, channelId };
}
```

## FakeSummoner API

```ts
const summoner = createFakeSummoner(server);

summoner.claude()                  // lazy-init FakeClaude
summoner.socket                    // FakeSocket（注入到 SocketProvider）
summoner.filesystem()              // FakeFilesystemService
summoner.git()                     // FakeGitService（可 undefined）
summoner.openspec()                // FakeOpenspecService（可 undefined）
summoner.pluginCli()               // FakePluginCliService（可 undefined）
summoner.connected                 // boolean
summoner.disconnect()

await summoner.send<T>(event, payload)     // 透過 socket 送（等 ack）
summoner.receivedEvents()                  // 收到的所有 server → client events
summoner.receivedEvents('session:init')    // 過濾特定 event
summoner.sentEvents()                      // 所有 client → server emits
summoner.sentEvents('session:launch')      // 過濾特定 sent event
summoner.on(event, fn)                     // subscribe
summoner.holdEmit(event)                   // 攔截下一次 emit 的 ACK（見下節）
```

## FakeClaude API

```ts
const claude = summoner.claude();

// 啟動 — 選一個
await claude.initialize(initSeg?)                      // 完整流程
await claude.initialize({ launch: { cwd, ... } }, seg) // with launch params
claude.prepareInit(segment)                             // 預備 init，不自動跑（等外部 launch）

// Protocol 發送（CLI → server → client）
await claude.emitSegment(s.assistant('Hi'))
await claude.emitSegment(s.result())
await claude.emitSegment(s.controlRequest('r1', 'can_use_tool', 'Bash', { command: 'ls' }))

// Socket send（等 ack）
await claude.send<LaunchOk>('session:launch', { channelId: 'ch-1' })
await claude.send('chat:send', { channelId, message: 'go' })
await claude.send('chat:respond', { channelId, requestId, response })

// 查 events（server → client broadcast）
claude.receivedEvents()                          // 所有
claude.receivedEvents<E>('message:assistant')    // 帶型別
claude.received()                                // CLI stdin 收到的訊息
claude.received<T>('control_response')           // 帶型別

// Control request handler（自訂回應）
claude.setControlRequestHandler((req) => { ... })

// Server push simulation
claude.pushServerEvent('event', payload)         // 模擬 server broadcast
claude.pushSessionState(channelId, state, opts)  // 模擬 session:states
claude.pushSessionClosed(channelId, error?)      // 模擬 session:closed

// Process 層
claude.provider                           // FakeProcessProvider
claude.handle                             // FakeProcessHandle（可 abort 模擬 exit）
claude.lastInitRequestId                  // 最後一次 initialize 的 request_id
claude.connected
claude.disconnect()
```

## FakeSocket 架構

`createFakeSocket()` 建立一個 dual-emitter：
- **client → server**: 同步 delivery（callback pattern 需立即回應）
- **server → client**: async via `queueMicrotask`（模擬真實 socket.io 網路延遲）

```ts
interface FakeSocket {
  id: string;
  connected: boolean;
  serverSocket: FakeServerSocket;  // server 端 emitter
  connect(): FakeSocket;
  disconnect(): FakeSocket;
  on / once / off / emit / listeners
}
```

`serverSocket.lastHandlerPromise` — 等待最後一個 server handler 的 async 完成（`send()` 內部使用）。

## 常見 pipeline：message 往返

```ts
const { claude, channelId } = await setup();

await claude.send('chat:send', { channelId, message: 'hi' });
await claude.emitSegment(s.assistant('Hello!'));
await claude.emitSegment(s.result());

const events = claude.receivedEvents('message:assistant');
expect(events[0].content[0].text).toBe('Hello!');
```

## Tool use + permission 流程

```ts
await claude.emitSegment(
  s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } })
);
await claude.emitSegment(s.controlRequest('req-1', 'can_use_tool', 'Bash', { command: 'ls' }));

const permEvents = claude.receivedEvents('control:permission');
expect(permEvents[0].requestId).toBe('req-1');

await claude.send('chat:respond', {
  channelId,
  requestId: 'req-1',
  response: { behavior: 'allow', updatedInput: {} },
});
```

## Control request handler（自訂回應）

```ts
claude.setControlRequestHandler((req) => {
  if (req.subtype === 'side_question') {
    return { response: 'The answer is 42', synthetic: false };
  }
  if (req.subtype === 'reload_plugins') {
    return { agents: [...], plugins: [...] };
  }
  return null;  // null = 自動回 { subtype: 'success' } 空回應
});
```

適用情境：
- `side_question` — `/btw` 邊緣提問
- `reload_plugins` — plugin 熱重載
- `can_use_tool` — MCP 工具授權
- `open_diff` — 檔案 diff 預覽

## holdEmit（攔截 ACK delivery）

```ts
const held = summoner.holdEmit('session:join');

// emit 會送到 server（handler 執行），但 ACK callback 被攔截
summoner.send('session:join', { channelId });

// 此時 client 還沒收到 ACK — 適合測 loading/connecting 中間狀態
// ...

held.release();  // 釋放 ACK → callback 執行
```

只攔截第一次 matching emit；後續同名 emit 正常通過。

## 多 window 在同一 channel（join pattern）

```ts
const server = createFakeServer();
const window1 = createFakeSummoner(server);
const window2 = createFakeSummoner(server);

const channelId = await window1.claude().initialize();
await window2.send('session:join', { channelId });

const initEvents = window2.claude().receivedEvents('session:init');
expect(initEvents[0].model).toBe('claude-opus-4-6');
```

## Channel resume（模擬 server 重啟）

```ts
const summoner1 = createFakeSummoner(server);
const channelId = await summoner1.claude().initialize(
  s.init('sess-x', { model: 'claude-opus-4-6' }),
);

// 模擬 channel 結束
summoner1.claude().handle.abort();
await new Promise<void>((r) => queueMicrotask(r));

// 新 summoner join — 從 DB 還原
const summoner2 = createFakeSummoner(server);
await summoner2.send('session:join', { channelId });
expect(summoner2.claude().receivedEvents('session:init')[0].model).toBe('claude-opus-4-6');
```

## 外部 launch（prepareInit）

預備 init segment 但不自動跑，用於測 UI 按「New tab」觸發 `session:launch`：

```ts
const claude = createFakeSummoner().claude();
claude.prepareInit(s.init('prep-sess'));

await claude.send<LaunchOk>('session:launch', { channelId: 'ch-1' });
```

## 時序陷阱

**忘記 `await`**：`claude.emitSegment()` 是 async，必須 await 才會 flush microtask。
**觀察 event 前要讓 delivery 完成**：server → client 是 async，驗證前可加 `await new Promise(r => queueMicrotask(r))`。
**open_diff 之類的 notification 有額外 delay**：可能需 `setTimeout(r, 50)` 等通知流程完成。

## Cleanup

**每個測試新 instance 就夠了**，不需 `afterEach`：

```ts
it('test 1', async () => {
  const { claude } = await setup();
  // ... 測試 ...
});

it('test 2', async () => {
  const { claude } = await setup();  // 全新 instance
});
```

測斷線 / channel exit：

```ts
claude.disconnect();            // socket 斷
claude.handle.abort();          // process 退出
await new Promise<void>((r) => queueMicrotask(r));
expect(claude.receivedEvents('session:closed').length).toBeGreaterThan(0);
```

## Channel / 單元測試需要 ProcessRunner

測試 `Channel` 這類建構時需要 `ProcessRunner` 但本身不驗證 runner 行為的 class：用真實 `ProcessRunner` + `FakeProcessProvider` 組合，維持 runner 的真實介面與生命週期。

```ts
import { ClaudeAdapter, ProcessRunner } from '@code-quest/summoner';
import { FakeProcessProvider } from '@code-quest/summoner/test';

function makeRunner() {
  return new ProcessRunner({
    adapter: new ClaudeAdapter(),
    processProvider: new FakeProcessProvider(),
  });
}

const channel = new Channel(makeRunner(), 'sess-1', 'claude', '/cwd');
```

好處：API 變動時測試會跟著更新，不會被型別 cast 靜默略過。

## 多層驗證（server 版）

Handler 測試預設多層驗證（FakeSummoner 給真 DB + 真 socket + 真 process）：

| 層 | API | 抓的 bug |
|---|---|---|
| ① RPC response | `await claude.send('event', payload)` return value | RPC shape 錯 |
| ② Broadcast | `claude.receivedEvents('event:name')` / 另一 FakeClaude 監聽 | broadcast 漏、channel filter 錯 |
| ③ **DB / Store** | `container.get(TYPES.XxxStore).getByY(...)` | store 邏輯、composite fan-out、transaction |
| ④ CLI stdin | `claude.received('cmd_type')` | controller → CLI writes |

**不要只驗 RPC response**。副作用真的發生比 response shape 重要。

```ts
const res = await claude.send('projects:add', { path: '/tmp/x' });
expect(res).not.toHaveProperty('error');                              // ①
expect(claude.receivedEvents('projects:added').length).toBeGreaterThan(0);    // ②
expect(await projectStore.getByPath('/tmp/x')).not.toBeNull();        // ③
```

對應 client 端在 `frontend-testing/references/fake-patterns.md` 的 Pattern 3.5。

## 慣例

| 情境 | 採用 |
|---|---|
| fake socket | `createFakeSummoner()` 提供的 dual-emitter FakeSocket |
| fake ProcessRunner | `new ProcessRunner({ adapter, processProvider: new FakeProcessProvider() })` |
| protocol event 建構 | `segments.*()` builder（`s.assistant()`, `s.result()`, etc.） |
| 啟動 FakeClaude | `createFakeSummoner().claude().initialize()` |
| 測啟動流程 | `initialize()` 或 `prepareInit()`（外部 launch） |
| 副作用驗證 | 多層（RPC + emit + store + stdin）都驗，不要只驗 RPC |
| 攔截 ACK | `summoner.holdEmit(event)` → `held.release()` |

## 相關 skill

- Client 端 test harness → `fake-summoner-client`
- Test double 層級（server）→ `vitest-testing`
- Fixture-driven TDD（parser/protocol 測試）→ `fixture-driven-tdd`
- Real CLI JSON 收集 → `collect-cli-fixtures`
