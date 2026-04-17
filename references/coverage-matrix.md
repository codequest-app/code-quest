# Protocol Coverage Matrix — Extension 2.1.111 vs cc-office

> Updated: 2026-04-17
> 所有 CLI 支援的功能 web 都能用（不存在「VS Code 專屬」）

## Event Types (CLI stdout → cc-office)

| Event Type | Extension | Schema | Adapter | Status |
|---|---|---|---|---|
| `system` (init) | ✅ | ✅ | ✅ | ✅ |
| `system` (status) | ✅ | ✅ | ✅ | ✅ |
| `system` (hook_started) | ✅ | ✅ | ✅ | ✅ |
| `system` (hook_response) | ✅ | ✅ | ✅ | ✅ |
| `system` (task_started) | ✅ | ✅ | ✅ | ✅ |
| `system` (task_notification) | ✅ | ✅ | ✅ | ✅ |
| `system` (task_progress) | ✅ | ✅ | ✅ | ✅ |
| `system` (compact_boundary) | ✅ | ✅ | ✅ | ✅ |
| `system` (bridge_state) | ✅ | — | ✅ | ✅ |
| `system` (post_turn_summary) | ✅ skip | ✅ | ✅ skip | ✅ |
| `system` (session_state_changed) | ✅ filter | ✅ | ✅ skip | ✅ |
| `system` (api_retry) | — | ✅ | ✅ → system:api_retry | ✅ |
| `assistant` | ✅ | ✅ | ✅ | ✅ |
| `user` | ✅ | ✅ | ✅ | ✅ |
| `result` | ✅ | ✅ | ✅ | ✅ |
| `control_request` | ✅ | ✅ | ✅ | ✅ |
| `control_response` | ✅ | ✅ | ✅ | ✅ |
| `control_cancel_request` | ✅ | ✅ | ✅ | ✅ |
| `stream_event` | ✅ | ✅ | ✅ | ✅ |
| `keep_alive` | ✅ skip | ✅ | ✅ skip | ✅ |
| `streamlined_text` | ✅ skip | ✅ | ✅ | ✅ |
| `streamlined_tool_use_summary` | ✅ skip | ✅ | ✅ | ✅ |
| `rate_limit_event` | — | ✅ | ✅ | ✅ |
| `experiment_gates` | — | ✅ | ✅ | ✅ |
| `available_models` | — | ✅ | ✅ | ✅ |
| `tool_use` | — | ✅ | ✅ | ✅ |
| `notification` | — | ✅ | ✅ | ✅ |
| `new_session_notification` | — | ✅ | ✅ | ✅ |
| `error` | — | ✅ | ✅ | ✅ |
| `auth_url` | — | ✅ | ✅ | ✅ |
| `auth_status` | — | ✅ | ✅ | ✅ |
| `system` (mirror_error) | ✅ | ✅ | ✅ | ✅ |

## Stream Delta Types

| Delta Type | Extension | Adapter | Status |
|---|---|---|---|
| `text_delta` | ✅ | ✅ | ✅ |
| `thinking_delta` | ✅ | ✅ | ✅ |
| `input_json_delta` | ✅ | ✅ | ✅ |
| `citations_delta` | ✅ | ✅ | ✅ |
| `signature_delta` | ✅ | ✅ skip | ✅ |
| `compaction_delta` | ✅ | ✅ skip | ✅ |

## Control Request Subtypes RECEIVED (CLI → cc-office)

| Subtype | Extension | Adapter | Status |
|---|---|---|---|
| `can_use_tool` | ✅ | ✅ | ✅ |
| `hook_callback` | ✅ | ✅ | ✅ |
| `mcp_message` | ✅ | ✅ | ✅ |
| `elicitation` | ✅ | ✅ | ✅ |
| `open_diff` | — | ✅ | ✅ |
| `open_url` | — | ✅ auto | ✅ |
| `open_file` | — | ✅ auto | ✅ |
| `show_notification` | — | ✅ auto | ✅ |
| `initialize` | — | ✅ passthrough | ✅ |
| `get_settings` | — | ✅ auto | ✅ |
| `set_model` | — | ✅ auto | ✅ |
| `set_permission_mode` | — | ✅ auto | ✅ |

## Control Request Subtypes SENT (cc-office → CLI)

| Subtype | Extension | cc-office | Status |
|---|---|---|---|
| `initialize` | ✅ | ✅ | ✅ |
| `interrupt` | ✅ | ✅ | ✅ |
| `set_permission_mode` | ✅ | ✅ | ✅ |
| `set_model` | ✅ | ✅ | ✅ |
| `set_max_thinking_tokens` | ✅ | ✅ | ✅ |
| `apply_flag_settings` | ✅ | ✅ | ✅ |
| `get_settings` | ✅ | ✅ | ✅ |
| `rewind_files` | ✅ | ✅ | ✅ |
| `cancel_async_message` | ✅ | ✅ | ✅ |
| `stop_task` | ✅ | ✅ | ✅ |
| `generate_session_title` | ✅ | ✅ | ✅ |
| `remote_control` | ✅ | ✅ | ✅ |
| `set_proactive` | ✅ | ✅ | ✅ |
| `mcp_reconnect` | ✅ | ✅ | ✅ |
| `mcp_toggle` | ✅ | ✅ | ✅ |
| `mcp_authenticate` | ✅ | ✅ | ✅ |
| `mcp_clear_auth` | ✅ | ✅ | ✅ |
| `mcp_oauth_callback_url` | ✅ | ✅ | ✅ |
| `mcp_status` | ✅ | ✅ | ✅ |
| `mcp_set_servers` | ✅ | ✅ | ✅ |
| `reload_plugins` | ✅ | ✅ | ✅ |
| `get_context_usage` | ✅ | ✅ fixture | ✅ |
| `seed_read_state` | ✅ | ✅ fixture | ✅ |
| `side_question` | ✅ | ✅ fixture | ✅ |
| `channel_enable` | ✅ | ✅ fixture | ✅ |
| `claude_authenticate` | ✅ | ✅ handler | ✅ |
| `claude_oauth_callback` | ✅ | ✅ handler | ✅ |
| `claude_oauth_wait_for_completion` | ✅ | ✅ handler | ✅ |
| `ultrareview_launch` | ✅ | ✅ | ✅ |

## CLI Spawn Flags

| Flag | Extension | cc-office | Status |
|---|---|---|---|
| `--output-format stream-json` | ✅ | ✅ | ✅ |
| `--input-format stream-json` | ✅ | ✅ | ✅ |
| `--verbose` | ✅ | ✅ | ✅ |
| `--permission-prompt-tool stdio` | ✅ | ✅ | ✅ |
| `--include-partial-messages` | ✅ | ✅ | ✅ |
| `--thinking` | ✅ | ✅ | ✅ |
| `--max-thinking-tokens` | ✅ | ✅ | ✅ |
| `--effort` | ✅ | ✅ | ✅ |
| `--max-turns` | ✅ | ✅ | ✅ |
| `--max-budget-usd` | ✅ | ✅ | ✅ |
| `--model` | ✅ | ✅ | ✅ |
| `--fallback-model` | ✅ | ✅ | ✅ |
| `--agent` | ✅ | ✅ | ✅ |
| `--betas` | ✅ | ✅ | ✅ |
| `--json-schema` | ✅ | ✅ | ✅ |
| `--debug` | ✅ | ✅ | ✅ |
| `--debug-file` | ✅ | ✅ | ✅ |
| `--debug-to-stderr` | ✅ | ✅ | ✅ |
| `--continue` | ✅ | ✅ | ✅ |
| `--resume` | ✅ | ✅ | ✅ |
| `--proactive` | ✅ | ✅ | ✅ |
| `--assistant` | ✅ | ✅ | ✅ |
| `--allowedTools` | ✅ | ✅ | ✅ |
| `--disallowedTools` | ✅ | ✅ | ✅ |
| `--tools` | ✅ | ✅ | ✅ |
| `--setting-sources` | ✅ | ✅ | ✅ |
| `--strict-mcp-config` | ✅ | ✅ | ✅ |
| `--permission-mode` | ✅ | ✅ | ✅ |
| `--allow-dangerously-skip-permissions` | ✅ | ✅ | ✅ |
| `--add-dir` | ✅ | ✅ | ✅ |
| `--plugin-dir` | ✅ | ✅ | ✅ |
| `--fork-session` | ✅ | ✅ | ✅ |
| `--resume-session-at` | ✅ | ✅ | ✅ |
| `--session-id` | ✅ | ✅ | ✅ |
| `--no-session-persistence` | ✅ | ✅ | ✅ |
| `--mcp-config` | ✅ | ✅ | ✅ |
| `--task-budget` | ✅ | ✅ | ✅ |
| `--channels` | ✅ | ✅ | ✅ |
| `--claude-in-chrome-mcp` | ✅ | ✅ | ✅ |

## Summary

| Category | Total | ✅ | Coverage |
|---|---|---|---|
| Event Types | 32 | 32 | **100%** |
| Stream Deltas | 6 | 6 | **100%** |
| Control Received | 12 | 12 | **100%** |
| Control Sent | 28 | 28 | **100%** |
| CLI Flags | 39 | 39 | **100%** |
| **Total** | **117** | **117** | **100%** |
