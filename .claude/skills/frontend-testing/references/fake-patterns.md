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

測試 CLI → server → client 事件流時用。FakeClaude 自動 `act()` 包裝 emit，不需手動。

```tsx
const { claude, user } = await renderWithWorkspace();
const textarea = screen.getByPlaceholderText(/Esc to focus/i);
await user.type(textarea, 'hello');
await user.keyboard('{Enter}');
await claude.emit(s.assistant('Hello!'));
await claude.emit(s.result());
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

- `onControlRequest((req) => ...)` 只能回 success response（fake-claude.ts:189-197）。驅動 `{ ok: false }` 錯誤 ack 目前需直接 override `socket.emit`；錯誤傳播邏輯通常在 server 層已測
