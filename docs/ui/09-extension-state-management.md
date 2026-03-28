## 9. Extension 狀態管理

### 9.1 globalState 鍵值對

Extension 使用 VS Code 的 `context.globalState` 持久化儲存以下狀態，跨 session 保留：

| 鍵名 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `thinkingLevel` | `string` | `"default_on"` | 使用者的思考層級設定（`default_on` / `disabled` / `adaptive`） |
| `hiddenSessionIds` | `string[]` | `[]` | 隱藏的 session ID 陣列（`delete_session` 不真正刪除，只是加入此清單） |
| `experimentGates` | `object` | `{}` | 實驗旗標儲存，由 CLI notification 推送更新（如 `tengu_vscode_onboarding`、`tengu_vscode_review_upsell`） |
| `showTerminalBanner` | `boolean` | `true` | 是否顯示 Terminal 模式提示橫幅 |
| `reviewUpsellDismissedMetadata` | `object` | `undefined` | 使用者關閉評論提示時儲存的 metadata |
| `reviewUpsellLastShownTimestamp` | `number` | `undefined` | 上次顯示評論提示的時間戳（毫秒） |
| `chromeExtensionNotificationDismissed` | `boolean` | `false` | Chrome MCP 安裝通知是否已關閉 |
| `walkthroughShown` | `boolean` | `false` | 是否已顯示新使用者 walkthrough 引導 |
| `settingsMigrated20251024` | `boolean` | `false` | 設定命名空間遷移完成標記 |
| `lastClaudeLocationMigrated` | `boolean` | `false` | 位置設定遷移完成標記 |

---

### 9.2 Settings Migration

Extension 啟動時執行 `migrateAllSettings()` 做兩項一次性遷移：

#### 遷移 1：設定命名空間（`settingsMigrated20251024`）

將舊的 `claude-code.*` 設定鍵遷移至 `claudeCode.*`：

| 舊鍵 | 新鍵 |
|------|------|
| `claude-code.selectedModel` | `claudeCode.selectedModel` |
| `claude-code.environmentVariables` | `claudeCode.environmentVariables` |
| `claude-code.useTerminal` | `claudeCode.useTerminal` |
| `claude-code.allowDangerouslySkipPermissions` | `claudeCode.allowDangerouslySkipPermissions` |
| `claude-code.claudeProcessWrapper` | `claudeCode.claudeProcessWrapper` |
| `claude-code.respectGitIgnore` | `claudeCode.respectGitIgnore` |

遷移後設定 `settingsMigrated20251024 = true`，下次啟動跳過此遷移。

#### 遷移 2：位置設定（`lastClaudeLocationMigrated`）

將舊的 `lastClaudeLocation` 整數值遷移至 `preferredLocation` 字串值：

| 舊值（整數） | 新值（字串） |
|------------|------------|
| `0` | `"sidebar"` |
| 非 `0` | `"panel"` |

遷移後設定 `lastClaudeLocationMigrated = true`，舊鍵清除。

---

### 9.3 workspace.getConfiguration 設定

Extension 讀寫的 VS Code 設定（`claudeCode.*`），使用 `workspace.getConfiguration("claudeCode")` 存取：

| 設定鍵 | 類型 | 說明 |
|--------|------|------|
| `selectedModel` | `string` | 選擇的 AI 模型（`"default"` 表示使用 CLI 預設） |
| `initialPermissionMode` | `string` | 初始權限模式（`"default"` / `"plan"` / `"bypassPermissions"`） |
| `allowDangerouslySkipPermissions` | `boolean` | 允許略過所有工具權限確認 |
| `useCtrlEnterToSend` | `boolean` | 使用 Ctrl+Enter 送出訊息（而非 Enter） |
| `hideOnboarding` | `boolean` | 隱藏新手引導 |
| `preferredLocation` | `string` | Claude 面板位置（`"sidebar"` / `"panel"`） |
| `environmentVariables` | `object` | 傳給 CLI subprocess 的額外環境變數 |
| `claudeProcessWrapper` | `string` | 包裝 CLI 執行的指令（如 `docker run ...`） |
| `respectGitIgnore` | `boolean` | 是否遵守 `.gitignore`（預設 `true`） |
| `useTerminal` | `boolean` | 使用 Terminal 模式（WebSocket JSON-RPC）而非 stdio |

---
