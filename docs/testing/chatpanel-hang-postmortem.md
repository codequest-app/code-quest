# ChatPanel 測試 Hang 事後分析

## 問題描述

`ChatPanel.test.tsx` 包含 11 個測試，單獨執行任一測試都能通過，但全部一起執行時會 hang（無限等待），尤其是最後的 `shows git panel after socket connects` 非同步測試。

```
FAIL src/components/__tests__/ChatPanel.test.tsx
  ● shows git panel after socket connects
    Exceeded timeout of 5000ms for a test
```

## 症狀

- `await screen.findByTestId('git-branch')` 永遠不 resolve
- `await act(async () => {})` 本身也 hang（確認不是 findBy timeout 問題）
- 只有在「sends message」測試之後執行「shows git」才會 hang
- 單獨執行「shows git」測試完全正常

## 調查過程

### 錯誤假設（排除清單）

| 假設 | 排除原因 |
|------|---------|
| `react-hotkeys-hook` 的 document-level keydown listener | mock 後仍 hang |
| Radix Dialog 的 `DismissableLayer` / `useEscapeKeydown` | mock `InitOptionsDialog` 為 null 仍 hang |
| `zustand/middleware` persist | mock 後仍 hang |
| `fireEvent.keyDown` 造成 React scheduler 殘留 | 改用 `fireEvent.click` 仍 hang |

### 二元搜尋定位

透過逐步縮減的 `chat-hang-repro.test.tsx` 確認：

1. `fireEvent.click` → `shows git` PASSES ✓
2. `fireEvent.keyDown(any key)` → `shows git` HANGS ✗
3. mock `@radix-ui/react-dialog` 整個模組 → 不 hang（但 Portal 壞掉）

前兩點讓我們誤以為是 keyDown 特有的問題。第三點誤導了方向（mock 整個 Radix 模組影響了更多東西）。

### 真正的根本原因

**`useGitActions.ts` 的函式沒有 `useCallback`**

```ts
// 修復前：每次 render 都產生新的 function reference
export function useGitActions(socket: TypedSocket) {
  const gitStatus = () =>
    new Promise<GitStatusResult>((resolve) => socket.emit('git:status', resolve));
  // ...
}
```

`ChatPanel.tsx` 的 gitStatus effect：

```ts
useEffect(() => {
  const fetch = () => gitStatus().then(setGitStatusResult).catch(() => {});
  socket.on('connect', fetch);
  if (socket.connected) fetch();
  return () => { socket.off('connect', fetch); };
}, [gitStatus, socket]); // ← gitStatus 每次 render 都是新 reference
```

**無限迴圈路徑：**

```
render → 新 gitStatus fn → effect 執行 → fetch()
→ gitStatus() → resolve({ branch: 'main', ... }) [每次是新物件]
→ setGitStatusResult(newObj) → React re-render
→ 新 gitStatus fn (reference 不同) → effect 再執行 → fetch()
→ setGitStatusResult(anotherNewObj) → re-render
→ ...無限迴圈
```

**為什麼單獨執行會 pass？**

`findByTestId` 在第一次 poll 時就找到了 `data-testid="git-branch"`（在無限迴圈完全佔滿 event loop 之前），測試就 pass 了。但無限迴圈仍在背景持續執行，直到 vitest 進程結束。

**為什麼接在「sends message」後才 hang？**

「sends message」測試在 `sendMessage()` 中呼叫多次 `useChatStore.setState`（`addMessage`、`setSuggestions`、`setStatus`）。這些 state update 讓 React 的 concurrent scheduler 已有待處理工作，加上 gitStatus 的無限迴圈，使 event loop 完全被佔用，`findByTestId` 的 polling timer 再也無法執行。

## 修復方案

### 1. `useGitActions.ts` — 加上 `useCallback`

```ts
import { useCallback } from 'react';

export function useGitActions(socket: TypedSocket) {
  const gitStatus = useCallback(
    () => new Promise<GitStatusResult>((resolve) => socket.emit('git:status', resolve)),
    [socket],
  );

  const gitCheckout = useCallback(
    (branch: string) =>
      new Promise<GitCheckoutResult>((resolve) =>
        socket.emit('git:checkout', { branch }, resolve),
      ),
    [socket],
  );

  const gitLog = useCallback(
    (limit?: number) =>
      new Promise<GitLogResult>((resolve) => socket.emit('git:log', { limit }, resolve)),
    [socket],
  );

  const gitDiff = useCallback(
    () => new Promise<GitDiffResult>((resolve) => socket.emit('git:diff', resolve)),
    [socket],
  );

  return { gitStatus, gitCheckout, gitLog, gitDiff };
}
```

`socket` prop 在整個 ChatPanel 生命週期不變，所以 `gitStatus` 穩定不變 → effect 只在 mount 時執行一次。

### 2. `ChatPanel.test.tsx` — 改用 `fireEvent.click` 觸發 onSend

避免 `fireEvent.keyDown`（即使不是根本原因，仍是好習慣）：

```tsx
// 修復前
act(() => {
  fireEvent.change(textarea, { target: { value: 'test message' } });
  fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
});

// 修復後：mock ChatInput 提供 Send button with onClick
act(() => {
  fireEvent.change(textarea, { target: { value: 'test message' } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));
});
```

## 核心教訓

### React Hook 規則

**凡是放進 `useEffect` dependency array 的 function，都必須用 `useCallback` 穩定化。**

在 React hooks 的 custom hook 中定義的 function，如果沒有 `useCallback`，每次 render 都是新 reference。如果這個 function 被放進 `useEffect([fn])` 的 dependency，effect 就會每次 render 都重新執行。

```ts
// ❌ 危險：每次 render 都是新 function
function useMyHook(socket) {
  const doSomething = () => socket.emit('event');
  return { doSomething };
}

// ✅ 正確：用 useCallback 穩定化
function useMyHook(socket) {
  const doSomething = useCallback(() => socket.emit('event'), [socket]);
  return { doSomething };
}
```

### 測試調試規則

1. **單獨跑 pass ≠ 沒問題** — 可能有無限迴圈只是跑得夠快
2. **`await act(async () => {})` hang = 無限 React 工作** — 不是 timeout 問題
3. **兩測試組合才 hang = 後者有無限迴圈，前者讓 scheduler 更忙** — 分別找前者「留下什麼」和後者「自己有什麼問題」
4. **二元搜尋時不要只找「前者留下什麼」** — 後者本身也可能有 bug

### 測試架構建議

在 `ChatPanel.test.tsx` 中 mock `ChatInput` 且用 `onClick` 觸發 `onSend` 是正確的架構分工：

- **ChatPanel 測試**：orchestration 邏輯（socket 呼叫、store 狀態）→ 用 mock ChatInput + click
- **ChatInput 測試**：UI 互動（keyDown、slash command dropdown）→ 用 Storybook play function
