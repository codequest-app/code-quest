### 7.23 Tab 管理

**方向**：Extension → WebView（推送）/ WebView → Extension（請求）

**用途**：管理 Claude 編輯器面板的多分頁架構，包含建立新分頁與更新分頁狀態。

---

#### 7.23.1 建立新對話分頁（new_conversation_tab）

**位置**：第 68132–68139 行

```
WebView ──(new_conversation_tab { sessionId?, initialPrompt? })──→ Extension
  ↓
執行 VSCode 命令：claude-vscode.editor.open(sessionId, initialPrompt)
  ↓
回傳 { type: "new_conversation_tab_response" }
```

- `sessionId`：可選，指定要恢復的 session
- `initialPrompt`：可選，開啟後自動填入的初始提示

---

#### 7.23.2 更新分頁標題與圖示（rename_tab）

**位置**：第 68141–68152 行

```
WebView ──(rename_tab { title, hasPendingPermissions, hasUnseenCompletion })──→ Extension
  ↓
更新 panelTab.title = title
  ↓
根據狀態選擇圖示：
  hasPendingPermissions = true → claude-logo-pending.svg
  hasUnseenCompletion = true   → claude-logo-done.svg
  其他                         → claude-logo.svg
  ↓
更新 panelTab.iconPath
  ↓
回傳 { type: "rename_tab_response" }
```

---

#### 7.23.3 圖示狀態

| 優先序 | 條件 | 圖示檔案 | 用途 |
|--------|------|---------|------|
| 1 | `hasPendingPermissions` | `claude-logo-pending.svg` | 提示使用者需要授權操作 |
| 2 | `hasUnseenCompletion` | `claude-logo-done.svg` | 提示 AI 已完成回應（使用者尚未查看） |
| 3 | 預設 | `claude-logo.svg` | 正常狀態 |

圖示路徑：`{extensionPath}/resources/{icon}`
