# FakeSummoner / Socket Test Patterns — Reference

詳細 API 見 `fake-summoner-client` skill。本檔收錄三種常用 pattern 的完整範例 + 需要遷移掉的 legacy patterns。

## Pattern 1: State injection（無 socket 互動）

測試組件 render + state-driven UI 時用。不經 FakeClaude 管線，直接以 `initialState` 喂進 ChannelProvider。

```tsx
render(
  <SocketProvider socket={createFakeSummoner().claude().socket}>
    <SessionProvider>
      <TabProvider>
        <ChannelProvider
          channelId="ch-1"
          initialState={{
            pendingControls: [{ requestId: 'r1', subtype: 'can_use_tool', toolName: 'Bash' }],
          }}
        >
          <ChatPanel joinSession={vi.fn()} toggleHistory={vi.fn()} />
        </ChannelProvider>
      </TabProvider>
    </SessionProvider>
  </SocketProvider>,
);

expect(screen.getByText(/Bash/)).toBeInTheDocument();
```

## Pattern 2: Full pipeline — `renderWithWorkspace`

測試 CLI → server → client 事件流時用。`emitSegment` 需包在 `act()` 裡。

```tsx
const { claude, user } = await renderWithWorkspace();
const textarea = screen.getByPlaceholderText(/Esc to focus/i);
await user.type(textarea, 'hello');
await user.keyboard('{Enter}');
await act(async () => {
  await claude.emitSegment(s.assistant('Hello!'));
  await claude.emitSegment(s.result());
});
expect(screen.getByText(/Hello!/)).toBeInTheDocument();
```

## Pattern 2b: `renderWithChannel` + `skipInit`

需要「未 init 狀態」（例如測 auth:login 無 session 錯誤流）時：

```tsx
const { summoner } = await renderWithChannel(<AuthProbe />, { skipInit: true });
// fake server naturally returns { ok: false, error: 'No active session' }
```

## Pattern 3: Verify action via observable effect

```tsx
// ✅ 驗證 side effect（state / UI）
await user.click(screen.getByText('Yes'));
expect(screen.getByTestId('pending-count')).toHaveTextContent('0');

// ❌ 不驗證 socket.emit spy
expect(claude.socket.emit).toHaveBeenCalledWith('chat:stop_task', ...);
```

## Pattern 3.5: 多層驗證 — 用 FakeSummoner 跑透整條 pipeline

**最強的 user-flow 測試**：FakeSummoner 給你**真的 socket + 真的 in-memory DB + 真的 server handler**。所以 user 操作後，每一層都能驗證。優先用這套，不要只驗 UI。

### 驗證鏈（由淺入深）

| 層 | 驗法 | 能抓的 bug |
|---|---|---|
| ① UI dialog / banner | `getByText(/...)` | wire 到 menu item / button 沒接對 |
| ② Server 收到 + 廣播 | `claude.receivedEvents('projects:removed').length > 0` | handler 沒跑、payload schema 錯、broadcast 漏 |
| ③ **DB / Store 真的改了** | `container.get(TYPES.ProjectStore).getByPath(...)` 為 null | store 邏輯壞、composite fan-out 漏、transaction 沒 commit |
| ④ Client state 同步 | `queryByText` 不在 doc / state probe | 訂閱沒接好、setState 沒觸發 |

**完整範例：**

```ts
const container = createTestContainer();
const server = createFakeServer(container);
const summoner = createFakeSummoner(server);
const projectStore = container.get<ProjectStore>(TYPES.ProjectStore);
const claude = summoner.claude();

await projectStore.upsert('/path/proj');  // prime DB

render(<Wrapper>...<ProjectCard cwd="/path/proj" /></Wrapper>);

// 操作 → 觸發 dialog
await user.click(screen.getByLabelText('More actions'));
await user.click(await screen.findByRole('menuitem', { name: /remove/i }));
expect(screen.getByText(/remove project/i)).toBeInTheDocument();   // ①

// 確認動作
await user.click(screen.getByRole('button', { name: /^remove$/i }));

await waitFor(async () => {
  expect(claude.receivedEvents('projects:removed').length).toBeGreaterThan(0);  // ②
  expect(await projectStore.getByPath('/path/proj')).toBeNull();         // ③
  expect(screen.queryByText(/remove project/i)).not.toBeInTheDocument(); // ④
});
```

### 反向驗證（reject 路徑）

「應該被擋」也要四層全驗，**每一層都該維持原狀**：

```ts
// prime: 一個 active session 阻擋 remove
await sessionStore.upsert({ ..., projectRoot: '/path/proj', status: 'active' });
const beforeEvents = claude.receivedEvents('projects:removed').length;

await user.click(removeButton);
await new Promise((r) => setTimeout(r, 30));

expect(claude.receivedEvents('projects:removed').length).toBe(beforeEvents);   // 沒新事件
expect(await projectStore.getByPath('/path/proj')).not.toBeNull();      // DB 還在
expect(screen.getByText(/active session/i)).toBeInTheDocument();        // UI 顯示原因
```

### 什麼時候不需要全四層？

- **純 UI primitive**（Button / Dialog / Input）：只驗 UI 層
- **非 socket 事件流**：跳過 ②（沒有 server roundtrip）
- **無 store 涉入**：跳過 ③
- **stateless 元件**：跳過 ④

但有 socket + store 的 user flow（add / remove / rename / fork / close 之類）— **預設四層全驗**。

## Pattern 4: 模擬 server 主動推送事件 — `claude.pushServerEvent`

測試「另一個 tab / server 自己 broadcast」場景，例如：
- `projects:added` 從另一個 client 觸發
- `notification:show` 從 server 主動推
- `session:states` 系統事件

```tsx
// ✅ 用 FakeClaude 的高層 API（自動透過 socket pipeline）
act(() => {
  summoner.claude().pushServerEvent('projects:added', {
    id: '...', path: '/x', name: 'x', pinned: false, color: null,
    lastOpenedAt: '...', createdAt: '...',
  });
});
await waitFor(() => expect(state.projects).toHaveLength(1));

// ❌ 不要用底層 socket 戳（破抽象、容易破裂）
summoner.socket.serverSocket.emit('projects:added', payload);
```

差別：
- `pushServerEvent` 是「測試 API」，封裝了 serverSocket 細節
- 直接戳 `serverSocket.emit` 會讓測試耦合到 FakeSocket 內部，未來 refactor 容易壞

## 什麼時候 `vi.fn()` callback 還可以用？

- **純 UI callback**、無 data flow：`onClose` / `onDismiss` / `onSelect(id)`
- **Parent 通知用 callback**，非 socket-based
- 若不確定：檢查 callback 是否封裝 `socket.emit()` → 是就改用 FakeSummoner

## Legacy patterns 要遷移掉

```tsx
// ❌ 手工 fake socket
const fakeSocket = { on: vi.fn(), emit: vi.fn() };

// ❌ Mock callback 不走 socket
const onFetch = vi.fn().mockResolvedValue({ events: mockEvents });

// ❌ 存取 serverSocket 內部
(claude.socket as any).serverSocket.emit('event', data);

// ❌ 客戶端直接 emit 伺服器事件
claude.socket.emit('request_usage_update' as never, {}, () => {});

// ❌ addHandler / setJoinResult / createSocket 皆 deprecated

// ❌ 覆寫 summoner.socket.emit 以注入假 ack
//    （例外：FakeClaude 無法回錯誤 response 時，見 SessionContext-auth test 註解）
```

## 已知 FakeClaude 限制

- `setControlRequestHandler((req) => ...)` 只能回 success response（fake-claude.ts `_wireAutoRespond`）。驅動 `{ ok: false }` 錯誤 ack 目前需直接 override `socket.emit`；錯誤傳播邏輯通常在 server 層已測
