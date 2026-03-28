## Client (frontend) — 已實作功能清單

> 603 tests / 69 files — 全部 pass

---

### 1. Context — State Management — DONE

#### 1.1 SocketContext
- [x] 提供 typed Socket.IO instance
- [x] useMemo stable reference
- [x] 2 tests

#### 1.2 SessionContext
- [x] Session CRUD: launch, join, fork, delete, rename, teleport
- [x] initOptions management（hooks, systemPrompt, jsonSchema）
- [x] Global state:update 處理
- [x] experiment_gates 處理
- [x] disconnect/reconnect toast
- [x] 5 tests

#### 1.3 TabContext
- [x] Tab CRUD: addTab, removeTab, setActiveTab, setTabTitle, setTabStatus
- [x] createNewTab → session:launch
- [x] syncFromServer → reconcile tabs with server sessions
- [x] joinSession → add + activate tab
- [x] Socket events: session:created, session:dead, connect
- [x] Document title side effect（pending → spinner prefix）
- [x] Actions useMemo（stable reference, single dep: socket）
- [x] 27 tests

#### 1.4 PluginContext
- [x] Plugin state: installed, available, marketplaces, needsRestart
- [x] Actions: refreshPlugins, install, uninstall, toggle, addMarketplace, removeMarketplace
- [x] RPC-based（不監聽 socket events）

#### 1.5 GitContext
- [x] Actions: gitStatus, gitLog, gitDiff, gitCheckout
- [x] RPC-based
- [x] **零 consumer**（UI component 已刪除，context 保留）

#### 1.6 ChannelMessagesContext
- [x] State: messages, status, stats, modifiedFiles, planComments, statusText
- [x] Streaming: textDelta 累積、thinkingDelta 累積、messageStop 切分
- [x] Dedup: delta → assistant replay 不重複
- [x] Actions: sendMessage, abort, kill, fetchRawEvents, forkSession
- [x] Actions: addPlanComment, clearPlanComments, clearModifiedFiles, removeModifiedFile
- [x] Socket events: message:*, stream:*, system:*, state:update, notification:*
- [x] Title derivation from first user message

#### 1.7 ChannelControlContext
- [x] State: pendingControls, pendingElicitation, pendingDiffReview
- [x] Actions: respondToControl, diffRespond, respondToElicitation, cancelElicitation, clearPendingDiffReview, stopTask
- [x] Socket events: control:*

#### 1.8 ChannelConfigContext
- [x] State: model, tools, mcpServers, permissionMode, thinkingLevel, effort, fastModeState, slashCommands
- [x] Actions: setModel, setPermissionMode, setThinkingLevel, setEffort, setFastMode
- [x] MCP actions: mcpToggle, mcpReconnect, mcpAuthenticate, mcpClearAuth, mcpStatus, mcpListTools
- [x] Socket events: session:init, state:update, system:available_models

#### 1.9 ChannelComposeContext
- [x] State: value, hasText, attachments, mentionResults
- [x] Actions: submit, updateValue, addAttachments, focusTextarea, insertSlashCommand, executeSlashCommand, mentionFile

### 2. Components — Chat Core — DONE

#### 2.1 ChatPanel（19 tests）
- [x] Message list + compose area
- [x] Diff review panel（inline）
- [x] Elicitation dialog（inline）
- [x] Control flow: tool_result pipeline, cancel request, notifications
- [x] Session mode routing

#### 2.2 MessageList（23 tests）
- [x] Message rendering with role grouping
- [x] Streaming: text_delta, thinking_delta 累積 render
- [x] Dedup: thinking_delta → thinking 不重複, text_delta → assistant 不重複
- [x] Subagent nesting（parentToolUseId）
- [x] Search + type filter
- [x] Scroll to bottom
- [x] SpinnerVerb loading indicator

#### 2.3 ChatMessage（55 tests）
- [x] 23 種 message type rendering（text, thinking, tool_use, tool_result, error, etc.）
- [x] Diff rendering（colored lines, filename header, line numbers）
- [x] ANSI output rendering
- [x] Selection attachment chips
- [x] File paths as clickable buttons
- [x] Result stats inline

#### 2.4 ComposeInput（5 tests）
- [x] Textarea with placeholder
- [x] Processing state placeholder
- [x] Enter submit + clear
- [x] Mention dropdown（@ file search）
- [x] Slash command menu（/ trigger）

#### 2.5 ComposeToolbar（9 tests）
- [x] Send/Stop button
- [x] Permission mode picker
- [x] Effort level
- [x] Command menu button
- [x] Context usage percentage
- [x] MCP server dialog（inline from ConnectedManageMcpDialog）

### 3. Components — Control Flow — DONE

#### 3.1 PendingActionBanner（12 tests）
- [x] Tool permission: Yes/No/Allow session
- [x] Custom deny message
- [x] Hook callback: Continue/Cancel
- [x] AskUserQuestion fallback
- [x] Esc to cancel

#### 3.2 PlanReviewBanner（9 tests）
- [x] Plan markdown preview
- [x] Comment textarea
- [x] Approve with planComments as userFeedback
- [x] Continue Planning with comment as deny message
- [x] Request ID change resets comment

#### 3.3 CommandMenu（5 tests）
- [x] Slash command palette（buildMenuItems 207 行 pure function）
- [x] Effort cycling + EffortSwitch
- [x] Model picker / permission / settings shortcuts

### 4. Components — Settings & Dialogs — DONE

#### 4.1 PermissionModePicker
- [x] Unified PERMISSION_MODES config + PERMISSION_BY_ID lookup
- [x] EffortSwitch slider

#### 4.2 ManageMcpDialog（31 tests via MCPPanel）
- [x] Server toggle, reconnect, authenticate
- [x] Scope grouping（project, user, claude.ai）
- [x] Status badges（connected, failed, needs-auth, disabled）
- [x] Send message（JSON）

#### 4.3 AccountUsageDialog（8 tests）
- [x] Rate limit event rendering
- [x] Usage data display
- [x] Account info display

#### 4.4 InitOptionsDialog（11 tests）
- [x] System prompt + append system prompt
- [x] JSON schema + agents
- [x] Hooks config（toggle checkboxes）

### 5. Components — Layout — DONE

#### 5.1 WorkspaceLayout（4 tests）
- [x] ChannelProvider per tab with CSS show/hide
- [x] TabBar above workspace

#### 5.2 HeaderBar（7 tests）
- [x] Connection status（idle/busy/streaming/disconnected）
- [x] Kill button with confirm flow
- [x] Session title

#### 5.3 TabBar（11 tests）
- [x] Tab switching, close, new tab
- [x] Status indicator dots（default/pending/done）

### 6. Components — Other — DONE

- [x] 6.1 DiffViewer — unified diff, accept/reject, edit mode（16 tests）
- [x] 6.2 SessionHistory — list, pagination, rename, delete, export/import, remote, teleport（37 tests）
- [x] 6.3 ContentPreviewPanel — markdown/diff preview（7 tests）
- [x] 6.4 ModifiedFilesPanel — file status, version badge, accept/rewind（10 tests）
- [x] 6.5 OnboardingOverlay — step navigation, dismiss（7 tests）
- [x] 6.6 ReviewUpsellBanner — experiment gate driven（4 tests）
- [x] 6.7 CodeBlock — syntax highlight, copy（4 tests）
- [x] 6.8 ThinkingBlock — collapsible thinking content（6 tests）
- [x] 6.9 SpinnerVerb — animated loading verb（6 tests）
- [x] 6.10 NotificationToast — severity styling, buttons（6 tests）
- [x] 6.11 FileViewer + FileViewerConnected — syntax highlight, emit fetch（8 tests）
- [x] 6.12 SearchBar — search + type filter（6 tests）
- [x] 6.13 ErrorFallback — error boundary（3 tests）

### 7. Utils — DONE

- [x] 7.1 message-tree — buildMessageTree, mergeToolResult, nestChild
- [x] 7.2 buildMessagesFromHistory — history events → message array（11 tests）
- [x] 7.3 diff — isDiff, parseDiffFileName, extractNewContent, generateUnifiedDiff（10 tests）
- [x] 7.4 slash-query — getSlashQuery（8 tests）
- [x] 7.5 feedback-label — getFeedbackLabel（6 tests）
- [x] 7.6 pluralize（4 tests）

### 8. Message Blocks (`components/message-blocks/`) — DONE

- [x] 8.0a ToolUseBlock — Bash, Read, Write, WebSearch, Agent 等 tool 卡片
- [x] 8.0b ToolResultBlock — diff, ANSI output, file paths as clickable buttons
- [x] 8.0c HookBlocks — hook_started, hook_response, hook_diagnostics
- [x] 8.0d SystemBlocks — compact_boundary, control_response, slash_command_result, interrupt
- [x] 8.0e shared.tsx — CollapsibleBlock, ANSI parser, file path parser

### 8a. Tool Registry (`components/tools/`) — DONE

- [x] 8a.1 getToolHeaderInfo — 結構化 tool display（name + detail）
- [x] 8a.2 getToolHeader — plain text header
- [x] 8a.3 isToolHidden — 隱藏 TodoRead/TodoWrite
- [x] 8a.4 isMcpTool / parseMcpToolName — MCP tool 解析
- [x] 8a.5 21 tests

### 8b. UI Components — DONE

- [x] 8b.1 Dialog — base modal（open/close, Escape, mandatory mode）— 6 tests
- [x] 8b.2 ToggleSwitch — clsx + bg-toggle
- [x] 8b.3 Icons.tsx — SVG icon library
- [x] 8b.4 EffortSwitch — effort level slider
- [x] 8b.5 PermissionModeIcons

### 8c. Socket RPC (`socket/rpc.ts`) — DONE

- [x] 8c.1 `rpc<E>(socket, event, ...args)` — Promise wrapper for socket.emit

### 8d. Stores — DONE

- [x] 8d.1 usePreferencesStore — Zustand + localStorage persist（onboarding, reviewUpsell）

### 8e. Types — DONE

- [x] 8e.1 types/chat.ts — ChannelState, Message（27 types）, PendingElicitation, InitOptions
- [x] 8e.2 types/ui.ts — ToolInput, ToolResult, ToolHeaderInfo

### 8f. Storybook — DONE

- [x] 8f.1 50 個 .stories.tsx 覆蓋所有主要 component

### 9. Hooks — DONE

- [x] 9.1 useInputHistory — push, cycleUp, cycleDown, reset（8 tests）
- [x] 9.2 useSpeechToText — Web Speech API integration（9 tests）

### 10. CSS Theme (`App.css @theme`) — DONE

- [x] 10.1 Semantic tokens: --color-selected, --color-toggle, --color-button
- [x] 10.2 Permission mode focus-within selectors use var() references
- [x] 10.3 Components use theme classes: bg-selected, bg-toggle, bg-button

### 11. Test Infrastructure — DONE

- [x] 11.1 FakeClaude — wraps server FakeClaude + act() for React flush
- [x] 11.2 renderWithWorkspace — full provider tree + auto launch + userEvent
- [x] 11.3 renderWithChannel — single channel + auto launch
- [x] 11.4 createFakeSocket — from summoner test exports
