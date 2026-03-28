## Adapter (server) — 已實作功能清單

> 359 tests / 27 files — 全部 pass

---

### 1. Channel Management — DONE

#### 1.1 Channel (`channel.ts`)
- [x] State machine: launching → active ↔ streaming → cancelling → closed
- [x] Control request tracking: register, resolve, timeout（default 30s, MCP 10s）
- [x] Notification request tracking
- [x] Socket join/leave
- [x] 16 tests

#### 1.2 ChannelManager (`channel-manager.ts`)
- [x] Multi-channel concurrent management
- [x] Socket-to-channel mapping（一對多）
- [x] findByRequestId（遍歷 channels）
- [x] Channel destroy + cleanup
- [x] 13 tests

#### 1.3 Channel Hooks (`hooks/channel-hooks.ts`)
- [x] ProcessRunner 事件 → Channel state 更新
- [x] socket_event broadcast 到已 join sockets
- [x] server_action 處理（permission enrichment, auto-response）
- [x] Raw event 記錄
- [x] session:init suppress broadcast（只發給請求者）
- [x] 15 tests

### 2. Socket Handlers — DONE

#### 2.1 Session Handler（104 tests, 12 endpoints）
- [x] session:launch — spawn CLI, create channel, emit session:init
- [x] session:join — join existing channel（replay pending requests）
- [x] session:close — close channel
- [x] fork_conversation — fork session at message
- [x] teleport_session — teleport to different branch
- [x] delete_session, rename_session
- [x] list_sessions_request, list_remote_sessions, get_session_request
- [x] session:raw_events — get raw protocol events
- [x] update_session_state — update title/state

#### 2.2 Control Handler（46 tests）
- [x] Permission flow: control:permission → client approve/deny → CLI
- [x] Elicitation flow: control:elicitation → client submit → CLI
- [x] Diff review flow: control:diff_review → client accept/reject → CLI
- [x] Hook callback flow
- [x] MCP control flow
- [x] Timeout handling
- [x] Cancel request propagation

#### 2.3 Message Handler（8 tests）
- [x] chat:send → format + write to CLI stdin
- [x] chat:cancel → interrupt signal（second call = force abort）
- [x] chat:respond → unified control response handler
- [x] chat:stop_task → stop subagent
- [x] cancel_async_message
- [x] rewind_code（with dry-run support）
- [x] cancel_request — cancel pending control requests
- [x] generate_session_title — AI 生成 title
- [x] hook_callback_respond

#### 2.4 Settings Handler（24 tests, 10 endpoints）
- [x] set_model → emit state:update
- [x] set_permission_mode → emit state:update
- [x] set_thinking_level → emit state:update
- [x] chat:set_fast_mode → emit state:update
- [x] set_proactive → enable/disable proactive
- [x] set_remote_control → enable/disable remote control
- [x] apply_settings → CLI restart with new settings（effort level）
- [x] get_claude_state → read current CLI state
- [x] request_usage_update → emit usage quota

#### 2.5 MCP Handler（16 tests）
- [x] get_mcp_servers — list MCP servers
- [x] set_mcp_server_enabled — toggle server
- [x] mcp_reconnect — reconnect server
- [x] authenticate_mcp_server — OAuth flow
- [x] mcp_list_tools — list server tools
- [x] mcp_set_servers — configure servers
- [x] mcp_message — JSON-RPC message with timeout
- [x] clear_mcp_server_auth — clear stored auth
- [x] submit_mcp_oauth_callback_url — OAuth callback
- [x] Chrome MCP: ensure_chrome_mcp_enabled, disable_chrome_mcp
- [x] Jupyter MCP: enable_jupyter_mcp, disable_jupyter_mcp
- [x] ask_debugger_help — debugger assistance

#### 2.6 Misc Handler（45 tests）
- [x] init — return session list, models, settings, platform info
- [x] raw_event_subscribe — stream raw CLI events
- [x] Channel metadata caching
- [x] Session state broadcasting
- [x] Plan: comment, get_plan_comments, remove_plan_comment, close_plan_preview
- [x] Speech-to-text stubs: start/stop
- [x] disconnect handler with cleanup
- [x] Auth: get_auth_status, login, submit_oauth_code

#### 2.7 Git Handler（3 tests）
- [x] check_git_status
- [x] git:log
- [x] git:diff
- [x] checkout_branch
- [x] update_skipped_branch
- [x] exec — shell command 執行

#### 2.8 Plugin Handler（3 tests, 8 endpoints）
- [x] list_plugins, install_plugin, uninstall_plugin, set_plugin_enabled
- [x] Marketplace: list_marketplaces, add_marketplace, remove_marketplace, refresh_marketplace

#### 2.9 Plan Handler（5 tests）
- [x] Plan comments CRUD
- [x] close_plan_preview

#### 2.10 Auth Handler（1 test）
- [x] get_auth_status, login, submit_oauth_code

### 3. Services — DONE

#### 3.1 RawEventStore
- [x] Interface: record(entry), query(sessionId, options)
- [x] DrizzleRawStore（SQLite/MySQL）— 4 tests
- [x] FileRawStore — 7 tests
- [x] CompositeRawStore（multi-target）— 5 tests

#### 3.2 SessionStore
- [x] Interface: upsert, get, list, delete, rename, updateState
- [x] DrizzleSessionStore — 11 tests

#### 3.3 UsageTracker
- [x] Token/cost tracking per session
- [x] Aggregation queries
- [x] 14 tests

#### 3.4 SettingsStore
- [x] FileSettingsStore: getAll, get, set
- [x] File-based persistence（readFileSync per call）
- [x] 8 tests

### 4. Infrastructure — DONE

#### 4.1 DI Container (`container.ts`)
- [x] Inversify bindings: RunnerFactory, stores, ChatHandler
- [x] SQLite / MySQL / File storage selection

#### 4.2 HTTP Routes
- [x] GET /health — status check
- [x] POST /sessions — session list/management（9 tests）
- [x] GET/POST /usage — usage metrics（3 tests）
- [x] GET /profile — auth status（3 tests）

#### 4.3 Config (`config.ts`)
- [x] Environment-based configuration
- [x] 4 tests

### 5. Helpers Module — DONE

- [x] 5.0 execGit — async git command execution
- [x] 5.0a runPluginCommand / runPluginCommandAsync — plugin CLI
- [x] 5.0b rgAvailable / rgListFiles — ripgrep file search
- [x] 5.0c File handler: file:read, list_files_request, terminal:get_contents, terminal:open_claude

### 6. Server Infrastructure — DONE

- [x] 6.1 Express + Socket.IO bootstrap（helmet, cors）
- [x] 6.2 /health endpoint
- [x] 6.3 SPA fallback routing
- [x] 6.4 Graceful shutdown（SIGTERM/SIGINT, 10s timeout）
- [x] 6.5 Config: port, databaseUrl, rawStore drivers, systemPrompt
- [x] 6.6 Database: Drizzle ORM, SQLite + MySQL dual support
- [x] 6.7 Migration scripts

### 7. Integration Tests — DONE

- [x] 5.1 adapter-integration — 完整 CLI→Server→Client flow（14 tests）
- [x] 5.2 named-event-integration — event 命名一致性（8 tests）
- [x] 5.3 clean-relay-protocol — protocol 轉發驗證（13 tests）
- [x] 5.4 schema-consistency — shared schema 與 handler 一致性（4 tests）
