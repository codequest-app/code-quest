## Protocol Alignment Gaps — Extension 2.1.86 vs cc-office

> 所有 CLI 支援的功能 web UI 都能用（不存在「VS Code 專屬」）。
> --claude-in-chrome-mcp 預設 false（沒有 Chrome 跑的話 CLI 會 hang）。
> Chrome/Jupyter/Debugger stubs 刪除（MCP 狀態由 mcpServers list 顯示，toggle 由 set_mcp_server_enabled 處理）。

---

### Group 1：Event Types — Schema + Fixture + Adapter — DONE

- [x] 1.1 `system/post_turn_summary` — schema + skip + fixture + test
- [x] 1.2 `system/session_state_changed` — schema + skip + fixture + test
- [x] 1.3 `system/api_retry` — schema + passthrough → system:api_retry + real fixture + test
- [x] 1.4 `compaction_delta` — schema + skip + fixture + test

### Group 2：Control Request Fixtures — DONE

- [x] 2.1 `get_context_usage` — fixture + test
- [x] 2.2 `seed_read_state` — fixture + test
- [x] 2.3 `side_question` — fixture + test
- [x] 2.4 `channel_enable` — fixture + test

### Group 3：Auth Flow — DONE

- [x] 3.1 Fixtures — claude_authenticate, claude_oauth_callback, claude_oauth_wait
- [x] 3.2 Server — 取代 auth stub，透過 active channel sendControlRequest
- [x] 3.3 Client UI — AuthDialog（login → auth URL → paste code → success）
- [x] 3.4 AuthDialog test
- [x] 3.5 FakeClaude.onControlRequest() — 自訂 control_request 回應

### Group 4：CLI Flags — DONE

- [x] 4.1 `--task-budget` — LaunchOptions + buildArgs + test
- [x] 4.2 `--channels` — LaunchOptions + buildArgs + test
- [x] 4.3 `--claude-in-chrome-mcp` — LaunchOptions + buildArgs + test（預設 false）

### Group 5：Fixtures Checklist — DONE

- [x] `system/api_retry` → `real/api-retry.jsonl`
- [x] `system/post_turn_summary` → `synthetic/post-turn-summary.jsonl`
- [x] `system/session_state_changed` → `synthetic/session-state-changed.jsonl`
- [x] `stream/compaction_delta` → `synthetic/compaction-delta.jsonl`
- [x] `control-request/get_context_usage` → `synthetic/control-get-context-usage.jsonl`
- [x] `control-request/seed_read_state` → `synthetic/control-seed-read-state.jsonl`
- [x] `control-request/side_question` → `synthetic/control-side-question.jsonl`
- [x] `control-request/channel_enable` → `synthetic/control-channel-enable.jsonl`
- [x] `control-request/claude_authenticate` → `synthetic/control-claude-authenticate.jsonl`
- [x] `control-request/claude_oauth_callback` → `synthetic/control-claude-oauth-callback.jsonl`
- [x] `control-request/claude_oauth_wait` → `synthetic/control-claude-oauth-wait.jsonl`

### Group 6：Client — system:api_retry 顯示 — DONE

- [x] shared socket-events.ts 加 `system:api_retry` event type
- [x] ChannelMessagesContext 監聽 → statusText "Retrying... (1/10)"

### Group 7：Coverage Matrix — DONE

- [x] 115/115 = 100% protocol coverage
- [x] 移除「VS Code 專屬」標記

### Group 8：Chrome/Jupyter/Debugger stubs 清理

> 這些 handler 是 extension-host 層操作，不走 CLI control_request。
> MCP 狀態由 session:init 的 mcpServers list 顯示。
> toggle 由 set_mcp_server_enabled handler 處理。
> stubs 刪除不影響功能。

- [ ] 8.1 刪除 ensure_chrome_mcp_enabled / disable_chrome_mcp handler
- [ ] 8.2 刪除 enable_jupyter_mcp / disable_jupyter_mcp handler
- [ ] 8.3 刪除 ask_debugger_help handler
- [ ] 8.4 刪除 shared socket-events.ts 中相關型別
- [ ] 8.5 刪除 client 中相關 UI（如果有）
- [ ] 8.6 更新 tests
