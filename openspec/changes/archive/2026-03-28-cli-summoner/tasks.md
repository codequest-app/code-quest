## CLI (summoner) — 已實作功能清單

> 201 tests / 7 files — 全部 pass

---

### 1. Process Management — DONE

- [x] 1.1 ChildProcessProvider — spawn CLI process, yield stdout lines
- [x] 1.2 ProcessRunner — wrap provider + adapter, emit parsed events
- [x] 1.3 ProcessHandle — send(stdin), abort(), signal(AbortSignal)
- [x] 1.4 Events: `socket_event`, `server_action`, `control_response`, `auto_response`, `exit`

### 2. Protocol Parsing (ClaudeProtocol) — DONE

- [x] 2.1 parseLine — JSON line → ProtocolEvent（60+ event types）
- [x] 2.2 Edge cases: empty string, whitespace, invalid JSON, missing type, keep_alive skip
- [x] 2.3 Real JSON fixtures（80+）+ synthetic fixtures（20+）
- [x] 2.4 parseInitializeResponse — extract commands, models, account

### 3. CLI Argument Building (buildArgs) — DONE

- [x] 3.1 Session: --resume, --continue, --fork-session, --session-id, --resume-session-at
- [x] 3.2 Model: --model, --fallback-model
- [x] 3.3 Thinking: --thinking (adaptive/disabled), --max-thinking-tokens
- [x] 3.4 Limits: --effort, --max-turns, --max-budget-usd
- [x] 3.5 Tools: --allowedTools, --disallowedTools, --tools, --agent
- [x] 3.6 MCP: --mcp-config (string/object), --strict-mcp-config
- [x] 3.7 Settings: --permission-mode, --setting-sources, --proactive, --assistant
- [x] 3.8 Schema: --json-schema (JSON string)
- [x] 3.9 Debug: --debug, --debug-file, --debug-to-stderr, --betas
- [x] 3.10 Dirs: --add-dir, --plugin-dir
- [x] 3.11 No-persistence: --no-session-persistence
- [x] 3.12 Combined: multiple options 同時使用

### 4. Event Transformation (ClaudeAdapter) — DONE

#### 4.1 System Events
- [x] system/init → session:init
- [x] system/status → session:status
- [x] system/hook_started, hook_response
- [x] system/task_started, task_notification, task_progress
- [x] system/bridge_state
- [x] system/compact_boundary（with/without compactMetadata, preservedSegment）
- [x] system/rate_limit（with/without overage fields）
- [x] system/experiment_gates, available_models

#### 4.2 Message Events
- [x] assistant → message:assistant（text/thinking/tool_use blocks）
- [x] user → message:user（tool_result block）
- [x] result → message:result（with stats, isError, subtype）
- [x] result with errors → message:result + error:message

#### 4.3 Stream Events
- [x] content_block_start → stream:block_start（with parentToolUseId）
- [x] text_delta → stream:chunk
- [x] thinking_delta → stream:chunk
- [x] message_stop → stream:end
- [x] signature_delta → skip（silent ignore）

#### 4.4 Control Requests
- [x] can_use_tool → control:permission（with blockedPath, decisionReason, agentId）
- [x] hook_callback → control:hook_callback
- [x] elicitation → control:elicitation（with elicitationId, mcpServerName, requestedSchema）
- [x] get_settings → ServerAction (auto_respond)
- [x] initialize → passthrough
- [x] mcp_message notification → ServerAction (auto_respond)
- [x] mcp_message request → control:mcp
- [x] show_notification → notification:show + ServerAction (auto_respond)
- [x] unknown subtype → ServerAction (forward_to_client)
- [x] open_url → AutoResponse
- [x] read_diff → NOT auto response（需 server enrichment）

#### 4.5 Misc Events
- [x] control_cancel_request → control:cancel
- [x] control_response → controlResponses output
- [x] error → error:message
- [x] notification → notification:toast
- [x] auth_url → notification:auth_url
- [x] auth_status → notification:auth_status（with isAuthenticating）
- [x] streamlined_text, streamlined_tool_use_summary
- [x] unknown type → raw:event

### 5. ProcessRunner Methods — DONE

- [x] 5.0 spawn, sendMessage, sendControlRequest, respondToControlRequest, write, kill, abort
- [x] 5.0a 7 event types: stdout, stdin, socket_event, server_action, control_response, auto_response, exit

### 5a. ProviderAdapter Interface — DONE

- [x] 5a.1 command, buildArgs, parseLine, transform
- [x] 5a.2 formatMessage, formatControlRequest, formatControlResponse
- [x] 5a.3 extractRespondedRequestIds — 從 raw entries 提取已回應的 request IDs

### 5b. ServerAction Subtypes — DONE

- [x] 5b.1 auto_respond — 自動回應（open_url, show_notification, get_settings）
- [x] 5b.2 read_diff — server 讀取 diff 後回應
- [x] 5b.3 forward_to_client — 轉發未知 request 到 client
- [x] 5b.4 SERVER_ENRICHED_SUBTYPES set

### 6. Format Methods — DONE (renumbered)

- [x] 5.1 formatMessage — 格式化 user message for CLI stdin
- [x] 5.2 formatControlResponse — 格式化 control response for CLI stdin
- [x] 5.3 formatControlRequest — 格式化 control request for CLI stdin（auto-generate requestId）

### 6. Test Infrastructure — DONE

- [x] 6.1 FakeProcessProvider + FakeProcessHandle — mock process spawning
- [x] 6.2 segments builder — 60+ helper methods 產生 CLI JSON fixtures
- [x] 6.3 createFakeSocket — dual-emitter socket mock（client ↔ server）
- [x] 6.4 Backward compatibility tests（old/new event formats）
- [x] 6.5 resetSeq — deterministic UUID for snapshot tests
