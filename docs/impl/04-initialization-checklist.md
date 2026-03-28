# 啟動流程與必要步驟

## Extension Host 啟動順序

```
1. Extension activate
       │
       ▼
2. 讀取設定（workspace.getConfiguration）
   - selectedModel
   - initialPermissionMode
   - useTerminal（決定 stdio vs WebSocket 模式）
       │
       ▼
3. 執行 Settings Migration（一次性）
   - migrateOldConfigSettings()
   - migrateLastClaudeLocation()
       │
       ▼
4. 初始化 AuthManager
   - 載入儲存的 OAuth token
   - 偵測認證狀態
       │
       ▼
5. 初始化 globalState
   - 讀取以下所有 key（共 11 個）：
     | Key | 用途 |
     |-----|------|
     | `thinkingLevel` | 思考層級（"off" / 其他） |
     | `hiddenSessionIds` | 已刪除（隱藏）的 session ID 列表 |
     | `experimentGates` | 功能旗標（由 CLI MCP notification 更新） |
     | `lastClaudeLocation` | 上次開啟的工作目錄 |
     | `lastClaudeLocationMigrated` | 路徑遷移標記 |
     | `settingsMigrated20251024` | 設定前綴遷移完成標記 |
     | `walkthroughShown` | 是否已顯示 onboarding walkthrough |
     | `showTerminalBanner` | 是否顯示 Terminal 模式提示橫幅 |
     | `chromeExtensionNotificationDismissed` | Chrome Extension 通知是否已關閉 |
     | `reviewUpsellDismissedMetadata` | Review upsell 關閉次數記錄 |
     | `reviewUpsellLastShownTimestamp` | Review upsell 最後顯示時間 |
       │
       ▼
6. 建立 WebviewPanel / SidebarView
       │
       ▼
7. 載入 WebView HTML（含 CSP nonce）
       │
       ▼
8. 等待 WebView 送出 init request（見下方 WebView 啟動）
```

---

## WebView 啟動順序

```
1. WebView HTML 載入完成（index.js 執行）
       │
       ▼
2. acquireVsCodeApi() 取得 postMessage 能力
       │
       ▼
3. 送出 init request
   { type: "init" }
       │
       ▼
4. 等待 init_response
   `init_response.state` 包含以下所有欄位（第 50241-50269 行）：
   | 欄位 | 用途 |
   |------|------|
   | `defaultCwd` | 工作目錄 |
   | `openNewInTab` | 是否在新 Tab 開啟對話 |
   | `showTerminalBanner` | 是否顯示 Terminal 橫幅 |
   | `showReviewUpsellBanner` | 是否顯示 Review 推廣橫幅 |
   | `isOnboardingEnabled` | Onboarding 是否啟用（experiment gate） |
   | `isOnboardingDismissed` | Onboarding 是否已關閉 |
   | `authStatus` | 認證狀態 → 決定顯示登入或主界面 |
   | `modelSetting` | 初始模型選擇 |
   | `thinkingLevel` | 思考層級 |
   | `initialPermissionMode` | 初始權限模式 |
   | `allowDangerouslySkipPermissions` | 是否允許跳過權限 |
   | `platform` | 平台（darwin/linux/win32） |
   | `speechToTextEnabled` | 語音轉文字是否啟用 |
   | `marketplaceType` | Marketplace 類型 |
   | `useCtrlEnterToSend` | 是否使用 Ctrl+Enter 送出 |
   | `chromeMcpState` | Chrome MCP 狀態 |
   | `browserIntegrationSupported` | 是否支援瀏覽器整合 |
   | `debuggerMcpState` | Debugger MCP 狀態 |
   | `jupyterMcpState` | Jupyter MCP 狀態 |
   | `spinnerVerbsConfig` | Spinner 動詞設定 |
   | `settings` | 使用者設定（settings.json 快取） |
   | `claudeSettings` | Claude 設定（~/.claude.json 快取） |
   | `currentRepo` | 當前 Git repo（owner, name） |
       │
       ▼
5. 渲染 UI
   - 若 authStatus 未登入 → 顯示登入畫面
   - 若已登入且無對話 → 顯示空白狀態（Proactive Suggestions）
   - 若有 sessionId → 準備恢復對話
```

---

## CLI 啟動 Checklist

每次 `launch_claude` 時必須依序完成：

### 必要步驟（順序固定）

| 步驟 | 動作 | 失敗處理 |
|------|------|---------|
| 1 | 建立 input stream（`V1`） | — |
| 2 | spawn CLI process | 送 `close_channel(error)` 給 WebView |
| 3 | `channels.set(channelId, {...})` | — |
| 4 | 等待 `initialize` 完成（`initializationResult()`） | timeout 或錯誤 → close channel |
| 5 | `pid` Promise resolve | — |
| 6 | 開始 async 讀取 stdout loop | loop 結束 → close channel |

### 非同步背景任務（不阻塞啟動）

- `generateAndPushProactiveSuggestions(channelId)`（需 `CLAUDE_PROACTIVE_SUGGESTIONS=true`）

### initialize request 必填欄位

```json
{
  "subtype": "initialize",
  "hooks": {},          // 可為空物件
  "sdkMcpServers": [],  // SDK MCP servers（可為空）
  "jsonSchema": {},     // 可為空物件
  "systemPrompt": null, // 可為 null
  "appendSystemPrompt": null,
  "agents": null,
  "promptSuggestions": null
}
```

---

## 認證狀態檢查

WebView 在以下時機需要重新檢查認證狀態：

1. `init` 時（`state.authStatus`）
2. Extension Host 呼叫 `closeAllChannelsWithCredentialChange()` 後，會送 `update_state` 通知
3. WebView 主動送 `get_auth_status`

### 認證狀態結構

```json
{
  "status": "logged_in | logged_out | unknown",
  "account": {
    "emailAddress": "user@example.com"
  }
}
```

---

## 環境變數設定順序

Extension 在 spawn CLI 前會設定以下環境變數：

```
CLAUDE_AGENT_SDK_VERSION = "0.2.71"  // 自動設定
PATH                                  // 繼承系統 PATH
+ claudeCode.environmentVariables     // 使用者自訂
```

若有 `claudeCode.claudeProcessWrapper`（如 `docker run ...`），CLI 命令會被包裝在此指令內執行。
