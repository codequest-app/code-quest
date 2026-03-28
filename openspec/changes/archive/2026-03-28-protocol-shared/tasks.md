## Protocol (shared) — 已實作功能清單

> 21 tests / 2 files — 全部 pass

---

### 1. Socket Event Types (`socket-events.ts`) — DONE

#### 1.1 ClientToServerEvents（Client → Server）
- [x] Session: `session:launch`, `session:join`, `session:close`
- [x] Chat: `chat:send`, `chat:cancel`, `chat:respond`, `chat:stop_task`, `chat:set_fast_mode`
- [x] Settings: `set_model`, `set_permission_mode`, `set_thinking_level`, `apply_settings`
- [x] Control: `rewind_code`, `cancel_request`, `hook_callback_respond`
- [x] MCP: `get_mcp_servers`, `set_mcp_server_enabled`, `mcp_message`, `authenticate_mcp_server`
- [x] Plugin: `list_plugins`, `install_plugin`, `list_marketplaces`
- [x] File/Git: `file:read`, `check_git_status`, `git:log`, `git:diff`
- [x] Plan: `comment`, `get_plan_comments`, `close_plan_preview`
- [x] Speech: `start_speech_to_text`, `stop_speech_to_text`
- [x] Terminal: `terminal:get_contents`, `terminal:open_claude`

#### 1.2 ServerToClientEvents（Server → Client）
- [x] Session lifecycle: `session:created`, `session:closed`, `session:dead`, `session:init`, `session:status`
- [x] Messages: `message:assistant`, `message:user`, `message:result`
- [x] Streaming: `stream:chunk`, `stream:end`, `stream:text`, `stream:tool_summary`, `stream:block_start`
- [x] Control: `control:permission`, `control:elicitation`, `control:diff_review`, `control:cancel`, `control:hook_callback`, `control:mcp`
- [x] System: `system:hook_started`, `system:hook_response`, `system:task_started`, `system:task_progress`, `system:compact_boundary`, `system:rate_limit`, `system:available_models`
- [x] Notification: `notification:toast`, `notification:show`, `notification:auth_url`, `notification:auth_status`
- [x] State: `state:update`, `state:usage`
- [x] Action: `action:open_url`, `action:open_file`

### 2. Event Types (`event-types.ts`) — DONE

- [x] 2.1 ContentBlock union: TextBlock, ThinkingBlock, ToolUseBlock, ToolResultBlock
- [x] 2.2 SessionStats: totalCostUsd, durationMs, inputTokens, outputTokens, numTurns
- [x] 2.3 UpdateStatePayload: channelId + global/per-channel fields
- [x] 2.4 ModelInfo, AccountInfo, UsageQuota
- [x] 2.5 PermissionRequest, ElicitationRequest, DiffReviewRequest
- [x] 2.6 HookStartedInfo, HookResponseInfo
- [x] 2.7 ControlResponse (allow/deny/hook_callback)
- [x] 2.8 SessionStateSummary, ChannelMetaCache

### 3. Zod Schemas (`schemas/chat.ts`) — DONE

- [x] 3.1 Session: chatCreateSchema, chatJoinSchema, sessionForkSchema, sessionTeleportSchema
- [x] 3.2 Message: chatSendSchema, chatInterruptSchema, chatStopTaskSchema, chatRewindCodeSchema
- [x] 3.3 Control: controlPermissionResponseSchema, chatControlResponseSchema
- [x] 3.4 Settings: chatSetModelSchema, chatSetPermissionModeSchema, chatSetThinkingLevelSchema
- [x] 3.5 MCP: mcpGetServersSchema, mcpSetEnabledSchema, mcpReconnectSchema, mcpAuthenticateSchema
- [x] 3.6 Plugin: pluginInstallSchema, pluginToggleSchema, addMarketplaceSchema
- [x] 3.7 Plan: planCommentSchema, planGetCommentsSchema, planClosePreviewSchema
- [x] 3.8 File/Git: fileListSchema, gitCheckoutSchema, gitLogSchema
- [x] 3.9 Auth: chatSetFastModeSchema, chatHookCallbackRespondSchema

### 4. MCP 特殊型別 — DONE

- [x] 4.0a ChromeMcpState, DebuggerMcpState, JupyterMcpState
- [x] 4.0b EnsureChromeMcpEnabled Request/Response
- [x] 4.0c EnableJupyterMcp Request/Response
- [x] 4.0d AskDebuggerHelp Request/Response

### 5. Action/Error Events — DONE

- [x] 5.0a action:open_url, action:open_file
- [x] 5.0b error:message
- [x] 5.0c raw:event（unknown event catch-all）

### 6. Contract Tests — DONE

- [x] 4.1 Permission response schema validation（17 tests）
- [x] 4.2 Launch options schema validation（4 tests）
