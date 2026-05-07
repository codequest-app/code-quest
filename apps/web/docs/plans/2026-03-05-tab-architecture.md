# Tab Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor from a single global chat state to per-tab state, where each tab has its own `messages`, `status`, `sessionId`, etc., enabling true multi-tab independence.

**Architecture:** `chatStore.tabs: Record<sessionId, TabState>` replaces all per-tab globals. `useChat(socket)` singleton routes events by `sessionId`. `TabContainer` holds the hook and renders one `ChatPanel({ sessionId })` per active tab.

**Tech Stack:** Zustand, React, Socket.IO, Vitest, @testing-library/react

---

## Test commands

```bash
# Store tests
pnpm --filter @code-quest/client test run src/stores/__tests__/chat-store.test.ts

# Hook tests
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts

# All client tests
pnpm --filter @code-quest/client test run
```

---

## Phase 1 — Store

### Task 1: Define `TabState` type and `initialTabState` factory

**Files:**
- Modify: `apps/web/src/stores/chat-store.ts`

**Step 1: Write failing test**

In `apps/web/src/stores/__tests__/chat-store.test.ts`, add:

```typescript
describe('TabState', () => {
  it('addTab creates a tab with correct initial state', () => {
    useChatStore.setState({ tabs: {}, activeTabId: null });
    useChatStore.getState().addTab('sess-1');
    const tab = useChatStore.getState().tabs['sess-1'];
    expect(tab).toMatchObject({
      sessionId: 'sess-1',
      messages: [],
      status: 'connecting',
      stats: null,
      pendingControls: [],
      statusText: null,
      model: null,
      tools: [],
      tabStatus: 'default',
    });
  });

  it('setActiveTab updates activeTabId', () => {
    useChatStore.setState({ tabs: {}, activeTabId: null });
    useChatStore.getState().addTab('sess-1');
    useChatStore.getState().setActiveTab('sess-1');
    expect(useChatStore.getState().activeTabId).toBe('sess-1');
  });

  it('removeTab removes the tab', () => {
    useChatStore.setState({ tabs: {}, activeTabId: null });
    useChatStore.getState().addTab('sess-1');
    useChatStore.getState().removeTab('sess-1');
    expect(useChatStore.getState().tabs['sess-1']).toBeUndefined();
  });

  it('replaceTab moves state to new sessionId', () => {
    useChatStore.setState({ tabs: {}, activeTabId: 'old' });
    useChatStore.getState().addTab('old');
    useChatStore.getState().updateTab('old', () => ({ messages: [{ id: '1', role: 'user', type: 'text', content: 'hi' }] as Message[] }));
    useChatStore.getState().replaceTab('old', 'new');
    expect(useChatStore.getState().tabs['new']).toBeDefined();
    expect(useChatStore.getState().tabs['old']).toBeUndefined();
    expect(useChatStore.getState().activeTabId).toBe('new');
  });

  it('updateTab mutates only the specified tab', () => {
    useChatStore.setState({ tabs: {}, activeTabId: null });
    useChatStore.getState().addTab('sess-1');
    useChatStore.getState().addTab('sess-2');
    useChatStore.getState().updateTab('sess-1', () => ({ status: 'busy' as const }));
    expect(useChatStore.getState().tabs['sess-1'].status).toBe('busy');
    expect(useChatStore.getState().tabs['sess-2'].status).toBe('connecting');
  });
});
```

**Step 2: Run test to verify RED**

```bash
pnpm --filter @code-quest/client test run src/stores/__tests__/chat-store.test.ts
```
Expected: FAIL — `tabs` not in store

**Step 3: Implement `TabState` type and store actions**

In `apps/web/src/stores/chat-store.ts`, add after the existing imports:

```typescript
export interface TabState {
  sessionId: string;
  messages: Message[];
  status: SessionStatus;
  stats: ChatStats | null;
  pendingControls: PendingControl[];
  statusText: string | null;
  model: string | null;
  tools: string[];
  permissionMode: string | undefined;
  fastModeState: string | undefined;
  thinkingLevel: number;
  effort: 'low' | 'medium' | 'high';
  suggestions: Suggestion[];
  slashCommands: string[];
  isContextCompressed: boolean;
  modifiedFiles: Record<string, { oldContent?: string | null; newContent?: string | null }>;
  planComments: Array<{ text: string; selectedText: string }>;
  title?: string;
  tabStatus: 'default' | 'pending' | 'done';
}

export function initialTabState(sessionId: string): TabState {
  return {
    sessionId,
    messages: [],
    status: 'connecting',
    stats: null,
    pendingControls: [],
    statusText: null,
    model: null,
    tools: [],
    permissionMode: undefined,
    fastModeState: undefined,
    thinkingLevel: 0,
    effort: 'medium',
    suggestions: [],
    slashCommands: [],
    isContextCompressed: false,
    modifiedFiles: {},
    planComments: [],
    title: undefined,
    tabStatus: 'default',
  };
}
```

Add to `ChatState` interface:

```typescript
tabs: Record<string, TabState>;
addTab: (sessionId: string) => void;
removeTab: (sessionId: string) => void;
setActiveTab: (sessionId: string) => void;
replaceTab: (oldSessionId: string, newSessionId: string) => void;
updateTab: (sessionId: string, updater: (tab: TabState) => Partial<TabState>) => void;
```

Add implementations in the store `create(...)`:

```typescript
tabs: {},
addTab: (sessionId) =>
  set((s) => {
    if (s.tabs[sessionId]) return s;
    return { tabs: { ...s.tabs, [sessionId]: initialTabState(sessionId) } };
  }),
removeTab: (sessionId) =>
  set((s) => {
    const { [sessionId]: _, ...rest } = s.tabs;
    return { tabs: rest };
  }),
setActiveTab: (sessionId) => set({ activeTabId: sessionId }),
replaceTab: (oldId, newId) =>
  set((s) => {
    const old = s.tabs[oldId] ?? initialTabState(newId);
    const { [oldId]: _, ...rest } = s.tabs;
    return {
      tabs: { ...rest, [newId]: { ...old, sessionId: newId } },
      activeTabId: s.activeTabId === oldId ? newId : s.activeTabId,
    };
  }),
updateTab: (sessionId, updater) =>
  set((s) => {
    const tab = s.tabs[sessionId];
    if (!tab) return s;
    return { tabs: { ...s.tabs, [sessionId]: { ...tab, ...updater(tab) } } };
  }),
```

**Step 4: Run tests to verify GREEN**

```bash
pnpm --filter @code-quest/client test run src/stores/__tests__/chat-store.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/stores/chat-store.ts apps/web/src/stores/__tests__/chat-store.test.ts
git commit -m "feat(store): add TabState type, tabs Record, and tab management actions"
```

---

### Task 2: Persist `tabs` sessionIds to localStorage

**Files:**
- Modify: `apps/web/src/stores/chat-store.ts`
- Modify: `apps/web/src/stores/__tests__/chat-store.test.ts`

**Step 1: Write failing test**

Add to `describe('persist middleware')`:

```typescript
it('partialize includes tab sessionIds but not messages', () => {
  useChatStore.getState().addTab('sess-persist');
  useChatStore.getState().updateTab('sess-persist', () => ({
    messages: [{ id: '1', role: 'user', type: 'text', content: 'hi' } as Message],
  }));
  useChatStore.getState().setActiveTab('sess-persist');

  const raw = localStorage.getItem('cc-chat-store');
  const parsed = JSON.parse(raw ?? '{}');
  expect(parsed.state.tabs['sess-persist'].sessionId).toBe('sess-persist');
  expect(parsed.state.tabs['sess-persist'].messages).toBeUndefined();
  expect(parsed.state.activeTabId).toBe('sess-persist');
});
```

**Step 2: Run test to verify RED**

```bash
pnpm --filter @code-quest/client test run src/stores/__tests__/chat-store.test.ts
```
Expected: FAIL

**Step 3: Update `partialize`**

In `chat-store.ts`, update `partialize`:

```typescript
partialize: (state) => ({
  tabs: Object.fromEntries(
    Object.entries(state.tabs).map(([id, tab]) => [id, { sessionId: tab.sessionId }]),
  ),
  activeTabId: state.activeTabId,
  isOnboardingDismissed: state.isOnboardingDismissed,
  isReviewUpsellDismissed: state.isReviewUpsellDismissed,
}),
```

Also remove `sessionId: state.sessionId` from `partialize` (it's now inside `tabs`).

**Step 4: Run tests to verify GREEN**

```bash
pnpm --filter @code-quest/client test run src/stores/__tests__/chat-store.test.ts
```

**Step 5: Commit**

```bash
git add apps/web/src/stores/chat-store.ts apps/web/src/stores/__tests__/chat-store.test.ts
git commit -m "feat(store): persist tab sessionIds to localStorage"
```

---

## Phase 2 — Hook

### Task 3: Route `onEvent` by `sessionId` to `updateTab`

**Files:**
- Modify: `apps/web/src/hooks/use-chat.ts`
- Modify: `apps/web/src/hooks/__tests__/use-chat.test.ts`

**Step 1: Write failing test**

Add to `use-chat.test.ts` in `describe('basic events')`:

```typescript
it('routes chat:event to the correct tab by sessionId', async () => {
  const sessA = uniqueSession();
  const sessB = uniqueSession();

  // Set up two tabs in store
  const p = await setupPipeline(
    fakeClaude(sessA).scene(s.assistant('hello from A'), s.result()).toProcessFactory(),
  );

  // Manually add a second tab (sessB) with no messages
  useChatStore.getState().addTab(sessB);

  await p.sendMessage('hi');
  await tick();

  // Tab A should have messages, Tab B should be empty
  const tabA = useChatStore.getState().tabs[sessA];
  const tabB = useChatStore.getState().tabs[sessB];
  expect(tabA?.messages.some((m) => m.content === 'hello from A')).toBe(true);
  expect(tabB?.messages).toHaveLength(0);

  await p.stop();
});
```

**Step 2: Run test to verify RED**

```bash
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts
```
Expected: FAIL — events go to global `messages` not `tabs[sessionId]`

**Step 3: Migrate `onEvent` switch cases to `updateTab`**

In `use-chat.ts`, change `onEvent` to use `store().updateTab(sessionId, ...)` for each case. The `sessionId` is already available in the event payload: `({ sessionId, event }) => { ... }`.

Key pattern — replace each global mutation:
```typescript
// Before
store().addMessage(msg({ ... }));
store().setStatus('busy');
store().setModel(event.model);

// After
store().updateTab(sessionId, (tab) => ({
  messages: [...tab.messages, msg({ ... })],
}));
store().updateTab(sessionId, () => ({ status: 'busy' }));
store().updateTab(sessionId, () => ({ model: event.model ?? null }));
```

Do this for ALL cases in the switch: `init`, `assistant`, `text`, `thinking`, `tool_use`, `tool_result`, `result`, `error`, `status`, `control_request`, `control_cancel_request`, `context_window_usage`, `compact_boundary`, `streamlined_text`, `streamlined_tool_use_summary`.

Also update `case 'result':` tab status:
```typescript
store().updateTab(sessionId, (tab) => {
  const active = store().activeTabId;
  return {
    tabStatus: tab.sessionId === active ? 'default' : 'done',
    stats: event.stats,
    isContextCompressed: false,
    statusText: null,
    messages: event.errors?.length
      ? [...tab.messages,
          msg({ role: 'system', type: 'error', content: event.errors[0] }),
          msg({ role: 'system', type: 'result', content: '', meta: { stats: event.stats } }),
        ]
      : [...tab.messages,
          msg({ role: 'system', type: 'result', content: '', meta: { stats: event.stats } }),
        ],
  };
});
```

**Step 4: Update helpers that read from global store**

`resetStreamingRefs` and `drainQueue` call `store().addMessage(...)` and `store().appendToLastMessage(...)`. These need the `sessionId` in scope. Pass it via closure from `onEvent`:

```typescript
const onEvent = ({ sessionId, event }: { sessionId: string; event: ChatStreamEvent }) => {
  // resetStreamingRefs and drainQueue now use sessionId
  ...
};
```

**Step 5: Run tests — fix any failures iteratively**

```bash
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts
```

Many tests use `p.store().messages` — add a helper to test file:
```typescript
function activeMessages(p: PipelineHookHarness) {
  const { tabs, activeTabId } = p.store();
  return tabs[activeTabId ?? '']?.messages ?? [];
}
```
Replace `p.store().messages` with `activeMessages(p)` throughout the test file.

Similarly `p.store().status` → `p.store().tabs[p.store().activeTabId!]?.status`
and `p.store().sessionId` → `p.store().activeTabId`

**Step 6: Run all tests GREEN**

```bash
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts
```
Expected: all pass

**Step 7: Commit**

```bash
git add apps/web/src/hooks/use-chat.ts apps/web/src/hooks/__tests__/use-chat.test.ts
git commit -m "feat(hook): route onEvent to updateTab by sessionId"
```

---

### Task 4: Update `onConnect` to rejoin all tabs

**Files:**
- Modify: `apps/web/src/hooks/use-chat.ts`
- Modify: `apps/web/src/hooks/__tests__/use-chat.test.ts`

**Step 1: Write failing test**

Add to `use-chat.test.ts` in `describe('rejoin after refresh')`:

```typescript
it('rejoins all persisted tabs on reconnect', async () => {
  const sessA = uniqueSession();
  const sessB = uniqueSession();

  const pA = await setupPipeline(
    fakeClaude(sessA).scene(s.result()).toProcessFactory(),
  );

  // Simulate second tab being persisted
  useChatStore.getState().addTab(sessB);

  // Simulate reconnect (disconnect + reconnect)
  act(() => pA.socket.disconnect());
  await tick(50);
  act(() => pA.socket.connect());
  await tick(200);

  // Both tabs should be in the store
  expect(useChatStore.getState().tabs[sessA]).toBeDefined();
  expect(useChatStore.getState().tabs[sessB]).toBeDefined();

  await pA.stop();
});
```

**Step 2: Run test to verify RED**

```bash
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts
```

**Step 3: Update `onConnect` in `use-chat.ts`**

```typescript
const onConnect = () => {
  const { tabs } = store();
  const sessionIds = Object.keys(tabs);

  if (sessionIds.length === 0) {
    // First time — create new session
    const { initOptions } = store();
    socket.emit('chat:create', initOptions ?? {}, (res) => {
      store().addTab(res.sessionId);
      store().setActiveTab(res.sessionId);
      if (res.slashCommands) {
        store().updateTab(res.sessionId, () => ({ slashCommands: res.slashCommands! }));
      }
    });
  } else {
    // Reload reconnect — rejoin every tab
    for (const sessionId of sessionIds) {
      socket.emit('chat:join', { sessionId }, (res) => {
        if ('error' in res) {
          socket.emit('chat:create', { resumeSessionId: sessionId }, (created) => {
            store().replaceTab(sessionId, created.sessionId);
            if (store().activeTabId === sessionId) {
              store().setActiveTab(created.sessionId);
            }
          });
        } else {
          store().updateTab(sessionId, () => ({ status: 'idle' }));
          if (store().tabs[sessionId].messages.length === 0) {
            socket.emit('chat:history', { sessionId: res.sessionId }, ({ events }) => {
              for (const event of events) {
                onEvent({ sessionId: res.sessionId, event });
              }
            });
          }
        }
      });
    }
  }
};
```

**Step 4: Run tests GREEN**

```bash
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts
```

**Step 5: Commit**

```bash
git add apps/web/src/hooks/use-chat.ts apps/web/src/hooks/__tests__/use-chat.test.ts
git commit -m "feat(hook): onConnect rejoins all persisted tabs on reconnect"
```

---

### Task 5: Update actions to use `activeTabId`

**Files:**
- Modify: `apps/web/src/hooks/use-chat.ts`

**Step 1: Write failing test**

Add to `use-chat.test.ts`:

```typescript
it('sendMessage uses activeTabId not global sessionId', async () => {
  const sessA = uniqueSession();
  const p = await setupPipeline(
    fakeClaude(sessA).scene(s.assistant('ok'), s.result()).toProcessFactory(),
  );

  // Verify activeTabId is used
  const emitSpy = vi.spyOn(p.socket, 'emit');
  act(() => p.hook.result.current.sendMessage('test'));
  const call = emitSpy.mock.calls.find(([ev]) => ev === 'chat:send');
  expect(call?.[1]).toMatchObject({ sessionId: useChatStore.getState().activeTabId });

  emitSpy.mockRestore();
  await p.stop();
});
```

**Step 2: Run test to verify RED**

```bash
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts
```

**Step 3: Update all actions in `use-chat.ts`**

Replace `store().sessionId` with `store().activeTabId` in:
- `sendMessage`
- `kill`
- `interrupt`
- `sendControlResponse`
- `setModel`, `setEffort`, `setThinkingLevel`, `setPermissionMode`, `setFastMode`
- `rewindFiles`, `stopTask`, `getSession`, etc.

```typescript
// Pattern: replace
const { sessionId } = useChatStore.getState();
if (!sessionId) return;
// with
const sessionId = useChatStore.getState().activeTabId;
if (!sessionId) return;
```

**Step 4: Run tests GREEN**

```bash
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts
```

**Step 5: Commit**

```bash
git add apps/web/src/hooks/use-chat.ts
git commit -m "feat(hook): use activeTabId for all session-scoped actions"
```

---

### Task 6: Update remaining socket event handlers

**Files:**
- Modify: `apps/web/src/hooks/use-chat.ts`

Handlers that still reference global state: `onError`, `onExit`, `onCreated`, `onSessionDead`, `onSuggestions`, `onSessionStateChanged`.

**Step 1: Write failing test**

Add to `use-chat.test.ts`:

```typescript
it('onCreated adds new tab and sets it active', async () => {
  const sessId = uniqueSession();
  const p = await setupPipeline(
    fakeClaude(sessId).scene(s.result()).toProcessFactory(),
  );

  // Simulate server emitting chat:created for a new tab
  const newSessId = 'new-sess-from-created';
  p.harness.io.emit('chat:created', { sessionId: newSessId });
  await tick();

  expect(useChatStore.getState().tabs[newSessId]).toBeDefined();
  await p.stop();
});
```

**Step 2: Run test to verify RED**

**Step 3: Update handlers**

```typescript
// onCreated
const onCreated = ({ sessionId: newSessionId }: { sessionId: string }) => {
  store().addTab(newSessionId);
  store().setActiveTab(newSessionId);
};

// onExit — route to the session's tab
const onExit = ({ sessionId }: { sessionId: string }) => {
  store().updateTab(sessionId, (tab) => ({
    pendingControls: [],
    messages: [
      ...tab.messages,
      msg({ role: 'system', type: 'text', content: 'CLI session has ended.' }),
    ],
    status: 'idle',
  }));
};

// onError — route to session's tab
const onError = ({ sessionId, message }: { sessionId?: string; message: string }) => {
  const sid = sessionId ?? store().activeTabId;
  if (!sid) return;
  store().updateTab(sid, (tab) => ({
    messages: [...tab.messages, msg({ role: 'system', type: 'error', content: message })],
  }));
  toast.error(message);
};

// onSessionDead — clear that tab's sessionId from store
const onSessionDead = ({ sessionId }: { sessionId: string }) => {
  store().removeTab(sessionId);
  if (store().activeTabId === sessionId) {
    const remaining = Object.keys(store().tabs);
    store().setActiveTab(remaining[0] ?? null);
  }
};
```

**Step 4: Run all tests GREEN**

```bash
pnpm --filter @code-quest/client test run src/hooks/__tests__/use-chat.test.ts
```

**Step 5: Commit**

```bash
git add apps/web/src/hooks/use-chat.ts apps/web/src/hooks/__tests__/use-chat.test.ts
git commit -m "feat(hook): route onCreated/onExit/onError/onSessionDead to correct tab"
```

---

## Phase 3 — UI

### Task 7: Create `TabContainer` component

**Files:**
- Create: `apps/web/src/components/TabContainer.tsx`
- Modify: `apps/web/src/App.tsx`

**Step 1: Create `TabContainer.tsx`**

```typescript
import { useChat } from '../hooks/use-chat';
import { useChatStore } from '../stores/chat-store';
import type { TypedSocket } from '../socket/client';
import { ChatPanel } from './ChatPanel';

interface TabContainerProps {
  socket: TypedSocket;
}

export function TabContainer({ socket }: TabContainerProps) {
  useChat(socket);  // singleton — manages all socket events

  const activeTabId = useChatStore((s) => s.activeTabId);

  if (!activeTabId) return null;

  return <ChatPanel socket={socket} sessionId={activeTabId} />;
}
```

**Step 2: Update `App.tsx`**

```typescript
import { TabContainer } from './components/TabContainer';

export function App() {
  useDocumentTitle();
  const socket = useMemo(() => createSocket(), []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg text-text">
      <Toaster position="top-right" richColors />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TabContainer socket={socket} />
      </ErrorBoundary>
    </div>
  );
}
```

**Step 3: Verify app compiles**

```bash
pnpm --filter @code-quest/client build 2>&1 | grep -E "error|Error" | head -20
```

**Step 4: Commit**

```bash
git add apps/web/src/components/TabContainer.tsx apps/web/src/App.tsx
git commit -m "feat(ui): add TabContainer as useChat singleton host"
```

---

### Task 8: Update `ChatPanel` to read from `tabs[sessionId]`

**Files:**
- Modify: `apps/web/src/components/ChatPanel.tsx`

**Step 1: Update props**

```typescript
interface ChatPanelProps {
  socket: TypedSocket;
  sessionId: string;   // ← add this
}

export function ChatPanel({ socket, sessionId }: ChatPanelProps) {
```

**Step 2: Replace global store reads with per-tab reads**

```typescript
// Before
const messages = useChatStore((s) => s.messages);
const status = useChatStore((s) => s.status);
const pendingControls = useChatStore((s) => s.pendingControls);
const stats = useChatStore((s) => s.stats);
const suggestions = useChatStore((s) => s.suggestions);
const slashCommands = useChatStore((s) => s.slashCommands);
const isContextCompressed = useChatStore((s) => s.isContextCompressed);

// After
const tab = useChatStore((s) => s.tabs[sessionId]);
const messages = tab?.messages ?? [];
const status = tab?.status ?? 'connecting';
const pendingControls = tab?.pendingControls ?? [];
const stats = tab?.stats ?? null;
const suggestions = tab?.suggestions ?? [];
const slashCommands = tab?.slashCommands ?? [];
const isContextCompressed = tab?.isContextCompressed ?? false;
```

Also update `openTabs` / tab bar — it now comes from `Object.values(tabs)`:
```typescript
const tabs = useChatStore((s) => s.tabs);
const openTabs = Object.values(tabs).map((t) => ({
  sessionId: t.sessionId,
  title: t.title,
  status: t.tabStatus,
}));
```

**Step 3: Remove `useChat(socket)` from `ChatPanel`**

`useChat` is now called in `TabContainer`. Remove the call from `ChatPanel`.
Destructure only the returned actions (not the hook call):

```typescript
// Before: inside ChatPanel
const { sendMessage, kill, ... } = useChat(socket);

// After: receive actions as props OR pass socket down and call per-action hooks
```

Simplest approach: keep `socket` prop, call per-action hooks (`useSessionActions(socket)`) inside `ChatPanel` directly. `useChat` is removed from `ChatPanel`.

**Step 4: Verify build and tests**

```bash
pnpm --filter @code-quest/client build 2>&1 | grep -E "^.*error" | head -20
pnpm --filter @code-quest/client test run
```

**Step 5: Commit**

```bash
git add apps/web/src/components/ChatPanel.tsx
git commit -m "feat(ui): ChatPanel reads from tabs[sessionId] instead of global store"
```

---

### Task 9: Remove deprecated global per-tab state from store

Once all consumers have migrated to `tabs[sessionId]`, remove the old global fields:

**Fields to remove from `ChatState`:**
`sessionId`, `messages`, `status`, `stats`, `pendingControls`, `statusText`, `model`, `tools`, `permissionMode`, `fastModeState`, `thinkingLevel`, `effort`, `suggestions`, `slashCommands`, `isContextCompressed`, `modifiedFiles`, `planComments`, `openTabs`, `updateTabStatus`, `updateTabTitle`

**Also remove corresponding setters:**
`setSessionId`, `addMessage`, `appendToLastMessage`, `clearMessages`, `setStatus`, `setStats`, `setStatusText`, `setModel`, `setTools`, `setPermissionMode`, `setFastModeState`, `setThinkingLevel`, `setEffort`, `setSuggestions`, `setSlashCommands`, `setContextCompressed`, `addModifiedFile`, `removeModifiedFile`, `addPlanComment`, `clearPlanComments`

**Step 1: Delete fields one at a time, run tests after each**

```bash
pnpm --filter @code-quest/client test run
```

Fix any TypeScript errors by updating the callsites.

**Step 2: Run full client test suite**

```bash
pnpm --filter @code-quest/client test run
```
Expected: all pass

**Step 3: Commit**

```bash
git add apps/web/src/stores/chat-store.ts
git commit -m "refactor(store): remove deprecated global per-tab state fields"
```

---

## Verification Checklist

- [ ] `pnpm --filter @code-quest/summoner test run` — all pass
- [ ] `pnpm --filter @code-quest/server test run` — all pass
- [ ] `pnpm --filter @code-quest/client test run` — all pass
- [ ] Manual: open app, send message in Tab 1, open Tab 2, send message, switch between tabs — each shows own messages
- [ ] Manual: hard refresh — all tabs rejoin their sessions, messages reload from history
- [ ] Manual: kill in one tab — other tabs unaffected
