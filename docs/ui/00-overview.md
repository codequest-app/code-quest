# Claude Code VS Code Extension — UI 架構文件

## 概覽

此擴充套件為 Claude Code 的 VS Code 整合介面，提供 AI 對話、方案審閱、Session 管理等功能。所有前端程式碼打包為單一 `webview/index.js` (React SPA) 及 `webview/index.css`，由 `extension.js` (bundled, ~74K 行) 作為 Extension Host 驅動。

---

## 文件索引

| 檔案 | 內容 |
|------|------|
| [01-ui-components.md](01-ui-components.md) | 10 個 UI 元件詳細說明 |
| [02-commands-keybindings.md](02-commands-keybindings.md) | 指令、快捷鍵、選單 |
| [03-configuration.md](03-configuration.md) | 設定項、Context Keys、GlobalState |
| [04-webview-frontend.md](04-webview-frontend.md) | 前端架構、CSS 設計系統、打包套件 |
| [05-webview-messages.md](05-webview-messages.md) | Webview 內部功能模組（message type 分類） |
| [06-communication.md](06-communication.md) | 通訊架構、虛擬檔案系統、雙模式架構 |
| [07-features.md](07-features.md) | 各項功能：@-mention、語音、Plan 評論、Git 等 |
| [08-resources.md](08-resources.md) | 靜態資源、第三方擴充套件整合、擴充套件基本資訊 |

---

## UI 元件一覽

| # | 元件 | 類型 | 位置 | 功能 |
|---|------|------|------|------|
| 1 | Main Chat Panel | Webview Panel (editor tab) | 編輯區 | 主要 AI 對話介面 |
| 2 | Secondary Sidebar | Webview View | 右側次要側邊欄 | 同上（VS Code ≥ 1.106） |
| 3 | Activity Bar Sidebar | Webview View | 左側活動列 | 同上（VS Code < 1.106 fallback） |
| 4 | Sessions List | Webview View | 活動列 | 多 Session 列表與切換 |
| 5 | Plan Preview | Webview Panel (editor tab) | 編輯區 | 互動式方案預覽，可選取文字留言 |
| 6 | Proposed Diff View | VS Code Diff Editor | 編輯區 | 顯示 AI 建議的檔案變更 diff |
| 7 | Status Bar Item | Status Bar | 底部狀態列 | 快速開啟 Claude Code |
| 8 | Terminal | Integrated Terminal | 終端面板 | CLI 模式（`claudeCode.useTerminal`） |
| 9 | Walkthrough | Getting Started | 歡迎頁 | 新手引導（4 步驟） |
| 10 | Output Channel | Output Panel | 輸出面板 | 開發除錯日誌 |

---

## 擴充套件基本資訊

| 項目 | 值 |
|------|-----|
| 最低 VS Code 版本 | `^1.94.0` |
| 類別 | AI, Chat |
| 不受信任工作區 | 不支援 |
| 圖示 | `resources/claude-logo.png` |
| 啟動事件 | `onStartupFinished`、`onWebviewPanel:claudeVSCodePanel` |
