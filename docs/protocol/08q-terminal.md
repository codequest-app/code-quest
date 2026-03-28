### 7.20 Terminal 整合

**方向**：WebView → Extension → VSCode Terminal API

**用途**：在 VSCode 整合式終端機中執行命令，支援 shell integration 與多種佈局選項。

---

#### 7.20.1 開啟 Claude 終端機（open_claude_in_terminal）

**位置**：第 47621–47629、68460–68461 行

```
WebView ──(open_claude_in_terminal { prompt, args, location })──→ Extension
  ↓
執行 VSCode 命令：claude-vscode.terminal.open(prompt, args, location)
  ↓
回傳 { type: "open_claude_in_terminal_response" }
```

---

#### 7.20.2 開啟通用終端機（open_terminal）

**位置**：第 47630–47640、68463–68509 行

```
WebView ──(open_terminal { executable, args, cwd, location })──→ Extension
  ↓
建立 VSCode Terminal：
  {
    name: "Claude Code",
    iconPath: "resources/claude-logo.svg",
    cwd: cwd || this.cwd,
    isTransient: true,        ← 暫時性終端（關閉後自動清理）
    strictEnv: true,          ← 隔離環境變數
    location: <根據參數>
  }
  ↓
顯示終端機
  ↓
┌─ Shell Integration 路徑（主要）────────────────────────────┐
│ 監聽 onDidChangeTerminalShellIntegration 事件              │
│ → shell integration 就緒後                                │
│ → shellIntegration.executeCommand(quote(cmd))             │
│ → 等待 onDidStartTerminalShellExecution 確認命令開始       │
└────────────────────────────────────────────────────────────┘
  │
  │ 3 秒 timeout
  ↓
┌─ Fallback 路徑 ───────────────────────────────────────────┐
│ shell integration 不可用                                   │
│ → terminal.sendText(quote(cmd))（直接發送文字）            │
└────────────────────────────────────────────────────────────┘
  ↓
若 location === "window"：
  執行 workbench.action.moveEditorToNewWindow
  ↓
回傳 { type: "open_terminal_response" }
```

---

#### 7.20.3 Location 選項

| 值 | 行為 | ViewColumn |
|---|------|-----------|
| `"beside"`（預設） | 在目前編輯器旁邊開啟 | `ViewColumn.Beside` |
| `"window"` | 開啟後移至新視窗 | `ViewColumn.One` → `moveEditorToNewWindow` |
| `undefined` | 同 `"beside"` | `ViewColumn.Beside` |
| 其他值 | 無指定位置 | `undefined` |

---

#### 7.20.4 取得終端機內容（get_terminal_contents）

**位置**：第 47531–47537、68906–68933 行

```
WebView ──(get_terminal_contents { terminalName })──→ Extension
  ↓
以名稱查找終端機（空格替換為底線比對）
  ↓
保存目前剪貼簿內容
  ↓
workbench.action.terminal.selectAll      ← 全選
workbench.action.terminal.copySelection  ← 複製
workbench.action.terminal.clearSelection ← 取消選取
  ↓
讀取剪貼簿 → 取得終端機完整輸出
  ↓
若超過 100 行 → 截取最後 100 行
  ↓
還原原始剪貼簿內容
  ↓
回傳：
{
  type: "get_terminal_contents_response",
  content: "終端機輸出文字（最多 100 行）"
}
```

> **實作限制**：使用剪貼簿作為中介，會暫時覆蓋使用者的剪貼簿內容（操作完成後還原）。
