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

### Group 8：Chrome/Jupyter/Debugger — 從 fake stub 改為真實實作

> Extension 做法：透過 `mcp_set_servers` control_request 動態增減 MCP server config。
> ensure_chrome = 加入 `claude-in-chrome` server config
> disable_chrome = 移除 `claude-in-chrome` server config
> Jupyter/Debugger 同理。
> `--claude-in-chrome-mcp` 預設 false（CLI 沒 Chrome 會 hang）。

#### 8.1 Chrome MCP — DONE
- [x] ensure_chrome_mcp_enabled：sendControlRequest('mcp_set_servers', { claude-in-chrome })
- [x] disable_chrome_mcp：sendControlRequest('mcp_set_servers', {}) 移除
- [x] 更新 chromeMcpState + broadcast state:update + error handling
- [x] 16 MCP tests pass

#### 8.2 Jupyter MCP — DONE
- [x] enable_jupyter_mcp：sendControlRequest('mcp_set_servers', { claude-jupyter })
- [x] disable_jupyter_mcp：同上移除
- [x] 更新 jupyterMcpState + broadcast state:update

#### 8.3 Debugger — DONE (kept as-is)
- [x] ask_debugger_help：空回應（extension 也是空實作）

#### 8.4 Tests — DONE
- [x] 現有 16 個 MCP tests 全部 pass（行為不變）

### Group 9：get_context_usage — 主動查詢 context 使用量

> 目前只從 message:result 被動拿 stats，加上主動查詢讓數字即時。
> Extension 用 get_context_usage control_request 問 CLI。

#### 9.1 Server — DONE
- [x] settings-handler `request_usage_update`：找 active channel → sendControlRequest('get_context_usage')
- [x] CLI 回傳 context usage → emit `state:usage` 含 contextUsage（inputTokens, outputTokens, contextWindow）
- [x] 沒有 active channel 時只回 usageTracker 資料（現有行為）
- [x] test：FakeClaude.onControlRequest mock

#### 9.2 Client — REVERTED (contextUsage 不應混入 stats)

> context usage 和 turn usage 語意不同，獨立存。
> ContextPieChart 保持用 message:result 的 stats（不改）。
> AccountUsageDialog 開啟時查 get_context_usage 顯示 breakdown。

### Group 10：AccountUsageDialog 對齊 — context breakdown + session cost

> 不打 Anthropic API。帳號 quota 只靠 rate_limit_event 被動拿。

#### 10.1 ChannelState 加 contextUsage — DONE
- [x] types/chat.ts ChannelState 加 `contextUsage: Record<string, unknown> | null`
- [x] onStateUsage handler 存到 contextUsage（不碰 stats）

#### 10.2 AccountUsageDialog 開啟時查 get_context_usage — DONE
- [x] server request_usage_update 已呼叫 get_context_usage（Group 9）

#### 10.3 AccountUsageDialog 顯示 context breakdown — DONE
- [x] 顯示 categories 列表（name + tokens, formatTokens）
- [x] 顯示 percentage% used + totalTokens / maxTokens
- [x] test：驗證 System prompt + 6.0k + 5% used

#### 10.4 AccountUsageDialog 顯示 session cost — DONE
- [x] 顯示 total_cost_usd（$1.23 format）
- [x] 顯示 num_turns
- [x] 顯示 modelUsage per-model cost
- [x] test：驗證 $1.23

#### 10.5 清理 — DONE
- [x] revert ComposeToolbar test（contextUsage → stats 混用已移除）
- [x] ContextPieChart 不受影響（保持用 stats）

### Group 11：Server 轉換 + ContextPieChart 漸進增強

#### 11.1 Server — get_context_usage response 只取需要的欄位
- [ ] settings-handler：`resp.response` 只取 `categories`, `totalTokens`, `maxTokens`, `percentage`
- [ ] 不傳 gridRows, apiUsage, mcpTools 等無用資料
- [ ] test

#### 11.2 ContextPieChart — 優先用 contextUsage
- [ ] ComposeToolbar：`contextPct` 優先用 `contextUsage.percentage`，fallback 用 `stats.inputTokens / stats.contextWindow`
- [ ] 開過 AccountUsageDialog 後 contextUsage 有值，ContextPieChart 自動切到精確數字
- [ ] 零額外呼叫
- [ ] test
