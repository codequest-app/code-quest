---
name: fake-summoner-client
description: >
  FakeSummoner test harness for **client-side** tests — React component/context/hook tests that need socket + pipeline. Covers renderWithWorkspace, renderWithChannel, multi-tab scenarios, state injection vs full pipeline. For server tests see `fake-summoner-server` skill.
---

# FakeSummoner — Client Tests

## 核心概念

Client 端 `FakeSummoner` 繼承 server 基礎版 + 加上 **TypedSocket 型別**。搭配兩個 render helper：

- **`renderWithWorkspace`** — 完整 workspace，適合 **多 tab / workspace-level** 測試
- **`renderWithChannel`** — 單一 channel 包好，適合 **component / context / hook** 測試

React 互動必須在 `act()` 裡 flush。

## Import 來源

| 東西 | 從哪 import |
|---|---|
| `renderWithChannel` / `renderWithWorkspace` | `@/test/render-with-channel` / `@/test/render-with-workspace` |
| `createFakeSummoner` / `FakeSummoner` | `@/test/fake-summoner`（含 TypedSocket 強型別） |
| `createFakeServer` | `@code-quest/server/test` |
| `segments as s` / `controlRequest*` | `@code-quest/summoner/test` |
| `sendUserMessage` / `emitAssistantTurn` | `@/test/helpers` |

## renderWithChannel — 最常用

自動包 `SocketProvider` → `SessionProvider` → ... → `TabProvider` → `ChannelProvider`，並跑 `claude.initialize()`。

```tsx
import { renderWithChannel } from '@/test/render-with-channel';
import { segments as s } from '@code-quest/summoner/test';

const { claude, channelId, user } = await renderWithChannel(<ChatPanel />);

await user.type(screen.getByPlaceholderText(/Esc to focus/i), 'hello{Enter}');
await act(async () => {
  await claude.emit(s.assistant('Hi back'));
  await claude.emit(s.result());
});

expect(screen.getByText('Hi back')).toBeInTheDocument();
```

### 選項

```tsx
await renderWithChannel(<MyComponent />, {
  channelId: 'ch-test',
  skipInit: false,                    // false = 自動 initialize
  extraSegments: [                    // 額外 init-time segments
    s.controlResponse('init', { models: [{ value: 'opus-4-6' }] }),
  ],
  initialState: {                     // ChannelProvider 的 initial state 注入
    pendingControls: [{ requestId: 'r1', subtype: 'can_use_tool', toolName: 'Bash' }],
  },
});
```

`skipInit: true` 用於外部控制啟動流程（搭配 `cwd` prop）。

## renderWithWorkspace — 多 session 測試

整個 WorkspaceLayout 入口（含 project list / tab bar）。

```tsx
import { renderWithWorkspace } from '@/test/render-with-workspace';

const { claude, summoner, user, addProject } = await renderWithWorkspace();

const project = await addProject({ path: '/test', dirName: 'app' });
await project.launchSession();

// 另開 tab
await user.click(screen.getByLabelText('New tab'));

const closeBtns = screen.getAllByLabelText(/^Close /);
expect(closeBtns).toHaveLength(2);
```

## 互動 + 事件發送的 act() 模式

**使用者操作**（`user.click`/`user.type`）— testing-library 的 userEvent 已自動 act。

**模擬 server push**（`claude.emit`）— 必須手動 act：

```tsx
await user.click(screen.getByRole('button', { name: 'Submit' }));  // ✓ 已包 act

await act(async () => {
  await claude.emit(s.assistant('response'));  // ⚠️ 必須手動 act
});
```

**便利 helper**（專案內）：
- `sendUserMessage(user, 'text')` — 打字 + Enter
- `emitAssistantTurn(claude, 'msg')` — 自動包 assistant + result + act

## Permission / Control request UI 測試

```tsx
const { claude } = await renderWithChannel(<ChatPanel />);
await userEvent.type(screen.getByPlaceholderText(/Esc to focus/i), 'go{Enter}');

await act(async () => {
  await claude.emit(
    s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls' } } }),
  );
  await claude.emit(s.controlRequestBash('r1', { command: 'ls' }));
});

expect(screen.getByText('Yes')).toBeInTheDocument();

// 使用者允許
await user.click(screen.getByText('Yes'));
expect(screen.queryByTestId('pending-banner')).not.toBeInTheDocument();
```

Segment helpers：`s.controlRequestBash()`、`s.controlRequestOpenInEditor()`、`s.controlRequestOpenDiff()`。

## State injection — 什麼時候用

**優先 full pipeline**（`claude.emit`）— 最接近真實流程。

**`initialState` 適合以下情境**：
- 測**純渲染**，不關心事件流程（例如「給定 pending control，banner 應顯示」）
- 測**初始 conditional render**（例如「loading=true 時顯示 spinner」）
- 快速設 edge case state 而不用串一大堆 segment

```tsx
await renderWithChannel(<ChatPanel />, {
  initialState: {
    pendingControls: [{ requestId: 'r1', subtype: 'can_use_tool', toolName: 'Bash' }],
  },
});
expect(screen.getByText(/Bash/)).toBeInTheDocument();
```

## 跨 Context 測試（WorktreeContext / SessionContext）

需要 prime 服務（例如 git worktree list）時，先用**一個 summoner** 設好 state，再給**另一個 summoner** 連上：

```tsx
import { createFakeServer } from '@code-quest/server/test';
import { FakeSummoner } from '@/test/fake-summoner';

const server = createFakeServer();
const primingSummoner = new FakeSummoner(server);
primingSummoner.git()!.setProjectRoot('/repo');
primingSummoner.git()!.addWorktree({ name: 'w1', path: '...', branch: 'b1' });

// 第二個 summoner 讀到已設好的 state
function Wrapper({ children }) {
  const ref = useRef<FakeSummoner | null>(null);
  if (!ref.current) ref.current = new FakeSummoner(server);
  return <SocketProvider socket={ref.current.socket}>{children}</SocketProvider>;
}

const { result } = renderHook(() => useWorktree(), { wrapper: Wrapper });
await act(() => result.current.list('/repo'));
expect(result.current.listing['/repo']).toContainEqual({ name: 'w1', ... });
```

`useRef` + lazy init 確保 renderHook rerender 時不會重建 summoner（socket 斷線問題）。

## 多 tab / multi-channel 細節

每個 tab 自己的 `channelId`（`launchSession` 時自動產生）。`ChannelProvider` 依 `useChannelId()` 路由訊息。

測試多個 channel 的行為：

```tsx
const { addProject, user } = await renderWithWorkspace();
const projA = await addProject({ path: '/a' });
const projB = await addProject({ path: '/b' });

await projA.launchSession();
await projB.launchSession();

// 在 Tab B 打字，切回 Tab A 應保留 Tab A 的內容
await user.type(screen.getByPlaceholderText(...), 'B message');
await user.click(screen.getByRole('tab', { name: /a/i }));
expect(screen.queryByDisplayValue('B message')).not.toBeInTheDocument();
```

## 純 action / handler unit test（不經 React）

測試只接 socket 參數的 function（如 `createControlActions`）：用完整 pipeline — prime server 端 state，透過 `claude.received(...)` 觀察真的送達 CLI。

```ts
const summoner = createFakeSummoner();
const claude = summoner.claude();
const channelId = await claude.initialize();

// prime server：造出 pending control request
await claude.send('chat:send', { channelId, message: 'go' });
await claude.emit(s.assistant({ toolUse: { id: 't1', name: 'Bash' } }));
await claude.emit(s.controlRequest('req-1', 'can_use_tool', 'Bash', {}));

// action 用真的 socket
const actions = createControlActions({ socket: summoner.socket, channelId, ... });
actions.respondToControl({ behavior: 'allow', updatedInput: {} }, 'req-1');

await new Promise<void>((r) => queueMicrotask(r));
await new Promise<void>((r) => setTimeout(r, 10));  // flush server→CLI delivery

const responses = claude.received('control_response');
expect(responses.map((r) => r.response.request_id)).toContain('req-1');
```

**負面斷言**（「不應該送」）用 `claude.received(...).length` before/after 比較。

## 慣例

| 情境 | 採用 |
|---|---|
| 取得 fake socket + handlers | `createFakeSummoner()` + `renderWithChannel` + segment emit |
| Fake socket 物件 | FakeSummoner 提供的 dual-emitter socket |
| 驗證 action 發 socket event | 完整 pipeline + `claude.received(...)` |
| 包 `claude.emit()` flush state | `await act(async () => claude.emit(...))` |
| `skipInit: true` 模式 | 搭配 `cwd` prop 由外部 launch |
| `renderHook` 重複 render | wrapper 用 `useRef` lazy init summoner |

## 相關 skill

- Server 端 test harness → `fake-summoner-server`
- Test double 層級（client）→ `frontend-testing`
- RTL query / userEvent 慣例 → `frontend-testing` / `testing-best-practices`
- Storybook play function → `storybook-component`
