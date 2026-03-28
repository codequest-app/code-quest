# 核心流程序列圖

## 1. WebView 初始化

WebView 載入後的第一件事：

```
WebView                    Extension Host
  │                              │
  │──── init request ───────────►│
  │                              │  讀取設定、auth 狀態
  │                              │  偵測 git repo
  │◄─── init_response ───────────│
  │     (state: model, auth,     │
  │      thinkingLevel, cwd...)  │
  │                              │
```

`init_response.state` 包含所有初始狀態，WebView 不需要再發其他請求就能渲染完整 UI。

---

## 2. 新對話（送出第一條訊息）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── launch_claude ────►│                        │
  │    (channelId, cwd,   │                        │
  │     model, resume)    │─── spawn process ──────►│
  │                       │                        │ 啟動中
  │                       │─── initialize ─────────►│
  │                       │    (hooks, agents,      │
  │                       │     promptSuggestions)  │
  │                       │◄─── control_response ───│
  │                       │     (commands, models,  │
  │                       │      agents, account,   │
  │                       │      pid)               │
  │◄─── update_state ─────│                        │
  │     (channelId 就緒)  │                        │
  │                       │                        │
  │─── io_message ───────►│                        │
  │    (user input,       │─── user message ───────►│
  │     done: false)      │    (stdin enqueue)      │
  │                       │                        │ 處理中
  │                       │◄─── system(init) ───────│
  │◄─── io_message ───────│                        │ busy=true
  │                       │◄─── stream_event ───────│ (多次)
  │◄─── io_message ───────│     (content delta)     │
  │     (串流文字)        │                        │
  │                       │◄─── result ─────────────│
  │◄─── io_message ───────│                        │ busy=false
  │     (done signal)     │                        │
```

**注意**：
- `launch_claude` 後，Extension 同時在背景執行 `generateAndPushProactiveSuggestions()`（非同步，不阻塞）
- `io_message` 每條 CLI 輸出都會包成一個 `io_message` 轉發給 WebView
- `result` 是回應結束信號，不是回應內容

---

## 3. 繼續對話（同一個 Channel 送第二條訊息）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── io_message ───────►│                        │
  │    (user input)       │─── stdin enqueue ──────►│
  │                       │◄─── stream_event ───────│ (多次)
  │◄─── io_message ───────│                        │
  │                       │◄─── result ─────────────│
  │◄─── io_message ───────│                        │
```

繼續對話不需要重新 `launch_claude`，直接送 `io_message` 即可。

---

## 4. 工具權限確認

當 Claude 要使用需要確認的工具時：

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │                       │◄─── control_request ────│
  │                       │     (can_use_tool,      │
  │                       │      tool_name, input)  │
  │◄─── tool_permission   │                        │ 等待確認
  │     _request ─────────│                        │
  │                       │                        │
  │  使用者點擊允許/拒絕  │                        │
  │                       │                        │
  │─── response ─────────►│                        │
  │    (tool_permission   │                        │
  │     _response,        │                        │
  │     result: allow/    │─── control_response ───►│
  │     deny)             │    (behavior: allow/    │
  │                       │     deny, updatedInput) │
  │                       │                        │ 繼續執行
```

**取消情況**：若使用者在確認前取消對話，Extension 送出 `cancel_request` 通知 WebView 關閉確認 UI。

---

## 5. 取消回應（中斷 AI 生成）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── interrupt_claude ─►│                        │
  │                       │─── interrupt ──────────►│
  │                       │    (control_request,    │
  │                       │     subtype: interrupt) │
  │                       │                        │ 停止生成
  │                       │◄─── control_response ───│
  │                       │◄─── result ─────────────│
  │◄─── io_message ───────│    (包含截至目前的輸出) │
```

---

## 6. 關閉對話

### WebView 主動關閉

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── close_channel ────►│                        │
  │                       │  channel.in.done()     │
  │                       │─── (stdin close) ──────►│
  │                       │  channel.query.return() │
  │                       │  channels.delete()      │
  │                       │                        │ 終止
```

### CLI 異常終止（Extension 發現）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │                       │  stdout async loop 結束 │
  │                       │  closeChannel(id, true) │
  │◄─── close_channel ────│                        │
  │     (帶 error 訊息)   │                        │
```

---

## 7. 設定變更同步

```
WebView              Extension Host
  │                       │
  │─── set_model ────────►│  settings.setModel()
  │                       │  pushStateUpdate()
  │◄─── update_state ─────│  (新 modelSetting)
  │                       │
  │─── apply_settings ───►│  writeFile(settings.json)
  │                       │  query.applyFlagSettings()
  │◄─── apply_settings    │
  │     _response ────────│
```

---

## 8. 認證流程（OAuth）

```
WebView              Extension Host           Browser
  │                       │                      │
  │─── login ────────────►│                      │
  │    (method: "oauth")  │                      │
  │                       │  authManager.login() │
  │◄─── auth_url ─────────│──── open URL ───────►│
  │    (手動 redirect URL) │                      │
  │                       │                      │ 使用者授權
  │                       │◄─── callback ─────────│
  │                       │                      │
  │◄─── login_response ───│                      │
  │    (auth 結果)        │                      │
  │                       │                      │
```

若 URI handler 捕捉到 callback，也可透過 `submit_oauth_code` 手動提交。

---

## 9. 工具執行（File Rewind）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── rewind_code ──────►│                        │
  │    (userMessageId,    │─── rewind_files ───────►│
  │     dryRun)           │    (control_request)    │
  │                       │◄─── control_response ───│
  │◄─── rewind_code       │    (changedFiles,       │
  │     _response ────────│     restoredFiles...)   │
```

`dryRun: true` 時只回傳預覽，不實際修改檔案。

---

## 10. MCP 工具確認（含 suggestions）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │                       │◄─── control_request ────│
  │                       │     (can_use_tool,      │
  │                       │      suggestions: [...])│
  │◄─── tool_permission   │                        │
  │     _request ─────────│                        │
  │  (toolName, inputs,   │                        │
  │   suggestions)        │                        │
  │                       │                        │
  │  UI 顯示建議選項       │                        │
  │  使用者選擇            │                        │
  │─── response ─────────►│                        │
  │                       │─── control_response ───►│
```

`suggestions` 是 CLI 提供的預設允許選項，WebView 可以直接顯示讓使用者快速選擇。

---

## 11. Plan Mode（計劃模式）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │                       │◄─── control_request ────│
  │                       │     can_use_tool        │
  │                       │     (ExitPlanMode)      │
  │                       │                        │ 等待確認
  │                       │  openMarkdownPreview()  │
  │◄─── tool_permission   │  → open plan file      │
  │     _request ─────────│                        │
  │  (ExitPlanMode)       │                        │
  │                       │                        │
  │  使用者選取文字加 comment                       │
  │─── comment ──────────►│                        │
  │                       │  planCommentsByChannel  │
  │◄─── plan_comment ─────│                        │
  │                       │                        │
  │  使用者按 Approve/Reject                        │
  │─── response ─────────►│                        │
  │    (accept 帶 userFeedback │                   │
  │     或 reject)        │─── control_response ───►│
  │                       │                        │ 繼續規劃
```

- 有 comment 時：`userFeedback = "[Re: \"文字\"] comment"` 序列化後傳給 CLI
- 無 comment 時：`accept(inputs)` 直接通過
- Reject：`reject("User chose to stay in plan mode and continue planning")`

---

## 12. Hook Callback

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │                       │                        │ 準備執行工具
  │                       │◄─── control_request ────│
  │                       │     (hook_callback,     │
  │                       │      callback_id: hook_0│
  │                       │      tool_input: {...}) │
  │                       │                        │ 等待 hook 完成
  │                       │  hookCallbacks.get(id)  │
  │                       │  執行 hook 函式         │
  │                       │  (captureBaseline /     │
  │                       │   saveFileIfNeeded /    │
  │                       │   findDiagnostics)      │
  │                       │─── control_response ───►│
  │                       │    { continue: true,    │
  │                       │      hookSpecificOutput }│
  │                       │                        │ 繼續執行工具
  │                       │                        │
  │                       │◄─── control_request ────│ PostToolUse
  │                       │     (hook_callback,     │
  │                       │      callback_id: hook_2│
  │                       │      診斷 hook)         │
  │                       │─── control_response ───►│
  │                       │    (diagnostics 結果)   │
```

---

## 13. Session Teleportation（遠端 Session 匯入）

```
WebView              Extension Host           Anthropic API
  │                       │                        │
  │─── list_remote        │                        │
  │    _sessions ────────►│                        │
  │                       │─── GET /v1/sessions ──►│
  │                       │◄─── session list ───────│
  │◄─── list_remote       │                        │
  │     _sessions_response│                        │
  │                       │                        │
  │─── teleport_session ─►│                        │
  │    (sessionId)        │─── GET /v1/sessions    │
  │                       │    /{id} ─────────────►│
  │                       │◄─── metadata ───────────│
  │                       │─── GET /v1/session_    │
  │                       │    ingress/session/{id}►│
  │                       │◄─── loglines ───────────│
  │                       │                        │
  │                       │  UUID 重映射            │
  │                       │  寫入本地 JSONL         │
  │                       │  追加 teleported-from   │
  │                       │  驗證 git branch        │
  │◄─── teleport_session  │                        │
  │     _response ────────│                        │
  │  (localSessionId,     │                        │
  │   branch, messages)   │                        │
```

---

## 14. Session Forking（對話分叉）

```
WebView              Extension Host
  │                       │
  │─── fork_conversation ►│
  │    (forkedFromSession, │
  │     resumeSessionAt)  │
  │                       │  載入原始 JSONL
  │                       │  截取到 resumeSessionAt
  │                       │  產生新 sessionId
  │                       │  UUID 重映射（跳過 progress）
  │                       │  複製 file-history snapshots
  │                       │    hard link → copy fallback
  │                       │  寫入新 JSONL
  │◄─── fork_conversation │
  │     _response ────────│
  │     (sessionId)       │
```

---

## 15. Proactive Suggestions 生成

```
WebView              Extension Host           Claude Haiku
  │                       │                        │
  │─── launch_claude ────►│                        │
  │                       │  [背景非同步，不阻塞]   │
  │                       │  收集 git context       │
  │                       │  (branch/status/diff)   │
  │                       │  收集 session summaries │
  │                       │─── 呼叫 Haiku ─────────►│
  │                       │   (persistSession:false)│
  │                       │◄─── JSON 建議陣列 ───────│
  │◄─── proactive_        │                        │
  │     suggestions_update│                        │
  │                       │                        │
  │  [僅在 messages=0     │                        │
  │   時顯示建議卡片]     │                        │
```

需設定 `CLAUDE_PROACTIVE_SUGGESTIONS=true`，否則跳過。

---

## 16. Experiment Gates 更新

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │                       │◄─── MCP notification ───│
  │                       │     (experiment_gates,  │
  │                       │      { gate: true/false})│
  │                       │  this.experimentGates = │
  │                       │  globalState.update()   │
  │                       │  checkReviewUpsell()    │
  │◄─── update_state ─────│                        │
  │     (isOnboardingEnabled                        │
  │      showReviewUpsellBanner                     │
  │      browserIntegrationSupported)               │
```

Gate 不直接傳給 WebView，轉換為衍生狀態欄位後隨 `update_state` 推送。

---

## 17. Speech-to-Text

```
WebView              Extension Host           VSCode Speech Ext
  │                       │                        │
  │─── start_speech       │                        │
  │    _to_text ─────────►│                        │
  │                       │  createSpeechToTextStream()
  │                       │─── activate ──────────►│
  │                       │─── editorDictation.start►│
  │                       │                        │ 聆聽中
  │                       │◄─── onDidChangeText ────│ (多次)
  │◄─── speech_to_text    │                        │
  │     _message ─────────│  text（累積完整文字）   │
  │     (done: false)     │                        │
  │                       │                        │
  │─── stop_speech        │                        │
  │    _to_text ─────────►│                        │
  │                       │─── editorDictation.stop►│
  │                       │  dispose listeners      │
  │                       │  close temp document    │
  │◄─── close_channel ────│                        │
```

每次推送的 `text` 是**完整文字**（非增量），VSCode Dictation 每次覆寫整個文件。

---

## 18. Git 操作

```
WebView              Extension Host
  │                       │
  │─── checkout_branch ──►│
  │    (branch)           │  依序嘗試：
  │                       │  1. git checkout <branch>
  │                       │  2. git fetch + checkout
  │                       │  3. git checkout -b ... origin/...
  │                       │  4. git checkout --track origin/...
  │◄─── checkout_branch   │
  │     _response ────────│  { success, error? }
  │                       │
  │─── check_git_status ─►│
  │                       │  git status --porcelain -uno
  │◄─── check_git_status  │
  │     _response ────────│  { isClean, changedFiles }
```

---

## 19. Usage Tracking

```
WebView              Extension Host           Anthropic API
  │                       │                        │
  │─── request_usage      │                        │
  │    _update ──────────►│                        │
  │                       │─── GET /api/oauth/usage►│
  │                       │◄─── utilization data ───│
  │◄─── usage_update ─────│  (廣播至所有 comms)    │
  │     (utilization)     │                        │
  │◄─── request_usage     │                        │
  │     _update_response  │                        │
```

`usage_update` 為非同步推送，與 `request_usage_update_response` 分開送出。

---

## 20. Tab 管理

```
WebView              Extension Host
  │                       │
  │─── rename_tab ───────►│
  │    (title,            │  panelTab.title = title
  │     hasPendingPerms,  │  根據狀態選擇圖示：
  │     hasUnseenCompletion)  pending → claude-logo-pending.svg
  │                       │  done    → claude-logo-done.svg
  │◄─── rename_tab_response│  normal  → claude-logo.svg
  │                       │
  │─── new_conversation   │
  │    _tab ─────────────►│  執行 claude-vscode.editor.open
  │◄─── new_conversation  │
  │     _tab_response ────│
```

---

## 21. @ Mention 搜尋

```
WebView              Extension Host
  │                       │
  │─── list_files_request►│
  │    (pattern)          │  並行搜尋：
  │                       │  1. getMatchingTerminals()
  │                       │     (AT_MENTION_TERMINAL=true)
  │                       │  2. getMatchingBrowserTabs()
  │                       │     (Chrome MCP 已連接)
  │                       │  3. ripgrep / findFiles()
  │◄─── list_files        │
  │     _response ────────│  合併結果
  │  [{path, name, type}] │  type: file/terminal/browser
```

---

## 22. Diff 流程（檔案變更確認）

```
WebView              Extension Host           使用者
  │                       │                      │
  │─── open_diff ────────►│                      │
  │    (originalFilePath, │  建立左右側 URI        │
  │     newFilePath,      │  vscode.diff() 開啟   │
  │     edits,            │  等待使用者操作        │
  │     supportMultiEdits)│                      │
  │                       │                      │ 審查 diff
  │                       │◄── acceptProposedDiff ┤ 點擊接受
  │                       │    或 rejectProposedDiff
  │                       │    或 save（視為接受） │
  │                       │  KA() 計算最終 edits  │
  │◄─── open_diff_response│                      │
  │     (newEdits | null) │                      │
```

---

## 23. Notification

```
WebView              Extension Host           使用者
  │                       │                      │
  │◄─── show_notification ─│                      │
  │     (message,         │  onlyIfNotVisible:    │
  │      severity,        │  若面板可見則跳過      │
  │      buttons)         │                      │
  │                       │  showErrorMessage /   │
  │                       │  showWarningMessage / │
  │                       │  showInformationMessage
  │                       │                      │ 點擊按鈕
  │                       │  makeVisible()        │
  │◄─── show_notification ─│                      │
  │     _response ────────│                      │
  │     (buttonValue)     │                      │
```

---

## 24. Debugger MCP 自動整合

```
VSCode Debugger      Extension Host           CLI Process
  │                       │                        │
  │  debug session 啟動   │                        │
  │──(onStateChange) ────►│                        │
  │                       │  遍歷所有 channels      │
  │                       │  addDebuggerMcpToChannel│
  │                       │─── setMcpServers ──────►│
  │                       │    (+ claude-vscode-    │
  │                       │       extension)        │
  │                       │◄─── control_response ───│
  │                       │  debuggerMcpState:active│
  │                       │  pushChannelStateUpdate │
  │                       │                        │
  │  debug session 結束   │                        │
  │──(onStateChange) ────►│                        │
  │                       │  removeDebuggerMcpFrom  │
  │                       │  Channel()              │
  │                       │─── setMcpServers ──────►│
  │                       │    (移除 extension MCP) │
  │                       │  debuggerMcpState:      │
  │                       │  inactive               │
```

Jupyter MCP 共用同一個 `"claude-vscode-extension"` 伺服器名稱。

---

## 25. Plugin 安裝

```
WebView              Extension Host           Claude CLI
  │                       │                        │
  │─── list_plugins ─────►│                        │
  │    (includeAvailable) │─── spawnSync ──────────►│
  │                       │    claude plugin list   │
  │◄─── list_plugins      │    --json [--available] │
  │     _response ────────│◄─── JSON 輸出 ──────────│
  │                       │                        │
  │─── install_plugin ───►│                        │
  │    (pluginId, scope)  │─── spawnSync ──────────►│
  │                       │    claude plugin install│
  │◄─── install_plugin    │◄─── result ─────────────│
  │     _response ────────│                        │
  │     (needsRestart:true│                        │
```

所有 plugin 操作使用 `spawnSync`（同步，30 秒 timeout）。安裝/移除/啟停需重啟。

---

## 26. MCP Elicitation

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │                       │◄─── control_request ────│
  │                       │     (elicitation,       │
  │                       │      mcp_server_name,   │
  │                       │      mode: url/form,    │
  │                       │      message)           │
  │                       │                        │ 等待使用者輸入
  │                       │  onElicitation callback │
  │                       │  (若無 handler → decline)
  │                       │─── control_response ───►│
  │                       │    { action: "decline" }│
  │                       │                        │ MCP 繼續
```


---

## 27. Permission Mode 切換

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── set_permission     │                        │
  │    _mode ────────────►│                        │
  │    (mode: acceptEdits)│  settings 持久化        │
  │                       │─── control_request ────►│
  │                       │    set_permission_mode  │
  │                       │◄─── control_response ───│
  │◄─── set_permission    │                        │
  │     _mode_response ───│  { success: true }      │
```

模式循環：`default` → `acceptEdits` → `plan` → `default`（或含 `bypassPermissions`）

---

## 28. 模型切換（雙層回滾）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── set_model ────────►│                        │
  │    (model.value)      │  [樂觀更新 UI]          │
  │                       │  settings.setModel()    │
  │                       │─── control_request ────►│
  │                       │    set_model            │
  │                       │◄─── control_response ───│
  │◄─── set_model         │                        │
  │     _response ────────│  { success: true }      │
  │                       │                        │
  │  失敗時：              │  settings 回滾          │
  │  UI 也回滾            │◄─── error ──────────────│
  │◄─── set_model         │                        │
  │     _response ────────│  { success: false,      │
  │  WebView 回滾 UI      │    error: "..." }       │
```

---

## 29. 思考層級切換

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── set_thinking_level►│                        │
  │    (thinkingLevel:    │  level → tokens 轉換：  │
  │     "off")            │  "off" → 0             │
  │                       │  其他  → 31999          │
  │                       │─── control_request ────►│
  │                       │    set_max_thinking_    │
  │                       │    tokens: 0            │
  │                       │  globalState 持久化      │
  │                       │◄─── control_response ───│
  │◄─── set_thinking      │                        │
  │     _level_response ──│                        │
```

WebView 送語義化的 level，Extension 轉換成 token 數後才送 CLI。

---

## 29b. apply_settings（Effort Level 切換等）

通用設定套用機制，用於 effortLevel 等不需要專屬 handler 的設定：

```
WebView              Extension Host           CLI Process     檔案系統
  │                       │                        │              │
  │─── apply_settings ───►│                        │              │
  │    (settings: {       │                        │              │
  │      effortLevel:     │  讀取 settings.json     │              │
  │      "high" })        │──────────────────────────────────────►│
  │                       │  合併新設定寫回          │              │
  │                       │──────────────────────────────────────►│
  │                       │  cachedUserSettings     │              │
  │                       │  = merged               │              │
  │                       │─── apply_flag_settings ►│              │
  │                       │    { settings:           │              │
  │                       │      { effortLevel:      │              │
  │                       │        "high" } }        │              │
  │                       │◄─── control_response ───│              │
  │◄─── apply_settings    │                        │              │
  │     _response ────────│                        │              │
```

與 `set_model` 的差異：
- `apply_settings` 無失敗回滾機制
- 設定寫入 `~/.claude/settings.json`（非 VS Code 設定）
- CLI 端透過 `apply_flag_settings` subtype 接收

---

## 30. 取消流程（詳細）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── interrupt_claude ─►│                        │
  │                       │─── interrupt ──────────►│ (control_request)
  │                       │◄─── control_response ───│
  │                       │                        │
  │  若 CLI 主動取消進行中的 control_request：        │
  │                       │◄─── control_cancel_     │
  │                       │     request ────────────│
  │                       │  cancelControllers      │
  │                       │  .get(id).abort()       │
  │                       │                        │
  │  abort 傳播至 WebView：│                        │
  │◄─── cancel_request ───│                        │
  │     (targetRequestId) │                        │
  │  關閉等待中的對話框    │                        │
```

---

## 31. File Rewind（詳細）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── rewind_code ──────►│                        │
  │    (userMessageId,    │─── control_request ────►│
  │     dryRun: true)     │    rewind_files         │
  │                       │◄─── fileDiffs ──────────│
  │◄─── rewind_code       │    (dry run 預覽)       │
  │     _response ────────│                        │
  │                       │                        │
  │─── open_file_diffs ──►│                        │
  │    (fileDiffs)        │  vscode.changes()       │
  │◄─── open_file_diffs   │  顯示 diff 預覽         │
  │     _response ────────│                        │
  │                       │                        │
  │─── rewind_code ──────►│                        │
  │    (userMessageId,    │─── rewind_files ───────►│
  │     dryRun: false)    │    (實際還原)            │
  │◄─── rewind_code       │◄─── fileDiffs ──────────│
  │     _response ────────│                        │
```

---

## 32. MCP 整合（Chrome / Jupyter）

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── ensure_chrome      │                        │
  │    _mcp_enabled ─────►│                        │
  │                       │  合併 mcpServers        │
  │                       │  ["claude-in-chrome"]   │
  │                       │─── mcp_set_servers ────►│
  │                       │◄─── control_response ───│
  │                       │  chromeMcpState:        │
  │                       │  connecting → connected │
  │                       │  pushChannelStateUpdate │
  │◄─── update_state ─────│                        │
  │                       │                        │
  │─── disable_chrome     │                        │
  │    _mcp ─────────────►│                        │
  │                       │  移除 mcpServers 項目   │
  │                       │─── mcp_set_servers ────►│
  │                       │  注入合成訊息            │
  │                       │  [Browser disconnected] │
  │                       │  chromeMcpState:        │
  │                       │  disconnected           │
  │◄─── update_state ─────│                        │
```

Jupyter MCP 流程相同但使用 `"claude-vscode-extension"` 伺服器名稱，且有自動偵測 notebook 開啟/關閉。

---

## 33. MCP OAuth 認證

```
WebView              Extension Host           CLI Process    Browser
  │                       │                        │              │
  │─── authenticate_mcp   │                        │              │
  │    _server ──────────►│                        │              │
  │                       │─── mcp_authenticate ──►│              │
  │                       │◄─── authUrl ────────────│              │
  │◄─── authenticate      │                        │              │
  │     _mcp_server ──────│                        │              │
  │                       │                        │              │
  │  開啟瀏覽器授權 URL    │                        │              │
  │──────────────────────────────────────────────────────────────►│
  │                       │                        │              │ 使用者授權
  │◄──────────────────────────────── callback URL ────────────────│
  │                       │                        │              │
  │─── submit_mcp_oauth   │                        │              │
  │    _callback_url ────►│                        │              │
  │                       │─── mcp_oauth_callback──►│              │
  │                       │◄─── control_response ───│              │
  │◄─── submit_mcp_oauth  │                        │              │
  │     _callback_url ────│                        │              │
```

---

## 34. Session 管理（rename / delete / open）

```
WebView              Extension Host
  │                       │
  │─── rename_session ───►│
  │    (sessionId, title) │  寫入 JSONL:
  │                       │  { type: "custom-title",
  │                       │    customTitle: "..." }
  │◄─── rename_session    │
  │     _response ────────│
  │                       │
  │─── delete_session ───►│
  │    (sessionId)        │  settings.hideSession()
  │                       │  (非真正刪除，只標記隱藏)
  │◄─── delete_session    │
  │     _response ────────│
  │                       │
  │─── open_in_editor ───►│
  │    (sessionId)        │  claude-vscode.editor.open
  │◄─── open_in_editor    │
  │     _response ────────│
```

---

## 35. REST API 呼叫

Extension 直接呼叫的 Anthropic REST API（不經過 CLI）：

```
Extension Host           Anthropic API
  │                            │
  │─── GET /v1/sessions ──────►│  list_remote_sessions
  │─── GET /v1/sessions/{id} ─►│  teleport_session（元資料）
  │─── GET /v1/session_ingress►│  teleport_session（對話記錄）
  │─── GET /api/oauth/usage ──►│  usage_update
  │                            │
  OAuth 相關：
  │─── GET  /oauth/authorize ─►│  login 流程
  │─── POST /v1/oauth/token ──►│  token 交換
  │─── POST /api/oauth/        │
  │         claude_cli/        │
  │         create_api_key ───►│  建立 API key
  │─── GET  /api/oauth/        │
  │         claude_cli/roles ─►│  取得帳戶角色
```

Headers（認證後）：
```
Authorization: Bearer <token>
anthropic-version: 2023-06-01
x-organization-uuid: <orgUUID>
```

---

## 36. Plugin 與 Marketplace 管理

Plugin 操作使用 `spawnSync` 同步執行 `claude plugin` CLI 子命令（30 秒 timeout）。

```
WebView              Extension Host           Claude CLI（spawnSync）
  │                       │                        │
  │─── list_plugins ─────►│                        │
  │    (includeAvailable) │─── claude plugin list ─►│
  │                       │    [--available] --json  │
  │◄─── list_plugins      │◄─── JSON stdout ────────│
  │     _response ────────│                        │
  │                       │                        │
  │─── install_plugin ───►│                        │
  │    (pluginId, scope)  │─── claude plugin        │
  │                       │    install <id> ────────►│
  │◄─── install_plugin    │◄─── result ─────────────│
  │     _response ────────│    (needsRestart: true)  │
  │                       │                        │
  │─── uninstall_plugin ─►│                        │
  │    (pluginId)         │─── claude plugin        │
  │                       │    remove <id> ─────────►│
  │◄─── uninstall_plugin  │◄─── result ─────────────│
  │     _response ────────│                        │
  │                       │                        │
  │─── set_plugin         │                        │
  │    _enabled ─────────►│                        │
  │    (pluginId,         │─── claude plugin        │
  │     enabled)          │    enable/disable <id> ─►│
  │◄─── set_plugin        │◄─── result ─────────────│
  │     _enabled_response │                        │
```

Marketplace 管理（管理 plugin 來源）：

```
WebView              Extension Host
  │                       │
  │─── list_marketplaces ►│  讀取設定中的 marketplace 列表
  │◄─── list_marketplaces │
  │     _response ────────│
  │                       │
  │─── add_marketplace ──►│  寫入設定
  │    (url, name)        │
  │◄─── add_marketplace   │
  │     _response ────────│
  │                       │
  │─── remove_marketplace►│  從設定中移除
  │    (url)              │
  │◄─── remove_marketplace│
  │     _response ────────│
  │                       │
  │─── refresh_marketplace►│  重新抓取 marketplace plugin 列表
  │◄─── refresh_marketplace│
  │     _response ─────────│
```

安裝/移除/啟停都需要重啟 extension 才生效（`needsRestart: true`）。

---

## 37. Terminal Operations

Extension 提供三個 Terminal 相關操作，直接呼叫 VS Code API，不經過 CLI：

```
WebView              Extension Host           VS Code Terminal
  │                       │                        │
  │─── open_terminal ────►│                        │
  │    (cwd)              │  createTerminal()       │
  │                       │  sendText("cd <cwd>")   │
  │                       │─────────────────────────►│ 開啟 terminal
  │◄─── open_terminal     │                        │
  │     _response ────────│                        │
  │                       │                        │
  │─── open_claude        │                        │
  │    _in_terminal ─────►│                        │
  │    (cwd, flags)       │  createTerminal()       │
  │                       │  sendText("claude ...")  │
  │                       │─────────────────────────►│ 執行 claude CLI
  │◄─── open_claude       │                        │
  │     _in_terminal      │                        │
  │     _response ────────│                        │
  │                       │                        │
  │─── show_claude        │                        │
  │    _terminal          │                        │
  │    _setting ─────────►│                        │
  │                       │  vscode.commands.       │
  │                       │  executeCommand(        │
  │                       │  "workbench.action.      │
  │                       │  openSettings",          │
  │                       │  "claudeCode.useTerminal")
  │◄─── show_claude       │                        │
  │     _terminal         │                        │
  │     _setting_response │                        │
```

`open_claude_in_terminal` 用於讓使用者在 terminal 中以 stdio 模式繼續操作 Claude CLI，`show_claude_terminal_setting` 引導使用者到 useTerminal 設定頁。

---

## 38. MCP Server 狀態查詢與管理

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── get_mcp_servers ──►│                        │
  │    (channelId)        │  query.mcpServerStatus()│
  │                       │  過濾 "claude-vscode"   │
  │◄─── get_mcp_servers   │                        │
  │     _response ────────│                        │
  │     (mcpServers: [...])│                        │
  │                       │                        │
  │─── set_mcp_server     │                        │
  │    _enabled ─────────►│                        │
  │    (serverName,       │─── toggleMcpServer ────►│
  │     enabled)          │◄─── control_response ───│
  │◄─── set_mcp_server    │                        │
  │     _enabled_response │                        │
  │     (success, error?) │                        │
  │                       │                        │
  │─── reconnect_mcp      │                        │
  │    _server ──────────►│                        │
  │    (serverName)       │─── reconnectMcpServer ─►│
  │                       │◄─── control_response ───│
  │◄─── reconnect_mcp     │                        │
  │     _server_response  │                        │
  │     (success, error?) │                        │
  │                       │                        │
  │─── clear_mcp_server   │                        │
  │    _auth ────────────►│                        │
  │    (serverName)       │  mcp_clear_auth ───────►│
  │◄─── clear_mcp_server  │◄─── control_response ───│
  │     _auth_response ───│                        │
```

---

## 39. Jupyter MCP 啟用／停用

```
WebView              Extension Host           CLI Process
  │                       │                        │
  │─── enable_jupyter     │                        │
  │    _mcp ─────────────►│                        │
  │    (channelId)        │  在 channel.mcpServers  │
  │                       │  加入 "claude-vscode-   │
  │                       │  extension"             │
  │                       │─── setMcpServers ──────►│
  │                       │◄─── control_response ───│
  │◄─── enable_jupyter    │  jupyterMcpState:active  │
  │     _mcp_response ────│  pushChannelStateUpdate  │
  │     (success)         │                        │
  │                       │                        │
  │─── disable_jupyter    │                        │
  │    _mcp ─────────────►│                        │
  │    (channelId)        │  從 mcpServers 移除      │
  │                       │─── setMcpServers ──────►│
  │                       │  注入合成訊息            │
  │                       │  "[Jupyter disconnected]"│
  │                       │  jupyterMcpState:inactive│
  │◄─── disable_jupyter   │                        │
  │     _mcp_response ────│                        │
  │     (success)         │                        │
```

---

## 40. Chrome MCP：建立新分頁

```
WebView              Extension Host           Chrome MCP Client
  │                       │                        │
  │─── create_new_browser │                        │
  │    _tab ─────────────►│                        │
  │                       │  chromeMcpClient.       │
  │                       │  createNewTab()         │
  │                       │─────────────────────────►│
  │◄─── create_new_browser│◄─────────────────────────│
  │     _tab_response ────│                        │
  │     (tabGroupId,      │                        │
  │      tabId)           │                        │
```

---

## 41. Session 列表與內容查詢

```
WebView              Extension Host           檔案系統
  │                       │                        │
  │─── list_sessions      │                        │
  │    _request ─────────►│                        │
  │                       │  gP({ dir: cwd,         │
  │                       │       includeWorktrees: │
  │                       │       false })          │
  │                       │  篩選隱藏 session       │
  │◄─── list_sessions     │                        │
  │     _response ────────│                        │
  │     (sessions: [...]) │                        │
  │                       │                        │
  │─── get_session        │                        │
  │    _request ─────────►│                        │
  │    (sessionId)        │  sessionManager.        │
  │                       │  getSessionMessages()   │
  │                       │  getSessionDiffs()      │
  │◄─── get_session       │                        │
  │     _response ────────│                        │
  │     (messages,        │                        │
  │      sessionDiffs)    │                        │
```

---

## 42. update_skipped_branch

用於 Session Forking 時記錄已跳過的 git branch：

```
WebView              Extension Host
  │                       │
  │─── update_skipped     │
  │    _branch ──────────►│
  │    (sessionId,        │  sessionManager.
  │     branch,           │  appendSkippedBranch()
  │     failed)           │
  │◄─── update_skipped    │
  │     _branch_response ─│
  │     (success)         │
```

---

## 43. open_file

在 VS Code Editor 中開啟指定檔案，支援行號跳轉與文字搜尋：

```
WebView              Extension Host           VS Code Editor
  │                       │                        │
  │─── open_file ────────►│                        │
  │    (filePath,         │  解析路徑（相對→絕對）   │
  │     location?: {      │                        │
  │       searchText,     │  如果是目錄：           │
  │       startLine,      │  revealInExplorer()     │
  │       endLine })      │                        │
  │                       │  如果是檔案：           │
  │                       │  showTextDocument()     │
  │                       │  選取 location 位置     │
  │◄─── open_file         │─────────────────────────►│
  │     _response ────────│                        │
```

---

## 44. exec（執行系統命令）

WebView 可要求 Extension 在工作目錄執行系統命令：

```
WebView              Extension Host           子行程
  │                       │                        │
  │─── exec ─────────────►│                        │
  │    (command,          │  child_process.spawn()  │
  │     params: [...])    │  cwd: this.cwd          │
  │                       │─────────────────────────►│
  │                       │◄── stdout / stderr ──────│
  │◄─── exec_response ────│                        │
  │     (stdout,          │                        │
  │      stderr,          │                        │
  │      exitCode)        │                        │
```

---

## 45. get_terminal_contents

取得 VS Code terminal 的文字內容（透過剪貼板）：

```
WebView              Extension Host           VS Code Terminal
  │                       │                        │
  │─── get_terminal       │                        │
  │    _contents ────────►│                        │
  │    (terminalName)     │  找到對應 terminal      │
  │                       │  executeCommand(        │
  │                       │  "terminal.selectAll")  │
  │                       │  executeCommand(        │
  │                       │  "terminal.copy         │
  │                       │   Selection")           │
  │                       │  env.clipboard.read()   │
  │◄─── get_terminal      │                        │
  │     _contents_response│                        │
  │     (content: string) │                        │
```

---

## 46. open_content（暫存檔案預覽）

在 VS Code 中以暫存檔案形式開啟任意文字內容（可選是否可編輯）：

```
WebView              Extension Host           VS Code Editor
  │                       │                        │
  │─── open_content ─────►│                        │
  │    (content,          │  建立暫存 URI           │
  │     fileName,         │  （VirtualFileSystem）  │
  │     editable,         │  showTextDocument()     │
  │     signal?)          │─────────────────────────►│
  │                       │  等待使用者關閉          │
  │◄─── open_content      │◄─────────────────────────│
  │     _response ────────│                        │
  │     (updatedContent)  │                        │
```

---

## 47. Plan Mode：Markdown Preview 與 Comments

Plan Mode 使用 VS Code Markdown 預覽面板，支援使用者加入 comment 回傳給 WebView：

```
WebView              Extension Host           Markdown Panel
  │                       │                        │
  │─── open_markdown      │                        │
  │    _preview ─────────►│                        │
  │    (channelId,        │  Qx.create()            │
  │     content,          │  設定 comment callback  │
  │     title,            │─────────────────────────►│ 建立面板
  │     enableComments)   │                        │
  │◄─── open_markdown     │                        │
  │     _preview_response │                        │
  │                       │                        │
  │                       │◄── 使用者新增 comment ───│
  │◄─── plan_comment ─────│                        │
  │     (channelId,       │                        │
  │      comment)         │                        │
  │                       │                        │
  │─── get_plan_comments ►│                        │
  │    (channelId)        │  從 planCommentsByChannel
  │◄─── get_plan_comments │  取得所有 comment       │
  │     _response ────────│                        │
  │     (comments: [...]) │                        │
  │                       │                        │
  │─── remove_plan        │                        │
  │    _comment ─────────►│                        │
  │    (channelId,        │  移除 comment           │
  │     commentId)        │  panel.removeComment()  │
  │◄─── remove_plan       │                        │
  │     _comment_response │                        │
  │                       │                        │
  │─── close_plan_preview►│                        │
  │    (channelId)        │  panel.dispose()        │
  │                       │  planCommentsByChannel  │
  │◄─── close_plan        │  .delete(channelId)     │
  │     _preview_response │                        │
```

---

## 48. get_asset_uris

取得 Extension 資源（圖示等）的 Webview URI：

```
WebView              Extension Host
  │                       │
  │─── get_asset_uris ───►│
  │                       │  getAssetUris()
  │                       │  （將資源路徑轉為 webview URI）
  │◄─── asset_uris        │
  │     _response ────────│
  │     (assetUris: {     │
  │       key: {          │
  │         light: uri,   │
  │         dark: uri }   │
  │     })                │
```

---

## 49. open_url

在系統預設瀏覽器中開啟 URL：

```
WebView              Extension Host
  │                       │
  │─── open_url ─────────►│
  │    (url)              │  vscode.env.openExternal(
  │                       │    Uri.parse(url))
  │◄─── open_url_response │
```

---

## 50. get_auth_status

主動查詢當前認證狀態（通常在 init 時已取得，此為按需查詢）：

```
WebView              Extension Host
  │                       │
  │─── get_auth_status ──►│
  │                       │  authManager.getAuthStatus()
  │◄─── get_auth_status   │
  │     _response ────────│
  │     (status: {        │
  │       status: "logged_in
  │                | logged_out
  │                | unknown",
  │       account: {      │
  │         emailAddress  │
  │       }})             │
```

---

## 51. submit_oauth_code（手動 OAuth 碼）

當使用者無法自動完成 OAuth 回調時，手動輸入授權碼：

```
WebView              Extension Host
  │                       │
  │─── submit_oauth_code ►│
  │    (code)             │  authManager.
  │                       │  handleManualAuthCode(code)
  │◄─── submit_oauth_code │
  │     _response ────────│
```

---

## 52. open_config_file

開啟 Claude 設定檔案（MCP 設定等），若不存在則自動建立：

```
WebView              Extension Host           VS Code Editor
  │                       │                        │
  │─── open_config_file ─►│                        │
  │    (configType:       │  根據 configType 決定路徑：
  │     "mcp-local"       │  "mcp-local" → ~/.claude.json
  │     "mcp-user"        │  "mcp-user"  → ~/.claude.json
  │     "mcp-project")    │  "mcp-project" → .mcp.json
  │                       │  若不存在則建立預設檔案  │
  │                       │  openTextDocument()     │
  │◄─── open_config_file  │  showTextDocument()     │
  │     _response ────────│─────────────────────────►│
```

---

## 53. get_claude_state

取得 Claude CLI 的目前配置（非 WebView 狀態）：

```
WebView              Extension Host
  │                       │
  │─── get_claude_state ─►│
  │                       │  this.loadConfig()
  │                       │  pushStateUpdate()
  │◄─── get_claude_state  │
  │     _response ────────│
  │     (config: {...})   │
```

---

## 54. open_config（開啟 VS Code 設定）

```
WebView              Extension Host
  │                       │
  │─── open_config ──────►│
  │    (searchString?)    │  focusFirstEditorGroup()
  │                       │  openSettings(searchString
  │                       │    || "claudeCode")
  │◄─── open_config       │
  │     _response ────────│
```

---

## 55. open_help

開啟 Claude for VS Code 說明文件（固定 URL）：

```
WebView              Extension Host
  │                       │
  │─── open_help ────────►│
  │                       │  env.openExternal(
  │                       │    "https://code.claude.com/
  │                       │     docs/en/vs-code")
  │◄─── open_help         │
  │     _response ────────│
```

---

## 56. open_output_panel

顯示 Extension 的 VS Code Output Panel（用於查看 debug log）：

```
WebView              Extension Host
  │                       │
  │─── open_output_panel ►│
  │                       │  this.output.show()
  │◄─── open_output_panel │
  │     _response ────────│
```

---

## 57. open_folder

開啟 VS Code 資料夾選擇對話框：

```
WebView              Extension Host
  │                       │
  │─── open_folder ──────►│
  │                       │  commands.executeCommand(
  │                       │    "vscode.openFolder")
  │◄─── open_folder       │
  │     _response ────────│
  │     (opened: boolean) │
```

---

## 58. dismiss_terminal_banner

隱藏 Terminal 模式提示橫幅並持久化設定：

```
WebView              Extension Host
  │                       │
  │─── dismiss_terminal   │
  │    _banner ──────────►│
  │                       │  globalState.update(
  │                       │    "showTerminalBanner",
  │                       │    false)
  │◄─── dismiss_terminal  │
  │     _banner_response ─│
```

---

## 59. dismiss_review_upsell_banner

隱藏 Code Review upsell 橫幅並記錄 metadata：

```
WebView              Extension Host
  │                       │
  │─── dismiss_review     │
  │    _upsell_banner ───►│
  │    (metadata)         │  globalState.update(
  │                       │    "reviewUpsellDismissed
  │                       │     Metadata", metadata)
  │                       │  showReviewUpsellBanner
  │                       │  = false
  │                       │  pushStateUpdate()
  │◄─── dismiss_review    │
  │     _upsell_banner    │
  │     _response ────────│
```

---

## 60. dismiss_onboarding

完成或跳過 onboarding 教學：

```
WebView              Extension Host
  │                       │
  │─── dismiss_onboarding►│
  │    (dismissType)      │  settings.setHideOnboarding
  │                       │  (true)
  │                       │  pushStateUpdate()
  │◄─── dismiss_onboarding│
  │     _response ────────│
```

---

## 61. log_event（分析事件追蹤）

WebView 向 Extension 回報 UI 事件，由 Extension 轉送至分析後端：

```
WebView              Extension Host
  │                       │
  │─── log_event ────────►│
  │    (eventName,        │  this.logEvent(
  │     eventData?: {...})│    channelId,
  │                       │    eventName,
  │                       │    eventData)
  │◄─── log_event         │
  │     _response ────────│
```

---

## 62. ask_debugger_help

請求 VS Code Debugger MCP 提供除錯建議（由子類實作）：

```
WebView              Extension Host
  │                       │
  │─── ask_debugger_help ►│
  │    (channelId)        │  （由 VSCode 子類實作）
  │                       │  呼叫 debugger MCP 取得建議
  │◄─── ask_debugger_help │
  │     _response ────────│
```

---

## 63. update_session_state

保留接口（目前為空實作，供未來使用）：

```
WebView              Extension Host
  │                       │
  │─── update_session     │
  │    _state ───────────►│
  │                       │  （空實作，無操作）
  │◄─── update_session    │
  │     _state_response ──│
```

