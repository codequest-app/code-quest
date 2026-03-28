# 06 — 通訊架構、虛擬檔案系統、雙模式架構

## 架構關鍵類別

| 類別 | 職責 |
|------|------|
| `EF`（WebviewManager） | 管理所有 Webview 實例，廣播 Session 狀態與設定變更 |
| `rN`（Communication） | 每個 Webview 的通訊橋接，管理 Claude 程序生命週期 |
| `DD`（VirtualFS — Native UI） | 虛擬檔案系統 Provider，提供 Diff View 左右兩側內容 |
| `JD`（VirtualFS — Terminal） | 同上，Terminal 模式專用 |
| `SF`（ReadonlyFS） | 唯讀 TextDocumentContentProvider |
| `SG`（Settings） | 設定管理，含遷移邏輯 |

---

## 通訊方式

### Native UI 模式

```
Webview (React SPA)
  ↕ postMessage / onDidReceiveMessage
Extension Host (EF → rN)
  ↕ stdin/stdout JSON (child_process.spawn)
Claude CLI Process
```

- Extension Host 透過 `child_process.spawn` 啟動 Claude CLI
- 與 CLI 之間透過 stdin/stdout 傳遞 JSON 訊息
- 與 Webview 之間透過 `postMessage` API 通訊
- 所有訊息包裝在 `{ type: "from-extension", message: ... }` 格式中

### Terminal 模式

```
VS Code Terminal
  ↕ Shell Integration / sendText
Claude CLI Process
  ↕ WebSocket (JSON-RPC)
Extension Host (tl function)
```

- CLI 在終端中直接執行
- Extension Host 透過 WebSocket（`ws` library, bundled）與 CLI 建立 JSON-RPC 連線
- 支援 `at_mentioned`、`log_event` 等 JSON-RPC 方法

---

## 虛擬檔案系統

Extension 共註冊了 **5 個**虛擬檔案系統 Provider（原生 UI 與 Terminal 模式各一組）：

| Scheme | 類型 | 用途 |
|--------|------|------|
| `_claude_vscode_fs_left` | FileSystemProvider (`DD`) | Diff 左側（原始檔案）— 原生 UI |
| `_claude_vscode_fs_right` | FileSystemProvider (`DD`) | Diff 右側（建議修改）— 原生 UI |
| `_claude_vscode_fs_readonly` | TextDocumentContentProvider (`SF`) | 唯讀檔案預覽 — 原生 UI |
| `_claude_fs_left` | FileSystemProvider (`JD`) | Diff 左側 — Terminal 模式 |
| `_claude_fs_right` | FileSystemProvider (`JD`) | Diff 右側 — Terminal 模式 |

---

## 雙模式架構（Native UI vs Terminal）

Extension 存在兩套平行架構，由 `claudeCode.useTerminal` 設定切換：

| 面向 | Native UI 模式 | Terminal 模式 |
|------|----------------|---------------|
| 主要 UI | Webview SPA（React） | VS Code 整合終端 |
| 通訊方式 | stdin/stdout JSON + postMessage | Shell Integration / JSON-RPC over WebSocket |
| Diff Provider | `_claude_vscode_fs_*`（DD class） | `_claude_fs_*`（JD class） |
| @-mention | `insertAtMention` → postMessage | `insertAtMentioned` → JSON-RPC `at_mentioned` |
| 啟動函數 | `pZ6()` | `tl()` |
| Context Key 前綴 | `claude-vscode.*` | `claude-code.*` |

兩種模式共用相同的 Diff Accept/Reject UI 與編輯器標題列按鈕。

---

## VS Code API 使用彙整

| API | 用途 |
|-----|------|
| `window.createWebviewPanel` | 建立 Chat Panel、Plan Preview |
| `window.registerWebviewViewProvider` | 註冊 Sidebar、Sessions List |
| `window.createStatusBarItem` | 狀態列按鈕 |
| `window.createTerminal` | Terminal 模式 |
| `window.createOutputChannel` | 日誌輸出 |
| `workspace.registerFileSystemProvider` | 虛擬檔案系統（Diff View） |
| `workspace.registerTextDocumentContentProvider` | 唯讀內容 Provider |
| `commands.executeCommand('vscode.diff')` | 開啟 Diff Editor |
| `registerWebviewPanelSerializer` | Panel 狀態序列化/還原 |
| `window.registerUriHandler` | URI Handler（`/install-plugin`） |

---

## 打包的 Extension Host 第三方套件

Extension 無宣告 `dependencies`，所有第三方程式碼已 bundle 進 `extension.js`：

| 套件 | 用途 |
|------|------|
| **which** / **isexe** | 尋找系統可執行檔路徑 |
| **lru-cache** | 快取管理 |
| **shell-quote** | Shell 指令引號處理 |
| **marked** | Markdown → HTML 轉換（Plan Preview） |
| **cross-spawn** | 跨平台子程序啟動 |
| **ws** (WebSocket) | Terminal 模式 JSON-RPC 通訊 |
| **semver** | 版本號比較（Node.js 版本檢查等） |
| **zod** | Runtime schema 驗證（MCP 訊息格式） |

### Node.js 內建模組

`fs`、`path`、`os`、`child_process`、`stream`、`util`、`http`、`https`、`url`、`buffer`、`tty`
