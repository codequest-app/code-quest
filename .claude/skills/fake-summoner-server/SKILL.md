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

## 最小 Setup

```ts
import { createFakeSummoner } from '@code-quest/summoner/test';
import { segments as s } from '@code-quest/summoner/test';

const claude = createFakeSummoner().claude();
const channelId = await claude.initialize();
```

`initialize()` 跑完整 CLI 啟動流程：spawn → ready → init segment。

## 含 DI container（存取 services）

```ts
import { createTestContainer, createFakeServer } from '../test/index';

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
summoner.socket                    // socket.io client（注入到 SocketProvider）
summoner.filesystem()              // FakeFilesystemService
summoner.git()                     // FakeGitService（可 undefined）
summoner.connected                 // boolean
summoner.disconnect()

await summoner.send<T>(event, payload)   // 透過 socket 送（等 ack）
summoner.events()                         // 收到的所有 server events
summoner.events('session:init')           // 過濾特定 event
summoner.on(event, fn)
```

## FakeClaude API

```ts
const claude = summoner.claude();

// 啟動 — 選一個
await claude.initialize(initSeg?)                      // 完整流程
await claude.initialize({ launch: { cwd, ... } }, seg) // with launch params
claude.prepareInit(segment)                             // 預備 init，不自動跑（等外部 launch）

// Protocol 發送
await claude.emit(s.assistant('Hi'))    // CLI → server → client
await claude.emit(s.result())
await claude.emit(s.controlRequest('r1', 'can_use_tool', 'Bash', { command: 'ls' }))

// Socket send（等 ack）
await claude.send<LaunchOk>('session:launch', { channelId: 'ch-1' })
await claude.send('chat:send', { channelId, message: 'go' })
await claude.send('chat:respond', { channelId, requestId, response })

// 查 events
claude.events()                          // 所有
claude.events<E>('message:assistant')    // 帶型別
claude.received()                        // CLI stdin 收到的訊息
claude.received<T>('control_response')   // 帶型別

// Control request handler
claude.onControlRequest((req) => { ... })  // 見下節

// Process 層
claude.provider                           // FakeProcessProvider
claude.handle                             // FakeProcessHandle（可 abort 模擬 exit）
claude.connected
claude.disconnect()
```

## 常見 pipeline：message 往返

```ts
const { claude, channelId } = await setup();

await claude.send('chat:send', { channelId, message: 'hi' });
await claude.emit(s.assistant('Hello!'));
await claude.emit(s.result());

const events = claude.events('message:assistant');
expect(events[0].content[0].text).toBe('Hello!');
```

## Tool use + permission 流程

```ts
await claude.emit(
  s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } })
);
await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', { command: 'ls' }));

const permEvents = claude.events('control:permission');
expect(permEvents[0].requestId).toBe('req-1');

await claude.send('chat:respond', {
  channelId,
  requestId: 'req-1',
  response: { behavior: 'allow', updatedInput: {} },
});
```

## Control request handler（自訂回應）

```ts
claude.onControlRequest((req) => {
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

## 多 window 在同一 channel（join pattern）

```ts
const server = createFakeServer();
const window1 = createFakeSummoner(server);
const window2 = createFakeSummoner(server);

const channelId = await window1.claude().initialize();
await window2.send('session:join', { channelId });

const initEvents = window2.events('session:init');
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
expect(summoner2.events('session:init')[0].model).toBe('claude-opus-4-6');
```

## 外部 launch（prepareInit）

預備 init segment 但不自動跑，用於測 UI 按「New tab」觸發 `session:launch`：

```ts
const claude = createFakeSummoner().claude();
claude.prepareInit(s.init('prep-sess'));

await claude.send<LaunchOk>('session:launch', { channelId: 'ch-1' });
```

## 時序陷阱

**忘記 `await`**：`claude.emit()` 是 async，必須 await 才會 flush microtask。
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
expect(claude.events('session:closed').length).toBeGreaterThan(0);
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

## 慣例

| 情境 | 採用 |
|---|---|
| fake socket | `createFakeSummoner()` 提供的 dual-emitter socket |
| fake ProcessRunner | `new ProcessRunner({ adapter, processProvider: new FakeProcessProvider() })` |
| protocol event 建構 | `segments.*()` builder |
| 啟動 FakeClaude | `createFakeSummoner().claude().initialize()` |
| 測啟動流程 | `initialize()` 或 `prepareInit()`（外部 launch） |

## 相關 skill

- Client 端 test harness → `fake-summoner-client`
- Test double 層級（server）→ `vitest-testing`
- Fixture-driven TDD（parser/protocol 測試）→ `fixture-driven-tdd`
- Real CLI JSON 收集 → `collect-cli-fixtures`
