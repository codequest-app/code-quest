# 08 — 靜態資源、第三方擴充套件整合

## 靜態資源一覽（`resources/`）

| 檔案 | 用途 |
|------|------|
| `claude-logo.svg` | 主圖示（活動列、分頁、終端） |
| `claude-logo.png` | Extension Marketplace 圖示 |
| `claude-logo-pending.svg` | 等待權限時的分頁圖示 |
| `claude-logo-done.svg` | 完成回應時的分頁圖示 |
| `clawd.svg` | Webview 內的吉祥物圖示（淺色/深色主題共用） |
| `welcome-art-light.svg` | 歡迎畫面插圖（淺色主題） |
| `welcome-art-dark.svg` | 歡迎畫面插圖（深色主題） |
| `AcceptMode.jpg` | Walkthrough / 文件用截圖 |
| `HighlightText.jpg` | Walkthrough / 文件用截圖 |
| `PlanMode.jpg` | Walkthrough / 文件用截圖 |
| `ClawdWithGradCap.png` | 教學用吉祥物圖片 |
| `native-binary/claude` | Claude CLI 原生可執行檔 |
| `native-binary/claude.zst` | Claude CLI 壓縮檔（zstd） |
| `walkthrough/step1.md` ~ `step4.md` | 新手引導步驟 Markdown |
| `walkthrough/welcome.png` | 新手引導 — 歡迎截圖 |
| `walkthrough/click.png` | 新手引導 — 開啟方式截圖 |
| `walkthrough/chat.png` | 新手引導 — 對話截圖 |
| `walkthrough/past.png` | 新手引導 — 歷史對話截圖 |

---

## Webview 內靜態資源載入

Webview 中的圖片/SVG 透過 `get_asset_uris` request 從 Extension Host 取得合法的 webview URI，因為 CSP 限制不允許直接引用本地路徑。

資源映射表（定義在 extension.js 中）：

| 資源 key | 淺色主題 | 深色主題 |
|----------|----------|----------|
| `clawd` | `resources/clawd.svg` | `resources/clawd.svg` |
| `welcome-art` | `resources/welcome-art-light.svg` | `resources/welcome-art-dark.svg` |

---

## 第三方擴充套件整合

| 擴充套件 | 用途 |
|----------|------|
| `ms-python.python` | 取得 Python 虛擬環境路徑，設定 Claude 程序的 Python 環境（`claudeCode.usePythonEnvironment` 控制） |
| `ms-vscode.vscode-speech` | 語音轉文字功能（Speech-to-Text），提供 VS Code Dictation API |

---

## 啟動事件（Activation Events）

| 事件 | 說明 |
|------|------|
| `onStartupFinished` | VS Code 啟動完成後自動啟用 |
| `onWebviewPanel:claudeVSCodePanel` | 還原已序列化的 Chat Panel 時啟用 |

---

## 擴充套件基本資訊

| 項目 | 值 |
|------|-----|
| 版本 | 2.1.63 |
| 最低 VS Code 版本 | `^1.94.0` |
| 類別 | AI, Chat |
| 不受信任工作區 | 不支援 |
| 圖示 | `resources/claude-logo.png` |
| Extension Kind | 未限制（可在 local 或 remote 執行） |
