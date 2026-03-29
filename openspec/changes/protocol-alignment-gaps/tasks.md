## Protocol Alignment Gaps — Extension 2.1.86 vs cc-office

> 所有 CLI 支援的功能 web UI 都能用。
> 每個 gap：fixture → schema → adapter → test。

---

### Group 1：Event Types — Schema + Fixture + Adapter（4 項）

#### 1.1 `system/post_turn_summary`
- [ ] 從 extension 合成 fixture → `synthetic/post-turn-summary.jsonl`
- [ ] claude-schemas.ts 加 subtype schema
- [ ] claude-adapter.ts skip（return null，extension 也 skip）
- [ ] parseLine + adapter test

#### 1.2 `system/session_state_changed`
- [ ] 從 extension 合成 fixture → `synthetic/session-state-changed.jsonl`
- [ ] claude-schemas.ts 加 subtype schema
- [ ] claude-adapter.ts skip（return null）
- [ ] parseLine + adapter test

#### 1.3 `system/api_retry`
- [ ] 從 DB 提取真實 JSON → `real/api-retry.jsonl`
- [ ] claude-schemas.ts 加 subtype schema
- [ ] claude-adapter.ts passthrough → `system:api_retry`
- [ ] parseLine + adapter test

#### 1.4 `compaction_delta`
- [ ] 從 extension 合成 fixture → `synthetic/compaction-delta.jsonl`
- [ ] claude-schemas.ts 加 delta schema
- [ ] claude-adapter.ts skip（CLI 自己處理壓縮，我們只需 compact_boundary）
- [ ] parseLine + adapter test

### Group 2：Control Request Subtypes SENT — Fixture + Test（4 項）

> formatControlRequest 是 generic，只需建 fixture 記錄 JSON 結構。

#### 2.1 `get_context_usage`
- [ ] 從 extension 提取結構 → `synthetic/control-get-context-usage.jsonl`
- [ ] test

#### 2.2 `seed_read_state`
- [ ] 從 extension 提取結構 → `synthetic/control-seed-read-state.jsonl`
- [ ] test

#### 2.3 `side_question`
- [ ] 從 extension 提取結構 → `synthetic/control-side-question.jsonl`
- [ ] test

#### 2.4 `channel_enable`
- [ ] 從 extension 提取結構 → `synthetic/control-channel-enable.jsonl`
- [ ] test

### Group 3：Auth Flow — 完整功能（3 項）

> 取代 misc-handler 假 auth stub，接上 CLI 的 OAuth flow。
> 使用第一個 active channel 送 control_request（不建臨時 channel）。
> 沒有 active channel 時 UI 提示「請先開一個 session」。

#### 3.1 Fixtures
- [ ] 從 extension 提取結構 → `synthetic/control-claude-authenticate.jsonl`
- [ ] 從 extension 提取結構 → `synthetic/control-claude-oauth-callback.jsonl`
- [ ] 從 extension 提取結構 → `synthetic/control-claude-oauth-wait.jsonl`

#### 3.2 Server — 取代 auth stub
- [ ] misc-handler `login`：找第一個 active channel → `channel.sendControlRequest('claude_authenticate', { method })`
- [ ] CLI 回傳 `{ manualUrl, automaticUrl }` → server emit `notification:auth_url` 到 client
- [ ] misc-handler `submit_oauth_code`：找 channel → `channel.sendControlRequest('claude_oauth_callback', { authorizationCode, state })`
- [ ] 接著送 `channel.sendControlRequest('claude_oauth_wait_for_completion')` 等待完成
- [ ] CLI 回 success → 更新 `ctx.authState` → callback success
- [ ] 沒有 active channel 時 callback `{ success: false, error: 'No active session' }`
- [ ] test：FakeClaude mock control_response

#### 3.3 Client UI
- [ ] 未登入時顯示 Login 按鈕（HeaderBar 或 ComposeToolbar）
- [ ] 點 Login → emit `login` → 收到 `notification:auth_url` → 開新分頁或顯示 URL
- [ ] 用戶登入完成 → 輸入 OAuth code → emit `submit_oauth_code`
- [ ] 登入成功 → 更新 UI 狀態
- [ ] 沒有 active session → 顯示提示「請先開一個 session」
- [ ] test

#### 3.4 舊 stub 清理
- [ ] Chrome MCP handler（ensure/disable）— 目前是 fake stub，同樣應該透過 channel sendControlRequest
- [ ] Jupyter MCP handler（enable/disable）— 同上
- [ ] Debugger handler（ask_debugger_help）— 同上
- [ ] 評估是否在這個 change 一起修，或開獨立 change

### Group 4：CLI Flags — LaunchOptions + buildArgs（3 項）

#### 4.1 `--task-budget`
- [ ] LaunchOptions 加 `taskBudget: { total: number }`
- [ ] buildArgs 加 `--task-budget`
- [ ] test

#### 4.2 `--channels`
- [ ] LaunchOptions 加 `channels: string[]`
- [ ] buildArgs 加 `--channels`（空格分隔）
- [ ] test

#### 4.3 `--claude-in-chrome-mcp`
- [ ] LaunchOptions 加 `claudeInChromeMcp: boolean`
- [ ] buildArgs 加 `--claude-in-chrome-mcp`
- [ ] test

### Group 5：Fixtures Checklist

#### 5.1 真實 JSON（從 DB）
- [ ] `system/api_retry` → `real/api-retry.jsonl`

#### 5.2 合成 JSON（從 extension 提取結構）
- [ ] `system/post_turn_summary` → `synthetic/post-turn-summary.jsonl`
- [ ] `system/session_state_changed` → `synthetic/session-state-changed.jsonl`
- [ ] `stream/compaction_delta` → `synthetic/compaction-delta.jsonl`
- [ ] `control-request/get_context_usage` → `synthetic/control-get-context-usage.jsonl`
- [ ] `control-request/seed_read_state` → `synthetic/control-seed-read-state.jsonl`
- [ ] `control-request/side_question` → `synthetic/control-side-question.jsonl`
- [ ] `control-request/channel_enable` → `synthetic/control-channel-enable.jsonl`
- [ ] `control-request/claude_authenticate` → `synthetic/control-claude-authenticate.jsonl`
- [ ] `control-request/claude_oauth_callback` → `synthetic/control-claude-oauth-callback.jsonl`
- [ ] `control-request/claude_oauth_wait_for_completion` → `synthetic/control-claude-oauth-wait.jsonl`

### Group 6：Coverage Matrix 更新
- [ ] 更新 `references/coverage-matrix.md` 所有項目狀態
- [ ] 移除「VS Code 專屬」標記（所有 CLI 功能 web 都能用）
