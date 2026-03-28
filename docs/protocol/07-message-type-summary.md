## 6. 所有訊息 Type 彙整

### Stdout Message Type（CLI → Extension）

| Type | 用途 | 處理方式 |
|------|------|---------|
| `control_response` | 控制請求的回應 | 由 `pendingControlResponses` 處理 |
| `control_request` | CLI 發起的控制請求 | 呼叫 `handleControlRequest()` |
| `control_cancel_request` | 取消請求 | 呼叫 `handleControlCancelRequest()` |
| `keep_alive` | 保活訊號 | 忽略 |
| `streamlined_text` | 精簡文字 | 忽略 |
| `streamlined_tool_use_summary` | 工具使用摘要 | 忽略 |
| `system` | 系統訊息（`init` 回應開始 / `status` 狀態更新 / `compact_boundary` context 壓縮） | 入隊到 `inputStream`；`init` 時 `busy = true` |
| `stream_event` | Anthropic Streaming API 事件（`message_start` / `content_block_delta` / `message_stop` 等） | 入隊到 `inputStream`，由 assembler 組裝 |
| `result` | **回應結束信號**，含 `total_cost_usd` 和 `modelUsage` | 入隊到 `inputStream`；`busy = false` |
| `user` | 使用者訊息 | 入隊到 `inputStream` |
| `assistant` | 助手回應（非串流模式） | 入隊到 `inputStream` |
| `tool_use` | 工具呼叫 | 入隊到 `inputStream` |
| `error` | 錯誤訊息 | 入隊到 `inputStream` |

### Control Request Subtype

| Subtype | 用途 |
|---------|------|
| `initialize` | 初始化 Claude 會話 |
| `interrupt` | 中斷當前操作 |
| `set_permission_mode` | 設定權限模式 |
| `set_model` | 切換 AI 模型 |
| `set_max_thinking_tokens` | 設定最大思考 token 數 |
| `rewind_files` | 回退檔案狀態 |
| `stop_task` | 停止任務 |
| `mcp_reconnect` | 重連 MCP 伺服器 |
| `mcp_toggle` | 啟用/停用 MCP 伺服器 |
| `mcp_status` | 查詢 MCP 伺服器狀態 |
| `mcp_set_servers` | 設定 MCP 伺服器 |
| `can_use_tool` | 工具權限檢查 |
| `hook_callback` | 鉤子回調 |
| `mcp_message` | MCP 訊息轉發 |
| `apply_flag_settings` | 套用實驗旗標設定 |
| `remote_control` | 啟用/停用遠端控制 |
| `mcp_authenticate` | MCP 伺服器 OAuth 認證 |
| `mcp_clear_auth` | 清除 MCP 伺服器認證 |
| `mcp_oauth_callback_url` | 提交 MCP OAuth callback URL |

### WebView Message Type

完整列表來自 `extension.js`（`readFromClient` switch）及 Extension 向 WebView 發送的訊息。

| Type | 用途 | 方向 |
|------|------|------|
| `from-extension` | 包裝訊息（所有 Extension → WebView 訊息的外層） | Extension → WebView |
| `request` | 請求訊息（內含 `request.type` 子類型） | 雙向 |
| `response` | 響應訊息（對應某個 `requestId`） | 雙向 |
| `launch_claude` | 啟動 Claude CLI session | WebView → Extension |
| `close_channel` | 關閉頻道 | 雙向 |
| `interrupt_claude` | 中斷 AI 回應 | WebView → Extension |
| `io_message` | 使用者訊息（含排隊） | 雙向 |
| `start_speech_to_text` | 開始語音轉文字 | WebView → Extension |
| `stop_speech_to_text` | 停止語音轉文字 | WebView → Extension |
| `cancel_request` | 取消進行中的請求 | 雙向 |
| `comment` | Plan 預覽面板評論 | WebView → Extension |
| `file_updated` | 檔案變更通知（filePath, oldContent, newContent） | Extension → WebView |
| `speech_to_text_message` | 語音轉文字串流結果 | Extension → WebView |
| `plan_comment` | Plan 評論推送 | Extension → WebView |
| `removeComment` | 移除 Plan 評論（Plan 預覽面板） | Extension → Plan Preview WebView |
| `update_state` | 完整狀態與設定推送（以 request 格式發送） | Extension → WebView |

### WebView Request Subtype（`request.request.type`）

完整列表來自 `extension.js` 第 50226 行（`processRequest` switch）及 Extension 主動推送的請求。

#### Extension → WebView（推送）

| Subtype | 用途 |
|---------|------|
| `proactive_suggestions_update` | 推送輸入框建議提示 |
| `usage_update` | 推送用量資訊 |
| `auth_url` | 推送 OAuth 授權 URL |
| `get_current_selection` | 取得編輯器選取文字 |
| `new_conversation_tab` | 開啟新對話分頁 |
| `rename_tab` | 重新命名分頁標題 |
| `show_notification` | 顯示通知 |
| `tool_permission_request` | 工具權限請求對話框 |
| `visibility_changed` | WebView 可見性變更 |
| `selection_changed` | 編輯器選取變更 |
| `font_configuration_changed` | 字型設定變更 |
| `insert_at_mention` | 插入 @mention |
| `create_new_conversation` | 建立新對話 |
| `open_plugins_dialog` | 開啟插件對話框 |
| `session_states_update` | 推送 session 狀態列表（sessions, activeSessionId） |

#### WebView → Extension（初始化與狀態）

| Subtype | 用途 |
|---------|------|
| `init` | 初始化 WebView 狀態 |
| `get_claude_state` | 取得 Claude 設定 |
| `get_auth_status` | 取得認證狀態 |
| `login` | 登入 |
| `submit_oauth_code` | 提交 OAuth 授權碼 |

#### WebView → Extension（Session 管理）

| Subtype | 用途 |
|---------|------|
| `list_sessions_request` | 列出本地 session |
| `list_remote_sessions` | 列出遠端 session |
| `get_session_request` | 取得 session 詳細資料 |
| `teleport_session` | Teleport 遠端 session |
| `fork_conversation` | 分叉對話 |
| `rewind_code` | 回退程式碼變更 |
| `rename_session` | 重新命名對話 |
| `delete_session` | 刪除/隱藏對話 |
| `open_in_editor` | 在編輯器中開啟對話 |
| `update_session_state` | 更新對話狀態 |

#### WebView → Extension（模型與權限）

| Subtype | 用途 |
|---------|------|
| `set_permission_mode` | 設定權限模式 |
| `set_model` | 切換模型 |
| `set_thinking_level` | 設定思考層級 |
| `apply_settings` | 套用設定（effortLevel 等，寫入 settings.json + 通知 CLI） |
| `request_usage_update` | 請求用量更新 |

#### WebView → Extension（MCP 伺服器）

| Subtype | 用途 |
|---------|------|
| `get_mcp_servers` | 取得 MCP 伺服器列表 |
| `set_mcp_server_enabled` | 啟用/停用 MCP 伺服器 |
| `reconnect_mcp_server` | 重連 MCP 伺服器 |
| `authenticate_mcp_server` | MCP 伺服器 OAuth 認證 |
| `clear_mcp_server_auth` | 清除 MCP 伺服器 OAuth 認證 |
| `submit_mcp_oauth_callback_url` | 提交 MCP OAuth callback URL |

#### WebView → Extension（瀏覽器 / Debugger / Jupyter）

| Subtype | 用途 |
|---------|------|
| `ensure_chrome_mcp_enabled` | 確保 Chrome MCP 已啟用 |
| `disable_chrome_mcp` | 停用 Chrome MCP |
| `create_new_browser_tab` | 建立新瀏覽器分頁 |
| `ask_debugger_help` | 請求 Debugger 協助 |
| `enable_jupyter_mcp` | 啟用 Jupyter MCP |
| `disable_jupyter_mcp` | 停用 Jupyter MCP |

#### WebView → Extension（檔案與編輯器）

| Subtype | 用途 |
|---------|------|
| `open_file` | 開啟檔案 |
| `open_diff` | 開啟 diff 比較 |
| `open_content` | 開啟內容預覽 |
| `open_markdown_preview` | 開啟 Plan Markdown 預覽 |
| `open_file_diffs` | 開啟多檔案 diff |
| `list_files_request` | 搜尋檔案 |
| `get_terminal_contents` | 取得終端機內容 |

#### WebView → Extension（Plan Comment）

| Subtype | 用途 |
|---------|------|
| `get_plan_comments` | 查詢 Plan 評論 |
| `remove_plan_comment` | 刪除 Plan 評論 |
| `close_plan_preview` | 關閉 Plan 預覽面板 |

#### WebView → Extension（Git）

| Subtype | 用途 |
|---------|------|
| `checkout_branch` | 切換分支 |
| `check_git_status` | 檢查 Git 狀態 |
| `update_skipped_branch` | 更新跳過的分支 |
| `exec` | 執行 Git 命令 |

#### WebView → Extension（終端機與 UI）

| Subtype | 用途 |
|---------|------|
| `open_terminal` | 開啟終端機 |
| `open_claude_in_terminal` | 在終端機開啟 Claude |
| `show_claude_terminal_setting` | 顯示終端機設定 |
| `open_url` | 開啟 URL |
| `open_config_file` | 開啟設定檔 |
| `open_config` | 開啟設定頁面 |
| `open_help` | 開啟說明 |
| `open_output_panel` | 開啟輸出面板 |
| `open_folder` | 開啟資料夾選擇器 |
| `get_asset_uris` | 取得靜態資源 URI |

#### WebView → Extension（UI 狀態）

| Subtype | 用途 |
|---------|------|
| `dismiss_terminal_banner` | 關閉終端機橫幅 |
| `dismiss_review_upsell_banner` | 關閉 Review 推廣橫幅 |
| `dismiss_onboarding` | 關閉 Onboarding |
| `log_event` | 記錄分析事件 |

#### WebView → Extension（Plugin 管理）

| Subtype | 用途 |
|---------|------|
| `list_plugins` | 列出插件 |
| `install_plugin` | 安裝插件 |
| `uninstall_plugin` | 移除插件 |
| `set_plugin_enabled` | 啟用/停用插件 |
| `list_marketplaces` | 列出 Marketplace |
| `add_marketplace` | 新增 Marketplace |
| `remove_marketplace` | 移除 Marketplace |
| `refresh_marketplace` | 刷新 Marketplace |

### Session JSONL 事件類型

以下事件類型記錄在本地 session JSONL 檔案（`.claude/sessions/{sessionId}.jsonl`）中，非即時通訊協議訊息。

| Type | 用途 | 位置 |
|------|------|------|
| `teleported-from` | 標記 session 從遠端 teleport 而來，含 `remoteSessionId`、`branch`、`messageCount` | 第 22723 行 |
| `teleport-skipped-branch` | 記錄 teleport 時跳過的分支，含 `branch`、`failed` | 第 22746 行 |
| `taskCreated` | Task 建立事件，含 `task` 物件（`taskId` 等） | 第 41184 行 |
| `taskStatus` | Task 狀態更新事件，含 `task` 物件（`status` 等） | 第 41189 行 |
| `summary` | 訊息摘要，含 `leafUuid`、`summary` | 第 22715 行 |
| `custom-title` | 自訂對話標題，含 `sessionId`、`customTitle` | 第 22762 行 |

---

