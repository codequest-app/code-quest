# Protocol Alignment: Real Data vs Protocol Doc vs Implementation

> **Ground truth priority**: Real DB/fixtures > Protocol doc > Implementation
>
> Protocol doc is based on VS Code extension v2.1.45; real data is from Claude CLI v2.1.63.
> When they disagree, real data wins.

---

## 1. stdin — User Input (Extension → CLI)

| | Real DB data | Protocol doc (§1.3) | Our code (`session.ts`) | Status |
|---|---|---|---|---|
| Format | `{ type: "user", message: { role, content } }` | `{ type: "user", role: "user", content: [...] }` | `{ type: "user", message: { role, content } }` | **Protocol doc outdated** — code matches real data |

---

## 2. stdin — Control Request Fields (Extension → CLI)

Comparing `request` payload fields sent to CLI.

### a) initialize

| | Real DB | Protocol (§1.2.a) | Our code | Status |
|---|---|---|---|---|
| Fields | `{ subtype: "initialize" }` (bare) | `{ subtype, hooks, sdkMcpServers, jsonSchema, systemPrompt, appendSystemPrompt, agents, promptSuggestions }` | `{ subtype, ...InitializeOptions }` | OK — all fields optional; we send what's needed |

### b–d) interrupt, set_permission_mode, set_model

All match across three sources. No issues.

### e) set_max_thinking_tokens

| | Real DB | Protocol (§1.2.e) | Our code | Status |
|---|---|---|---|---|
| Field name | **`tokens`** | `max_thinking_tokens` | **`tokens`** | **Protocol doc outdated** — code matches real data |

### f) rewind_files

All match. Our code also sends optional `file_paths` — harmless extension.

### g) stop_task

All match (`task_id`).

### h) mcp_reconnect

| | Real DB | Protocol (§1.2.h) | Our code | Status |
|---|---|---|---|---|
| Field name | (no real data) | **`serverName`** (camelCase) | **`server_name`** (snake_case) | **Unknown** — no real DB data to confirm; **needs live test** |

### i) mcp_toggle

| | Real DB | Protocol (§1.2.i) | Our code | Status |
|---|---|---|---|---|
| Field name | (no real data) | **`serverName`** (camelCase) | **`server_name`** (snake_case) | **Unknown** — no real DB data to confirm; **needs live test** |

### j) mcp_status

All match (no extra fields).

### k) mcp_set_servers

All match (`servers`).

### n) mcp_message

| | Real DB | Protocol (§1.2.n) | Our code | Status |
|---|---|---|---|---|
| Field name | (no real data) | `server_name` (snake_case) | `server_name` (snake_case) | Match — but note protocol uses snake here while camel for h/i/q/r |

### p) remote_control

All match (`enabled`).

### q) mcp_authenticate

| | Real DB | Protocol (§1.2.q) | Our code | Status |
|---|---|---|---|---|
| Field name | (no real data) | **`serverName`** (camelCase) | **`server_name`** (snake_case) | **Unknown** — needs live test |

### r) mcp_clear_auth

| | Real DB | Protocol (§1.2.r) | Our code | Status |
|---|---|---|---|---|
| Field name | (no real data) | **`serverName`** (camelCase) | **`server_name`** (snake_case) | **Unknown** — needs live test |

### set_effort → apply_flag_settings

| | Real DB | Real VS Code Extension | Our code | Status |
|---|---|---|---|---|
| `set_effort` 獨立 subtype | CLI 回 `"Unsupported control request subtype: set_effort"` | 不存在 | `session.setEffort()` 已改用 `apply_flag_settings` | **Session 方法正確** |
| 正確做法 | (DB 無成功紀錄) | `apply_flag_settings` + `{ settings: { effortLevel } }` | `sendControlRequest('apply_flag_settings', { settings: { effortLevel } })` | **匹配** |

**VS Code extension effort 切換流程：**
1. WebView 點擊 effort bars → 循環 low/medium/high/max
2. WebView 送 `apply_settings { settings: { effortLevel: "high" } }`
3. Extension 寫入 `~/.claude/settings.json` + 送 CLI `apply_flag_settings`
4. `apply_flag_settings` 是通用設定管道，不只 effort，任意 settings 欄位都走這條

**待確認：** `apply_flag_settings` socket handler（chat-handler.ts:1182）只存 settingsStore，未轉發給 CLI。`custom:set_effort` handler 透過 `session.setEffort()` 有轉發。

### Subtypes we don't implement

| Subtype | Protocol section | Description | Notes |
|---|---|---|---|
| `apply_flag_settings` | §1.2.o | Apply experiment flag settings to CLI | chat-handler stores in settingsStore only, doesn't forward to CLI |
| `get_settings` | §1.2.s | Query CLI current settings | Not implemented |
| `set_proactive` | §1.2.t | Toggle proactive suggestions | Not implemented |
| `mcp_oauth_callback_url` | §1.2.u | MCP OAuth callback URL | chat-handler uses `mcpMessage` workaround instead of native subtype |

---

## 3. stdout — Top-Level Event Types

| Type | Real DB (27,486 events) | Protocol (§2.3) | KNOWN_TYPES | Status |
|---|:-:|:-:|:-:|---|
| `stream_event` | 25,000 | Listed | Yes | OK |
| `assistant` | 939 | Listed | Yes | OK |
| `user` | 745 | Listed | Yes | OK |
| `system` | 254 | Listed | Yes | OK |
| `control_response` | 129 | Listed | Yes | OK |
| `result` | 126 | Listed | Yes | OK |
| `control_request` | 112 | Listed | Yes | OK |
| `rate_limit_event` | 87 | **Not listed** | Yes | **Protocol doc missing** |
| `control_cancel_request` | 7 | Listed | Yes | OK |
| `streamlined_text` | 0 | Listed (ignored) | Yes | OK — fast mode only |
| `streamlined_tool_use_summary` | 0 | Listed (ignored) | Yes | OK — fast mode only |
| `experiment_gates` | 0 | **Not listed** | Yes | OK — rare |
| `available_models` | 0 | **Not listed** | Yes | OK — rare |
| `keep_alive` | (filtered) | Listed (ignored) | Filtered | OK |
| `tool_use` | **0** | Listed | **No** | **Protocol doc wrong** — never appears as top-level type in real CLI output |
| `error` | **0** | Listed | **No** | **Protocol doc wrong** — never appears as top-level type in real CLI output |

---

## 4. stdout — system subtypes

| Subtype | Real DB | Protocol (§2.3) | ChatStreamEvent | Status |
|---|:-:|:-:|:-:|---|
| `init` | 145 | Listed | Yes (named variant) | OK |
| `hook_started` | 39 | **Not listed** | Yes (named variant) | **Protocol doc missing** |
| `hook_response` | 39 | **Not listed** | Yes (named variant) | **Protocol doc missing** |
| `task_started` | 26 | **Not listed** | Yes (named variant) | **Protocol doc missing** |
| `status` | 4 | Listed | Yes (named variant) | OK |
| `bridge_state` | 1 | **Not listed** | No (falls to catch-all) | **New** — caught by `subtype: string` catch-all variant |
| `compact_boundary` | 0 | Listed | Yes (named variant) | OK — rare |

---

## 5. stdout — Real Field Inventory

Extracted from real fixtures. These are the actual fields each event type carries.

### system (init)

```
type, subtype, cwd, session_id, tools, mcp_servers, model, permissionMode,
slash_commands, apiKeySource, claude_code_version, output_style,
agents, skills, plugins, uuid, fast_mode_state
```

Note: `current_repo` (in ChatStreamEvent type) — not seen in real data but defined in type.

### system (status)

```
type, subtype, status, permissionMode, uuid, session_id
```

### system (hook_started)

```
type, subtype, hook_id, hook_name, hook_event, uuid, session_id
```

### system (hook_response)

```
type, subtype, hook_id, hook_name, hook_event, output, stdout, stderr,
exit_code, outcome, uuid, session_id
```

Note: `hook_event_name` and `additional_context` — in ChatStreamEvent type but real fixture has them **nested inside `output` JSON string**, not at top level. `output` is a JSON-encoded string containing `additional_context` and `hookSpecificOutput`.

### system (task_started)

```
type, subtype, task_id, tool_use_id, description, task_type, uuid, session_id
```

### system (bridge_state)

```
type, subtype, state, uuid, session_id
```

New subtype not in our named variants — falls to catch-all `{ type: 'system'; subtype: string }`.

### assistant

```
type, message: { model, id, type, role, content[], stop_reason, stop_sequence, usage, context_management },
parent_tool_use_id, session_id, uuid
```

### user

```
type, message: { role, content[] }, parent_tool_use_id, session_id, uuid, tool_use_result
```

`tool_use_result` can be a string or an object `{ type, file: { filePath, content, numLines, startLine, totalLines } }`.

### result

```
type, subtype, is_error, duration_ms, duration_api_ms, num_turns, result, stop_reason,
session_id, total_cost_usd, usage, modelUsage, permission_denials, fast_mode_state, uuid
```

Real subtypes seen: `success`, `error_during_execution`.

### control_request (from CLI)

```
type, request_id, request: { subtype, tool_name, input, permission_suggestions,
decision_reason, tool_use_id, agent_id }
```

Real subtypes: `can_use_tool` (for Read, Bash, AskUserQuestion, ExitPlanMode, etc.)

### control_response (from CLI)

```
type, response: { subtype, request_id, response?, error? }
```

### control_cancel_request

```
type, request_id
```

### rate_limit_event

```
type, rate_limit_info: { status, resetsAt, rateLimitType, overageStatus,
overageDisabledReason, isUsingOverage }, uuid, session_id
```

Note: Real data has `overageDisabledReason` — not in our ChatStreamEvent type but caught by `[key: string]: unknown`.

### stream_event

```
type, event: { type, index?, delta?, content_block?, message?, usage?, context_management? },
session_id, parent_tool_use_id, uuid
```

---

## 6. Action Items

### Needs live test (no real DB data to verify)

These 4 MCP methods use `server_name` (snake_case) in our code, but protocol doc says `serverName` (camelCase). Since `mcp_message` uses `server_name` in protocol, there's inconsistency in the doc itself. Need to test with a real MCP server to determine which the CLI actually accepts.

| Method | Our code | Protocol doc |
|---|---|---|
| `mcpReconnect` | `server_name` | `serverName` |
| `mcpToggle` | `server_name` | `serverName` |
| `mcpAuthenticate` | `server_name` | `serverName` |
| `mcpClearAuth` | `server_name` | `serverName` |

### Protocol doc corrections needed

| Item | Current doc | Real data |
|---|---|---|
| §1.3 User input | `{ type, role, content }` | `{ type, message: { role, content } }` |
| §1.2.e set_max_thinking_tokens field | `max_thinking_tokens` | `tokens` |
| §2.3 Missing types | — | `rate_limit_event`, `experiment_gates`, `available_models` |
| §2.3 system subtypes | init, status, compact_boundary | + `hook_started`, `hook_response`, `task_started`, `bridge_state` |
| §2.3 `tool_use` top-level type | Listed | Never appears in real output |
| §2.3 `error` top-level type | Listed | Never appears in real output |
| §1.2 Missing subtype | — | effort 走 `apply_flag_settings`，非獨立 subtype |

### Implementation OK (confirmed by real data)

| Item | Concern | Verdict |
|---|---|---|
| `sendMessage` format | `{ type, message }` vs flat | Our code correct (`{ type, message }`) |
| `setMaxThinkingTokens` field | `tokens` vs `max_thinking_tokens` | Our code correct (`tokens`) |
| `setEffort` | `set_effort` subtype 不存在 | 已改用 `apply_flag_settings` + `{ settings: { effortLevel } }` — 匹配 VS Code extension 做法 |
| KNOWN_TYPES missing `tool_use`, `error` | Protocol lists them | They never appear — **not needed** |
