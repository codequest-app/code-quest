# Protocol Coverage Matrix — Extension 2.1.45 vs cc-office

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
| `system` (post_turn_summary) | ✅ skip | — | — | ❌ Missing |
| `system` (session_state_changed) | ✅ special | — | — | ❌ Missing |
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

## Stream Delta Types (within content_block_delta)

| Delta Type | Extension | Adapter | Status |
|---|---|---|---|
| `text_delta` | ✅ | ✅ | ✅ |
| `thinking_delta` | ✅ | ✅ | ✅ |
| `input_json_delta` | ✅ | ✅ | ✅ |
| `citations_delta` | ✅ | ✅ | ✅ |
| `signature_delta` | ✅ | ✅ skip | ✅ |
| `compaction_delta` | ✅ | — | ❌ Missing |

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
| `get_context_usage` | ✅ | — | ❌ Missing |
| `seed_read_state` | ✅ | — | ❌ Missing |
| `side_question` | ✅ | — | ❌ Missing |
| `channel_enable` | ✅ | — | ❌ Missing |
| `claude_authenticate` | ✅ | — | ❌ Missing |
| `claude_oauth_callback` | ✅ | — | ❌ Missing |
| `claude_oauth_wait_for_completion` | ✅ | — | ❌ Missing |

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
| `--task-budget` | ✅ | — | ❌ Missing |
| `--channels` | ✅ | — | ❌ Missing |
| `--claude-in-chrome-mcp` | ✅ | — | ❌ Missing |

## Summary

| Category | Total | ✅ | ❌ | Coverage |
|---|---|---|---|---|
| Event Types | 30 | 28 | 2 | 93% |
| Stream Deltas | 6 | 5 | 1 | 83% |
| Control Received | 12 | 12 | 0 | 100% |
| Control Sent | 27 | 20 | 7 | 74% |
| CLI Flags | 39 | 36 | 3 | 92% |
| **Total** | **114** | **101** | **13** | **89%** |

## Missing Items (13)

### Should implement (有用):
1. `compaction_delta` — message compaction 壓縮提示
2. `get_context_usage` — context window 使用率查詢
3. `--task-budget` — task 預算控制

### Nice to have (不急):
4. `system` (post_turn_summary) — extension 也 skip
5. `system` (session_state_changed) — extension 特殊處理
6. `seed_read_state` — file mtime seeding
7. `side_question` — side question 功能
8. `channel_enable` — MCP channel 控制
9. `--channels` — MCP channels flag
10. `--claude-in-chrome-mcp` — Chrome MCP mode

### Auth specific (web 不需要):
11. `claude_authenticate` — Claude OAuth（web 有自己的 auth）
12. `claude_oauth_callback` — OAuth callback
13. `claude_oauth_wait_for_completion` — OAuth wait
