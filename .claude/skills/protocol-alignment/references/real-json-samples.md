# Real JSON Samples from DB

Source: `apps/server/data/code-quest.db` (raw_entries table)
Last updated: 2026-03-17

Each sample is one real JSON line captured from CLI stdout (OUT) or sent to CLI stdin (IN).
Use these as reference when writing Zod schemas, relay handlers, and tests.

---

# OUT (CLI stdout → cc-office)

## assistant

```json
{
  "type": "assistant",
  "message": {
    "model": "claude-opus-4-6",
    "id": "msg_01ETeYXNgij6wadWZZYNriRi",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_01GBZLMnAv7XaHkNmtZCbGsg",
        "name": "Read",
        "input": { "file_path": "/path/to/file.ts" },
        "caller": { "type": "direct" }
      }
    ],
    "stop_reason": null,
    "stop_sequence": null,
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 7026,
      "cache_read_input_tokens": 19026,
      "output_tokens": 19,
      "service_tier": "standard"
    }
  },
  "parent_tool_use_id": null,
  "session_id": "025f90ee-...",
  "uuid": "75579313-..."
}
```

## control_cancel_request

```json
{
  "type": "control_cancel_request",
  "request_id": "b0e4bdb3-..."
}
```

## control_request (can_use_tool)

```json
{
  "type": "control_request",
  "request_id": "2d3b501d-...",
  "request": {
    "subtype": "can_use_tool",
    "tool_name": "Read",
    "input": { "file_path": "/path/to/file.ts" },
    "permission_suggestions": [
      {
        "type": "addRules",
        "rules": [{ "toolName": "Read", "ruleContent": "//path/**" }],
        "behavior": "allow",
        "destination": "session"
      }
    ],
    "decision_reason": "Path is outside allowed working directories",
    "tool_use_id": "toolu_01Xqw3vYFCcrnE7ykCavzHip"
  }
}
```

## control_response

```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "interrupt-001"
  }
}
```

## rate_limit_event

```json
{
  "type": "rate_limit_event",
  "rate_limit_info": {
    "status": "allowed",
    "resetsAt": 1772301600,
    "rateLimitType": "five_hour",
    "overageStatus": "rejected",
    "overageDisabledReason": "org_level_disabled",
    "isUsingOverage": false
  },
  "uuid": "6963f85d-...",
  "session_id": "025f90ee-..."
}
```

## result/success

```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 7853,
  "duration_api_ms": 7806,
  "num_turns": 3,
  "result": "...",
  "session_id": "025f90ee-...",
  "total_cost_usd": 0.086,
  "usage": {
    "input_tokens": 5,
    "cache_creation_input_tokens": 7293,
    "cache_read_input_tokens": 71265,
    "output_tokens": 195,
    "service_tier": "standard",
    "iterations": [],
    "speed": "standard"
  },
  "modelUsage": {
    "claude-opus-4-6": {
      "inputTokens": 5,
      "outputTokens": 195,
      "cacheReadInputTokens": 71265,
      "cacheCreationInputTokens": 7293,
      "costUSD": 0.086,
      "contextWindow": 200000,
      "maxOutputTokens": 32000
    }
  },
  "permission_denials": [],
  "fast_mode_state": "off"
}
```

## result/error_during_execution

```json
{
  "type": "result",
  "subtype": "error_during_execution",
  "is_error": false,
  "duration_ms": 2993,
  "num_turns": 2,
  "session_id": "f284cc93-...",
  "total_cost_usd": 0.221,
  "usage": { "...same shape as success..." },
  "errors": [
    "Error: NON-FATAL: Lock acquisition failed...",
    "Error: Request was aborted."
  ]
}
```

## system/init

```json
{
  "type": "system",
  "subtype": "init",
  "session_id": "025f90ee-...",
  "model": "claude-opus-4-6",
  "permissionMode": "default",
  "apiKeyStatus": "valid",
  "tools": ["Read", "Write", "Edit", "..."],
  "mcp_servers": [{ "name": "server-name", "status": "connected" }],
  "uuid": "..."
}
```

## system/status

```json
{
  "type": "system",
  "subtype": "status",
  "status": "processing",
  "uuid": "..."
}
```

## system/hook_started

```json
{
  "type": "system",
  "subtype": "hook_started",
  "hook_id": "05b1694a-...",
  "hook_name": "SessionStart:startup",
  "hook_event": "SessionStart",
  "uuid": "...",
  "session_id": "..."
}
```

## system/hook_response

```json
{
  "type": "system",
  "subtype": "hook_response",
  "hook_id": "05b1694a-...",
  "hook_name": "SessionStart:startup",
  "hook_event": "SessionStart",
  "output": "{ \"additional_context\": \"...\" }",
  "stdout": "...",
  "stderr": "",
  "exit_code": 0,
  "outcome": "success",
  "uuid": "...",
  "session_id": "..."
}
```

## system/bridge_state

```json
{
  "type": "system",
  "subtype": "bridge_state",
  "state": "ready",
  "uuid": "19885b5e-...",
  "session_id": "520b9ebf-..."
}
```

## system/task_started

```json
{
  "type": "system",
  "subtype": "task_started",
  "description": "Running tests",
  "task_type": "test",
  "uuid": "...",
  "session_id": "..."
}
```

## system/task_progress

```json
{
  "type": "system",
  "subtype": "task_progress",
  "task_id": "a6bbdbd28ab02f859",
  "tool_use_id": "toolu_0144QEZDTRfHxwWDeQtF87Hn",
  "description": "Reading src/routes/profile.ts",
  "usage": {
    "total_tokens": 14430,
    "tool_uses": 1,
    "duration_ms": 1963
  },
  "last_tool_name": "Read",
  "uuid": "...",
  "session_id": "..."
}
```

## system/task_notification

```json
{
  "type": "system",
  "subtype": "task_notification",
  "task_id": "a6bbdbd28ab02f859",
  "tool_use_id": "toolu_0144QEZDTRfHxwWDeQtF87Hn",
  "status": "completed",
  "output_file": "",
  "summary": "Security review of server code",
  "usage": {
    "total_tokens": 64991,
    "tool_uses": 40,
    "duration_ms": 100193
  },
  "uuid": "...",
  "session_id": "..."
}
```

---

# IN (cc-office → CLI stdin)

## control_request/initialize

```json
{
  "type": "control_request",
  "request_id": "e57da6c8-...",
  "request": { "subtype": "initialize" }
}
```

## control_request/interrupt

```json
{
  "type": "control_request",
  "request_id": "13629993-...",
  "request": { "subtype": "interrupt" }
}
```

## control_request/set_model

```json
{
  "type": "control_request",
  "request_id": "6ede12dc-...",
  "request": { "subtype": "set_model", "model": "claude-sonnet-4-6" }
}
```

## control_request/set_permission_mode

```json
{
  "type": "control_request",
  "request_id": "dc59d526-...",
  "request": { "subtype": "set_permission_mode", "mode": "acceptEdits" }
}
```

## control_request/set_max_thinking_tokens

```json
{
  "type": "control_request",
  "request_id": "81a2b5ce-...",
  "request": { "subtype": "set_max_thinking_tokens", "tokens": 1024 }
}
```

## control_request/apply_flag_settings

```json
{
  "type": "control_request",
  "request_id": "fc751c9b-...",
  "request": { "subtype": "apply_flag_settings", "settings": { "effortLevel": "low" } }
}
```

## control_request/set_effort

```json
{
  "type": "control_request",
  "request_id": "c900d981-...",
  "request": { "subtype": "set_effort", "effort": "low" }
}
```

## control_request/rewind_files

```json
{
  "type": "control_request",
  "request_id": "68ed1c12-...",
  "request": {
    "subtype": "rewind_files",
    "user_message_id": "316682fa-...",
    "dry_run": true
  }
}
```

## control_request/remote_control

```json
{
  "type": "control_request",
  "request_id": "db6c1f5a-...",
  "request": { "subtype": "remote_control", "enabled": true }
}
```

## control_request/mcp_status

```json
{
  "type": "control_request",
  "request_id": "54e2ddd8-...",
  "request": { "subtype": "mcp_status" }
}
```

## control_response/success (tool deny)

```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "e822c298-...",
    "response": {
      "behavior": "deny",
      "message": "User denied this action",
      "interrupt": false,
      "toolUseID": "toolu_01LJ1sbVGgcxBDmZmLXDqEbp"
    }
  }
}
```

## user

```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [{ "type": "text", "text": "讀取 docs/protocol.md" }]
  }
}
```
