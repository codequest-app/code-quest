# Tab Architecture Design

Date: 2026-03-05

## Problem

Current architecture has a single global state shared across all tabs:
- `sessionId`, `messages`, `status` etc. are global singletons
- Switching tabs clears messages and reloads from `chat:history` every time
- Multi-tab is "fake" — just view switching, not independent sessions
- `openTabs` array tracks tab metadata but has no per-tab state

## Approach: tabId = sessionId, tabs Record in store

### Chosen Approach

`tabId` is the `sessionId` — no separate mapping needed. All per-tab state lives in
`chatStore.tabs: Record<sessionId, TabState>`.

### Rejected Alternatives

**Approach B (tabId independent of sessionId):** Two-level mapping adds complexity
with no meaningful benefit.

**Approach C (per-tab messages cache only):** Doesn't fix per-tab `status`,
`pendingControls`, etc. Still has conflicts when multiple tabs are active.

---

## Phase 1: Store Redesign

### Per-tab State (TabState)

```typescript
type TabState = {
  sessionId: string
  messages: Message[]
  status: Status
  stats: ChatStats | null
  pendingControls: PendingControl[]
  statusText: string | null
  model: string | null
  tools: string[]
  permissionMode: PermissionMode | undefined
  suggestions: Suggestion[]
  slashCommands: string[]
  isContextCompressed: boolean
  modifiedFiles: string[]
  fastModeState: FastModeState
  thinkingLevel: ThinkingLevel
  title?: string
  tabStatus: 'default' | 'pending' | 'done'
}
```

### Global State (stays global)

```typescript
{
  tabs: Record<string, TabState>   // key = sessionId
  activeTabId: string | null
  usageQuota: UsageQuota | null
  isOnboardingDismissed: boolean
  isReviewUpsellDismissed: boolean
  initOptions: InitOptions | null
  searchQuery: string
  typeFilter: string
}
```

### localStorage persist

Only persist sessionIds (not messages — rebuild from `chat:history` on reconnect):

```typescript
partialize: (state) => ({
  tabs: Object.fromEntries(
    Object.entries(state.tabs).map(([id, tab]) => [id, { sessionId: tab.sessionId }])
  ),
  activeTabId: state.activeTabId,
  isOnboardingDismissed: state.isOnboardingDismissed,
  isReviewUpsellDismissed: state.isReviewUpsellDismissed,
})
```

---

## Phase 2: useChat Hook

`useChat(socket)` remains a singleton, called once in TabContainer.

### onConnect — rejoin all tabs

```typescript
const onConnect = () => {
  const { tabs } = store();
  if (Object.keys(tabs).length === 0) {
    // First time — create new session
    socket.emit('chat:create', {}, (res) => {
      store().addTab(res.sessionId);
    });
  } else {
    // Reload reconnect — rejoin every tab
    for (const sessionId of Object.keys(tabs)) {
      socket.emit('chat:join', { sessionId }, (res) => {
        if ('error' in res) {
          // Process gone — resume with new process
          socket.emit('chat:create', { resumeSessionId: sessionId }, (created) => {
            store().replaceTab(sessionId, created.sessionId);
          });
        } else if (tabs[sessionId].messages.length === 0) {
          // Rejoin success, no cached messages — load history
          socket.emit('chat:history', { sessionId }, ({ events }) => {
            events.forEach(e => onEvent({ sessionId, event: e }));
          });
        }
      });
    }
  }
};
```

### onEvent — route by sessionId

```typescript
const onEvent = ({ sessionId, event }) => {
  // All switch(event.type) logic routes to store().updateTab(sessionId, ...)
  // instead of global store mutations
};
```

### Actions — use activeTabId

```typescript
const sendMessage = (message: string) => {
  const { activeTabId } = store();
  if (!activeTabId) return;
  socket.emit('chat:send', { sessionId: activeTabId, message });
};
// kill, interrupt, controlResponse, etc. follow the same pattern
```

---

## Phase 3: UI Structure

```
App
└── TabContainer({ socket })
    ├── useChat(socket)              ← singleton
    ├── TabBar
    │   ├── Tab(sessionId='A')
    │   ├── Tab(sessionId='B')
    │   └── + new tab button
    └── ChatPanel({ sessionId: activeTabId })
        └── reads tabs[sessionId] state
```

- **Only the active tab's ChatPanel is rendered** — messages stay in store when
  switching, no re-fetch needed
- Tab switching: `setActiveTab(sessionId)` — no `clearMessages`, no `chat:join`

### ChatPanel state reads

```typescript
// Before
const messages = useChatStore(s => s.messages);
const status = useChatStore(s => s.status);

// After
const tab = useChatStore(s => s.tabs[sessionId]);
const { messages, status, pendingControls } = tab ?? defaultTabState;
```

---

## Server Changes

None required. The server already supports one socket joining multiple sessions via
`sessionSocketSetMap`. `chat:event` already carries `sessionId` in the payload.

Note: server could be independently refactored to use socket.io native rooms
(`socket.join(sessionId)` + `io.to(sessionId).emit(...)`) instead of the custom Map,
but this is a separate concern that doesn't affect the client Tab architecture.

---

## Known Issues Resolved by This Refactor

- `resumeSession` missing `chat:history`: eliminated — `onConnect` handles all rejoins
  including history replay
- Tab switch clearing messages: eliminated — messages cached in `tabs[sessionId]`
- Only one sessionId persisted to localStorage: fixed — all tab sessionIds persisted

## Implementation Order

1. Phase 1: Store (`chat-store.ts`) — `tabs` Record, `TabState`, actions
2. Phase 2: Hook (`use-chat.ts`) — route events by `sessionId`, multi-tab `onConnect`
3. Phase 3: UI (`App.tsx` → `TabContainer`, `ChatPanel` reads `tabs[sessionId]`)
