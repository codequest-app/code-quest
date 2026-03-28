# Client — React Frontend

## 職責
接收 server socket events，渲染 chat UI，處理使用者互動。

## 架構

```
App.tsx
├── SocketProvider          ← Socket.IO 連線
│   └── SessionProvider     ← Session CRUD + initOptions
│       └── GitProvider     ← Git 操作（目前零 consumer）
│           └── PluginProvider  ← Plugin/Marketplace 管理
│               └── TabProvider ← Tab routing + sync
│                   └── WorkspaceLayout
│                       ├── TabBar
│                       └── ChannelProvider (per tab)
│                           ├── ChannelMessagesProvider  ← 訊息 + streaming + lifecycle
│                           │   └── ChannelControlProvider  ← permission/control 佇列
│                           │       └── ChannelConfigProvider  ← model/thinking/effort/MCP
│                           │           └── ChannelComposeProvider  ← 輸入框狀態
│                           └── ChatPanel
│                               ├── HeaderBar
│                               ├── MessageList
│                               └── ChatInputArea
│                                   ├── ComposeInput
│                                   └── ComposeToolbar
```

## Context 職責分離

### Top-Level Contexts

| Context | State | Actions | Socket Events |
|---|---|---|---|
| SocketContext | socket instance | — | — |
| SessionContext | initOptions | launch, join, fork, delete, rename | `state:update` (global) |
| TabContext | tabs, activeTabId | addTab, removeTab, createNewTab, syncFromServer | `session:created`, `session:dead`, `connect` |
| PluginContext | installed, available, marketplaces | refresh, install, uninstall, toggle | — (RPC) |
| GitContext | — | gitStatus, gitLog, gitDiff, gitCheckout | — (RPC) |

### Channel Contexts（per-tab）

| Context | State | Actions | Socket Events |
|---|---|---|---|
| ChannelMessages | messages, status, stats, modifiedFiles, planComments | sendMessage, abort, kill, fetchRawEvents | `message:*`, `stream:*`, `system:*`, `state:update` |
| ChannelControl | pendingControls, pendingElicitation, pendingDiffReview | respondToControl, diffRespond, respondToElicitation | `control:*` |
| ChannelConfig | model, tools, mcpServers, permissionMode, effort, thinkingLevel | setModel, setPermissionMode, setThinkingLevel, setEffort | `session:init`, `state:update`, `system:available_models` |
| ChannelCompose | value, hasText, attachments, mentionResults | submit, updateValue, addAttachments, focusTextarea | — |

## 關鍵 Component

### Chat 核心
- **ChatPanel** — 主要 chat 視窗，包含 diff review、elicitation dialog
- **MessageList** — 訊息列表 + streaming render + scroll 管理
- **MessageContent** — 23 種 message type 的 switch renderer
- **ChatMessage** — 單一訊息（avatar + content + actions）
- **ComposeInput** — 輸入框 + mention + slash command + keyboard navigation
- **ComposeToolbar** — Send/Stop + permission mode + effort + MCP dialog

### Control Flow
- **PendingActionBanner** — Permission request（Yes/No/Allow session）
- **PlanReviewBanner** — Plan review（Approve/Continue planning + comments）
- **ElicitationDialog** — User input dialog（inlined in ChatPanel）
- **ContentPreviewPanel** — Diff review panel（inlined in ChatPanel）

### Settings & Dialogs
- **CommandMenu** — Slash command palette + settings shortcuts
- **PermissionModePicker** — Permission mode dropdown
- **ModelPickerPanel** — Model selection
- **ManageMcpDialog** — MCP server 管理
- **AccountUsageDialog** — Usage stats

### Layout
- **WorkspaceLayout** — Tab routing + channel panel composition
- **HeaderBar** — Connection status + kill + raw events
- **TabBar** — Tab switcher + new tab

## Message Blocks (`components/message-blocks/`)

| File | 職責 |
|---|---|
| ToolUseBlock.tsx | Tool 呼叫卡片（Bash, Read, Write, WebSearch 等）|
| ToolResultBlock.tsx | Tool 結果解析（diff, ANSI, file paths）|
| HookBlocks.tsx | Hook 事件（hook_started, hook_response, hook_diagnostics）|
| SystemBlocks.tsx | 系統訊息（compact_boundary, control_response, slash_command_result）|
| shared.tsx | 共用元件（CollapsibleBlock, ANSI parser, file path parser）|

## Tool Registry (`components/tools/tool-registry.ts`)

- `getToolHeaderInfo(name, input)` — 結構化 tool display info
- `getToolHeader(name, input)` — plain text header
- `isToolHidden(name)` — 隱藏 TodoRead/TodoWrite
- `isMcpTool(name)` / `parseMcpToolName(name)` — MCP tool 解析

## UI Components (`components/ui/`)

- Dialog.tsx — base modal/dialog
- ToggleSwitch.tsx — toggle UI（clsx + bg-toggle）
- Icons.tsx — SVG icon library

## Icon Components (`components/icons/`)

- EffortSwitch.tsx — effort level slider
- PermissionModeIcons.tsx — permission mode 圖示

## Socket RPC (`socket/rpc.ts`)

```typescript
rpc<E>(socket, event, ...args): Promise<Response>
```
包裝 `socket.emit(event, ...args, callback)` 為 Promise，用於 request-response 模式。

## Stores

- `usePreferencesStore` — Zustand + localStorage persist
  - `isOnboardingDismissed`
  - `isReviewUpsellDismissed`

## Types

### `types/chat.ts`
- `ChannelState` — messages, status, stats, modifiedFiles, planComments, terminalSessions
- `Message` — 27 種 message type union
- `PendingElicitation`, `PendingDiffReview`, `PendingControl`
- `InitOptions` — hooks, systemPrompt, jsonSchema, agents
- `initialChannelState(channelId)` helper

### `types/ui.ts`
- `ToolInput`, `ToolResult`, `ToolHeaderInfo`
- Tool 解析 utilities（isMcpTool, parseMcpToolName 等）

## Storybook

50 個 `.stories.tsx` 檔案覆蓋所有主要 component，用於 visual design system 驗證。

## 無獨立測試的 Components（22 個）

以下 component 沒有 `__tests__/X.test.tsx`，但多數透過 parent component 測試間接覆蓋：

**透過 ChatPanel/ComposeToolbar 間接測試：**
- ChatInputArea, PermissionModePicker, ModelPickerPanel, AddButton, ContextPieChart, SpeechInputButton, SparkLegend

**透過 PendingActionBanner 間接測試：**
- ToolPermissionBanner, HookCallbackBanner, PermissionHeader, OptionButton

**透過 MessageList/ChatMessage 間接測試：**
- MessageContent, MessageNodeList, CollapsibleTimeline, SubagentChildren, MarkdownContent

**透過 MCPPanel 間接測試：**
- ManageMcpDialog, InstalledPluginList, MarketplaceSection

**獨立但簡單（Storybook 覆蓋）：**
- ElicitationDialog, MentionDropdown, PluginsPanel

## CSS Theme (`App.css @theme`)

```css
--color-selected: #094771;   /* row highlight */
--color-toggle: #0e639c;     /* switch on state */
--color-button: #0078d4;     /* primary button */
--color-accent: #d97757;     /* Claude orange */
--color-success/warning/danger
```

## Test Infrastructure

### FakeClaude (`test/fake-claude.ts`)
- 包裝 server FakeClaude + `act()` for React flush
- `prepareInit()` + `emit(segment)` + `received(type)`

### renderWithWorkspace (`test/render-with-workspace.tsx`)
- Full provider tree + auto launch + userEvent setup

### renderWithChannel (`test/render-with-channel.tsx`)
- Single channel provider + auto launch

## 測試覆蓋（69 files, 603 tests）

**Component tests（48 files）：**
- ChatPanel, MessageList, ChatMessage, ComposeInput, ComposeToolbar
- PendingActionBanner, PlanReviewBanner, CommandMenu, HeaderBar
- MCPPanel, ManageMcpDialog, DiffViewer, SessionHistory
- AccountUsageDialog, ModifiedFilesPanel, etc.

**Context tests（8 files）：**
- ChannelProvider, ChannelContext, ChannelCompose, TabContext, SessionContext, SocketContext

**Utils tests（5 files）：**
- diff, message-tree, buildMessagesFromHistory, pluralize, getSlashQuery

**Hooks tests（2 files）：**
- useInputHistory, useSpeechToText
