# Decouple TabBar from ChatPanel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Move all tab management (TabBar rendering, openTabs, handleCloseTab, createNewTab) out of `ChatPanel` into `TabContainer`, so `ChatPanel` only knows about a single session.

**Architecture:** `TabContainer` becomes the host for tab UI logic: it reads `tabs` / `activeTabId` from the store, renders `<TabBar>`, and wires tab actions. `ChatPanel` loses all tab awareness — it only receives `sessionId` as prop and calls `useChat(socket)` for session-specific actions. `createNewTab` moves from `use-chat.ts` to `useSessionActions.ts` so `TabContainer` can access it without importing the full `useChat` hook.

**Tech Stack:** React, Zustand, Vitest, @testing-library/react, socket.io-client (TypedSocket)

---

## Current coupling (what we're removing from ChatPanel)

| Line(s) | What | Goes to |
|---------|------|---------|
| 26 | `import { TabBar }` | TabContainer |
| 75 | `createNewTab` from useChat | TabContainer (via useSessionActions) |
| 94–99 | `tabs`, `openTabs` computation | TabContainer |
| 100 | `activeTabId` (for TabBar) | TabContainer |
| 149–160 | `handleCloseTab` function | TabContainer |
| 312–321 | `<TabBar .../>` JSX | TabContainer |
| 228–230 | `addTab`/`setActiveTab` in `onJoin` | replace with `resumeSession(id)` |
| 211 | `activeTabId: aid` in `onClear` | replace with `sessionId` prop |

After refactor, `ChatPanel` has no knowledge of other tabs.

---

## Task 1: Move `createNewTab` from `use-chat.ts` to `useSessionActions.ts`

**Why:** `TabContainer` needs `createNewTab` but should not import the full `useChat` hook.

**Files:**
- Modify: `packages/client/src/hooks/useSessionActions.ts`
- Modify: `packages/client/src/hooks/use-chat.ts`
- Modify: `packages/client/src/hooks/__tests__/useSessionActions.test.ts`

**Step 1: Write the failing test**

In `packages/client/src/hooks/__tests__/useSessionActions.test.ts`, add inside `describe('useSessionActions', ...)`:

```typescript
it('createNewTab emits chat:new_tab and resolves with sessionId', async () => {
  const socket = makeSocket();
  vi.mocked(socket.emit).mockImplementation(((event: string, ...args: unknown[]) => {
    if (event === 'chat:new_tab') {
      const cb = args.at(-1) as (res: { sessionId: string }) => void;
      cb({ sessionId: 'new-sess' });
    }
  }) as unknown as typeof socket.emit);

  const { result } = renderHook(() => useSessionActions(socket));
  const response = await result.current.createNewTab();

  expect(socket.emit).toHaveBeenCalledWith(
    'chat:new_tab',
    {},
    expect.any(Function),
  );
  expect(response.sessionId).toBe('new-sess');
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/client && pnpm test run src/hooks/__tests__/useSessionActions.test.ts
```

Expected: FAIL — `result.current.createNewTab is not a function`

**Step 3: Move `createNewTab` implementation**

Cut the entire `createNewTab` function from `packages/client/src/hooks/use-chat.ts` (lines 1024–1036) and paste into `packages/client/src/hooks/useSessionActions.ts`, before the `return` statement:

```typescript
const createNewTab = (initialPrompt?: string) =>
  new Promise<{ sessionId: string }>((resolve) => {
    socket.emit('chat:new_tab', { initialPrompt }, (response) => {
      const { addTab, setActiveTab, updateTab } = useChatStore.getState();
      addTab(response.sessionId);
      setActiveTab(response.sessionId);
      if (response.slashCommands) {
        const cmds = response.slashCommands;
        updateTab(response.sessionId, () => ({ slashCommands: cmds }));
      }
      resolve(response);
    });
  });
```

Add `createNewTab` to the return object of `useSessionActions`.

In `use-chat.ts`: remove the `createNewTab` definition, but keep `createNewTab` in the destructure from `useSessionActions`:

```typescript
// use-chat.ts — in the useSessionActions destructure block, add:
const {
  resumeSession,
  ...
  createNewTab,   // ← add this
  searchFiles,
} = useSessionActions(socket);  // no longer defined in use-chat.ts directly
```

Keep `createNewTab` in the `return` at the bottom of `useChat` (it's already there).

**Step 4: Run test to verify it passes**

```bash
cd packages/client && pnpm test run src/hooks/__tests__/useSessionActions.test.ts
```

Expected: PASS (14+1 = 15 tests)

**Step 5: Run all client tests to confirm no regression**

```bash
cd packages/client && pnpm test run
```

Expected: all pass

**Step 6: Commit**

```bash
git add packages/client/src/hooks/useSessionActions.ts \
        packages/client/src/hooks/use-chat.ts \
        packages/client/src/hooks/__tests__/useSessionActions.test.ts
git commit -m "refactor: move createNewTab from use-chat to useSessionActions"
```

---

## Task 2: Expand `TabContainer` with tab management logic

**Why:** TabContainer becomes the owner of tab UI: it renders `TabBar`, handles close/select/new-tab.

**Files:**
- Modify: `packages/client/src/components/TabContainer.tsx`
- Create: `packages/client/src/components/__tests__/TabContainer.test.tsx`

**Step 1: Write the failing tests**

Create `packages/client/src/components/__tests__/TabContainer.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../../stores/chat-store';
import { makeFakeSocket } from '../../test/make-fake-socket';
import { TabContainer } from '../TabContainer';

// Mock ChatPanel — TabContainer tests only care about tab orchestration
vi.mock('../ChatPanel', () => ({
  ChatPanel: ({ sessionId }: { sessionId: string }) => (
    <div data-testid="chat-panel" data-session-id={sessionId} />
  ),
}));

// Mock useSessionActions — isolate tab actions
vi.mock('../../hooks/useSessionActions', () => ({
  useSessionActions: () => ({
    resumeSession: vi.fn(),
    createNewTab: vi.fn().mockResolvedValue({ sessionId: 'new-tab-id' }),
    // other actions — not needed by TabContainer
  }),
}));

function setup() {
  const socket = makeFakeSocket();
  const store = useChatStore.getState();
  store.addTab('sess-a');
  store.addTab('sess-b');
  store.setActiveTab('sess-a');
  return { socket };
}

describe('TabContainer', () => {
  beforeEach(() => {
    useChatStore.setState(useChatStore.getInitialState());
  });

  it('renders TabBar with tabs from store', () => {
    const { socket } = setup();
    render(<TabContainer socket={socket} />);
    expect(screen.getByRole('tab', { name: /sess-a/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sess-b/ })).toBeInTheDocument();
  });

  it('renders ChatPanel with activeTabId as sessionId', () => {
    const { socket } = setup();
    render(<TabContainer socket={socket} />);
    expect(screen.getByTestId('chat-panel')).toHaveAttribute('data-session-id', 'sess-a');
  });

  it('renders new tab button and calls createNewTab on click', async () => {
    const { socket } = setup();
    render(<TabContainer socket={socket} />);
    await userEvent.click(screen.getByRole('button', { name: /new tab/i }));
    // createNewTab called — verified via mock
  });

  it('removes tab from store when close button clicked', async () => {
    const { socket } = setup();
    render(<TabContainer socket={socket} />);
    const closeBtn = screen.getAllByRole('button', { name: /close/i })[0];
    await userEvent.click(closeBtn);
    expect(useChatStore.getState().tabs['sess-a']).toBeUndefined();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/client && pnpm test run src/components/__tests__/TabContainer.test.tsx
```

Expected: FAIL — TabContainer doesn't render TabBar yet

**Step 3: Implement the new TabContainer**

Replace entire `packages/client/src/components/TabContainer.tsx` with:

```typescript
import { useCallback } from 'react';
import { useSessionActions } from '../hooks/useSessionActions';
import type { TypedSocket } from '../socket/client';
import { useChatStore } from '../stores/chat-store';
import { ChatPanel } from './ChatPanel';
import { TabBar } from './TabBar';

interface TabContainerProps {
  socket: TypedSocket;
}

export function TabContainer({ socket }: TabContainerProps) {
  const { resumeSession, createNewTab } = useSessionActions(socket);
  const tabs = useChatStore((s) => s.tabs);
  const activeTabId = useChatStore((s) => s.activeTabId);

  const openTabs = Object.values(tabs).map((t) => ({
    sessionId: t.sessionId,
    title: t.title,
    status: t.tabStatus,
  }));

  const handleCloseTab = useCallback(
    (id: string) => {
      const { removeTab, setActiveTab } = useChatStore.getState();
      removeTab(id);
      if (id === activeTabId && openTabs.length > 1) {
        const remaining = openTabs.filter((t) => t.sessionId !== id);
        resumeSession(remaining[0].sessionId);
        setActiveTab(remaining[0].sessionId);
      }
    },
    [activeTabId, openTabs, resumeSession],
  );

  return (
    <div className="flex flex-col h-full">
      <TabBar
        tabs={openTabs}
        activeTabId={activeTabId}
        onSelectTab={(id) => {
          resumeSession(id);
          useChatStore.getState().setActiveTab(id);
        }}
        onCloseTab={handleCloseTab}
        onNewTab={() => createNewTab()}
      />
      <ChatPanel socket={socket} sessionId={activeTabId ?? ''} />
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
cd packages/client && pnpm test run src/components/__tests__/TabContainer.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add packages/client/src/components/TabContainer.tsx \
        packages/client/src/components/__tests__/TabContainer.test.tsx
git commit -m "feat(ui): TabContainer owns TabBar and tab management logic"
```

---

## Task 3: Remove tab management from `ChatPanel`

**Why:** ChatPanel should only know about one session (`sessionId` prop), not the full tab list.

**Files:**
- Modify: `packages/client/src/components/ChatPanel.tsx`
- Modify: `packages/client/src/components/__tests__/ChatPanel.test.tsx`

**Step 1: Write a regression test that tab-related state is NOT accessed in ChatPanel**

Add to `packages/client/src/components/__tests__/ChatPanel.test.tsx`:

```typescript
it('renders without accessing tabs or activeTabId from store', () => {
  const socket = makeFakeSocket();
  // Set up store with ONE tab (the current session), no activeTabId awareness needed
  useChatStore.setState({
    ...useChatStore.getInitialState(),
    tabs: {
      'sess-1': { ...initialTabState('sess-1'), status: 'idle' },
    },
    activeTabId: 'sess-1',
  });

  // Spy: if ChatPanel reads s.tabs (the whole record), this fires
  const tabsSpy = vi.spyOn(useChatStore.getState(), 'tabs', 'get');

  render(<ChatPanel socket={socket} sessionId="sess-1" />);

  // ChatPanel should read tabs['sess-1'] only, not the full tabs object
  // (TabBar is gone — no openTabs computation needed)
  expect(screen.queryByTestId('tab-bar')).not.toBeInTheDocument();
});
```

Note: `data-testid="tab-bar"` needs to be added to `TabBar`'s root div first (add `data-testid="tab-bar"` to `TabBar.tsx` line 25).

**Step 2: Run test to verify it currently fails**

```bash
cd packages/client && pnpm test run src/components/__tests__/ChatPanel.test.tsx \
  --reporter=verbose 2>&1 | grep "tab-bar\|FAIL"
```

Expected: The test `renders without accessing tabs...` fails because TabBar IS rendered.

**Step 3: Remove tab management from ChatPanel**

In `packages/client/src/components/ChatPanel.tsx`:

1. **Remove import** (line 26):
   ```diff
   - import { TabBar } from './TabBar';
   ```

2. **Remove from useChat destructuring** (line 75):
   ```diff
   - createNewTab,
   ```

3. **Remove tab state** (lines 94–100):
   ```diff
   - const tabs = useChatStore((s) => s.tabs);
   - const openTabs = Object.values(tabs).map((t) => ({
   -   sessionId: t.sessionId,
   -   title: t.title,
   -   status: t.tabStatus,
   - }));
   - const activeTabId = useChatStore((s) => s.activeTabId);
   ```

4. **Remove `handleCloseTab`** (lines 149–160): delete entire function.

5. **Fix `onClear` keyboard shortcut** (line 211) — replace `activeTabId: aid` with `sessionId` prop:
   ```diff
   - const { activeTabId: aid, updateTab } = useChatStore.getState();
   - if (aid) updateTab(aid, () => ({ messages: [], modifiedFiles: {} }));
   + const { updateTab } = useChatStore.getState();
   + updateTab(sessionId, () => ({ messages: [], modifiedFiles: {} }));
   ```

6. **Fix `onJoin` in SessionListPage** (lines 228–230) — replace `addTab`/`setActiveTab` with `resumeSession`:
   ```diff
   - const { addTab, setActiveTab } = useChatStore.getState();
   - addTab(id);
   - setActiveTab(id);
   + resumeSession(id);
   ```

7. **Remove `<TabBar>` JSX** (lines 312–321): delete the entire `<TabBar ... />` block.

**Step 4: Run all ChatPanel tests**

```bash
cd packages/client && pnpm test run src/components/__tests__/ChatPanel.test.tsx
```

Expected: all pass

**Step 5: Run full client test suite**

```bash
cd packages/client && pnpm test run
```

Expected: all pass — no regressions

**Step 6: Commit**

```bash
git add packages/client/src/components/ChatPanel.tsx \
        packages/client/src/components/__tests__/ChatPanel.test.tsx
git commit -m "refactor(ui): remove tab management from ChatPanel — now purely session-scoped"
```

---

## Task 4: Add `data-testid` to TabBar and verify E2E layout

**Why:** TabBar now lives in TabContainer. Need `data-testid` for tests, and need to verify the visual layout is correct (TabBar above ChatPanel content).

**Files:**
- Modify: `packages/client/src/components/TabBar.tsx`
- Modify: `packages/client/src/components/__tests__/TabContainer.test.tsx`

**Step 1: Add data-testid to TabBar**

In `packages/client/src/components/TabBar.tsx`, add `data-testid="tab-bar"` to the root div (line 25):

```diff
- <div className="flex items-center gap-1 px-4 py-1 border-b border-border overflow-x-auto">
+ <div className="flex items-center gap-1 px-4 py-1 border-b border-border overflow-x-auto" data-testid="tab-bar">
```

**Step 2: Add layout assertion to TabContainer test**

In `TabContainer.test.tsx`, add:

```typescript
it('renders TabBar above ChatPanel', () => {
  const { socket } = setup();
  const { container } = render(<TabContainer socket={socket} />);
  const tabBar = screen.getByTestId('tab-bar');
  const chatPanel = screen.getByTestId('chat-panel');
  // TabBar should appear before ChatPanel in DOM order
  expect(
    container.firstChild?.firstChild,
  ).toBe(tabBar);
});
```

**Step 3: Run test**

```bash
cd packages/client && pnpm test run src/components/__tests__/TabContainer.test.tsx
```

Expected: PASS

**Step 4: Run full test suite one final time**

```bash
cd packages/client && pnpm test run
cd packages/server && pnpm test run
```

Expected: all pass

**Step 5: Commit**

```bash
git add packages/client/src/components/TabBar.tsx \
        packages/client/src/components/__tests__/TabContainer.test.tsx
git commit -m "test(ui): add data-testid to TabBar, verify TabContainer layout"
```

---

## Final State

After this refactor:

```
TabContainer
  ├── calls useSessionActions(socket) → resumeSession, createNewTab
  ├── reads store: tabs, activeTabId
  ├── renders <TabBar> with openTabs, handlers
  └── renders <ChatPanel sessionId={activeTabId} socket={socket} />
        ├── calls useChat(socket) → sendMessage, abort, setModel, ...
        ├── reads store: tabs[sessionId] only (one tab)
        └── NO TabBar, NO openTabs, NO handleCloseTab
```

**To use without tabs:** Replace `<TabContainer>` with `<ChatPanel sessionId={fixedSessionId} socket={socket} />` directly — ChatPanel has zero tab awareness.
