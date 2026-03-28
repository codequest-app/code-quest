### 7.13 Chrome MCP / Jupyter MCP 生命週期

**用途**：Extension 可動態為 CLI 新增或移除 MCP 伺服器，實現瀏覽器操控（Chrome MCP）和 Jupyter notebook 互動（Jupyter MCP）。

---

#### 7.13.1 共通機制：動態 MCP 伺服器管理

所有 MCP 整合的核心是 `Query.setMcpServers(servers)`（第 27747–27766 行），它：

1. 將新的伺服器字典與既有伺服器比較
2. 斷開已移除的 SDK 伺服器
3. 連接新增的 SDK 伺服器
4. 發送 `control_request` 至 CLI：

```json
{
  "type": "control_request",
  "request_id": "xxx",
  "request": {
    "subtype": "mcp_set_servers",
    "servers": {
      "claude-in-chrome": { "type": "stdio", "command": "...", "args": ["--claude-in-chrome-mcp"] },
      "claude-vscode-extension": { "type": "sdk", "name": "claude-vscode-extension" }
    }
  }
}
```

---

#### 7.13.2 Chrome MCP（瀏覽器整合）

##### 前置條件

**位置**：第 68900–68905 行

```javascript
isBrowserIntegrationSupported() {
  return authMethod === "claudeai"          // 必須以 Claude AI 登入
    && experimentGates.tengu_quiet_fern;    // 必須啟用 experiment gate
}
```

##### 狀態機

```
disconnected ──(ensure_chrome_mcp_enabled)──→ connecting
                                                  ↓
                                          setMcpServers 成功?
                                         ↙            ↘
                                   connected        error { error: msg }
                                        ↓                  ↓
                              (disable_chrome_mcp)    (可重試 ensure)
                                        ↓
                                  disconnected
```

| 狀態 | 格式 |
|------|------|
| `disconnected` | `{ status: "disconnected" }` |
| `connecting` | `{ status: "connecting" }` |
| `connected` | `{ status: "connected" }` |
| `error` | `{ status: "error", error: "錯誤訊息" }` |

##### 啟用流程（ensure_chrome_mcp_enabled）

**位置**：第 47306–47337 行（基底類別）、第 68849–68876 行（VSCode 子類別）

```
WebView ──(ensure_chrome_mcp_enabled { channelId })──→ Extension
  ↓
[VSCode only] macOS 上檢查 Chrome 擴展是否安裝
  ├── 未安裝 → 顯示安裝提示對話框
  └── 已安裝或非 macOS → 繼續
  ↓
設定 chromeMcpState = { status: "connecting" }
  ↓
pushChannelStateUpdate() → 通知 WebView 狀態變更
  ↓
取得 Chrome MCP 設定：
  {
    type: "stdio",
    command: "<claude-binary-path>",
    args: ["--claude-in-chrome-mcp"]
  }
  ↓
合併至 mcpServers["claude-in-chrome"]
  ↓
query.setMcpServers(mergedServers) → 通知 CLI
  ↓
成功 → chromeMcpState = { status: "connected" }
失敗 → chromeMcpState = { status: "error", error: msg }
  ↓
pushChannelStateUpdate() → 通知 WebView 最終狀態
  ↓
回傳 { type: "ensure_chrome_mcp_enabled_response", wasDisabled: boolean }
```

##### 停用流程（disable_chrome_mcp）

**位置**：第 47338–47364 行

```
WebView ──(disable_chrome_mcp { channelId })──→ Extension
  ↓
從 mcpServers 中移除 "claude-in-chrome"
  ↓
query.setMcpServers(remainingServers) → 通知 CLI
  ↓
chromeMcpState = { status: "disconnected" }
  ↓
pushChannelStateUpdate()
  ↓
若先前為 connected → 注入合成訊息通知 AI：
  {
    type: "user",
    isSynthetic: true,
    parent_tool_use_id: null,
    message: {
      role: "user",
      content: "[Browser disconnected: The browser connection has been closed. Browser tools are no longer available.]"
    }
  }
  ↓
回傳 { type: "disable_chrome_mcp_response", wasEnabled: boolean }
```

> **合成訊息**：`isSynthetic: true` 標記此訊息非真實使用者輸入，以 `[...]` 包裹內容。目的是讓 AI 知道瀏覽器工具已不可用。

##### 建立新瀏覽器分頁（create_new_browser_tab）

**位置**：第 68882–68887 行

```
WebView ──(create_new_browser_tab)──→ Extension
  ↓
建立 ChromeMcpClient（若不存在）
  ↓
呼叫 Chrome MCP tool: tabs_context_mcp { createIfEmpty: true }
  ↓
回傳 { type: "create_new_browser_tab_response", tabGroupId, tabId }
```

---

#### 7.13.3 Jupyter MCP（Notebook 整合）

##### 狀態機

```
inactive ──(偵測到 notebook)──→ available { notebookCount, isActiveEditorNotebook }
                                    ↓
                          (enable_jupyter_mcp)
                                    ↓
                                  active
                                    ↓
                          (disable_jupyter_mcp)
                                    ↓
                          有 notebook? → available
                          無 notebook? → inactive

任何狀態 ──(enable 失敗)──→ error { error: msg }
active/available ──(所有 notebook 關閉)──→ inactive
```

| 狀態 | 格式 |
|------|------|
| `inactive` | `{ status: "inactive" }` |
| `available` | `{ status: "available", notebookCount: number, isActiveEditorNotebook: boolean }` |
| `active` | `{ status: "active" }` |
| `error` | `{ status: "error", error: "錯誤訊息" }` |

##### 啟用流程（enable_jupyter_mcp）

**位置**：第 69027–69059 行

```
WebView ──(enable_jupyter_mcp { channelId })──→ Extension
  ↓
合併 mcpServers["claude-vscode-extension"] = extensionMcpServer.config
  ↓
query.setMcpServers(mergedServers) → 通知 CLI
  ↓
成功 → jupyterMcpState = { status: "active" }
失敗 → jupyterMcpState = { status: "error", error: msg }
  ↓
pushChannelStateUpdate()
  ↓
回傳 { type: "enable_jupyter_mcp_response" }
```

##### 停用流程（disable_jupyter_mcp）

**位置**：第 69060–69087 行

```
WebView ──(disable_jupyter_mcp { channelId })──→ Extension
  ↓
從 mcpServers 中移除 "claude-vscode-extension"
  ↓
query.setMcpServers(remainingServers) → 通知 CLI
  ↓
檢查是否仍有 notebook 開啟：
  有 → jupyterMcpState = { status: "available", notebookCount, isActiveEditorNotebook }
  無 → jupyterMcpState = { status: "inactive" }
  ↓
pushChannelStateUpdate()
  ↓
回傳 { type: "disable_jupyter_mcp_response" }
```

##### 自動狀態更新

**位置**：第 69088–69113 行

Extension 監聽 VSCode 的 notebook 開啟/關閉事件，自動呼叫 `updateJupyterStateForAllChannels(state)` 更新所有頻道的 Jupyter 狀態：

- notebook 開啟 → `inactive` 變為 `available`，或更新 `notebookCount`
- 所有 notebook 關閉 → `active` 或 `available` 變為 `inactive`

---

#### 7.13.4 狀態傳遞至 WebView

MCP 整合狀態透過以下訊息傳遞至 WebView：

**init_response**（初始化，第 47443–47447 行）：

```json
{
  "type": "init_response",
  "state": {
    "chromeMcpState": { "status": "disconnected" },
    "jupyterMcpState": { "status": "available", "notebookCount": 2, "isActiveEditorNotebook": true },
    "browserIntegrationSupported": true
  }
}
```

**update_state**（狀態變更，第 48163–48178 行）：

每次狀態變更後呼叫 `pushChannelStateUpdate(channelId)`，將該頻道的 `chromeMcpState`、`jupyterMcpState` 推送至 WebView。

---

#### 7.13.5 Chrome MCP vs Jupyter MCP 對比

| 特性 | Chrome MCP | Jupyter MCP |
|------|-----------|-------------|
| MCP 伺服器名稱 | `claude-in-chrome` | `claude-vscode-extension` |
| 伺服器類型 | `stdio`（啟動獨立程序） | `sdk`（Extension 內建） |
| 前置條件 | claudeai 登入 + experiment gate | 有開啟的 notebook |
| 停用時合成訊息 | 有（通知 AI 瀏覽器不可用） | 無 |
| 自動狀態偵測 | 無（需手動啟用） | 有（自動偵測 notebook 開啟/關閉） |
| 狀態數 | 4（disconnected/connecting/connected/error） | 4（inactive/available/active/error） |

---

#### 7.13.6 MCP OAuth 認證流程（v2.1.63 新增）

**用途**：支援需要 OAuth 認證的 MCP 伺服器（如 Anthropic 託管的 MCP 伺服器）。

##### 認證流程

```
WebView ──(get_mcp_servers)──→ Extension
  ↓
伺服器需要認證（authUrl 存在）
  ↓
Extension 構建認證 URL：
  {baseUrl}/api/organizations/{orgId}/mcp/start-auth/{serverId}
  （serverId: "mcprs" 前綴替換為 "mcpsrv"）
  ↓
WebView 開啟認證 URL（瀏覽器）
  ↓
使用者完成 OAuth 授權
  ↓
瀏覽器重導向至 callback URL
  ↓
WebView ──(submit_mcp_oauth_callback_url { serverName, callbackUrl })──→ Extension
  ↓
Extension ──(mcp_oauth_callback_url control_request)──→ CLI
  ↓
CLI 完成認證 → 回傳結果
  ↓
Extension → WebView：{ type: "submit_mcp_oauth_callback_url" }（或含 error）
```

##### 相關 Control Request

| Subtype | 用途 |
|---------|------|
| `mcp_authenticate` | 觸發 MCP 伺服器 OAuth 認證，取得認證 URL |
| `mcp_clear_auth` | 清除已儲存的 MCP 認證資訊 |
| `mcp_oauth_callback_url` | 提交 OAuth callback URL 完成授權 |

##### 相關 WebView Request

| Subtype | 用途 |
|---------|------|
| `submit_mcp_oauth_callback_url` | WebView 提交 callback URL 至 Extension |
