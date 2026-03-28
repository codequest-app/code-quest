# Gap Analysis: docs vs 實作

比對 `docs/ui/` + `docs/protocol/` 文件與程式碼實作現狀。

> 最後更新: 2026-03-05（+docs/impl/ 分析）

---

## docs/impl/ 分析（2026-03-05）

`docs/impl/` 裡的六份文件描述的是 **VS Code Extension 架構**（WebView ↔ Extension Host ↔ CLI），但我們實際實作的是 **client-server Socket.IO 架構**（React client ↔ Node.js server ↔ CLI）。以下逐份說明差異。

---

### 00-overview.md — 架構根本不同

| 項目 | 文件描述 | 實際程式碼 |
|------|---------|-----------|
| 傳輸層 | WebView ↔ Extension Host via `postMessage` | React ↔ Server via Socket.IO |
| 主機 | VS Code Extension Host（同 process） | 獨立 Node.js server |
| CLI 通信 | Extension Host 直接 spawn，stdio 在同機 | Server 端 `InteractiveSession` spawn |

**結論：** 文件描述的是 VS Code extension 內部架構，跟我們的 web 架構完全不同層。文件可能是對 Claude Code 官方 extension 的 reverse engineering 筆記，不是我們自己的 spec。

---

### 01-architecture.md — Channel 概念 vs SessionManager

| 項目 | 文件描述 | 實際程式碼 |
|------|---------|-----------|
| 核心物件 | `ChannelManager`（class `g$`），`channels: Map<channelId, Channel>` | `SessionManager`（Inversify injectable），`activeSessions: Map<string, ControllableSession>` |
| 狀態存放 | Channel 物件帶 `in`（RxJS stream）、`query`、`pid`、`vscodeMcpServer` | Server `SessionStore`（DB），client `chatStore.tabs[sessionId]`（Zustand） |
| MCP sub-states | `chromeMcpState`, `debuggerMcpState`, `jupyterMcpState` | 無對應，MCP 狀態不暴露到 client |

---

### 02-channel-state-machine.md — 狀態機不完整

文件定義 6 個狀態：`IDLE → LAUNCHING → ACTIVE → STREAMING → IDLE` 或 `CANCELLING → IDLE`

實際 `packages/summoner/src/session.ts`：
```typescript
private _state: 'idle' | 'processing' = 'idle';
```

只有 2 個狀態。細節差異：

| 文件狀態 | 實際狀況 |
|---------|---------|
| `LAUNCHING` | 無此狀態，spawn 後直接 `processing` |
| `ACTIVE` | 無此狀態，等同 `idle`（等待輸入） |
| `STREAMING` | 無顯式狀態，靠事件類型判斷 |
| `CANCELLING` | 無此狀態，interrupt 後等 CLI 自行結束 |

Server 廣播用的是 `'busy' | 'idle' | 'exited'`，跟文件的狀態名稱不對應。

---

### 03-sequence-diagrams.md — 事件名稱全部不同

文件裡所有 sequence diagram 用的事件名稱跟我們的 socket-events.ts 不同：

| 文件事件名 | 實際 Socket.IO 事件 |
|-----------|-------------------|
| `launch_claude` | `chat:create` |
| `io_message`（input） | `chat:send` |
| `io_message`（output） | `chat:event` |
| `update_state` | `chat:created` + callback |
| `close_channel` | `chat:kill` |
| `interrupt_claude` | `chat:interrupt` |
| `set_model` | `chat:set_model` |
| `apply_settings` | `settings:update` |
| `tool_permission_request` | `chat:event`（control_request subtype） |

此外文件提到 `generateAndPushProactiveSuggestions(channelId)` 在 launch 時非同步跑 — 實際程式碼找不到對應實作（suggestion 功能有，但不是這個 call）。

---

### 04-initialization-checklist.md — 初始化流程不同

文件列了 11 個 `globalState` key 需要讀取、settings migration、AuthManager 初始化、`CLAUDE_AGENT_SDK_VERSION` 環境變數等。

實際程式碼：

| 文件項目 | 實際程式碼 |
|---------|-----------|
| 11-key globalState 讀取 | 無。設定透過 `settings:get` socket 事件取得 |
| `migrateOldConfigSettings()` | 無此函數 |
| `migrateLastClaudeLocation()` | 無此函數 |
| `CLAUDE_AGENT_SDK_VERSION` env | 無此 env var 設定 |
| AuthManager 初始化 | server 端有 `authState: AuthStatus` 簡易記憶體狀態 |

這些是 VS Code extension 的初始化需求，跟我們的 web app 無關。

---

### 05-error-handling.md — 錯誤處理模式不同

| 文件描述 | 實際程式碼 |
|---------|-----------|
| `closeChannel(channelId, true, error)` 送 `close_channel` with `error` 欄位 | `socket.emit('chat:error', { message })` |
| `pending_permission_requests[]` array + `processingPermissions` flag（batch 處理） | `pendingControlRequests: Map<sessionId, Map<requestId, event>>`（dedup，非 batch） |
| WebSocket Terminal fallback mode（`claudeCode.useTerminal = true`） | 無，只有 stdio 模式 |

---

### 整體結論

**`docs/impl/` 的文件是對 Claude Code 官方 VS Code extension 的 reverse engineering 筆記**，不是我們 cc-office 的規格文件。兩者架構根本不同：

- 文件：single-process VS Code extension，WebView postMessage
- 實作：distributed client-server，Socket.IO

這些文件作為「了解 Claude Code extension 內部運作」的參考有價值，但**不應作為 cc-office 的實作規格**。事件名稱、狀態機、初始化流程都不應照搬。

---

---

## 完全未實作

### 1. Session Teleportation（遠端 Session 匯入）
- **文件**: `07i-session-teleportation.md`
- **內容**: `list_remote_sessions` → fetch API `/v1/sessions` → `teleport_session` 下載 loglines 寫入本地 JSONL、branch checkout、skipped branch tracking
- **現狀**: 零程式碼，無任何 `teleport`/`remote_sessions`/`session_ingress` 相關實作

### 2. Speech-to-Text（語音輸入）
- **文件**: `07n-speech-to-text.md`
- **內容**: `start_speech_to_text` / `stop_speech_to_text`，透過 `ms-vscode.vscode-speech` 擴充做語音辨識，串流 `speech_to_text_message` 到 Webview
- **現狀**: 零程式碼

### 3. @-Mention 系統
- **文件**: `07u-at-mention.md`, `07-features.md`
- **內容**: `insert_at_mention` 命令、`list_files_request` 回傳 file/terminal/browser 三種類型、`selection_changed` 追蹤編輯器選取
- **現狀**: 零程式碼，file:search 只回傳檔案路徑，無 terminal/browser mention

### 4. Experiment Gates（功能開關）
- **文件**: `07h-experiment-gates.md`
- **內容**: CLI 發送 `experiment_gates` MCP notification → Extension 儲存 → 衍生 `isOnboardingEnabled`、`showReviewUpsellBanner`、`browserIntegrationSupported` 狀態
- **現狀**: 零程式碼，無 `apply_flag_settings` control request

### 5. Debugger MCP Integration
- **文件**: `07k-debugger-mcp.md`
- **內容**: 偵測 VSCode debug session → 自動啟用/停用 `claude-vscode-extension` MCP server → `ask_debugger_help` request
- **現狀**: 零程式碼

### 6. Terminal Integration
- **文件**: `07q-terminal.md`
- **內容**: `open_terminal` / `open_claude_in_terminal` / `get_terminal_contents`（讀取 terminal 輸出）
- **現狀**: 零程式碼

### 7. Tab Management（多分頁管理）
- **文件**: `07t-tab-management.md`
- **內容**: `new_conversation_tab` 建立分頁、`rename_tab` 更新標題與 icon 狀態（pending/done/default）
- **現狀**: 零程式碼（Web UI 不需 VSCode tab，但多分頁管理邏輯未實作）

### 8. Remote Control
- **文件**: `01-stdin-messages.md`
- **內容**: `remote_control` control request `{ enabled: boolean }` 允許外部系統控制對話
- **現狀**: 零程式碼

### 9. MCP OAuth 流程
- **文件**: `01-stdin-messages.md`, `07j-mcp-integration.md`
- **內容**: `mcp_authenticate` / `mcp_clear_auth` / `mcp_oauth_callback_url` control request subtypes
- **現狀**: 零程式碼（`mcp:set_servers`、`mcp:reconnect`、`mcp:toggle`、`mcp:status` 已實作）

---

## 部分實作

### 10. Auth 登入流程
- **文件**: `07f-oauth.md`
- **內容**: `auth:status` / `auth:login` / `auth:oauth_code` 事件
- **現狀**:
  - ✅ socket 事件在 shared types 中已定義
  - ✅ client `LoginOverlay` 元件已存在
  - ✅ **server 端 stub handler 已實作**（`auth:status` 回傳 unauthenticated、`auth:login`/`auth:oauth_code` 回傳 not-implemented）
  - ❌ 實際 OAuth 流程（取得 authUrl、交換 code）未串接

### 11. Diff Accept/Reject Flow（提議修改審閱）✅
- **文件**: `07v-diff-flow.md`
- **內容**: `open_diff` 用 VirtualFS 建立 left/right → diff editor → Accept/Reject 按鈕 → 回傳使用者修改
- **現狀**:
  - ✅ client 有 `DiffViewer` 元件做 inline diff 顯示
  - ✅ `diff:respond` socket 事件已定義
  - ✅ **server 端 `diff:respond` handler 已實作**（accepted → allow, rejected → deny，轉發至 `respondToControlRequest`）
  - ✅ **client 端 `diffRespond` 已串接** — `use-chat` → `ChatPanel` → `MessageList` → `ChatMessage` → `DiffViewer` Accept/Reject 按鈕觸發 `diff:respond` socket 事件

### 12. Plan Mode（計畫模式審閱）✅
- **文件**: `07e-plan-mode.md`
- **內容**: `exit_plan_mode` control request → `open_markdown_preview` 開啟 Plan Preview 面板 → 使用者可加 comment → Accept/Reject
- **現狀**:
  - ✅ `ControlRequestBanner` 支援 `exit_plan_mode` subtype
  - ✅ `PlanReviewBanner` 元件已有 Storybook stories
  - ✅ **comment textarea 已實作** — 輸入回饋後 Continue Planning 會帶入 deny message
  - ✅ **Plan Markdown Preview 已實作** — `MarkdownContent` 共用元件 + collapsible `<details>` 預覽 `pending.input.plan`

### 13. Hook Callback 系統
- **文件**: `07d-hook-callback.md`
- **內容**: `hook_callback` control request → Extension 執行 hook function（captureBaseline、saveFile、findDiagnostics）→ 回傳結果
- **現狀**:
  - ✅ `hook_callback` control request 在 shared schema 中定義
  - ✅ `ControlRequestBanner` 支援 `hook_callback` subtype，顯示 Approve/Deny 按鈕
  - ✅ `hook_started` / `hook_response` 事件已在 parser 中處理
  - ✅ server 端 auto-deny 在 disconnect 時以 `{ continue: false }` 回應
  - ⚠️ 缺少 IDE 整合 hook functions（captureBaseline、findDiagnostics 等），Web UI 場景不適用

### 14. Plugin Marketplace
- **文件**: `07m-plugin-marketplace.md`
- **內容**: `list_plugins` / `install_plugin` / `uninstall_plugin` / `set_plugin_enabled` + marketplace CRUD
- **現狀**:
  - ✅ `plugin:list` / `plugin:install` / `plugin:uninstall` / `plugin:toggle` socket 事件已定義
  - ✅ `PluginPanel` 元件已存在
  - ✅ **server 端 stub handler 已實作**（`plugin:list` 回傳空列表，其餘回傳 not-implemented）
  - ❌ 實際 plugin 管理邏輯（讀取/安裝/移除）未實作
  - ❌ marketplace CRUD（add/remove/refresh marketplace source）未實作

### 15. File Updated 通知
- **文件**: `07-interaction-flows.md`
- **內容**: CLI 發送 `file_updated` → Extension 推送到 Webview → 更新 diff preview
- **現狀**:
  - ✅ `file_updated` 事件在 shared `ServerToClientEvents` 已定義
  - ✅ `use-chat` hook 有監聯 `file_updated`
  - ✅ **ModifiedFilesPanel 已實作** — 點擊展開可查看 unified diff（新增/刪除/修改皆支援）
  - ⚠️ 尚無自動滾動/highlight 最新變更的 UI

### 16. Notification 系統 ✅
- **文件**: `07w-notification.md`
- **內容**: `show_notification` 含 severity、buttons、onlyIfNotVisible → 顯示通知 → 回傳點擊結果
- **現狀**:
  - ✅ `notification` 事件在 `ServerToClientEvents` 已定義
  - ✅ server chat-handler `sendNotification()` 已實作
  - ✅ **client 多按鈕已實作** — `NotificationToast` 自定元件，透過 `toast.custom()` 渲染 N 個可點擊按鈕

### 17. stop_task 精確停止
- **文件**: `01-stdin-messages.md`
- **內容**: `stop_task` control request 帶 `task_id` 停止特定 subagent task
- **現狀**:
  - ✅ `chat:stop_task` socket 事件已定義
  - ✅ **server 已改為根據 `sessionId` + `taskId` 呼叫 `session.stopTask(taskId)`**
  - ✅ `ControllableSession` 已新增 `stopTask()` 方法
  - ✅ schema 已更新為 `{ sessionId, taskId }`

### 18. Session Fork at Message Point
- **文件**: `07p-session-forking.md`
- **內容**: fork 時可指定 `resumeSessionAt` 從特定 message 開始
- **現狀**:
  - ✅ `sessionForkSchema` 有 `messageId` 欄位
  - ✅ **server 已改為傳遞 `messageId` 至 `session.initialize({ resumeSessionAt: messageId })`**
  - ⚠️ CLI 端是否支援 `resumeSessionAt` 參數待驗證

### 19. Subagent 巢狀顯示
- **文件**: `07-interaction-flows.md`
- **內容**: `parent_tool_use_id` 標記 subagent 事件，應分組顯示
- **現狀**:
  - ✅ `parentToolUseId` 欄位在 `ChatStreamEvent` 已定義且傳遞
  - ✅ `MessageList` 已有 `buildMessageTree()` 以 `parentToolUseId` 做巢狀分組
  - ✅ tree rendering 已實作，子事件 nested under parent tool_use node

---

## 已實作（確認完成）

| 功能 | 文件參考 |
|------|---------|
| CLI 啟動與參數 | `00-cli-startup.md` |
| stdin/stdout JSON 協議 | `01-stdin-messages.md`, `02-stdout-messages.md` |
| 串流事件解析（stream_event） | `02-stdout-messages.md` |
| initialize control request | `01-stdin-messages.md` |
| interrupt flow | `07c-cancel-flow.md` |
| Permission Mode 切換 | `07a-permission-mode.md` |
| Model 切換 | `07b-model-thinking.md` |
| Thinking Level 控制 | `07s-thinking-level.md` |
| can_use_tool 權限審批 | `07-interaction-flows.md` |
| control_cancel_request | `07c-cancel-flow.md` |
| File Rewind | `07l-file-rewind.md` |
| Session Forking（基本） | `07p-session-forking.md` |
| Session 管理（list/rename/delete） | `07x-session-management.md` |
| MCP reconnect/toggle/status/set_servers/message | `07j-mcp-integration.md` |
| Git status / checkout | `07o-git-integration.md` |
| Proactive Suggestions（規則式） | `07g-proactive-suggestions.md` |
| compact_boundary 事件 | `02-stdout-messages.md` |
| Subagent / parent_tool_use_id（傳遞） | `07-interaction-flows.md` |
| Citations | `02-stdout-messages.md` |
| Usage Tracking（`UsageTracker` + `chat:request_usage` handler + `rate_limit_event` 自動推送） | `07r-usage-tracking.md` |
| Diff Accept/Reject 完整流程（server `diff:respond` handler + client `diffRespond` → `DiffViewer`） | `07v-diff-flow.md` |
| stop_task 精確停止（`session.stopTask(taskId)`） | `01-stdin-messages.md` |
| Session Fork at message point（`messageId` → `resumeSessionAt`） | `07p-session-forking.md` |
| Hook Callback（`hook_callback` control request + Approve/Deny UI） | `07d-hook-callback.md` |
| Subagent 巢狀顯示（`buildMessageTree` + `parentToolUseId` 分組） | `07-interaction-flows.md` |
| Notification 多按鈕（`NotificationToast` + `toast.custom()`） | `07w-notification.md` |
| ModifiedFiles diff 展開（`ModifiedFilesPanel` + `DiffViewer`） | `07-interaction-flows.md` |
| Plan Mode 完整流程（comment + Markdown preview + `MarkdownContent` 共用元件） | `07e-plan-mode.md` |

---

## 建議優先順序

| 優先級 | 功能 | 理由 | 複雜度 |
|--------|------|------|--------|
| ~~P1~~ | ~~Usage Tracking server handler~~ | ✅ **已完成** | — |
| ~~P1~~ | ~~Diff Accept/Reject 完整流程~~ | ✅ **已完成** — server `diff:respond` handler + client `diffRespond` 串接至 `DiffViewer` | — |
| ~~P1~~ | ~~Auth server handler~~ | ✅ **stub 已完成** — `auth:status`/`auth:login`/`auth:oauth_code` handler | — |
| ~~P1~~ | ~~Plugin server handler~~ | ✅ **stub 已完成** — `plugin:list`/`install`/`uninstall`/`toggle` handler | — |
| ~~P2~~ | ~~stop_task 精確停止~~ | ✅ **已完成** — `session.stopTask(taskId)` + schema 更新 | — |
| ~~P2~~ | ~~Session Fork at message point~~ | ✅ **已完成** — `messageId` → `resumeSessionAt` | — |
| ~~P2~~ | ~~Hook Callback~~ | ✅ **已完成** — Approve/Deny UI + auto-deny on disconnect | — |
| ~~P2~~ | ~~Subagent 巢狀顯示~~ | ✅ **已完成** — `buildMessageTree()` + tree rendering | — |
| ~~P1~~ | ~~Notification 多按鈕~~ | ✅ **已完成** — `NotificationToast` + `toast.custom()` | — |
| ~~P1~~ | ~~File Updated UI 回應~~ | ✅ **已完成** — `ModifiedFilesPanel` 可展開 diff | — |
| ~~P1~~ | ~~Plan Mode 完整流程~~ | ✅ **已完成** — comment + Markdown preview（`MarkdownContent` 共用元件） | — |
| P2 | Auth 實際 OAuth 串接 | stub 已完成，需外部 OAuth provider 設計 | 中（需 spec） |
| P2 | Plugin 實際管理邏輯 | stub 已完成，需定義 plugin 格式與管理方式 | 中（需 spec） |
| P2 | MCP OAuth | MCP 基礎已完善，需新增 control_request subtypes | 中（需 spec） |
| P3 | Experiment Gates | 需新增 event type + client state | 中 |
| P3 | @-Mention 系統 | 需新 UI 元件 + file search 擴充 | 高 |
| P3 | Session Teleportation | 需 REST API 對接 | 高 |
| P4 | Remote Control | 需 spec 定義控制語意 | 中 |
| P4 | Speech-to-Text | 需要額外依賴（語音辨識） | 高 |
| P4 | Debugger MCP | 需 debug session 偵測，Web UI 不適用 | 高 |
| P4 | Terminal Integration | Web UI 場景較不需要 | 高 |
| P4 | Tab Management | Web UI 可用不同方式實作 | 中 |
