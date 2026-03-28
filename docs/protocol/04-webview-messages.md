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

### 3.3 具體 Request Subtype

所有 request subtype 透過 `{ type: "request", channelId, requestId, request: { type: "子類型", ... } }` 格式傳送。

來源：`extension.js` 第 47409–47751 行（`processRequest` switch）及 Extension 向 WebView 發送的請求。

#### 3.3.1 Extension → WebView Request（由 Extension 發起，WebView 回應）

##### get_current_selection

```json
{ "type": "get_current_selection" }
// Response:
{ "type": "get_current_selection_response", "selection": "選取的文字" }
```

##### new_conversation_tab

```json
{ "type": "new_conversation_tab", "sessionId": "xxx", "initialPrompt": "初始提示詞" }
// Response:
{ "type": "new_conversation_tab_response" }
```

##### rename_tab

```json
{ "type": "rename_tab", "title": "標題", "hasPendingPermissions": false, "hasUnseenCompletion": true }
// Response:
{ "type": "rename_tab_response" }
```

##### show_notification

```json
{ "type": "show_notification", "message": "訊息", "severity": "error | warning | info", "buttons": ["按鈕1"], "onlyIfNotVisible": true }
// Response:
{ "type": "show_notification_response", "buttonValue": "使用者點擊的按鈕值" }
```

##### tool_permission_request

```json
{ "type": "tool_permission_request", "toolName": "工具名稱", "inputs": {}, "suggestions": {} }
```

##### visibility_changed / selection_changed / font_configuration_changed

```json
{ "type": "visibility_changed", "isVisible": true }
{ "type": "selection_changed", "selection": "新的選取" }
{ "type": "font_configuration_changed", "fontConfig": {} }
```

##### insert_at_mention / create_new_conversation

```json
{ "type": "insert_at_mention", "text": "@mention 文字" }
{ "type": "create_new_conversation" }
```

##### open_plugins_dialog

```json
{ "type": "open_plugins_dialog", "pluginName": "插件名稱", "marketplaceSource": "來源" }
```

##### proactive_suggestions_update

**推送，無需 Response**。觸發時機：`launchClaude()` 啟動時，需 `CLAUDE_PROACTIVE_SUGGESTIONS=true`。

```json
{
  "type": "proactive_suggestions_update",
  "suggestions": [
    { "title": "簡短標題", "description": "具體描述", "prompt": "填入輸入框的 prompt" }
  ]
}
```

##### usage_update

**推送，無需 Response**。

```json
{ "type": "usage_update", "utilization": {}, "error": "錯誤訊息（可選）" }
```

##### auth_url

**推送，無需 Response**。登入流程中通知 WebView 開啟 OAuth URL。

```json
{ "type": "auth_url", "url": "OAuth 手動重導向 URL", "method": "登入方式" }
```

#### 3.3.2 WebView → Extension Request（由 WebView 發起，Extension 回應）

##### 初始化與狀態

| Request | 參數 | Response |
|---------|------|----------|
| `init` | （無） | `init_response` — 含 `state`：`defaultCwd`、`authStatus`、`modelSetting`、`thinkingLevel`、`initialPermissionMode`、`platform`、`speechToTextEnabled`、`chromeMcpState`、`spinnerVerbsConfig`、`currentRepo`、`isOnboardingDismissed` 等 |
| `get_claude_state` | （無） | `get_claude_state_response` — 含 `config` |
| `get_auth_status` | （無） | `get_auth_status_response` — 含 `status` |
| `login` | `method` | `login_response` — 含 `auth` |
| `submit_oauth_code` | `code` | `submit_oauth_code_response` |

##### Session 管理

| Request | 參數 | Response |
|---------|------|----------|
| `list_sessions_request` | （無） | session 列表 |
| `list_remote_sessions` | （無） | 遠端 session 列表 |
| `get_session_request` | `sessionId` | session 詳細資料 |
| `teleport_session` | `sessionId` | teleport 結果 |
| `fork_conversation` | `forkedFromSession`、`resumeSessionAt` | `fork_conversation_response` — 含 `sessionId` |
| `rewind_code` | `userMessageId`、`dryRun` | `rewind_code_response` — 含回退結果 |

##### 模型與權限設定

| Request | 參數 | Response |
|---------|------|----------|
| `set_permission_mode` | `mode` | 設定結果 |
| `set_model` | `model` | 設定結果（含 `success`、`error`） |
| `set_thinking_level` | `thinkingLevel` | 設定結果 |
| `apply_settings` | `settings`（物件） | `apply_settings_response` |
| `request_usage_update` | （無） | `request_usage_update_response` |

**apply_settings**：將任意設定鍵值合併寫入 `~/.claude/settings.json`，並呼叫 `query.applyFlagSettings()` 立即套用至執行中的 CLI（含實驗標誌）。需要有效的 `channelId`。

##### MCP 伺服器管理

| Request | 參數 | Response |
|---------|------|----------|
| `get_mcp_servers` | （無） | MCP 伺服器列表 |
| `set_mcp_server_enabled` | `serverName`、`enabled` | 設定結果 |
| `reconnect_mcp_server` | `serverName` | 重連結果 |
| `authenticate_mcp_server` | `serverName` | `{ type: "authenticate_mcp_server", ... }` — 啟動 MCP 伺服器 OAuth 認證流程 |
| `clear_mcp_server_auth` | `serverName` | 清除 MCP 伺服器的已儲存 OAuth 憑證 |

> `authenticate_mcp_server` 與 `clear_mcp_server_auth` 需要有效的 `channelId`，基礎實作回傳 "OAuth service not available in this context"，由具備 OAuth 服務的子類別覆寫實作。

##### 瀏覽器 / Debugger / Jupyter 整合

| Request | 參數 | Response |
|---------|------|----------|
| `ensure_chrome_mcp_enabled` | （無） | `wasDisabled` |
| `disable_chrome_mcp` | （無） | 結果 |
| `create_new_browser_tab` | （無） | `tabGroupId`、`tabId` |
| `ask_debugger_help` | （無） | 結果 |
| `enable_jupyter_mcp` | （無） | 結果 |
| `disable_jupyter_mcp` | （無） | 結果 |

##### 檔案與編輯器操作

| Request | 參數 | Response |
|---------|------|----------|
| `open_file` | `filePath`、`location` | `open_file_response` |
| `open_diff` | `originalFilePath`、`newFilePath`、`edits`、`supportMultiEdits` | diff 結果 |
| `open_content` | `content`、`fileName`、`editable` | 結果 |
| `open_markdown_preview` | `channelId`、`content`、`title`、`enableComments` | `open_markdown_preview_response` |
| `open_file_diffs` | `fileDiffs` | `open_file_diffs_response` |
| `list_files_request` | `pattern` | `list_files_response` — 含 `files` |
| `get_terminal_contents` | `terminalName` | `get_terminal_contents_response` — 含 `content` |

##### Plan Comment 管理

| Request | 參數 | Response |
|---------|------|----------|
| `get_plan_comments` | `channelId` | `get_plan_comments_response` — 含 `comments` |
| `remove_plan_comment` | `channelId`、`commentId` | `remove_plan_comment_response` |
| `close_plan_preview` | `channelId` | `close_plan_preview_response` |

##### Session 操作（v2.1.63 新增）

| Request | 參數 | Response |
|---------|------|----------|
| `rename_session` | `sessionId`、`title` | `rename_session_response` |
| `delete_session` | `sessionId` | `delete_session_response` |
| `open_in_editor` | `sessionId` | `open_in_editor_response` |
| `update_session_state` | `sessionId`、`state`、`title` | `update_session_state_response` |

- **rename_session**：重新命名對話，會在 JSONL 寫入 `custom-title` 事件
- **delete_session**：隱藏對話（透過 settings 的 `hideSession()`，非真正刪除）
- **open_in_editor**：在 VSCode 編輯器中開啟對話（執行 `claude-vscode.editor.open` 命令）
- **update_session_state**：更新對話狀態，觸發 `onSessionStateChanged` 回調

##### MCP OAuth（v2.1.63 新增）

| Request | 參數 | Response |
|---------|------|----------|
| `submit_mcp_oauth_callback_url` | `channelId`（隱含）、`serverName`、`callbackUrl` | `submit_mcp_oauth_callback_url`（含可選 `error`） |

透過 WebView 提交 MCP OAuth callback URL，內部呼叫 `query.mcpSubmitOAuthCallbackUrl()`。

##### Git 操作

| Request | 參數 | Response |
|---------|------|----------|
| `checkout_branch` | `branch` | 結果（含 `success`、`error`） |
| `check_git_status` | （無） | `isClean`、`changedFiles` |
| `update_skipped_branch` | `sessionId`、`branch`、`failed` | 結果 |
| `exec` | `command`、`params` | 執行結果 |

##### 終端機與 UI 操作

| Request | 參數 | Response |
|---------|------|----------|
| `open_terminal` | `executable`、`args`、`cwd`、`location` | `open_terminal_response` |
| `open_claude_in_terminal` | `prompt`、`args`、`location` | `open_claude_in_terminal_response` |
| `show_claude_terminal_setting` | （無） | `show_claude_terminal_setting_response` |
| `open_url` | `url` | `open_url_response` |
| `open_config_file` | `configType` | `open_config_file_response` |
| `open_config` | `searchString` | `open_config_response` |
| `open_help` | （無） | `open_help_response` |
| `open_output_panel` | （無） | `open_output_panel_response` |
| `open_folder` | （無） | `open_folder_response` — 含 `opened` |
| `get_asset_uris` | （無） | `asset_uris_response` — 含 `assetUris` |

##### UI 狀態管理

| Request | 參數 | Response |
|---------|------|----------|
| `dismiss_terminal_banner` | （無） | `dismiss_terminal_banner_response` |
| `dismiss_review_upsell_banner` | `metadata` | `dismiss_review_upsell_banner_response` |
| `dismiss_onboarding` | `dismissType` | `dismiss_onboarding_response` |
| `log_event` | `eventName`、`eventData` | `log_event_response` |

##### Plugin 管理

| Request | 參數 | Response |
|---------|------|----------|
| `list_plugins` | `includeAvailable` | plugin 列表 |
| `install_plugin` | `pluginId`、`scope` | 安裝結果 |
| `uninstall_plugin` | `pluginId` | 移除結果 |
| `set_plugin_enabled` | `pluginId`、`enabled` | 設定結果 |
| `list_marketplaces` | （無） | marketplace 列表 |
| `add_marketplace` | `source` | 新增結果 |
| `remove_marketplace` | `marketplaceId` | 移除結果 |
| `refresh_marketplace` | `marketplaceId` | 刷新結果 |

---

### 3.4 WebView → Extension 訊息

#### launch_claude

啟動新的 Claude CLI session。

```json
{
  "type": "launch_claude",
  "channelId": "隨機頻道ID",
  "resume": "session-uuid 或 null（恢復既有 session）",
  "cwd": "/工作目錄路徑",
  "model": "claude-sonnet-4-6-20250514（模型選擇）",
  "permissionMode": "default | plan | ...（權限模式）",
  "thinkingLevel": "off | low | medium | high（思考層級）"
}
```

**呼叫來源**（webview/index.js — connection）：

```javascript
launchClaude($, J, Z, Y, X, Q) {
  let G = new $D;
  this.streams.set($, G);
  this.send({
    type: "launch_claude",
    channelId: $,    // 隨機頻道 ID
    resume: J,       // session ID（恢復）或 null（新建）
    cwd: Z,          // 工作目錄
    model: Y,        // 模型選擇
    permissionMode: X, // 權限模式
    thinkingLevel: Q   // 思考層級
  });
  return G;  // 回傳 stream，用於接收 CLI 輸出
}
```

**Session 端呼叫時機**（webview/index.js — session.launchClaude()）：

```javascript
async launchClaude() {
  if (this.claudeChannelId) return this.claudeChannelId; // 已啟動則跳過
  let $ = Math.random().toString(36).slice(2);           // 產生隨機 channelId
  this.claudeChannelId = $;
  let J = await this.getConnection();
  // 使用 session 的當前設定
  let Z = J.launchClaude(
    $,
    this.sessionId.value,       // resume
    this.cwd.value,             // cwd
    this.modelSelection.value,  // model
    this.permissionMode.value,  // permissionMode
    this.thinkingLevel.value    // thinkingLevel
  );
  this.readMessages(Z);  // 開始讀取 CLI 輸出
}
```

#### close_channel

關閉頻道，結束 CLI session。

```json
{
  "type": "close_channel",
  "channelId": "頻道ID",
  "error": "錯誤訊息（可選）"
}
```

- **WebView → Extension**（主動關閉）：WebView 發送 `close_channel`，Extension 呼叫 `channel.in.done()` 關閉 input stream，再呼叫 `channel.query.return()` 清理 CLI process
- **Extension → WebView**（被動通知）：Extension 關閉頻道時（`z = true`），會發送 `close_channel` 通知 WebView，WebView 收到後結束對應的 stream；若有 `error` 欄位，stream 會以 error 結束

```javascript
// extension.js 第 47170–47183 行
async closeChannel(v, z, U) {
  if (z) this.send({ type: "close_channel", channelId: v, error: U }); // 通知 WebView
  let V = this.channels.get(v);
  if (V) {
    V.in.done();           // 關閉 input stream
    await V.query.return(); // 清理 CLI process
    this.channels.delete(v);
  }
}
```

#### interrupt_claude

中斷當前 AI 回應。

```json
{
  "type": "interrupt_claude",
  "channelId": "頻道ID"
}
```

#### io_message

傳送使用者訊息（或排隊訊息）給 CLI。

```json
{
  "type": "io_message",
  "channelId": "頻道ID",
  "message": { "type": "user", "...": "訊息內容" },
  "done": false
}
```

- `done: true` 時表示輸入結束，Extension 會呼叫 `channel.in.done()` 關閉 input stream

#### start_speech_to_text / stop_speech_to_text

```json
{ "type": "start_speech_to_text", "channelId": "頻道ID" }
{ "type": "stop_speech_to_text", "channelId": "頻道ID" }
```

#### cancel_request

取消進行中的請求。雙向使用。

```json
{
  "type": "cancel_request",
  "targetRequestId": "要取消的 requestId"
}
```

- **Extension → WebView**：當 CLI 發送 `control_cancel_request` 導致 abort 時，Extension 的 `sendRequest()` 會發送 `cancel_request` 通知 WebView 取消對應的請求（如正在等待的權限對話框）
- **WebView → Extension**：WebView 取消進行中的請求時，Extension 的 `handleCancellation()` 會呼叫對應的 `AbortController.abort()`

```javascript
// extension.js 第 47127–47130 行 — Extension → WebView（abort 時自動取消）
let x = () => {
  this.outstandingRequests.delete(V),
    this.send({ type: "cancel_request", targetRequestId: V }),
    K(Error(U.reason || "aborted"));
};

// extension.js 第 48029–48032 行 — WebView → Extension
handleCancellation(v) {
  let z = this.abortControllers.get(v);
  if (z) z.abort();
}
```

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

### 3.5 Extension → WebView 推送訊息（非 Request/Response）

以下訊息由 Extension 直接透過 `send()` 推送至 WebView，不經過 Request/Response 包裝。

#### file_updated（檔案變更通知）

**位置**：第 47022–47028 行

當編輯器中的檔案被修改時，Extension 通知 WebView：

```json
{
  "type": "file_updated",
  "channelId": "頻道 ID",
  "filePath": "/path/to/file",
  "oldContent": "修改前的內容",
  "newContent": "修改後的內容"
}
```

#### speech_to_text_message（語音轉文字串流）

**位置**：第 68624–68629 行

語音辨識過程中，逐段串流轉錄結果至 WebView：

```json
{
  "type": "speech_to_text_message",
  "channelId": "頻道 ID",
  "text": "辨識到的文字片段",
  "done": false
}
```

- `done: false`：串流中，持續接收
- `done: true`：辨識完成（由 `closeSpeechToTextChannel` 發送）

#### plan_comment（Plan 評論推送）

**位置**：第 68413 行

使用者在 Plan 預覽面板新增評論時，Extension 推送至 WebView：

```json
{
  "type": "plan_comment",
  "channelId": "頻道 ID",
  "comment": {
    "id": "comment-唯一ID",
    "selectedText": "被注釋的文字",
    "sectionHeading": "章節標題",
    "comment": "評論內容"
  }
}
```

> 與 §3.4 的 `comment`（WebView → Extension）方向相反，此為 Extension → WebView 的推送。

#### removeComment（移除 Plan 評論）

**位置**：第 68433 行

Extension 通知 Plan 預覽面板的 WebView 移除指定評論：

```json
{
  "type": "removeComment",
  "commentId": "要移除的 comment ID"
}
```

> 此訊息直接透過 Plan 預覽面板的 `webview.postMessage()` 發送，不經過主 WebView 的 `from-extension` 包裝。

#### update_state（狀態推送）

**位置**：第 48122–48134 行

Extension 透過 `pushStateUpdate()` 將完整狀態與設定推送至 WebView，使用 Request 格式但不期待回應：

```json
{
  "type": "request",
  "channelId": "",
  "requestId": "xxx",
  "request": {
    "type": "update_state",
    "state": {
      "defaultCwd": "/path/to/workspace",
      "authStatus": { ... },
      "channels": { ... }
    },
    "config": { ... }
  }
}
```

---

