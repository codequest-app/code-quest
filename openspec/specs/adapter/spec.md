# Adapter (server) — CLI ↔ Client 橋接層

## 職責
管理 Socket.IO 連線，將 CLI 事件路由到 client，處理 client 請求並轉發給 CLI。

## 架構

```
Client (Socket.IO)
  → ChatHandler (dispatcher)
    → Handlers (session, message, settings, mcp, git, file, plugin, misc)
      → Channel (state machine + ProcessRunner)
        → CLI Process
```

## 核心模組

### Channel (`socket/channel.ts`)
- 封裝一個 Claude process 的完整生命週期
- State machine: `launching → active ↔ streaming → cancelling → closed`
- 管理 pending control requests（permission, elicitation, diff_review, mcp）
- Timeout handling（default 30s, MCP 10s）

### ChannelManager (`socket/channel-manager.ts`)
- 管理多個並發 channel
- Socket-to-channel mapping（一個 socket 可 join 多個 channel）
- `findByRequestId()` — 根據 control request ID 找到對應 channel

### ChatHandler (`socket/chat-handler.ts`)
- @injectable singleton（Inversify DI）
- 註冊所有 socket handler
- 管理 ChannelManager 生命週期

### Handlers（9 個專門 handler，共 64 個 socket.on 註冊）

| Handler | 職責 | 主要事件 |
|---|---|---|
| `session-handler` | Session 生命週期 | launch, join, close, fork, teleport, delete, rename, list, raw_events |
| `message-handler` | 訊息收發 | chat:send, chat:cancel, chat:respond, chat:stop_task, rewind_code, hook_callback |
| `settings-handler` | 設定變更 | set_model, permission, thinking, fast_mode, proactive, remote_control, apply（10 endpoints）|
| `mcp-handler` | MCP server 管理 | get/set/toggle/reconnect/auth + Chrome/Jupyter/Debugger（13 endpoints）|
| `git-handler` | Git 操作 | check_git_status, git:log, git:diff |
| `file-handler` | 檔案操作 | file:read, list_files |
| `plugin-handler` | Plugin 管理 | list_plugins, install, toggle |
| `misc-handler` | 其他 | init, raw_event, auth, plan, speech-to-text, disconnect（11 endpoints）|
| `helpers` | 共用工具 | requireRunner, broadcastSessionState |

### Channel Hooks (`socket/hooks/channel-hooks.ts`)
- 連接 ProcessRunner 事件到 Channel state
- 將 `socket_event` broadcast 到已 join 的 sockets
- 處理 `server_action`（permission enrichment, auto-response）
- 記錄 raw events 到 RawEventStore

### Services

| Service | 實作 | 職責 |
|---|---|---|
| RawEventStore | Drizzle / File / Composite | 記錄 CLI raw bytes |
| SessionStore | Drizzle / Composite | Session metadata 持久化 |
| UsageTracker | In-memory | Token/cost 追蹤 |
| SettingsStore | File-based | 使用者設定持久化 |

### Helpers (`socket/handlers/helpers.ts`)
- `execGit(args, timeout)` — 執行 git 命令
- `runPluginCommand(args)` / `runPluginCommandAsync(args)` — 執行 plugin 命令
- `rgAvailable` / `rgListFiles(cwd)` — ripgrep 檔案搜尋

### File Handler (`socket/handlers/file-handler.ts`)
- `file:read` — 讀取檔案（含 path traversal 保護）
- `list_files_request` — ripgrep 搜尋或 fallback directory walk
- `terminal:get_contents` — 讀取 terminal 最後 100 行
- `terminal:open_claude` — 開啟新 Claude session

### DI Container (`container.ts`)
- Inversify container
- Binds: RunnerFactory, RawEventStore, SessionStore, ChatHandler, ChannelManager, UsageTracker, SettingsStore, Database
- 支持 SQLite / MySQL / File storage（composite multi-backend）
- TYPES symbols: RunnerFactory, Database, ChannelManager, SettingsStore

### Config (`config.ts`)
- `port` — Server port（default 3000）
- `databaseUrl` — MySQL 連線字串
- `rawStore.drivers` — 多 driver 支援（sqlite, mysql, file）
- `systemPrompt` — 自訂 system prompt
- `allowDangerouslySkipPermissions` — 跳過權限檢查

### Server Entry (`bin/server.ts`)
- Express + Socket.IO bootstrap
- Middleware: `helmet()`（security headers）, `cors()`
- `/health` endpoint
- SPA fallback routing（serve client dist）
- Graceful shutdown on SIGTERM/SIGINT（10s timeout）

### Database (`db/`)
- Drizzle ORM schema: rawEntries, sessions tables
- SQLite + MySQL dual support
- Migration scripts: `migrate-sqlite.ts`, `migrate-mysql.ts`

## 測試覆蓋（25 個 test files）

**Handler tests（8 個）：**
- `chat-handler-session.test.ts` — launch, join, fork, rewind
- `chat-handler-message.test.ts` — send, cancel, control response
- `chat-handler-settings.test.ts` — model, permission, thinking
- `chat-handler-control.test.ts` — permission flow, timeout
- `chat-handler-mcp.test.ts` — MCP toggle, reconnect
- `chat-handler-git.test.ts` — git status, log
- `chat-handler-auth.test.ts` — auth flow
- `chat-handler-plan.test.ts` — plan comments

**Channel tests（3 個）：**
- `channel.test.ts` — state machine, control requests
- `channel-manager.test.ts` — multi-channel 管理
- `channel-wire-runner.test.ts` — runner event 路由

**Service tests（6 個）：**
- `raw-event-store.test.ts`, `file-raw-store.test.ts`, `composite-raw-store.test.ts`
- `drizzle-session-store.test.ts`, `usage-tracker.test.ts`, `settings-store.test.ts`

**Integration tests（2 個）：**
- `adapter-integration.test.ts` — 完整 CLI→Server→Client flow
- `named-event-integration.test.ts` — event 命名一致性
