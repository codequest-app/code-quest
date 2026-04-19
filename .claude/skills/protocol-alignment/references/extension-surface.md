# Extension Protocol Surface — v2.1.45

Extracted from: `/Users/user/Desktop/anthropic.claude-code-2.1.45-darwin-arm64/src/core/main.js`
Last updated: 2026-03-17

## 1. Event Types (CLI stdout → readMessages loop)

Search: `readMessages` method, event type switch/if-chain.

| Event Type | Handling | Notes |
|---|---|---|
| `control_response` | Route to pendingControlResponses by request_id | |
| `control_request` | Call processControlRequest() | |
| `control_cancel_request` | Call handleControlCancelRequest() | |
| `keep_alive` | Drop (continue) | |
| `streamlined_text` | Drop (continue) | Fast mode |
| `streamlined_tool_use_summary` | Drop (continue) | Fast mode |
| `result` | Enqueue + extract error text | Checks is_error, subtype |
| All others | Enqueue to inputStream | system, assistant, user, etc. |

## 2. Control Request Subtypes — Received from CLI

Search: `processControlRequest` method. These are control_requests the CLI sends, and the extension must respond to.

| Subtype | Handler | Notes |
|---|---|---|
| `can_use_tool` | canUseTool callback | Permission prompt |
| `hook_callback` | hookCallbacks.get(callback_id) | Execute registered hook |
| `mcp_message` | MCP transport routing | Distinguishes request (has id) vs notification (no id) |
| `elicitation` | onElicitation callback | Default: `{ action: "decline" }` |
| (unknown) | throw Error | Unsupported subtype |

## 3. Control Request Subtypes — Sent to CLI

Search: `this.request({` calls with `subtype:`. These are control_requests the extension initiates. All wait for control_response.

### Core Session Control

| Subtype | Parameters | Notes |
|---|---|---|
| `initialize` | hooks, sdkMcpServers, jsonSchema, systemPrompt, appendSystemPrompt, agents, promptSuggestions, agentProgressSummaries | Handshake |
| `interrupt` | (none) | Stop current operation |
| `set_permission_mode` | mode | |
| `set_model` | model | |
| `set_max_thinking_tokens` | max_thinking_tokens | |
| `apply_flag_settings` | settings | Generic flag object |
| `get_settings` | (none) | |

### Session Operations

| Subtype | Parameters | Notes |
|---|---|---|
| `rewind_files` | user_message_id, dry_run | |
| `cancel_async_message` | message_uuid | Cancel background message |
| `stop_task` | task_id | Stop subagent task |
| `generate_session_title` | description, persist | |

### Mode Control

| Subtype | Parameters | Notes |
|---|---|---|
| `remote_control` | enabled | Toggle remote control |
| `set_proactive` | enabled | Toggle proactive suggestions |

### MCP Management

| Subtype | Parameters | Notes |
|---|---|---|
| `mcp_reconnect` | serverName | |
| `mcp_toggle` | serverName, enabled | |
| `mcp_authenticate` | serverName | |
| `mcp_clear_auth` | serverName | |
| `mcp_oauth_callback_url` | serverName, callbackUrl | |
| `mcp_status` | (none) | |
| `mcp_set_servers` | servers (Record) | |
| `mcp_message` | server_name, message | JSON-RPC to MCP server |

## 4. System Event Subtypes

| Subtype | Handling | Notes |
|---|---|---|
| `compact_boundary` | Explicit check before enqueuing | Search: `compact_boundary` |
| `bridge_state` | Updates remoteControlState | Search: `bridge_state` |
| Others | passthrough | init, status, hook_started, etc. — all pass to inputStream |

## 5. CLI Args (spawn)

Search: CLI arg building logic (look for `--output-format` or arg array construction). Extension builds these args when spawning CLI:

### Always included
- `--output-format stream-json`
- `--input-format stream-json`
- `--verbose`
- `--permission-prompt-tool stdio`
- `--include-partial-messages`

### Conditional
- `--thinking` (adaptive/disabled/max-thinking-tokens)
- `--effort`, `--max-turns`, `--max-budget-usd`
- `--model`, `--fallback-model`, `--agent`
- `--betas`, `--json-schema`, `--debug`, `--debug-file`, `--debug-to-stderr`
- `--proactive`, `--assistant`
- `--allowedTools`, `--disallowedTools`, `--tools`
- `--mcp-config`, `--setting-sources`, `--strict-mcp-config`
- `--continue`, `--fork-session`, `--resume-session-at`, `--session-id`
- `--no-session-persistence`, `--plugin-dir`, `--add-dir`
- Generic `--key value` pairs from options.settings
