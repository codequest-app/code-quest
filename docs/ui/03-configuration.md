# 03 — 設定、Context Keys、內部狀態

## 設定項（Configuration）

| 設定 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `claudeCode.selectedModel` | string | `"default"` | AI 模型選擇 |
| `claudeCode.environmentVariables` | array | `[]` | 啟動 Claude 時的環境變數 |
| `claudeCode.useTerminal` | boolean | `false` | 使用終端模式而非原生 UI |
| `claudeCode.allowDangerouslySkipPermissions` | boolean | — | 允許跳過權限（僅建議無網路沙箱使用） |
| `claudeCode.claudeProcessWrapper` | string | — | 自訂 Claude 程序啟動的可執行檔路徑 |
| `claudeCode.respectGitIgnore` | boolean | `true` | 搜尋檔案時遵循 `.gitignore` |
| `claudeCode.initialPermissionMode` | string | — | 初始權限模式 |
| `claudeCode.disableLoginPrompt` | boolean | — | 停用登入提示 |
| `claudeCode.autosave` | boolean | — | 自動儲存 |
| `claudeCode.useCtrlEnterToSend` | boolean | — | 使用 Ctrl+Enter 送出訊息 |
| `claudeCode.preferredLocation` | string | — | 偏好的開啟位置（sidebar / editor） |
| `claudeCode.enableNewConversationShortcut` | boolean | — | 啟用 Cmd+N 新對話快捷鍵 |
| `claudeCode.hideOnboarding` | boolean | — | 隱藏新手引導 |
| `claudeCode.usePythonEnvironment` | boolean | — | 使用 Python 環境（整合 ms-python 擴充套件） |

---

## Context Keys（條件判斷）

Extension 設定的 VS Code Context Keys，用於控制 UI 元素的顯示/隱藏：

| Context Key | 用途 |
|-------------|------|
| `claude-code:doesNotSupportSecondarySidebar` | 判斷 VS Code 版本是否支援次要側邊欄 |
| `claude-vscode.viewingProposedDiff` | 是否正在查看 AI 建議的 diff（控制 Accept/Reject 按鈕顯示） |
| `claude-code.viewingProposedDiff` | 同上（Terminal 模式使用的 legacy key） |
| `claude-vscode.sessionsListEnabled` | 是否啟用 Sessions List 側邊欄 |
| `claude-vscode.updateSupported` | 是否支援擴充套件更新指令 |
| `claude-vscode.primaryEditorEnabled` | 是否顯示 Primary Editor 指令 |
| `claude-vscode.sideBarActive` | 側邊欄是否為活動狀態 |

---

## GlobalState 儲存的內部狀態

除了 VS Code Configuration 設定外，Extension 還使用 `context.globalState` 儲存以下內部狀態：

| Key | 用途 |
|-----|------|
| `thinkingLevel` | 思考層級（`default_on` / `disabled` / `adaptive`） |
| `walkthroughShown` | 是否已顯示新手引導 |
| `hiddenSessionIds` | 被刪除/隱藏的 Session ID 列表 |
| `settingsMigrated20251024` | 設定遷移是否已完成 |
| `lastClaudeLocationMigrated` | 位置偏好遷移是否已完成 |

---

## Settings Migration

Extension 啟動時執行 `SG.migrateAllSettings()`，包含：
- **`migrateOldConfigSettings()`**：將舊 `claude-code.*` 前綴的設定遷移至新 `claudeCode.*` 前綴（一次性，透過 `settingsMigrated20251024` flag 控制）
- **`migrateLastClaudeLocation()`**：遷移 `lastClaudeLocation` 偏好設定

---

## 事件監聽（Configuration Change）

Extension 監聽以下設定變更並即時反映：

| 設定變更 | 反應 |
|----------|------|
| `claudeCode.respectGitIgnore` | 清除檔案搜尋快取 |
| `chat.fontSize` / `chat.fontFamily` | 通知所有 Webview 更新字型設定 |
| `chat.editor.fontSize` / `fontFamily` / `fontWeight` | 同上 |

---

## JSON Schema 驗證

Extension 為以下檔案提供 JSON Schema 驗證（`claude-code-settings.schema.json`）：

- `**/.claude/settings.json`
- `**/.claude/settings.local.json`
- `**/ClaudeCode/managed-settings.json`
- `**/claude-code/managed-settings.json`

Schema 涵蓋 60+ 個 Claude Code CLI 設定項，包括 `model`、`permissions`、`hooks`、`env`、`sandbox`、`mcpServers` 等。
