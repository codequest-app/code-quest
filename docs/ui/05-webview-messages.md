# 05 — Webview 內部功能模組

根據 Webview ↔ Extension Host 之間的 message protocol，Webview SPA 內部包含以下功能模組。

---

## 對話與 Session 管理
- 啟動 / 中斷 / 關閉 Claude 對話（`launch_claude`、`interrupt_claude`、`close_channel`）
- Session 列表、詳情、重命名、刪除、分叉（`list_sessions_request`、`fork_conversation`、`rename_session`、`delete_session`）
- 遠端 Session 列表與 Teleport（`list_remote_sessions`、`teleport_session`）
- 在編輯器中開新分頁（`new_conversation_tab`、`open_in_editor`）

---

## 認證與帳號
- 登入 / OAuth 授權（`login`、`submit_oauth_code`、`get_auth_status`、`auth_url`）

---

## 模型與權限控制
- 切換模型 / 權限模式 / 思考層級（`set_model`、`set_permission_mode`、`set_thinking_level`）
- 工具權限請求對話框（`tool_permission_request`）
- 用量查詢與更新（`request_usage_update`、`usage_update`）

---

## MCP Server 管理
- 查詢 / 啟用 / 停用 / 重連 MCP 伺服器（`get_mcp_servers`、`set_mcp_server_enabled`、`reconnect_mcp_server`）
- MCP OAuth 認證（`submit_mcp_oauth_callback_url`）

---

## 瀏覽器 / Debugger / Jupyter 整合
- Chrome MCP 啟用 / 停用（`ensure_chrome_mcp_enabled`、`disable_chrome_mcp`）
- 建立新瀏覽器分頁（`create_new_browser_tab`）
- Debugger 協助（`ask_debugger_help`）
- Jupyter MCP 啟用 / 停用（`enable_jupyter_mcp`、`disable_jupyter_mcp`）

---

## 檔案與編輯器操作
- 開啟檔案 / Diff / 內容預覽 / Plan Preview（`open_file`、`open_diff`、`open_content`、`open_markdown_preview`、`open_file_diffs`）
- 搜尋檔案（`list_files_request`）
- 取得終端機內容（`get_terminal_contents`）
- 程式碼回退（`rewind_code`）

---

## Plan 評論系統
- 查詢 / 刪除評論、關閉預覽（`get_plan_comments`、`remove_plan_comment`、`close_plan_preview`）

---

## Git 整合
- 切換分支 / 檢查狀態 / 執行 Git 命令（`checkout_branch`、`check_git_status`、`exec`）

---

## Plugin 管理
- 列出 / 安裝 / 移除 / 啟停用 Plugin（`list_plugins`、`install_plugin`、`uninstall_plugin`、`set_plugin_enabled`）
- Marketplace 管理（`list_marketplaces`、`add_marketplace`、`remove_marketplace`、`refresh_marketplace`）

---

## 語音輸入
- 語音轉文字開始 / 停止（`start_speech_to_text`、`stop_speech_to_text`）
- 需要 `ms-vscode.vscode-speech` 擴充套件

---

## UI 狀態 Banner
- 關閉終端機橫幅（`dismiss_terminal_banner`）
- 關閉 Review 推廣橫幅（`dismiss_review_upsell_banner`）
- 關閉 Onboarding（`dismiss_onboarding`）

---

## 推播通知（Extension → Webview）
- 輸入建議提示（`proactive_suggestions_update`）
- 檔案變更通知（`file_updated`）
- 編輯器選取變更（`selection_changed`）
- @-mention 插入（`insert_at_mention`）
- 開啟 Plugin 對話框（`open_plugins_dialog`）
- 字型設定變更（`font_configuration_changed`）
- WebView 可見性變更（`visibility_changed`）
- 建立新對話（`create_new_conversation`）
