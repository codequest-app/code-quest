## Context

目前 119 個 socket events 有 4 種命名風格：

**已用 `namespace:action`（55 個，不需要改）：**
- `session:*`（launch, close, join, init, status, created, closed, dead, states, raw_events）
- `chat:*`（send, cancel, respond, stop_task, set_fast_mode）
- `message:*`（assistant, user, result）
- `stream:*`（chunk, end, text, tool_summary, block_start）
- `control:*`（permission, elicitation, diff_review, mcp, cancel, hook_callback）
- `system:*`（hook_started, hook_response, task_started, task_progress, task_notification, compact_boundary, rate_limit, api_retry, file_updated, experiment_gates, available_models, remote_control）
- `notification:*`（toast, show, auth_url, auth_status）
- `action:*`（open_url, open_file）
- `state:*`（update, usage）
- `git:*`（log, diff）
- `file:*`（read）
- `terminal:*`（get_contents, open_claude）
- `error:*`（message）
- `raw:*`（event）

**Bare events（64 個，需要遷移）：**

| 現在 | 建議 namespace | 新名稱 |
|---|---|---|
| `init` | `app:` | `app:init` |
| `get_provider_config` | `app:` | `app:get_provider_config` |
| `login` | `auth:` | `auth:login` |
| `submit_oauth_code` | `auth:` | `auth:submit_oauth_code` |
| `get_auth_status` | `auth:` | `auth:get_status` |
| `set_model` | `settings:` | `settings:set_model` |
| `set_permission_mode` | `settings:` | `settings:set_permission_mode` |
| `set_thinking_level` | `settings:` | `settings:set_thinking_level` |
| `apply_settings` | `settings:` | `settings:apply` |
| `get_claude_state` | `settings:` | `settings:get_state` |
| `request_usage_update` | `settings:` | `settings:request_usage_update` |
| `set_proactive` | `settings:` | `settings:set_proactive` |
| `set_remote_control` | `settings:` | `settings:set_remote_control` |
| `generate_session_title` | `session:` | `session:generate_title` |
| `list_sessions_request` | `session:` | `session:list` |
| `list_remote_sessions` | `session:` | `session:list_remote` |
| `get_session_request` | `session:` | `session:get` |
| `delete_session` | `session:` | `session:delete` |
| `rename_session` | `session:` | `session:rename` |
| `fork_conversation` | `session:` | `session:fork` |
| `teleport_session` | `session:` | `session:teleport` |
| `update_session_state` | `session:` | `session:update_state` |
| `cancel_async_message` | `chat:` | `chat:cancel_async` |
| `hook_callback_respond` | `chat:` | `chat:hook_callback_respond` |
| `cancel_request` | `chat:` | `chat:cancel_request`（C→S） |
| `rewind_code` | `chat:` | `chat:rewind_code` |
| `get_mcp_servers` | `mcp:` | `mcp:get_servers` |
| `set_mcp_server_enabled` | `mcp:` | `mcp:set_enabled` |
| `reconnect_mcp_server` | `mcp:` | `mcp:reconnect` |
| `mcp_set_servers` | `mcp:` | `mcp:set_servers` |
| `mcp_message` | `mcp:` | `mcp:message` |
| `authenticate_mcp_server` | `mcp:` | `mcp:authenticate` |
| `clear_mcp_server_auth` | `mcp:` | `mcp:clear_auth` |
| `submit_mcp_oauth_callback_url` | `mcp:` | `mcp:oauth_callback` |
| `ensure_chrome_mcp_enabled` | `mcp:` | `mcp:ensure_chrome` |
| `disable_chrome_mcp` | `mcp:` | `mcp:disable_chrome` |
| `enable_jupyter_mcp` | `mcp:` | `mcp:enable_jupyter` |
| `disable_jupyter_mcp` | `mcp:` | `mcp:disable_jupyter` |
| `ask_debugger_help` | `mcp:` | `mcp:ask_debugger` |
| `list_files_request` | `file:` | `file:list` |
| `checkout_branch` | `git:` | `git:checkout` |
| `check_git_status` | `git:` | `git:status` |
| `update_skipped_branch` | `git:` | `git:update_skipped_branch` |
| `exec` | `git:` | `git:exec` |
| `install_plugin` | `plugin:` | `plugin:install` |
| `uninstall_plugin` | `plugin:` | `plugin:uninstall` |
| `set_plugin_enabled` | `plugin:` | `plugin:set_enabled` |
| `list_plugins` | `plugin:` | `plugin:list` |
| `list_marketplaces` | `plugin:` | `plugin:list_marketplaces` |
| `add_marketplace` | `plugin:` | `plugin:add_marketplace` |
| `remove_marketplace` | `plugin:` | `plugin:remove_marketplace` |
| `refresh_marketplace` | `plugin:` | `plugin:refresh_marketplace` |
| `comment` | `plan:` | `plan:comment` |
| `get_plan_comments` | `plan:` | `plan:get_comments` |
| `remove_plan_comment` | `plan:` | `plan:remove_comment` |
| `close_plan_preview` | `plan:` | `plan:close_preview` |
| `start_speech_to_text` | `speech:` | `speech:start` |
| `stop_speech_to_text` | `speech:` | `speech:stop` |
| S→C: `close_channel` | `session:` | 保留（S→C legacy） |
| S→C: `file_updated` | `system:` | 保留（S→C legacy） |
| S→C: `plan_comment` | `plan:` | 保留（S→C legacy） |
| S→C: `removeComment` | `plan:` | 保留（S→C legacy, camelCase 特例） |
| S→C: `speech_to_text_message` | `speech:` | 保留（S→C legacy） |
| S→C: `cancel_request`（S→C） | `chat:` | 保留（S→C legacy） |

## Goals / Non-Goals

**Goals:**
- 所有 C→S events 統一 `namespace:action` 格式
- Namespace 分組清晰（app, auth, settings, session, chat, mcp, file, git, plugin, plan, speech, terminal）
- `get_provider_config` → `app:get_provider_config`

**Non-Goals:**
- 不改 S→C events（由 adapter/server push，改名影響太大）
- 不改 S→C 的已有 namespace events（`message:*`、`stream:*`、`control:*`、`system:*` 等）
- 不做一步到位 — 分 batch 按 namespace 遷移

## Decisions

### 1. 只改 C→S bare events
S→C events 大部分已有 namespace，少數 bare 的（`close_channel`、`file_updated`）是 extension protocol 對齊的，不改。

### 2. 向下相容策略
Server handler 同時 listen 新舊 event name，過渡期後移除舊的。不需要 client 版本判斷。

### 3. 分 batch 按 handler file 遷移
每個 handler file 獨立一個 batch，降低 PR 大小。

## Risks / Trade-offs

### Risk: 測試大量修改
每個 event rename 要改 server handler + client emit + tests。用 find-and-replace 降低風險。

### Risk: Extension protocol 不對齊
Extension 用的是 bare event names。但 extension protocol 是 S→C（adapter 轉換），C→S 是我們自己定義的，不受 extension 約束。
