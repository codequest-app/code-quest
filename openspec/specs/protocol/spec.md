# Protocol (shared) — 共用型別與事件定義

## 職責
定義 client ↔ server 之間所有 Socket.IO 事件的 TypeScript 型別與 Zod 驗證 schema。

## 核心模組

### Socket Events (`socket-events.ts`)
定義兩個 interface：

**ClientToServerEvents（Client → Server）：**
- Session: `session:launch`, `session:join`, `session:close`
- Chat: `chat:send`, `chat:cancel`, `chat:respond`, `chat:stop_task`, `chat:set_fast_mode`
- Settings: `set_model`, `set_permission_mode`, `set_thinking_level`
- Control: `rewind_code`, `cancel_request`, `hook_callback_respond`
- MCP: `get_mcp_servers`, `set_mcp_server_enabled`, `mcp_message`, `authenticate_mcp_server`
- Plugin: `list_plugins`, `install_plugin`, `list_marketplaces`
- File/Git: `file:read`, `check_git_status`, `git:log`, `git:diff`
- Plan: `comment`, `get_plan_comments`

**ServerToClientEvents（Server → Client）：**
- Session: `session:created`, `session:closed`, `session:dead`, `session:init`, `session:status`
- Messages: `message:assistant`, `message:user`, `message:result`
- Streaming: `stream:chunk`, `stream:end`, `stream:text`, `stream:block_start`
- Control: `control:permission`, `control:elicitation`, `control:diff_review`, `control:cancel`, `control:hook_callback`
- System: `system:hook_started`, `system:hook_response`, `system:task_started`, `system:compact_boundary`, `system:rate_limit`, `system:available_models`
- Notification: `notification:toast`, `notification:show`, `notification:auth_url`
- State: `state:update`, `state:usage`

### Key Types (`event-types.ts`)

```typescript
ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock
SessionStats { totalCostUsd, durationMs, inputTokens, outputTokens, numTurns }
UpdateStatePayload { channelId, model, tools, permissionMode, thinkingLevel, fastModeState, ... }
ModelInfo { value, label?, displayName? }
AccountInfo { email, subscriptionType, authMethod, organization }
```

### Schemas (`schemas/chat.ts`)
60+ Zod schemas 覆蓋所有 payload：
- Session: `chatCreateSchema`, `chatJoinSchema`, `sessionForkSchema`
- Message: `chatSendSchema`, `chatInterruptSchema`
- Control: `controlPermissionResponseSchema`
- Settings: `chatSetModelSchema`, `chatSetPermissionModeSchema`
- MCP: `mcpGetServersSchema`, `mcpAuthenticateSchema`
- Plugin: `pluginInstallSchema`, `addMarketplaceSchema`

## MCP 特殊型別

- `ChromeMcpState` — Chrome MCP 狀態
- `DebuggerMcpState` — Debugger MCP 狀態
- `JupyterMcpState` — Jupyter MCP 狀態
- `EnsureChromeMcpEnabledRequest/Response`
- `EnableJupyterMcpRequest/Response`
- `AskDebuggerHelpRequest/Response`

## Action Events（Server → Client）

- `action:open_url` — 開啟 URL
- `action:open_file` — 開啟檔案（含 location）
- `error:message` — 錯誤訊息
- `raw:event` — 未知事件 catch-all

## 測試覆蓋
- `control-permission-response.contract.test.ts` — Permission response 格式驗證（17 tests）
- `launch-options.contract.test.ts` — 啟動選項 schema 驗證（4 tests）
