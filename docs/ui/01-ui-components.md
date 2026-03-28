# 01 — UI 元件詳細說明

## 1. Main Chat Panel (`claudeVSCodePanel`)

**外觀**：以編輯器分頁形式開啟，標題為「Claude Code」，圖示為 `resources/claude-logo.svg`。內部渲染一個 React SPA，掛載於 `<div id="root">`。

**功能**：
- 與 Claude AI 進行多輪對話
- 支援多 Session 同時開啟（每個 Session 一個分頁，透過 `Map<sessionId, panel>` 管理）
- 支援 Full Editor 模式（`IS_FULL_EDITOR=true`，佔滿整個編輯區）
- 面板關閉後可透過 `registerWebviewPanelSerializer` 恢復狀態
- `retainContextWhenHidden: true` 保持隱藏時的狀態

**Panel 圖示狀態變化**：

| 狀態 | 圖示檔案 | 說明 |
|------|----------|------|
| 一般 | `resources/claude-logo.svg` | 預設圖示 |
| 等待權限確認 | `resources/claude-logo-pending.svg` | 有未處理的權限請求 |
| 完成但未查看 | `resources/claude-logo-done.svg` | AI 回應完成，使用者尚未查看 |

**對應指令**：
- `claude-vscode.editor.open` — 開啟新對話
- `claude-vscode.editor.openLast` — 開啟最近的對話
- `claude-vscode.primaryEditor.open` — Full Editor 模式

---

## 2 & 3. Sidebar（Secondary / Activity Bar）

**外觀**：在側邊欄中顯示與 Chat Panel 相同的對話 UI（`IS_SIDEBAR=true`），佈局較緊湊。

- **Secondary Sidebar**（`claudeVSCodeSidebarSecondary`）：VS Code ≥ 1.106 時使用右側次要側邊欄
- **Activity Bar Sidebar**（`claudeVSCodeSidebar`）：VS Code < 1.106 時 fallback 到左側活動列

兩者共用同一個 Provider 實例（`EF` class）。

**對應指令**：`claude-vscode.sidebar.open`

---

## 4. Sessions List（`claudeVSCodeSessionsList`）

**外觀**：在活動列中顯示所有 Claude 對話 Session 的列表。

**功能**：
- 列出所有進行中的 Session
- 顯示 badge 數字（例如「2 sessions waiting for input」）
- 點擊可切換至對應 Session
- 透過 `window.IS_SESSION_LIST_ONLY = true` 渲染為精簡的列表模式

**啟用條件**：`claude-vscode.sessionsListEnabled` context 為 true

---

## 5. Plan Preview（`claudePlanPreview`）

**外觀**：獨立的編輯器分頁，以 HTML 渲染 Claude 產生的方案/計畫文件。

**功能**：
- 將 Markdown 方案渲染為 HTML
- **互動式留言**：選取文字後出現浮動按鈕，可針對特定段落提交評論
- 評論透過 `postMessage` 傳回 Extension Host

**注意**：此面板使用獨立的 vanilla JS 模板，不共用 React SPA。

**訊息類型**：`ready`、`updateContent`、`setCommentsEnabled`、`removeComment`、`comment`

---

## 6. Proposed Diff View

**外觀**：使用 VS Code 內建 Diff Editor，左側為原始檔案、右側為 AI 建議的修改版本。編輯器標題列顯示 ✓ Accept 和 ✗ Reject 按鈕。

**功能**：
- 透過兩個虛擬檔案系統 Provider（`_claude_vscode_fs_left`、`_claude_vscode_fs_right`）提供 diff 內容，不需寫入磁碟
- 另有 `_claude_vscode_fs_readonly` 唯讀 Provider
- `claude-vscode.viewingProposedDiff` context key 標記是否正在查看 diff

**對應指令**：
- `claude-vscode.acceptProposedDiff` — 接受變更
- `claude-vscode.rejectProposedDiff` — 拒絕變更

---

## 7. Status Bar Item

**外觀**：底部狀態列右側顯示「✻ Claude Code」文字。

**功能**：點擊開啟最近的 Claude 對話。僅在偏好位置為 sidebar 模式時顯示（使用 panel 模式時隱藏）。

---

## 8. Terminal 模式

**外觀**：VS Code 整合終端，名稱為「Claude Code」，圖示為 Claude logo。

**功能**：
- 當 `claudeCode.useTerminal` 設為 `true` 時啟用
- 直接在終端中執行 `claude` CLI
- 支援 Shell Integration

**對應指令**：`claude-vscode.terminal.open`

---

## 9. Walkthrough（新手引導）

**外觀**：VS Code Getting Started 頁面，包含 4 個步驟：

| 步驟 | 說明 | 圖片 |
|------|------|------|
| Welcome | 歡迎介紹 | `welcome.png` |
| Open Claude Code | 開啟方式 | `click.png` |
| Chat with Claude | 對話教學 | `chat.png` |
| Past Conversations | 歷史對話 | `past.png` |

首次安裝後延遲 1 秒自動顯示（透過 `walkthroughShown` global state 控制）。

---

## 10. Output Channel

**外觀**：VS Code 輸出面板中的「Claude VSCode」頻道。

**功能**：記錄 Extension 與 Webview 間的所有訊息，供開發除錯使用。

**對應指令**：`claude-vscode.showLogs`

---

## 互動式彈窗與通知

除了常駐 UI 元件外，Extension 還使用以下 VS Code 原生互動 API：

| 類型 | 用途 |
|------|------|
| `showInformationMessage` | 更新成功、登入提示等資訊通知 |
| `showWarningMessage` | 權限警告等 |
| `showErrorMessage` | MCP Server 啟動失敗、Claude 程序錯誤等錯誤通知 |
| `showQuickPick` | Notebook 程式碼執行確認（Execute / Cancel） |
| `showInputBox` | Plugin 安裝時輸入 plugin@marketplace 識別碼 |
| `withProgress` (Notification) | Terminal 模式啟動時顯示「Claude Code launching...」進度通知 |
| `env.openExternal` | 開啟外部 URL（登入認證頁面 authUrl 等） |
