# 02 — 指令、快捷鍵、選單

## 所有註冊指令

| 指令 | 說明 |
|------|------|
| `claude-vscode.editor.open` | 在新分頁開啟 Claude Code |
| `claude-vscode.editor.openLast` | 開啟最近的對話 |
| `claude-vscode.primaryEditor.open` | 在主編輯區以全螢幕開啟 |
| `claude-vscode.window.open` | 在新視窗開啟 |
| `claude-vscode.sidebar.open` | 在側邊欄開啟 |
| `claude-vscode.newConversation` | 開啟新對話 |
| `claude-vscode.update` | 更新擴充套件 |
| `claude-vscode.focus` | 焦點移至 Claude 輸入框 |
| `claude-vscode.blur` | 焦點從 Claude 移回編輯器 |
| `claude-vscode.logout` | 登出 |
| `claude-vscode.terminal.open` | 在終端開啟 Claude |
| `claude-vscode.acceptProposedDiff` | 接受 AI 建議的變更 |
| `claude-vscode.rejectProposedDiff` | 拒絕 AI 建議的變更 |
| `claude-vscode.insertAtMention` | 在編輯器中插入 @-mention 參考 |
| `claude-vscode.installPlugin` | 安裝 Plugin |
| `claude-vscode.showLogs` | 顯示日誌 |
| `claude-vscode.openWalkthrough` | 開啟新手引導 |

> 另有 `claude-code.*` 前綴的 legacy 指令（`acceptProposedDiff`、`rejectProposedDiff`、`insertAtMentioned`），功能相同。

---

## 快捷鍵綁定

| 快捷鍵 | 指令 | 條件 |
|--------|------|------|
| `Alt+K` | `insertAtMention` | 編輯器有焦點 |
| `Cmd+Escape` (Mac) / `Ctrl+Escape` | `focus` | 非 Terminal 模式，編輯器有焦點 |
| `Cmd+Escape` (Mac) / `Ctrl+Escape` | `blur` | 非 Terminal 模式，編輯器無焦點 |
| `Cmd+Shift+Escape` (Mac) / `Ctrl+Shift+Escape` | `editor.open` | 非 Terminal 模式 |
| `Cmd+Escape` (Mac) / `Ctrl+Escape` | `terminal.open.keyboard` | Terminal 模式 |
| `Cmd+Alt+K` (Mac) | `insertAtMentioned` (legacy) | 編輯器有焦點 |
| `Cmd+N` (Mac) | `newConversation` | 啟用設定且 Claude Panel 有焦點時 |

---

## 編輯器標題列按鈕（Menus）

| 位置 | 按鈕 | 顯示條件 |
|------|------|----------|
| `editor/title` | Accept Proposed Changes (`$(check)`) | 正在查看 Proposed Diff |
| `editor/title` | Reject Proposed Changes (`$(discard)`) | 正在查看 Proposed Diff |
| `editor/title` | Open Claude Code | 非 Terminal 模式（所有編輯器右上角） |
| `editor/title` | Open in Terminal | Terminal 模式（所有編輯器右上角） |

---

## Command Palette 可見性

| 指令 | 條件 |
|------|------|
| `update` | `claude-vscode.updateSupported` 為 true |
| `primaryEditor.open` | `claude-vscode.primaryEditorEnabled` 為 true |
| `insertAtMention` | 非 Terminal 模式 |
| `insertAtMentioned` (legacy) | Terminal 模式 |
| `installPlugin` | `claude-vscode.updateSupported` 為 true |
| `editor.openLast` | 隱藏（僅從選單觸發） |
| `blur` | 隱藏 |
| `newConversation` | 隱藏 |
