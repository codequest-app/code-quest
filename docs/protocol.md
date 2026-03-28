# VSCode Claude 擴展通訊協議完整文件

## 概述

本文件詳細記錄了 VSCode Claude 擴展的完整通訊協議，包括 stdin/stdout 訊息格式、WebView 通訊、REST API 請求和 VSCode 命令。

---

## 目錄

- [0. 總覽](protocol/00-overview.md)
- [1. CLI 啟動參數](protocol/01-cli-startup.md)
- [2. Subprocess stdin 送出的訊息格式](protocol/02-stdin-messages.md)
- [3. Subprocess stdout 接收的訊息格式](protocol/03-stdout-messages.md)
- [4. WebView ↔ Extension postMessage 格式](protocol/04-webview-messages.md)
- [5. REST API 請求格式](protocol/05-rest-api.md)
- [6. VSCode 已註冊命令](protocol/06-vscode-commands.md)
- [7. 所有訊息 Type 彙整](protocol/07-message-type-summary.md)
- [8. 完整交互流程](protocol/08-interaction-flows.md)
  - [8a. Permission Mode 切換](protocol/08a-permission-mode.md)
  - [8b. 模型與思考層級切換](protocol/08b-model-thinking.md)
  - [8c. 請求取消流程](protocol/08c-cancel-flow.md)
  - [8d. Hook 回調流程](protocol/08d-hook-callback.md)
  - [8e. Plan Mode 流程](protocol/08e-plan-mode.md)
  - [8f. OAuth 認證流程](protocol/08f-oauth.md)
  - [8g. Proactive Suggestions](protocol/08g-proactive-suggestions.md)
  - [8h. Experiment Gates](protocol/08h-experiment-gates.md)
  - [8i. Session Teleportation](protocol/08i-session-teleportation.md)
  - [8j. Chrome MCP / Jupyter MCP 生命週期](protocol/08j-mcp-integration.md)
  - [8k. Debugger MCP 整合](protocol/08k-debugger-mcp.md)
  - [8l. File History / Code Rewind](protocol/08l-file-rewind.md)
  - [8m. Plugin / Marketplace 系統](protocol/08m-plugin-marketplace.md)
  - [8n. Speech-to-Text 生命週期](protocol/08n-speech-to-text.md)
  - [8o. Git 操作流程](protocol/08o-git-integration.md)
  - [8p. Session Forking](protocol/08p-session-forking.md)
  - [8q. Terminal 整合](protocol/08q-terminal.md)
  - [8r. Usage / Cost 追蹤](protocol/08r-usage-tracking.md)
  - [8s. Thinking Level 控制](protocol/08s-thinking-level.md)
  - [8t. Tab 管理](protocol/08t-tab-management.md)
  - [8u. @ Mention 系統](protocol/08u-at-mention.md)
  - [8v. Diff 接受/拒絕流程](protocol/08v-diff-flow.md)
  - [8w. VSCode 通知機制](protocol/08w-notification.md)
  - [8x. Session 管理操作](protocol/08x-session-management.md)
  - [8y. MCP Elicitation 流程](protocol/08y-elicitation-flow.md)
- [9. OAuth 設定](protocol/09-oauth-settings.md)
- [10. 環境變數參考](protocol/10-environment-variables.md)
