# Channel Zustand Migration — Design

## Store 架構

一個 global store 取代 per-channel zustand instance + messageRegistryStore。

```ts
// stores/channels-store.ts
interface ChannelsStoreState {
  channels: Map<string, ChannelState>;
  setChannelState: (channelId: string, fn: (prev: ChannelState) => ChannelState) => void;
  removeChannel: (channelId: string) => void;
}
```

```ts
interface ChannelState {
  channelId: string;

  // ── Message domain ──
  messages: Message[];
  historyMessages: string[];

  // ── Task domain ──
  tasks: Map<string, Task>;

  // ── Session domain ──
  status: SessionStatus;
  stats: ChatStats | null;
  statusText: string | null;
  isContextCompressed: boolean;
  tokenUsage?: TokenUsage;
  streamingToolUseId?: string;

  // ── File domain ──
  modifiedFiles: Record<string, { oldContent?: string | null; newContent?: string | null }>;

  // ── Terminal domain ──
  terminalSessions: Record<string, TerminalSession>;

  // ── Plan domain ──
  planComments: PlanCommentData[];
}
```

## Selector 使用方式

```ts
// Per-channel (精確 re-render — 只有自己 channel 變化時才 trigger)
const messages = useChannelsStore(s => s.channels.get(channelId)?.messages);
const task = useChannelsStore(s => s.channels.get(channelId)?.tasks.get(toolId));
const status = useChannelsStore(s => s.channels.get(channelId)?.status);

// Global (Command Palette — pull-based，打開時才讀)
function getSearchResults(query: string) {
  const { channels } = useChannelsStore.getState();
  const results = [];
  for (const [id, ch] of channels) {
    for (const msg of ch.messages) {
      if (matches(msg, query)) results.push({ channelId: id, msg });
    }
  }
  return results;
}
```

## 取代的東西

| 移除 | 取代為 |
|---|---|
| `useMessageRegistryStore` | `useChannelsStore.getState().channels` (pull-based) |
| per-channel `createChannelStore` instance | `useChannelsStore` 的 `channels.get(id)` |
| `ChannelStoreContext` + Provider | 不需要 — global store，channelId 由 component 傳入 |
| register/update/unregister sync 邏輯 | 不需要 — 單一 source of truth |

## Handler 接入

```ts
// ChannelMessagesProvider 初始化時 register channel
useChannelsStore.getState().setChannelState(channelId, () => initialChannelState(channelId));

// Socket event handler 寫入
router.register(handlers, (fn) => {
  useChannelsStore.getState().setChannelState(channelId, fn);
});

// Channel unmount 時清理
useChannelsStore.getState().removeChannel(channelId);
```

Handler 簽名不變：`(state: ChannelState, payload) => ChannelState`

## Channel 生命週期

```
Tab open → setChannelState(id, () => initial)
  ↓
Socket events → setChannelState(id, handler)
  ↓
Tab close → removeChannel(id)
  ↓
Map.delete(id) → GC 清除所有該 channel 的 state
```

## Socket RPC Actions

需要 socket instance 的 actions 保留在精簡的 context：

```ts
interface ChannelRpcActions {
  sendMessage: (message: string) => void;
  abort: () => void;
  kill: () => void;
  fetchRawEvents: () => Promise<RawEventsResponse>;
  subscribeRawEvents: (cb: (evt: unknown) => void) => () => void;
  searchFiles: (pattern: string) => Promise<FsSearchResponse>;
  getTerminalContents: () => Promise<TerminalGetContentsResponse>;
  openClaudeTerminal: () => Promise<RpcResult<{ channelId: string }>>;
  forkSession: (messageId: string) => Promise<ForkConversationResponse>;
  rewindToMessage: (userMessageId: string) => Promise<RpcResult<RewindResult>>;
  askSideQuestion: (question: string) => Promise<RpcResult<SideQuestionResult>>;
  reloadPlugins: () => Promise<PluginReloadResult>;
}
```

## 測試策略

### 原則
- **Expect 不變**：所有既有 test 的 DOM assertions 保持原樣
- **Protocol-driven**：測試透過 FakeSummoner emit segment 驗證
- **TDD 重構**：先確認現有測試 green，改一步跑一次

### Setup 變化

```tsx
// renderWithChannel 內部改為：
// 1. useChannelsStore.getState().setChannelState(channelId, () => initial)
// 2. router handler 寫入 channelsStore
// 外部 API 不變，測試碼不需改 expect
```

## 不動的部分

- `handlers/*.ts` — 全部不改（純函式，簽名相容）
- `usePreferencesStore` — 獨立 global store，持久化 UI 設定
- `ChannelMetaContext` — infra，不動
- `ChannelSocketRouterContext` — infra，不動
- `FeatureRegistryContext` — infra，不動
- `ChannelControlContext` — 獨立 domain，不動
- `ChannelConfigContext` — 獨立 domain，不動
- `ChannelComposeContext` — 獨立 domain，不動
