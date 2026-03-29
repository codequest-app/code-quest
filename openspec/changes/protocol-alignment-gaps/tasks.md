## Protocol Alignment Gaps — Extension 2.1.86 vs cc-office

> 從 coverage-matrix.md 的 13 個 gap + DB 發現的 api_retry。
> 每個 gap：找/建 fixture → schema → adapter → test。
> adapter 層的處理方式待討論。

---

### 1. Event Types — Missing

#### 1.1 `system/post_turn_summary` — extension skip
- [ ] 從 extension 找出 JSON 結構，建 synthetic fixture
- [ ] claude-schemas.ts 加 schema
- [ ] claude-adapter.ts 決定處理方式（skip? passthrough?）
- [ ] test

#### 1.2 `system/session_state_changed` — extension 特殊處理
- [ ] 從 extension 找出 JSON 結構，建 synthetic fixture
- [ ] claude-schemas.ts 加 schema
- [ ] claude-adapter.ts 決定處理方式
- [ ] test

#### 1.3 `system/api_retry` — DB 有真實 JSON
- [ ] 從 DB 提取真實 JSON 建 fixture
- [ ] claude-schemas.ts 加 schema
- [ ] claude-adapter.ts 決定處理方式（顯示 retry 狀態？）
- [ ] test

### 2. Stream Deltas — Missing

#### 2.1 `compaction_delta`
- [ ] 從 extension 找出 JSON 結構，建 synthetic fixture
- [ ] claude-schemas.ts 加 delta schema
- [ ] claude-adapter.ts 決定處理方式
- [ ] test

### 3. Control Request Subtypes SENT — Missing

#### 3.1 `get_context_usage`
- [ ] 從 extension 找出 request/response 結構
- [ ] 建 synthetic fixture
- [ ] test（formatControlRequest 已 generic，只需 fixture test）

#### 3.2 `seed_read_state`
- [ ] 從 extension 找出結構
- [ ] 建 synthetic fixture
- [ ] test

#### 3.3 `side_question`
- [ ] 從 extension 找出結構
- [ ] 建 synthetic fixture
- [ ] test

#### 3.4 `channel_enable`
- [ ] 從 extension 找出結構
- [ ] 建 synthetic fixture
- [ ] test

#### 3.5 `claude_authenticate`
- [ ] 從 extension 找出結構
- [ ] 建 synthetic fixture
- [ ] test

#### 3.6 `claude_oauth_callback`
- [ ] 從 extension 找出結構
- [ ] 建 synthetic fixture
- [ ] test

#### 3.7 `claude_oauth_wait_for_completion`
- [ ] 從 extension 找出結構
- [ ] 建 synthetic fixture
- [ ] test

### 4. CLI Flags — Missing

#### 4.1 `--task-budget`
- [ ] claude.ts LaunchOptions 加 `taskBudget`
- [ ] buildArgs 加 `--task-budget`
- [ ] test

#### 4.2 `--channels`
- [ ] claude.ts LaunchOptions 加 `channels`
- [ ] buildArgs 加 `--channels`
- [ ] test

#### 4.3 `--claude-in-chrome-mcp`
- [ ] claude.ts LaunchOptions 加 `claudeInChromeMcp`
- [ ] buildArgs 加 `--claude-in-chrome-mcp`
- [ ] test

### 5. Fixtures 建立

> 來源優先順序：1. DB 真實 JSON → 2. extension main.js 結構 → 3. 參考 changelog 合成

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
