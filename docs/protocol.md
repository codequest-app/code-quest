# VSCode Claude 擴展 (v2.1.45) 通訊協議完整文件

## 概述

本文件詳細記錄了 VSCode Claude 擴展（版本 2.1.45 darwin-arm64）的完整通訊協議，包括 stdin/stdout 訊息格式、WebView 通訊、REST API 請求和 VSCode 命令。

---

## 0. CLI 啟動參數

**位置**：第 27110–27175 行

Extension 透過 `spawn` 啟動 Claude CLI 執行檔，以 stdin/stdout pipe 做雙向通訊。

### 0.1 預設參數（必帶）

```
claude --output-format stream-json --input-format stream-json --verbose
```

| 參數 | 值 | 說明 |
|------|---|------|
| `--output-format` | `stream-json` | stdout 以逐行 JSON 格式輸出 |
| `--input-format` | `stream-json` | stdin 以逐行 JSON 格式輸入 |
| `--verbose` | — | 輸出詳細資訊 |

### 0.2 條件參數

根據 `spawnClaude()` 傳入的選項，動態追加以下參數：

| 參數 | 條件 | 範例 |
|------|------|------|
| `--max-thinking-tokens <n>` | 有設定思考 token 數 | `--max-thinking-tokens 10000` |
| `--effort <level>` | 有設定 effort | `--effort high` |
| `--max-turns <n>` | 有設定最大輪次 | `--max-turns 5` |
| `--max-budget-usd <n>` | 有設定預算上限 | `--max-budget-usd 1.0` |
| `--model <name>` | 有指定模型 | `--model claude-sonnet-4-6` |
| `--agent <name>` | 有指定 agent | `--agent my-agent` |
| `--betas <list>` | 有啟用 beta 功能 | `--betas beta1,beta2` |
| `--json-schema <json>` | 有指定 JSON schema | `--json-schema '{...}'` |
| `--debug-file <path>` | 有指定 debug 檔案 | `--debug-file /tmp/debug.log` |
| `--debug` | 啟用 debug（無 debug-file 時） | — |
| `--debug-to-stderr` | 環境變數 `DEBUG_CLAUDE_AGENT_SDK` 存在 | — |
| `--permission-prompt-tool stdio` | 有提供 `canUseTool` callback | — |
| `--permission-prompt-tool <name>` | 有指定 `permissionPromptToolName` | — |
| `--continue` | 繼續上次對話 | — |
| `--resume <id>` | 恢復指定會話 | `--resume session_abc123` |
| `--allowedTools <list>` | 有白名單工具 | `--allowedTools Read,Glob` |
| `--disallowedTools <list>` | 有黑名單工具 | `--disallowedTools Bash` |
| `--tools <list>` | 有指定工具集（空陣列傳 `""`，否則逗號分隔或 `default`） | `--tools default` |
| `--mcp-config <json>` | 有 MCP 伺服器設定 | `--mcp-config '{"mcpServers":{...}}'` |
| `--setting-sources <list>` | 有指定設定來源 | `--setting-sources user,project,local` |
| `--strict-mcp-config` | 啟用嚴格 MCP 設定 | — |
| `--permission-mode <mode>` | 有指定權限模式 | `--permission-mode default` |
| `--allow-dangerously-skip-permissions` | 允許跳過權限檢查 | — |
| `--fallback-model <name>` | 有指定備用模型（不可與主模型相同） | `--fallback-model claude-haiku-4-5` |
| `--include-partial-messages` | 啟用部分訊息（非 Remote 環境時） | — |
| `--add-dir <path>` | 每個額外工作目錄（可多次） | `--add-dir /other/project` |
| `--plugin-dir <path>` | 每個本地插件目錄（可多次） | `--plugin-dir /plugins/my-plugin` |
| `--fork-session` | 分叉會話 | — |
| `--resume-session-at <id>` | 從指定點恢復會話 | — |
| `--session-id <id>` | 指定 session ID | `--session-id sess_123` |
| `--no-session-persistence` | 停用 session 持久化 | — |

### 0.3 Extension 額外注入的參數

`spawnClaude()`（第 68226–68232 行）透過 `extraArgs` 注入：

```javascript
extraArgs: {
  "debug": null,              // → --debug
  "debug-to-stderr": null,    // → --debug-to-stderr
  "enable-auth-status": null, // → --enable-auth-status
  "no-chrome": null,          // → --no-chrome
}
```

（`null` 值表示旗標型參數，無需帶值）

### 0.4 環境變數

| 環境變數 | 說明 |
|---------|------|
| `CLAUDE_CODE_ENTRYPOINT` | 設為 `"sdk-ts"`（第 27175 行） |
| `DEBUG` | 若有 `DEBUG_CLAUDE_AGENT_SDK` 則設為 `"1"`，否則刪除 |
| `NODE_OPTIONS` | 啟動前刪除（第 27176 行） |
| Python 相關（`PATH`, `VIRTUAL_ENV`, `CONDA_PREFIX`, `CONDA_DEFAULT_ENV`） | 若啟用 `usePythonEnvironment`，從 VSCode Python 環境繼承 |

### 0.5 執行檔選擇

**位置**：第 27043–27044、68256 行

```javascript
// 預設執行命令
getDefaultExecutable() {
  return $W() ? "bun" : "node";  // 偵測環境選擇 bun 或 node
}
```

Extension 會透過 `getClaudeBinary()`（第 68256 行）取得：
- `pathToClaudeCodeExecutable`：Claude CLI 執行檔路徑
- `executableArgs`：額外執行引數
- `env`：環境變數

最終 spawn 命令形式：

```
<node|bun> [executableArgs] <claude-code-executable> [所有參數]
// 或者如果是原生二進位檔：
<claude-code-executable> [所有參數]
```

---

## 1. Subprocess stdin 送出的訊息格式

### 1.1 基礎寫入機制

**位置**：第 27241–27260 行

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

**位置**：第 27705–27727 行

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
    "agents": {}
  }
}
```

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

## 2. Subprocess stdout 接收的訊息格式

### 2.1 基礎讀取機制

**位置**：第 27285–27308 行

- 使用 `readline` 模組按行讀取 stdout
- 每行必須是有效的 JSON，空行忽略

---

### 2.2 Control Response 訊息（Claude CLI → Extension）

#### 成功響應

```json
{
  "type": "control_response",
  "response": {
    "subtype": "success",
    "request_id": "對應的 request_id",
    "response": {}
  }
}
```

#### 錯誤響應

```json
{
  "type": "control_response",
  "response": {
    "subtype": "error",
    "request_id": "對應的 request_id",
    "error": "錯誤訊息"
  }
}
```

---

### 2.3 所有 stdout 訊息類型

**位置**：第 27520–27551 行

| Type | 描述 | 處理方式 |
|------|------|---------|
| `control_response` | 控制請求的回應 | 由 `pendingControlResponses` 處理 |
| `control_request` | CLI 發起的控制請求 | 呼叫 `handleControlRequest()` |
| `control_cancel_request` | 取消請求 | 呼叫 `handleControlCancelRequest()` |
| `keep_alive` | 保活訊號 | 忽略 |
| `streamlined_text` | 精簡文字 | 忽略 |
| `streamlined_tool_use_summary` | 工具使用摘要 | 忽略 |
| `result` | 最終結果 | 入隊到 `inputStream` |
| `user` | 使用者訊息 | 入隊到 `inputStream` |
| `assistant` | 助手回應 | 入隊到 `inputStream` |
| `tool_use` | 工具呼叫 | 入隊到 `inputStream` |
| `error` | 錯誤訊息 | 入隊到 `inputStream` |

---

### 2.4 Control Cancel Request 訊息

```json
{
  "type": "control_cancel_request",
  "request_id": "要取消的 request_id"
}
```

---

## 3. WebView ↔ Extension postMessage 格式

### 3.1 Extension → WebView 包裝格式

**位置**：第 68118–68125 行

```json
{
  "type": "from-extension",
  "message": {
    "type": "request | response | ...",
    "...訊息內容"
  }
}
```

---

### 3.2 Request / Response 格式

#### Request

```json
{
  "type": "request",
  "channelId": "頻道 ID",
  "requestId": "請求 ID",
  "request": {
    "type": "具體請求類型",
    "...其他欄位"
  }
}
```

#### Response（成功）

```json
{
  "type": "response",
  "requestId": "對應的 requestId",
  "response": {
    "type": "響應類型",
    "...響應資料"
  }
}
```

#### Response（錯誤）

```json
{
  "type": "response",
  "requestId": "對應的 requestId",
  "response": {
    "type": "error",
    "message": "錯誤訊息"
  }
}
```

---

### 3.3 具體 WebView Request 類型

#### get_current_selection

```json
{ "type": "get_current_selection" }
// Response:
{ "type": "get_current_selection_response", "selection": "選取的文字" }
```

#### new_conversation_tab

```json
{ "type": "new_conversation_tab", "sessionId": "xxx", "initialPrompt": "初始提示詞" }
// Response:
{ "type": "new_conversation_tab_response" }
```

#### rename_tab

```json
{
  "type": "rename_tab",
  "title": "新標籤頁標題",
  "hasPendingPermissions": false,
  "hasUnseenCompletion": true
}
// Response:
{ "type": "rename_tab_response" }
```

#### show_notification

```json
{
  "type": "show_notification",
  "message": "通知訊息",
  "severity": "error | warning | info",
  "buttons": ["按鈕1", "按鈕2"],
  "onlyIfNotVisible": true
}
// Response:
{ "type": "show_notification_response", "buttonValue": "使用者點擊的按鈕值" }
```

#### tool_permission_request

```json
{
  "type": "tool_permission_request",
  "toolName": "工具名稱",
  "inputs": {},
  "suggestions": {}
}
```

#### visibility_changed

```json
{ "type": "visibility_changed", "isVisible": true }
```

#### selection_changed

```json
{ "type": "selection_changed", "selection": "新的選取" }
```

#### insert_at_mention

```json
{ "type": "insert_at_mention", "text": "@mention 文字" }
```

#### font_configuration_changed

```json
{ "type": "font_configuration_changed", "fontConfig": {} }
```

#### create_new_conversation

```json
{ "type": "create_new_conversation" }
```

#### open_plugins_dialog

```json
{
  "type": "open_plugins_dialog",
  "pluginName": "插件名稱",
  "marketplaceSource": "插件市場來源"
}
```

---

### 3.4 WebView → Extension 訊息

#### Plan Preview Comment

```json
{
  "type": "comment",
  "id": "comment-唯一ID",
  "selectedText": "被注釋的文字",
  "sectionHeading": "章節標題",
  "comment": "評論內容"
}
```

---

## 4. REST API 請求格式

### 4.1 API 端點設定

**位置**：第 45326–45341 行

```javascript
{
  BASE_API_URL:           "https://api.anthropic.com",
  CONSOLE_AUTHORIZE_URL:  "https://platform.claude.com/oauth/authorize",
  CLAUDE_AI_AUTHORIZE_URL:"https://claude.ai/oauth/authorize",
  TOKEN_URL:              "https://platform.claude.com/v1/oauth/token",
  API_KEY_URL:            "https://api.anthropic.com/api/oauth/claude_cli/create_api_key",
  ROLES_URL:              "https://api.anthropic.com/api/oauth/claude_cli/roles",
  MCP_PROXY_URL:          "https://mcp-proxy.anthropic.com",
  MCP_PROXY_PATH:         "/v1/mcp/{server_id}",
}
```

---

### 4.2 Usage API

**位置**：第 45421–45445 行

```
GET https://api.anthropic.com/api/oauth/usage
Headers:
  Content-Type: application/json
  Authorization: Bearer <token>
Timeout: 5000ms
```

**回應格式**：

```json
{
  "five_hour":       { "utilization": 0.5, "resets_at": "2026-02-18T10:00:00Z" },
  "seven_day":       { "utilization": 0.3, "resets_at": "2026-02-25T00:00:00Z" },
  "seven_day_sonnet":{ "utilization": 0.4, "resets_at": "2026-02-25T00:00:00Z" },
  "extra_usage": {
    "is_enabled":    true,
    "monthly_limit": 1000,
    "used_credits":  500,
    "utilization":   0.5
  }
}
```

---

### 4.3 Sessions API

```
GET https://api.anthropic.com/v1/sessions
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
  anthropic-version: 2023-06-01
  x-organization-uuid: <orgUUID>
Timeout: 15000ms
```

---

### 4.4 認證 Headers

**OAuth 模式**（位置：第 53901 行）：

```json
{
  "Authorization": "Bearer <access_token>",
  "anthropic-beta": "oauth-2025-04-20"
}
```

**API Key 模式**：

```json
{
  "x-api-key": "<api_key>"
}
```

---

## 5. VSCode 已註冊命令

**位置**：第 72170–72602 行

| 命令 | 說明 |
|------|------|
| `claude-vscode.terminal.open` | 在終端機開啟 Claude |
| `claude-vscode.terminal.open.keyboard` | 鍵盤快捷鍵開啟終端機 |
| `claude-code.acceptProposedDiff` | 接受建議的 diff |
| `claude-code.rejectProposedDiff` | 拒絕建議的 diff |
| `claude-code.insertAtMentioned` | 插入 @mention |
| `claude-code.viewingProposedDiff` | 查看建議的 diff 狀態 |
| `claude-vscode.editor.open` | 開啟編輯器面板 |
| `claude-vscode.editor.openLast` | 開啟上次的編輯器面板 |
| `claude-vscode.newConversation` | 建立新對話 |
| `claude-vscode.sidebar.open` | 開啟側邊欄 |
| `claude-vscode.window.open` | 開啟獨立視窗 |
| `claude-vscode.logout` | 登出 |
| `claude-vscode.showLogs` | 顯示日誌 |
| `claude-vscode.openWalkthrough` | 開啟入門指引 |
| `claude-vscode.installPlugin` | 安裝插件 |
| `claude-vscode.insertAtMention` | 插入 @mention |
| `claude-vscode.blur` | 失去焦點 |
| `claude-vscode.focus` | 取得焦點 |
| `claude-vscode.sideBarActive` | 側邊欄活躍狀態 |
| `claude-vscode.updateSupported` | 更新支援狀態 |

---

## 6. 所有訊息 Type 彙整

### Control Request Subtype

| Subtype | 用途 |
|---------|------|
| `initialize` | 初始化 Claude 會話 |
| `interrupt` | 中斷當前操作 |
| `set_permission_mode` | 設定權限模式 |
| `set_model` | 切換 AI 模型 |
| `set_max_thinking_tokens` | 設定最大思考 token 數 |
| `rewind_files` | 回退檔案狀態 |
| `stop_task` | 停止任務 |
| `mcp_reconnect` | 重連 MCP 伺服器 |
| `mcp_toggle` | 啟用/停用 MCP 伺服器 |
| `mcp_status` | 查詢 MCP 伺服器狀態 |
| `mcp_set_servers` | 設定 MCP 伺服器 |
| `can_use_tool` | 工具權限檢查 |
| `hook_callback` | 鉤子回調 |
| `mcp_message` | MCP 訊息轉發 |

### WebView Message Type

| Type | 用途 | 方向 |
|------|------|------|
| `from-extension` | 包裝訊息 | Extension → WebView |
| `request` | 請求訊息 | Extension → WebView |
| `response` | 響應訊息 | Extension ← WebView |
| `comment` | 評論訊息 | WebView → Extension |
| `cancel_request` | 取消請求 | Extension → WebView |
| `close_channel` | 關閉頻道 | Extension → WebView |
| `remove_plan_comment_response` | 刪除評論響應 | Extension → WebView |

---

## 7. 完整交互流程

### 7.1 初始化流程

```
Extension 啟動
    ↓
spawn Claude CLI process（stdin/stdout pipe）
    ↓
建立 ProcessTransport 實例
    ↓
發送 { type: "control_request", request: { subtype: "initialize", ... } }
    ↓
等待 { type: "control_response", response: { subtype: "success", ... } }
    ↓
初始化完成，開始處理使用者輸入
```

### 7.2 使用者對話流程

```
使用者在 WebView 輸入
    ↓
WebView 發送訊息到 Extension
    ↓
Extension 透過 streamInput() 轉換為
    { "type": "user", "content": [{ "type": "text", "text": "..." }] }
    ↓
寫入 processStdin
    ↓
Claude CLI 處理請求（呼叫 Anthropic API）
    ↓
回傳 { type: "result", content: [...] } 到 stdout
    ↓
Extension 讀取並透過 postMessage 回傳給 WebView 顯示
```

### 7.3 工具權限請求流程（`can_use_tool` 觸發機制）

**方向**：Claude CLI → stdout → Extension（被動接收）

**觸發條件**：CLI 想使用某個工具（如 Edit、Write、Bash 等）時，主動詢問 Extension 是否允許。

**前提**：`spawnClaude()` 時傳入 `canUseTool` callback（第 47036 行），並帶 `--permission-prompt-tool stdio` 參數，CLI 才會透過 stdio 詢問權限。

**完整觸發鏈**：

```
① CLI 想使用某工具（如 Edit）
    ↓
② CLI 透過 stdout 送出（第 27604 行觸發）：
    {
      type: "control_request",
      request_id: "xxx",
      request: {
        subtype: "can_use_tool",
        tool_name: "Edit",
        input: { file_path: "/src/app.js", old_string: "...", new_string: "..." },
        permission_suggestions: {...},
        blocked_path: "/src/app.js",
        decision_reason: "reason",
        tool_use_id: "xxx",
        agent_id: "xxx"
      }
    }
    ↓
③ Extension readMessages()（第 27527 行）判斷 type === "control_request"
    ↓
④ handleControlRequest()（第 27559 行）建立 AbortController，存入 cancelControllers Map
    ↓
⑤ processControlRequest()（第 27604 行）判斷 subtype === "can_use_tool"
    ↓
⑥ 呼叫 this.canUseTool(tool_name, input, options)
   └→ 實際是呼叫 requestToolPermission()（第 47097 行）
    ↓
⑦ requestToolPermission() 透過 postMessage 向 WebView 發送：
    {
      type: "tool_permission_request",
      toolName: "Edit",
      inputs: {...},
      suggestions: [...]
    }
    ↓
⑧ WebView 顯示權限對話框，使用者點擊「允許」或「拒絕」
    ↓
⑨ WebView 回傳結果給 Extension
    ↓
⑩ Extension 透過 stdin 寫回 control_response 給 CLI：
    {
      type: "control_response",
      response: {
        subtype: "success",
        request_id: "xxx",
        response: {
          behavior: "allow",      // 或 "deny"
          updatedInput: {...},     // 可選，修改後的輸入
          toolUseID: "xxx"
        }
      }
    }
    ↓
⑪ CLI 根據 behavior 繼續執行或中止工具呼叫
```

**相關程式碼**：

```javascript
// 第 47036-47044 行：canUseTool callback 定義
async (D, A, w) => {
  return this.requestToolPermission(v, D, A, w.suggestions || [], w.signal);
}

// 第 47097-47113 行：requestToolPermission 實作
async requestToolPermission(v, z, U, V, N) {
  // Chrome MCP 工具自動允許
  if (this.channels.get(v)?.chromeMcpState.status === "connected"
      && z.startsWith("mcp__claude-in-chrome__"))
    return { behavior: "allow", updatedInput: U };

  // 其他工具透過 WebView 詢問使用者
  let x = await this.sendRequest(v, {
    type: "tool_permission_request",
    toolName: z,
    inputs: U,
    suggestions: V,
  }, N);
  return x.result;
}
```

---

### 7.4 請求取消流程（`control_cancel_request` 觸發機制）

**方向**：Claude CLI → stdout → Extension（被動接收）

**觸發條件**：CLI 先前發送了一個 `control_request`（如 `can_use_tool`），但在 Extension 回應之前，CLI 決定取消該請求（例如使用者中斷操作、超時等）。

**完整觸發鏈**：

```
① CLI 送出 control_request { request_id: "abc123", ... }
    ↓
② Extension 收到，建立 AbortController 存入 cancelControllers Map（第 27560-27561 行）：
    cancelControllers.set("abc123", new AbortController())
    ↓
③ Extension 開始處理（例如正在等使用者回應權限對話框）
    ↓
④ CLI 決定取消，透過 stdout 送出：
    { type: "control_cancel_request", request_id: "abc123" }
    ↓
⑤ Extension readMessages()（第 27530 行）判斷 type === "control_cancel_request"
    ↓
⑥ handleControlCancelRequest()（第 27599 行）：
    - 從 cancelControllers Map 取出 AbortController
    - 呼叫 abort() 中止進行中的操作
    - 從 Map 刪除該 controller
```

**相關程式碼**：

```javascript
// 第 27599-27601 行
handleControlCancelRequest(v) {
  let z = this.cancelControllers.get(v.request_id);
  if (z) z.abort(), this.cancelControllers.delete(v.request_id);
}
```

**abort 的效果**：
- 正在等待的 `processControlRequest()` 會收到 abort signal
- 透過 `sendRequest()` 送出的 WebView 請求（如權限對話框）帶有 signal 參數（第 47126-47136 行），abort 時會自動發送 `cancel_request` 給 WebView 並 reject Promise

```javascript
// 第 47127-47136 行：sendRequest 中的 abort 處理
let x = () => {
  this.outstandingRequests.delete(V),
    this.send({ type: "cancel_request", targetRequestId: V }),
    K(Error(U.reason || "aborted"));
};
if (U.aborted) { x(); return; }
U.addEventListener("abort", x, { once: !0 });
```

---

### 7.5 Hook 回調流程（`hook_callback` 觸發機制）

**方向**：Claude CLI → stdout → Extension（被動接收）

**觸發條件**：CLI 在執行工具前後（PreToolUse / PostToolUse），回調 Extension 預先註冊的 hook 函式。

#### Hook 註冊階段

Extension 在 `spawnClaude()` 時定義 hooks（第 68208–68225 行）：

```javascript
hooks: {
  PreToolUse: [
    {
      matcher: "Edit|Write|MultiEdit",
      hooks: [(F) => O.captureBaseline(F)]       // 記錄檔案原始狀態
    },
    {
      matcher: "Edit|Write|Read",
      hooks: [(F) => this.saveFileIfNeeded(F)]    // 先儲存未存檔的檔案
    },
  ],
  PostToolUse: [
    {
      matcher: "Edit|Write|MultiEdit",
      hooks: [(F) => O.findDiagnosticsProblems(F)] // 檢查 linting 錯誤
    },
  ],
}
```

初始化時（第 27644–27659 行），每個 hook 函式會被分配一個 `callback_id` 並存入 `hookCallbacks` Map：

```javascript
for (let j of K.hooks) {
  let B = `hook_${this.nextCallbackId++}`;
  this.hookCallbacks.set(B, j);  // 例如 "hook_0" → captureBaseline 函式
  x.push(B);
}
```

然後在 `initialize` control_request 中告知 CLI：

```json
{
  "type": "control_request",
  "request": {
    "subtype": "initialize",
    "hooks": {
      "PreToolUse": [
        { "matcher": "Edit|Write|MultiEdit", "hookCallbackIds": ["hook_0"], "timeout": 5000 },
        { "matcher": "Edit|Write|Read", "hookCallbackIds": ["hook_1"], "timeout": 5000 }
      ],
      "PostToolUse": [
        { "matcher": "Edit|Write|MultiEdit", "hookCallbackIds": ["hook_2"], "timeout": 5000 }
      ]
    }
  }
}
```

#### 實際觸發階段

```
① CLI 準備執行 Edit 工具（符合 PreToolUse 的 matcher "Edit|Write|MultiEdit"）
    ↓
② CLI 透過 stdout 送出：
    {
      type: "control_request",
      request_id: "xxx",
      request: {
        subtype: "hook_callback",
        callback_id: "hook_0",
        input: { file_path: "/src/app.js", ... },
        tool_use_id: "xxx"
      }
    }
    ↓
③ Extension readMessages()（第 27527 行）→ handleControlRequest()
    ↓
④ processControlRequest()（第 27617 行）判斷 subtype === "hook_callback"
    ↓
⑤ handleHookCallbacks()（第 27824 行）：
    - 用 callback_id 從 hookCallbacks Map 找到對應函式
    - 執行該函式
    ↓
⑥ Extension 透過 stdin 回傳 control_response 給 CLI
    ↓
⑦ CLI 收到 hook 執行結果後，繼續執行工具
    ↓
⑧ 工具執行完畢後，CLI 再觸發 PostToolUse hook（hook_2）
    重複 ②-⑥ 流程
```

**相關程式碼**：

```javascript
// 第 27824-27828 行
handleHookCallbacks(v, z, U, V) {
  let N = this.hookCallbacks.get(v);  // 用 callback_id 找到對應函式
  if (!N) throw Error(`No hook callback found for ID: ${v}`);
  return N(z, U, { signal: V });      // 執行 hook 函式
}
```

#### 已註冊的 Hook 函式一覽

| callback_id | 時機 | 匹配工具 | 函式 | 功能 |
|-------------|------|---------|------|------|
| `hook_0` | PreToolUse | Edit, Write, MultiEdit | `captureBaseline(input)` | 在修改檔案前記錄原始狀態，用於後續差異比較 |
| `hook_1` | PreToolUse | Edit, Write, Read | `saveFileIfNeeded(input)` | 若 VSCode 中該檔案有未儲存變更，先自動儲存 |
| `hook_2` | PostToolUse | Edit, Write, MultiEdit | `findDiagnosticsProblems(input)` | 修改後檢查 VSCode 診斷問題（linting、型別錯誤等） |

---

### 7.7 OAuth 認證流程

```
使用者登入
    ↓
Extension 開啟 OAuth 授權 URL
    (https://claude.ai/oauth/authorize 或 https://platform.claude.com/oauth/authorize)
    ↓
使用者同意授權
    ↓
取得 access_token（透過 TOKEN_URL）
    ↓
後續所有 API 請求帶入 Authorization: Bearer <token>
```

---

## 8. OAuth 設定

```javascript
CLIENT_ID: "9d1c250a-e61b-44d9-88ed-5944d1962f5e"

// Scopes:
"user:profile"
"user:inference"
"user:sessions:claude_code"
"user:mcp_servers"
"org:create_api_key"
```
