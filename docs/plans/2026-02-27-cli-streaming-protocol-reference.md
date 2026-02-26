# Claude Code CLI Streaming Protocol Reference

> Date: 2026-02-27
> Source: Real CLI output capture + POC fixtures analysis

## Overview

Claude Code CLI communicates via line-delimited JSON (NDJSON) over stdin/stdout. Launch flags:

```bash
claude --output-format stream-json --input-format stream-json --verbose
```

For one-shot mode (`-p`), `--verbose` is required with `--output-format stream-json`.

## Event Types

### 1. `system` — Session lifecycle

#### Subtype: `init`

Session initialization. Emitted once at startup.

```json
{
  "type": "system",
  "subtype": "init",
  "cwd": "/path/to/project",
  "session_id": "c1405928-e4f1-4fcb-9ef4-4080277bafa3",
  "tools": ["Task", "Bash", "Read", "Edit", "Write", "Glob", "Grep", ...],
  "mcp_servers": [
    {"name": "pixel-mcp", "status": "connected"},
    {"name": "pencil", "status": "failed"}
  ],
  "model": "claude-opus-4-6",
  "permissionMode": "default",
  "slash_commands": ["commit", "review", ...],
  "apiKeySource": "none",
  "claude_code_version": "2.1.59",
  "output_style": "default",
  "agents": ["general-purpose", "Explore", "Plan", ...],
  "skills": ["code-review", "project-overview", ...],
  "plugins": [
    {"name": "superpowers", "path": "/Users/.../.claude/plugins/cache/..."}
  ],
  "fast_mode_state": "off",
  "uuid": "...",
}
```

**MVP 需要的欄位**：`session_id`, `model`, `tools`
**可選用**：`mcp_servers`, `agents`, `skills`, `plugins`, `fast_mode_state`

#### Subtype: `hook_started`

Hook 開始執行。Parser 應**忽略**。

```json
{
  "type": "system",
  "subtype": "hook_started",
  "hook_id": "9172b08c-5302-4087-ade2-beab41d3bf01",
  "hook_name": "SessionStart:startup",
  "hook_event": "SessionStart",
  "uuid": "...",
  "session_id": "..."
}
```

#### Subtype: `hook_response`

Hook 執行完成，含 stdout/stderr/exit_code。Parser 應**忽略**。

```json
{
  "type": "system",
  "subtype": "hook_response",
  "hook_id": "9172b08c-...",
  "hook_name": "SessionStart:startup",
  "hook_event": "SessionStart",
  "output": "{\"additional_context\": \"...\"}",
  "stdout": "...",
  "stderr": "",
  "exit_code": 0,
  "outcome": "success",
  "uuid": "...",
  "session_id": "..."
}
```

### 2. `assistant` — AI response

Content blocks array with `text`, `thinking`, and `tool_use`:

```json
{
  "type": "assistant",
  "message": {
    "model": "claude-opus-4-6",
    "id": "msg_01LpJUZYGGSWjF99Y2guKvDo",
    "type": "message",
    "role": "assistant",
    "content": [
      {"type": "text", "text": "hello"},
      {"type": "thinking", "thinking": "Let me think..."},
      {"type": "tool_use", "id": "toolu_123", "name": "Read", "input": {"file_path": "/tmp/x"}}
    ],
    "stop_reason": null,
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 35551,
      "cache_read_input_tokens": 0,
      "output_tokens": 1,
      "service_tier": "standard",
      "cache_creation": {
        "ephemeral_5m_input_tokens": 0,
        "ephemeral_1h_input_tokens": 35551
      }
    }
  },
  "parent_tool_use_id": null,
  "session_id": "...",
  "uuid": "..."
}
```

### 3. `user` — Echo-back

CLI echoes user messages back. Parser 應**忽略**。

### 4. `result` — Turn complete

```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 3449,
  "duration_api_ms": 2790,
  "num_turns": 1,
  "result": "hello",
  "stop_reason": null,
  "session_id": "...",
  "total_cost_usd": 0.22230875,
  "usage": {
    "input_tokens": 3,
    "cache_creation_input_tokens": 35551,
    "cache_read_input_tokens": 0,
    "output_tokens": 4,
    "server_tool_use": {"web_search_requests": 0, "web_fetch_requests": 0},
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 35551,
      "ephemeral_5m_input_tokens": 0
    },
    "speed": "standard"
  },
  "modelUsage": {
    "claude-opus-4-6": {
      "inputTokens": 3,
      "outputTokens": 4,
      "cacheReadInputTokens": 0,
      "cacheCreationInputTokens": 35551,
      "webSearchRequests": 0,
      "costUSD": 0.22230875,
      "contextWindow": 200000,
      "maxOutputTokens": 32000
    }
  },
  "permission_denials": [],
  "uuid": "..."
}
```

**MVP ChatStats 映射**：
- `costUsd` ← `total_cost_usd`
- `durationMs` ← `duration_ms`
- `inputTokens` ← `usage.input_tokens`
- `outputTokens` ← `usage.output_tokens`

**可選用**：`modelUsage`（多模型統計）、`permission_denials`、`speed`

### 5. `control_response` — Control protocol response

```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "initialize-001",
    "response": { "session_id": "..." }
  }
}
```

### 6. `control_request` — CLI requests permission

```json
{
  "type": "control_request",
  "request": {
    "subtype": "can_use_tool",
    "request_id": "...",
    "tool_name": "Bash",
    "input": {"command": "rm -rf /"},
    "callback_id": "...",
    "tool_use_id": "..."
  }
}
```

### 7. Ignored types

| Type | 說明 |
|------|------|
| `keep_alive` | 心跳 |
| `rate_limit_event` | 速率限制警告（含 `utilization`, `surpassedThreshold`）|
| `streamlined_text` | 簡化文字（重複） |
| `streamlined_tool_use_summary` | 簡化工具摘要（重複） |
| `system` subtype `hook_started` | Hook 生命週期 |
| `system` subtype `hook_response` | Hook 生命週期 |

## stdin Protocol

### User message

```json
{"type":"user","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
```

### Control request (extension → CLI)

```json
{"type":"control_request","request_id":"initialize-001","request":{"subtype":"initialize"}}
```

### Control response (extension → CLI, answering CLI's control_request)

```json
{"type":"control_response","response":{"subtype":"success","request_id":"...","response":{...}}}
```

## POC Fixtures Inventory

17 JSONL fixture files in `poc/archive` branch:

| Fixture | Covers |
|---------|--------|
| `simple-text.jsonl` | Basic text response |
| `tool-use-read.jsonl` | Tool use + tool result |
| `control-initialize.jsonl` | Initialize control flow |
| `control-interrupt.jsonl` | Interrupt control |
| `control-set-model.jsonl` | Set model control |
| `control-set-permission-mode.jsonl` | Permission mode control |
| `control-set-max-thinking-tokens.jsonl` | Thinking tokens control |
| `control-response-error.jsonl` | Error response |
| `control-rewind-files.jsonl` | Rewind files control |
| `control-stop-task.jsonl` | Stop task control |
| `control-mcp-message.jsonl` | MCP message |
| `control-mcp-reconnect.jsonl` | MCP reconnect |
| `control-mcp-set-servers.jsonl` | MCP set servers |
| `control-mcp-status.jsonl` | MCP status |
| `control-mcp-toggle.jsonl` | MCP toggle |
| `control-request-can-use-tool.jsonl` | CLI→extension permission request |
| `control-request-hook-callback.jsonl` | CLI→extension hook callback |

### Missing fixtures (discovered from real CLI)

- `system` subtype `hook_started` — new, needs fixture
- `system` subtype `hook_response` — new, needs fixture
- `system` subtype `init` with full fields (`plugins`, `agents`, `skills`, `fast_mode_state`) — update existing fixture
- `result` with `modelUsage`, `permission_denials`, `speed` — update existing fixture
- `rate_limit_event` with `utilization`, `surpassedThreshold` — optional (ignored type)

## Implementation Impact

For the summoner MVP implementation plan:

1. **Task 1 (Zod schemas)**: Add `hook_started` and `hook_response` to the system subtype union in `CliSystemMessage` schema. Add optional `modelUsage`, `permission_denials` to `CliResultMessage`.
2. **Task 3 (Parser)**: Ensure `hook_started` and `hook_response` are in the ignore list alongside `keep_alive`, `rate_limit_event`, etc.
3. **Task 0 (Setup)**: Copy fixtures from `poc/archive` and add 2 new fixtures for hook events.
