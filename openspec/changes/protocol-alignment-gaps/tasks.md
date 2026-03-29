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

#### 3.1 `claude_authenticate`
- [ ] 從 extension 提取結構 → `synthetic/control-claude-authenticate.jsonl`
- [ ] server handler：收到 login request → sendControlRequest('claude_authenticate') → 推 auth URL 到 client
- [ ] test

#### 3.2 `claude_oauth_callback`
- [ ] 從 extension 提取結構 → `synthetic/control-claude-oauth-callback.jsonl`
- [ ] server handler：收到 OAuth code → sendControlRequest('claude_oauth_callback')
- [ ] test

#### 3.3 `claude_oauth_wait_for_completion`
- [ ] 從 extension 提取結構 → `synthetic/control-claude-oauth-wait.jsonl`
- [ ] server handler：sendControlRequest('claude_oauth_wait_for_completion') 等待完成
- [ ] test

#### 3.4 Client UI
- [ ] 登入按鈕（未登入時顯示）
- [ ] 顯示 auth URL / 開瀏覽器
- [ ] OAuth code 提交表單
- [ ] 登入狀態顯示
- [ ] test

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
