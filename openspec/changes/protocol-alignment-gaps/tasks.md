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

#### 11.1 Server — get_context_usage response 只取需要的欄位 — DONE
- [x] settings-handler：只取 categories, totalTokens, maxTokens, percentage
- [x] 不傳 gridRows, apiUsage, mcpTools 等無用資料
- [x] test：驗證 extra fields stripped

#### 11.2 ContextPieChart — 優先用 contextUsage — DONE
- [x] ComposeToolbar：contextPct 優先用 contextUsage.percentage，fallback 用 stats

### Group 12：Client emit request_usage_update + 重構 serverSocket 測試

> 順序：先實作 UI 觸發點，再重構測試改成 user interaction。
> 所有測試不得直接操作 serverSocket 或 claude.socket.emit。

#### 12.1 ComposeToolbar — 開 AccountUsageDialog 時 emit request_usage_update — DONE
- [x] ChannelMessagesContext 加 requestUsageUpdate action
- [x] ComposeToolbar onOpenAccountUsage 呼叫 requestUsageUpdate
- [x] test：開 dialog → onControlRequest mock → dialog 顯示 context breakdown

#### 12.2 重構 serverSocket 測試 — DONE
- [x] config-from-session.test.tsx → renderWithWorkspace + prepareInit + claude.emit(s.status)
- [x] ChannelProvider.test.tsx → onControlRequest mock
- [x] ComposeToolbar.test.tsx → onControlRequest mock
- [x] AccountUsageDialog.test.tsx → onControlRequest mock
- [x] 零 `(claude.socket as any).serverSocket` in tests
- [x] 零 `claude.socket.emit(... as never` in tests
- [x] 986 tests pass

### Group 13：Client `as never` cleanup — DONE

- [x] `OAuthCodePayload` 加 `state?: string`
- [x] `AuthDialog.tsx` — 3 處 `as never` 移除（notification:auth_url, login, submit_oauth_code）
- [x] `ChannelMessagesContext.tsx` — `request_usage_update` 移除 `as never`
- [x] `claude-adapter.ts` — `system:api_retry` 移除 `as never`（SocketEvent.name 已是 string）
- [x] 測試重構：`AuthDialog.test.tsx` 刪除未使用的 `renderAuthWithSession`
- [x] 測試重構：`ChannelProvider.test.tsx` — socket.emit → UI 觸發 /usage dialog
- [x] 測試重構：`ComposeToolbar.test.tsx` — socket.emit → renderWithWorkspace + UI 觸發 /usage dialog
- [x] 零 `as never` + 零 `claude.socket.emit` in client（packages/client/src）
- [x] 986 tests pass

### Group 14：Server `as never` cleanup — 用已定義 interface 取代型別斷言

> server 端 31 處 `as never`，分 5 類。用 ClientToServerEvents/ServerToClientEvents 已定義的 interface 消除。
> 測試檔 `as any` 不在此範圍（test code 可接受）。

#### 14.1 Handler registration — socket.on(event, handler as never)（8 處）— DONE
- [x] message-handler.ts：inline handler into socket.on()
- [x] session-handler.ts：inline launchHandler/joinHandler/closeHandler
- [x] mcp-handler.ts：ensureChannel callback 用 arrow wrapper

#### 14.2 Callback response casts — callback({...} as never)（18 處）— DONE
- [x] message-handler.ts：respondAndBroadcast 改用 `as Record<string, unknown>`
- [x] mcp-handler.ts：error callback 加 `success: false`
- [x] misc-handler.ts：login/oauth 用 AuthResult 型別
- [x] session-handler.ts：list/get error 回傳正確型別

#### 14.3 emit() type bridge — socket.emit(event, payload as never)（5 處）— DONE
- [x] session-handler.ts：用 `Parameters<ServerToClientEvents[event]>[0]>` 型別
- [x] settings-handler.ts：state:usage payload 型別化
- [x] channel.ts：dynamic emit 用 `(socket.emit as (event: string, ...args: unknown[]) => void)`

#### 14.4 Protocol transformation — adapter.transform(obj as never)（2 處）— DONE
- [x] process-runner.ts：`as ProtocolEvent`（import from local schema）
- [x] channel-manager.ts：`as ProtocolEvent`（import from @code-quest/summoner）

#### 14.5 Rate limit info — usageTracker.update(p.info as never)（1 處）— DONE
- [x] channel-hooks.ts：`as Parameters<typeof ctx.usageTracker.update>[0]>`
- [x] 零 `as never` in production code（server + summoner + client）
- [x] 986 tests pass（374 server + 612 client）

### Group 15：Socket Events inline 型別 → Zod schema 統一

> ClientToServerEvents / ServerToClientEvents 裡的 inline 型別全部改成從 Zod schema 推導。
> Single source of truth：Zod schema → z.infer → Socket.IO typed events。
> 分 4 batch，每 batch 獨立 commit。

#### 15.1 共用 response schema（消除重複 inline）— DONE
- [x] `successResponseSchema` — `{ success: boolean; error?: string }` ×10 處
- [x] `controlResponseSchema` — `{ success; response?; error? }` ×6 處
- [x] `sessionListResponseSchema` — `{ sessions; total }` ×2 處
- [x] ControlResponse 統一：刪 event-types.ts 手寫 interface，re-export from Zod

#### 15.2 已有 Zod schema 但 inline 未引用的（換引用）— DONE
- [x] `list_files_request`, `uninstall_plugin`, `add/remove/refresh_marketplace` → 對應 schema
- [x] `git:log` → `gitLogSchema`, `chat:respond` → `chatRespondSchema`
- [x] terminal, speech, cancel_async, set_proactive, generate_session_title 等全部換引用

#### 15.3 新建 payload/callback schema — DONE
- [x] 27 new schemas: channelIdPayload, cancelRequest, listPlugins, fileRead payloads
- [x] sessionLaunch/Join/Teleport/Fork response schemas
- [x] init, getClaudeState, rawEvents, terminalGet/Open response schemas
- [x] listFiles, exec, listPlugins, listMarketplaces, getPlanComments response schemas
- [x] fileRead, generateSessionTitle response schemas
- [x] Reuse ChannelIdPayload for request_usage_update, speech_to_text, raw_events

#### 15.4 Chrome/Jupyter/Debugger specific response schema — DONE
- [x] ensureChromeMcp, disableChromeMcp, enableJupyterMcp, disableJupyterMcp, askDebuggerHelp response schemas
- [x] ClientToServerEvents: **零 inline 型別**

#### 15.5 清理 re-export + 向下相容 — DONE
- [x] ControlResponse 直接從 chat.ts 匯出，移除 event-types.ts re-export
- [x] 確認零 deep import（所有 import 走 @code-quest/shared barrel）
- [x] integration tests 合併到 handler tests（clean-relay-protocol, named-event-integration 刪除）
- [x] socket-events.ts 所有 interface → Zod schema（20 個）

#### 15.6 event-types.ts 剩餘 interface → Zod schema — DONE
- [x] TextBlock, ThinkingBlock, ToolUseBlock, ToolResultBlock → Zod schema
- [x] ContentBlock → `z.union([text, thinking, toolUse, toolResult])`
- [x] StreamChunk, SessionStats（與 ChatStats 不同，保留兩個）
- [x] RateLimitInfo, RemoteControlStateInfo, HookStartedInfo, HookResponseInfo, ModelInfo
- [x] 刪除 event-types.ts（所有型別移到 chat.ts）
- [x] integration tests 合併到 handler tests：
  - `named-event-integration.test.ts` → `chat-handler-message.test.ts`（stream:text）
  - `clean-relay-protocol.test.ts` → `chat-handler-control.test.ts`（input/inputs check）
  - 其餘 expects 已被 unit tests 覆蓋，刪除

#### 15.7 ServerToClientEvents inline 型別 → Zod schema — DONE
- [x] 47 new S2C payload schemas（message, stream, control, system, notification, action）
- [x] ServerToClientEvents: 零 inline 型別
- [x] event-types.ts 已刪除
- [x] **ClientToServerEvents + ServerToClientEvents 全部 100% Zod-inferred**

### Group 16：Code Review 重構

#### 16.1 P0 — chat.ts 1438 行 God File 拆分 — DONE
- [x] 14 個 domain file：common, auth, session, message, control, settings, plugin, git, mcp, terminal, notification, plan, file, system
- [x] chat.ts → barrel re-export（向下相容）
- [x] schemas/index.ts re-export all
- [x] 最大 270 行（session.ts），平均 ~100 行

#### 16.2 P1 — AuthDialog 直接用 socket → SessionContext — DONE
- [x] SessionContext：加 auth state + login/submitOAuthCode/resetAuth
- [x] notification:auth_url listener 搬到 SessionContext
- [x] AuthDialog 改用 useSession()，不再 useSocket()

#### 16.3 P1 — ChannelMessagesContext 957 行 — SKIP
- [x] 分析結論：event handler 邏輯內聚，拆 hook 只增加 indirection 不減複雜度
- [x] 暫不拆

#### 16.4 P2 — ChatStats vs SessionStats — SKIP
- [x] ChatStats（client UI 用）vs SessionStats（CLI message:result 用）— 不同語意，不合併

### Group 17：socket-events.ts — SKIP
- [x] 分析結論：import 牆是 domain schema 拆分的正常結果，editor 摺疊即可
- [x] C2S + S2C 是純 event registry，職責清晰不需再拆
- [x] `import * as S` 降低可讀性，不採用

### Group 18：Code Review Round 2 — Component 職責 + Storybook

#### 18.1 P0 — WorkspaceLayout 直接用 socket → SessionContext — DONE
- [x] SessionContext 加 `closeSession(channelId: string)` action
- [x] WorkspaceLayout 移除 `useSocket()`，改用 `useSession().closeSession`
- [x] 確認零 component 直接用 useSocket

#### 18.2 P1 — Storybook 補缺（>100 行 component）— PARTIAL
- [x] SystemBlocks.stories.tsx（14 variants）
- [x] ToolUseBlock.stories.tsx（4 variants）
- [x] InstalledPluginList.stories.tsx（3 variants）
- [x] ToolPermissionBanner.stories.tsx（3 variants）
- [ ] CommandMenu.stories.tsx（697 行，context-dependent — 需 decorator）
- [ ] AuthDialog.stories.tsx（135 行，context-dependent）
- [ ] WorkspaceLayout.stories.tsx（104 行，context-dependent）
- [ ] CollapsibleTimeline.stories.tsx（110 行，complex deps）

#### 18.3 P2 — Storybook 補缺（<100 行 component，低優先）
- [ ] AddButton, ChatInputArea, ContextPieChart, HookCallbackBanner
- [ ] MarketplaceSection, MessageNodeList, OptionButton, PermissionHeader
- [ ] SubagentChildren, EffortSwitch, PermissionModeIcons
- [ ] ui/Icons, ui/ToggleSwitch
- [ ] message-blocks/HookBlocks, message-blocks/ToolResultBlock

### Group 19：Final Cleanup
- [ ] 確認零 component 直接 useSocket（全部走 Context）
- [ ] 確認零 `as never`、零 `as any`（production code）
- [ ] 確認零 `claude.socket.emit`、零 `if (el) { expect }` guard（test code）
- [ ] 確認 `schemas/` 無 dead export（所有 schema 至少被一處引用）
- [ ] 確認 `index.ts` re-export 無多餘項
- [ ] skills 內容與實際 codebase 一致（檔案路徑、pattern）
- [ ] tasks.md 所有 group 標記完成狀態
