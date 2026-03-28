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

### 5.1 VSCode Context 變數

**位置**：第 69299、72317 行

Extension 透過 `commands.executeCommand("setContext", ...)` 設定以下 context 變數，用於控制選單與 UI 元素的顯示條件：

| Context 變數 | 說明 |
|-------------|------|
| `claude-vscode.sideBarActive` | 側邊欄是否處於活躍狀態，控制相關選單項目的可見性 |
| `claude-vscode.updateSupported` | 當前環境是否支援擴展更新，控制更新相關 UI 的顯示 |

> 這些變數可在 `package.json` 的 `when` 條件中使用，例如 `"when": "claude-vscode.sideBarActive"` 控制選單項目顯示。

---

