## 1. Subprocess stdin 送出的訊息格式

### 1.1 基礎寫入機制

**位置**：第 30666–30676 行

```javascript
write(v) {
  // 每條訊息是 JSON 格式，後跟換行符 \n
  if (!this.processStdin.write(v))
    c9("[ProcessTransport] Write buffer full, data queued");
}
```

- 每條訊息為有效 JSON + `\n`
- 透過 `processStdin.write()` 寫入

---

### 1.2 Control Request 訊息（Extension → Claude CLI）

**位置**：第 31162 行（`request()` 方法）

```json
{
  "type": "control_request",
  "request_id": "隨機產生的唯一 ID",
  "request": {
    "subtype": "initialize | interrupt | set_permission_mode | set_model | ...",
    "...其他欄位依 subtype 而定"
  }
}
```

#### a) initialize（初始化）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "initialize",
    "hooks": {
      "PreToolUse": [
        {
          "matcher": "Edit|Write|MultiEdit",
          "hookCallbackIds": ["hook_1"],
          "timeout": 5000
        }
      ]
    },
    "sdkMcpServers": ["server1"],
    "jsonSchema": {},
    "systemPrompt": "...",
    "appendSystemPrompt": "...",
    "agents": {},
    "promptSuggestions": ["建議提示 1", "建議提示 2"]
  }
}
```

- **`promptSuggestions`**（可選）：預設提示建議陣列，供 WebView 空白狀態顯示。

**initialize response** 包含以下欄位（透過 `initializationResult()` 取得）：

| 欄位 | 說明 |
|------|------|
| `commands` | CLI 支援的指令列表（`supportedCommands()` 存取） |
| `models` | 可用 AI 模型列表（`supportedModels()` 存取） |
| `agents` | 可用 Agent 列表（`supportedAgents()` 存取） |
| `account` | 帳戶資訊（`accountInfo()` 存取） |
| `pid` | CLI subprocess 的 process ID |

#### b) interrupt（中斷請求）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": { "subtype": "interrupt" }
}
```

#### c) set_permission_mode（設置權限模式）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "set_permission_mode",
    "mode": "default | permissive | strict"
  }
}
```

#### d) set_model（切換模型）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "set_model",
    "model": "model_name"
  }
}
```

#### e) set_max_thinking_tokens（設置最大思考 token 數）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "set_max_thinking_tokens",
    "max_thinking_tokens": 10000
  }
}
```

#### f) rewind_files（回退檔案狀態）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "rewind_files",
    "user_message_id": "xxx",
    "dry_run": false
  }
}
```

#### g) stop_task（停止任務）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "stop_task",
    "task_id": "xxx"
  }
}
```

#### h) mcp_reconnect（MCP 伺服器重連）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "mcp_reconnect",
    "serverName": "server_name"
  }
}
```

#### i) mcp_toggle（MCP 伺服器開關）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "mcp_toggle",
    "serverName": "server_name",
    "enabled": true
  }
}
```

#### j) mcp_status（查詢 MCP 狀態）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": { "subtype": "mcp_status" }
}
```

#### k) mcp_set_servers（設定 MCP 伺服器）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "mcp_set_servers",
    "servers": {
      "server_name": {
        "type": "sdk | stdio | http",
        "name": "server_name"
      }
    }
  }
}
```

#### l) can_use_tool（工具權限請求）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "can_use_tool",
    "tool_name": "tool_name",
    "input": {},
    "permission_suggestions": {},
    "blocked_path": "/path/to/file",
    "decision_reason": "reason",
    "tool_use_id": "xxx",
    "agent_id": "xxx"
  }
}
```

#### m) hook_callback（鉤子回調）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "hook_callback",
    "callback_id": "hook_1",
    "input": {},
    "tool_use_id": "xxx"
  }
}
```

#### n) mcp_message（MCP 訊息轉發）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "mcp_message",
    "server_name": "server_name",
    "message": {
      "jsonrpc": "2.0",
      "method": "method_name",
      "params": {},
      "id": 123
    }
  }
}
```

#### o) apply_flag_settings（套用實驗旗標設定）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "apply_flag_settings",
    "settings": { "flag_name": "value", "..." }
  }
}
```

用於將 Experiment Gates 接收到的旗標設定套用至 CLI subprocess。

#### p) remote_control（遠端控制開關）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "remote_control",
    "enabled": true
  }
}
```

啟用或停用遠端控制功能。回傳 `response` 物件。

#### q) mcp_authenticate（MCP OAuth 認證）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "mcp_authenticate",
    "serverName": "server_name"
  }
}
```

觸發指定 MCP 伺服器的 OAuth 認證流程。回傳認證結果。

#### r) mcp_clear_auth（清除 MCP 認證）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "mcp_clear_auth",
    "serverName": "server_name"
  }
}
```

清除指定 MCP 伺服器的已儲存認證資訊。

#### s) get_settings（查詢設定）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": { "subtype": "get_settings" }
}
```

向 CLI 查詢當前生效的設定值，回傳完整設定物件。

#### t) set_proactive（設定主動建議開關）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "set_proactive",
    "enabled": true
  }
}
```

啟用或停用 CLI 層級的主動建議功能。

#### u) mcp_oauth_callback_url（MCP OAuth Callback URL）

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "mcp_oauth_callback_url",
    "serverName": "server_name",
    "callbackUrl": "https://..."
  }
}
```

將 OAuth callback URL 提交給 CLI，完成 MCP 伺服器的 OAuth 授權流程。

---

### 1.3 User Input 訊息

**位置**：第 27770–27804 行

```json
{
  "type": "user",
  "role": "user",
  "content": [
    { "type": "text", "text": "使用者輸入的文字" }
  ]
}
```

---

