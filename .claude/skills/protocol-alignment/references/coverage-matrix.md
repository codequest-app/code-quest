# Protocol Coverage Matrix

Last updated: 2026-03-17
Extension version: 2.1.45

Legend:
- ✅ Implemented (all layers complete)
- ⚠️ Partial (some layers missing or behavior differs)
- ❌ Missing
- ➖ N/A (not needed for cc-office architecture)

## 1. Event Types (CLI → Server)

| Event Type | Schema | Converter | ClientEvent | Notes |
|---|---|---|---|---|
| `control_response` | ✅ | ✅ null (handled by ProcessRunner) | ➖ | Route to pending handlers |
| `control_request` | ✅ | ✅ | ✅ | Dispatch by subtype |
| `control_cancel_request` | ✅ | ✅ | ✅ control_cancel | |
| `keep_alive` | ✅ | ✅ null | ➖ | Silently skipped |
| `streamlined_text` | ✅ | ✅ | ✅ | Extension drops these; cc-office preserves (intentional) |
| `streamlined_tool_use_summary` | ✅ | ✅ | ✅ | Same as above |
| `result` | ✅ | ✅ | ✅ session_result | |
| `system` | ✅ | ✅ | ✅ | Dispatched by subtype |
| `assistant` | ✅ | ✅ | ✅ message | |
| `user` | ✅ | ✅ | ✅ message | |
| `stream_event` | ✅ | ✅ | ✅ stream_chunk | |
| `rate_limit_event` | ✅ | ✅ | ✅ rate_limit | |
| `tool_use` | ✅ | ✅ | ✅ raw_event (fallback) | |
| `notification` | ✅ | ✅ | ✅ notification | |
| `new_session_notification` | ✅ | ✅ | ✅ raw_event (fallback) | |
| `error` | ✅ | ✅ | ✅ error | |
| `auth_url` | ✅ | ✅ | ✅ auth_url | |
| `auth_status` | ✅ | ✅ | ✅ raw_event (fallback) | |
| `experiment_gates` | ✅ | ✅ | ✅ experiment_gates | |
| `available_models` | ✅ | ✅ | ✅ available_models | |

## 2. System Event Subtypes

| Subtype | Schema | Converter | ClientEvent | Notes |
|---|---|---|---|---|
| `init` | ✅ | ✅ | ✅ session_init | |
| `status` | ✅ | ✅ | ✅ session_status | |
| `hook_started` | ✅ | ✅ | ✅ | |
| `hook_response` | ✅ | ✅ | ✅ | |
| `compact_boundary` | ✅ | ✅ | ✅ | |
| `task_started` | ✅ | ✅ | ✅ task_started | |
| `task_notification` | ✅ | ✅ | ✅ task_notification | |
| `task_progress` | ✅ | ✅ | ✅ task_progress | |
| `bridge_state` | ✅ | ✅ | ✅ remote_control_state | |

## 3. Control Request Subtypes — Received from CLI

| Subtype | Converter | ClientEvent | Extension Behavior | Gap |
|---|---|---|---|---|
| `can_use_tool` | ✅ | permission_request | Callback | ✅ Aligned |
| `hook_callback` | ✅ | hook_callback_request | Execute hook callback | ✅ Aligned |
| `mcp_message` | ✅ | mcp_message_request / pending_action (notif) | Route: request (id) vs notification (!id) | ✅ Aligned |
| `elicitation` | ✅ | elicitation_request | Callback | ✅ Aligned |
| `open_diff` | ✅ | pending_action (open_diff) | Not handled (throws) | cc-office extra |
| `open_url` | ✅ | pending_action (open_url) | Not in processControlRequest | cc-office extra |
| `open_file` | ✅ | pending_action (open_file) | Not in processControlRequest | cc-office extra |
| `get_settings` | ✅ | pending_action (get_settings) | Not received (extension sends this) | Architecture difference |
| `set_permission_mode` | ✅ | pending_action | Not received (extension sends this) | Architecture difference |
| `set_model` | ✅ | pending_action | Not received (extension sends this) | Architecture difference |
| `initialize` | ✅ | pending_action | Not received (extension sends this) | Architecture difference |

## 4. Control Request Subtypes — Sent to CLI

### Core Session Control

| Subtype | ChatHandler | Schema | Notes |
|---|---|---|---|
| `initialize` | ✅ | ✅ | |
| `interrupt` | ✅ | ✅ | |
| `set_permission_mode` | ✅ | ✅ | |
| `set_model` | ✅ | ✅ | |
| `set_max_thinking_tokens` | ✅ | ✅ | |
| `apply_flag_settings` | ✅ | ✅ | |
| `get_settings` | ✅ | ✅ | Auto-responded in relay |

### Session Operations

| Subtype | ChatHandler | Schema | Notes |
|---|---|---|---|
| `rewind_files` | ✅ | ✅ | |
| `stop_task` | ✅ | ✅ | |
| `cancel_async_message` | ✅ | ✅ | |
| `generate_session_title` | ✅ | ✅ | |

### Mode Control

| Subtype | ChatHandler | Schema | Notes |
|---|---|---|---|
| `remote_control` | ✅ | ✅ | |
| `set_proactive` | ✅ | ✅ | |

### MCP Management

| Subtype | ChatHandler | Schema | Notes |
|---|---|---|---|
| `mcp_reconnect` | ✅ | ✅ | |
| `mcp_toggle` | ✅ | ✅ | |
| `mcp_authenticate` | ✅ | ✅ | |
| `mcp_clear_auth` | ✅ | ✅ | |
| `mcp_oauth_callback_url` | ✅ | ✅ | |
| `mcp_status` | ✅ | ✅ | |
| `mcp_set_servers` | ✅ | ✅ | |
| `mcp_message` | ✅ | ✅ | |

## 5. CLI Args

| Arg | cc-office | Extension | Notes |
|---|---|---|---|
| `--output-format stream-json` | ✅ | ✅ | |
| `--input-format stream-json` | ✅ | ✅ | |
| `--verbose` | ✅ | ✅ | |
| `--permission-prompt-tool stdio` | ✅ | ✅ | |
| `--include-partial-messages` | ✅ | ✅ | |
| `--allow-dangerously-skip-permissions` | ✅ | ❌ | cc-office extra |
| `--resume` | ✅ | ✅ | |
| `--thinking` | ✅ | ✅ | |
| `--effort` | ✅ | ✅ | |
| `--max-turns` | ✅ | ✅ | |
| `--max-budget-usd` | ✅ | ✅ | |
| `--model` | ✅ | ✅ | |
| `--fallback-model` | ✅ | ✅ | |
| `--agent` | ✅ | ✅ | |
| `--allowedTools` | ✅ | ✅ | |
| `--disallowedTools` | ✅ | ✅ | |
| `--tools` | ✅ | ✅ | |
| `--mcp-config` | ✅ | ✅ | |
| `--continue` | ✅ | ✅ | |
| `--fork-session` | ✅ | ✅ | |
| `--proactive` | ✅ | ✅ | |
| `--json-schema` | ✅ | ✅ | |
| `--betas` | ✅ | ✅ | |
| `--debug` | ✅ | ✅ | |
| `--debug-file` | ✅ | ✅ | |
| `--debug-to-stderr` | ✅ | ✅ | |
| `--session-id` | ✅ | ✅ | |
| `--resume-session-at` | ✅ | ✅ | |
| `--no-session-persistence` | ✅ | ✅ | |
| `--max-thinking-tokens` | ✅ | ✅ | thinking number → this flag |
| `--assistant` | ✅ | ✅ | |
| `--setting-sources` | ✅ | ✅ | |
| `--strict-mcp-config` | ✅ | ✅ | |
| `--permission-mode` | ✅ | ✅ | |
| `--add-dir` | ✅ | ✅ | repeatable |
| `--plugin-dir` | ✅ | ✅ | repeatable |

## Summary

### Gaps Requiring Changes

| # | Gap | Direction | Priority | Status |
|---|---|---|---|---|
| 1 | `hook_callback` forwarding | CLI→Server | Medium | ✅ Done — forwarded to client |
| 2 | `mcp_message` req/notif distinction | CLI→Server | Medium | ✅ Done — check message.id |
| 3 | `cancel_async_message` | Server→CLI | Low | ✅ Done |
| 4 | `remote_control` + `bridge_state` | Server→CLI + CLI→Server | Low | ✅ Done |
| 5 | `set_proactive` | Server→CLI | Low | ✅ Done |
| 6 | `generate_session_title` | Server→CLI | Low | ✅ Done |
| 7 | `keep_alive` silent skip | CLI→Server | Trivial | ✅ Done |
| 8 | CLI args expansion | Spawn | Medium | ✅ Done — LaunchOptions + buildArgs |
