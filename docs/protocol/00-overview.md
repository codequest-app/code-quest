# Protocol 文件總覽

本資料夾記錄 Claude Code VS Code Extension 的**所有通訊協議與訊息格式**，涵蓋三層架構（WebView ↔ Extension Host ↔ CLI）之間的完整通訊規格。

## 文件列表

| 檔案 | 內容 |
|------|------|
| [01-cli-startup.md](01-cli-startup.md) | CLI 啟動參數、binary 載入邏輯 |
| [02-stdin-messages.md](02-stdin-messages.md) | Extension → CLI 的 control_request 訊息格式 |
| [03-stdout-messages.md](03-stdout-messages.md) | CLI → Extension 的所有 stdout 訊息類型 |
| [04-webview-messages.md](04-webview-messages.md) | WebView ↔ Extension 的 postMessage 格式 |
| [05-rest-api.md](05-rest-api.md) | Extension 直接呼叫的 REST API |
| [06-vscode-commands.md](06-vscode-commands.md) | VS Code Commands 與 UI 元件 |
| [07-message-type-summary.md](07-message-type-summary.md) | 所有訊息類型彙整總表 |
| [08-interaction-flows.md](08-interaction-flows.md) | 核心互動流程（工具權限確認等） |
| [08a-permission-mode.md](08a-permission-mode.md) | 權限模式切換流程 |
| [08b-model-thinking.md](08b-model-thinking.md) | 模型切換與思考層級 |
| [08c-cancel-flow.md](08c-cancel-flow.md) | 取消回應流程 |
| [08d-hook-callback.md](08d-hook-callback.md) | Hook 回調機制 |
| [08e-plan-mode.md](08e-plan-mode.md) | Plan Mode 流程 |
| [08f-oauth.md](08f-oauth.md) | OAuth 認證流程 |
| [08g-proactive-suggestions.md](08g-proactive-suggestions.md) | Proactive Suggestions 生成 |
| [08h-experiment-gates.md](08h-experiment-gates.md) | Experiment Gates 功能旗標 |
| [08i-session-teleportation.md](08i-session-teleportation.md) | Session Teleportation |
| [08j-mcp-integration.md](08j-mcp-integration.md) | MCP 整合（Chrome / Jupyter） |
| [08k-debugger-mcp.md](08k-debugger-mcp.md) | Debugger MCP 自動整合 |
| [08l-file-rewind.md](08l-file-rewind.md) | File Rewind 流程 |
| [08m-plugin-marketplace.md](08m-plugin-marketplace.md) | Plugin Marketplace |
| [08n-speech-to-text.md](08n-speech-to-text.md) | 語音轉文字 |
| [08o-git-integration.md](08o-git-integration.md) | Git 整合 |
| [08p-session-forking.md](08p-session-forking.md) | Session Forking |
| [08q-terminal.md](08q-terminal.md) | Terminal 操作 |
| [08r-usage-tracking.md](08r-usage-tracking.md) | 用量追蹤 |
| [08s-thinking-level.md](08s-thinking-level.md) | 思考層級設定 |
| [08t-tab-management.md](08t-tab-management.md) | Tab 管理 |
| [08u-at-mention.md](08u-at-mention.md) | @Mention 機制 |
| [08v-diff-flow.md](08v-diff-flow.md) | Diff 流程 |
| [08w-notification.md](08w-notification.md) | 通知機制 |
| [08x-session-management.md](08x-session-management.md) | Session 管理 |
| [08y-elicitation-flow.md](08y-elicitation-flow.md) | MCP Elicitation 流程 |
| [09-oauth-settings.md](09-oauth-settings.md) | OAuth 設定與認證狀態 |
| [10-environment-variables.md](10-environment-variables.md) | 環境變數參考 |

## 閱讀順序

1. **01-cli-startup.md** — CLI 如何啟動
2. **02/03** — stdin/stdout 訊息格式（Extension ↔ CLI）
3. **04** — WebView ↔ Extension postMessage 格式
4. **07** — 訊息類型總表（速查用）
5. **08*** — 各互動流程詳細說明
6. **10** — 環境變數參考

## 與 impl/ 文件的關係

本資料夾是**訊息格式參考**（每個訊息長什麼樣），`docs/impl/` 是**實作指南**（訊息的順序、狀態機、錯誤處理）。實作時兩者搭配使用。
