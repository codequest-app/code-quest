# 整體架構

## 元件概覽

```
┌─────────────────────────────────────────────────────────────┐
│  VS Code Process                                             │
│                                                             │
│  ┌─────────────────┐    postMessage    ┌─────────────────┐  │
│  │   WebView       │ ◄──────────────► │ Extension Host  │  │
│  │  (React SPA)    │                  │  (Node.js)      │  │
│  └─────────────────┘                  └────────┬────────┘  │
│                                                │            │
└────────────────────────────────────────────────┼────────────┘
                                                 │ spawn
                                                 ▼
                                    ┌─────────────────────┐
                                    │   Claude CLI        │
                                    │   (subprocess)      │
                                    │                     │
                                    │  stdin ◄── JSON     │
                                    │  stdout ──► JSON    │
                                    └─────────────────────┘
```

## 元件職責

### WebView（前端）
- 渲染對話 UI
- 使用者輸入處理
- 透過 `postMessage` 與 Extension Host 溝通
- **不直接**與 CLI 通訊

### Extension Host（核心）
- 管理一或多個 **Channel**（每個 Channel 對應一個 CLI process）
- 橋接 WebView ↔ CLI 之間的訊息
- 管理認證、設定、工具權限
- 維護 globalState 持久化

**主要類別：`class g$`**（extension.js 核心類別，承擔多個角色）：
- **ChannelManager**：`channels = new Map()`，路由所有 channelId 訊息
- **McpHub**：管理 chromeMcpState / debuggerMcpState / jupyterMcpState
- **AuthManager**：OAuth token 載入與認證狀態偵測
- **SidebarView / WebviewPanel**：透過 `vscode.window.createWebviewPanel` 與 `vscode.window.registerWebviewViewProvider` 建立（UI 層，由 VS Code API 管理，非獨立類別）
- **VirtualFileSystem**：透過 `vscode.workspace.registerFileSystemProvider` 掛載虛擬 URI，供 Diff Editor 顯示原始內容（非獨立類別）

### Claude CLI（子行程）
- 執行 AI 推理
- 透過 stdin 接收指令，透過 stdout 輸出結果
- 每個 Channel 一個獨立的 CLI process

---

## 通訊協議

### WebView ↔ Extension Host

使用 VS Code 的 `webview.postMessage` / `window.acquireVsCodeApi().postMessage`。

**Extension → WebView** 包裝格式：
```json
{ "type": "from-extension", "message": { ...實際訊息 } }
```

**WebView → Extension** 直接送出 JSON，無額外包裝。

訊息分兩類：
- **Request/Response**：有 `requestId`，期待對方回應
- **推送（Push）**：無 `requestId`，單向通知

### Extension Host ↔ CLI

使用 **stdio**（預設）或 **WebSocket JSON-RPC**（Terminal 模式）。

- 每條訊息為 JSON + `\n` 換行
- Extension → CLI：control_request、user input
- CLI → Extension：control_response、stream_event、result、system、control_request...

---

## Channel 概念

**Channel** 是一個邏輯連線，對應一個 CLI subprocess。

- 每個對話 session 對應一個 Channel
- Channel ID 由 WebView 在 `launch_claude` 時隨機產生（`Math.random().toString(36).slice(2)`）
- 多個 Channel 可同時存在（多個對話視窗）
- Channel 包含：
  - `in`：輸入 stream（送給 CLI 的訊息佇列）
  - `query`：CLI process wrapper（控制請求介面）
  - `pid`：CLI process ID（Promise，初始化完成後 resolve）
  - `vscodeMcpServer`：VS Code MCP 伺服器實例
  - `mcpServers`：額外 MCP 伺服器狀態
  - `chromeMcpState`、`debuggerMcpState`、`jupyterMcpState`

---

## VS Code Commands

Extension 註冊以下 command（可透過 Command Palette 或 keybinding 觸發）：

| Command ID | 說明 |
|------------|------|
| `claude-vscode.focus` | 聚焦 Claude 面板 |
| `claude-vscode.window.open` | 開啟 Claude 視窗 |
| `claude-vscode.sidebar.open` | 開啟側邊欄 |
| `claude-vscode.newConversation` | 建立新對話 |
| `claude-vscode.editor.open` | 在 Editor 中開啟指定 session |
| `claude-vscode.editor.openLast` | 開啟最後一個 session |
| `claude-vscode.terminal.open` | 在 terminal 中開啟 Claude |
| `claude-vscode.terminal.open.keyboard` | 同上（鍵盤觸發版） |
| `claude-vscode.blur` | 取消聚焦 |
| `claude-vscode.logout` | 登出 |
| `claude-vscode.showLogs` | 顯示 output panel logs |
| `claude-vscode.openWalkthrough` | 開啟 onboarding walkthrough |
| `claude-vscode.acceptProposedDiff` | 接受 diff 編輯器中的變更 |
| `claude-code.acceptProposedDiff` | 同上（`claude-code.*` 別名） |
| `claude-vscode.rejectProposedDiff` | 拒絕 diff 編輯器中的變更 |
| `claude-code.rejectProposedDiff` | 同上（`claude-code.*` 別名） |
| `claude-vscode.insertAtMention` | 插入 @ mention 項目 |
| `claude-code.insertAtMentioned` | 同上（`claude-code.*` 別名，注意拼寫為 Mentioned） |
| `claude-vscode.primaryEditor.open` | 在主編輯區開啟 Claude 面板 |
| `claude-vscode.installPlugin` | 安裝 plugin（從 marketplace） |

---

## 資料流方向速查

| 動作 | 方向 |
|------|------|
| 使用者輸入文字 | WebView → Extension → CLI stdin |
| AI 回應串流 | CLI stdout → Extension → WebView |
| 工具權限確認 | CLI stdout (control_request) → Extension → WebView → 使用者確認 → Extension → CLI stdin (control_response) |
| 設定變更 | WebView → Extension（儲存） → Extension → WebView (update_state) |
| 取消回應 | WebView → Extension → CLI stdin (interrupt) |
