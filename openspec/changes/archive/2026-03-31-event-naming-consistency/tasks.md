## 0. Batch 0 — Handler 拆分

> 測試已按職責分組（chat-handler-auth.test.ts 等），handler 跟著拆對齊。
> TDD 重構：expect 不變或等價，FakeClaude + real JSON，先跑測試確認 GREEN 再搬 code。

### 0.1-0.4 Handler 拆分 — DONE
- [x] `connection-handler.ts` ← init, disconnect, get_provider_config（from settings-handler）
- [x] `auth-handler.ts` ← login, submit_oauth_code, get_auth_status
- [x] `plan-handler.ts` ← comment, get_plan_comments, remove_plan_comment, close_plan_preview
- [x] `speech-handler.ts` ← start_speech_to_text, stop_speech_to_text
- [x] `terminal-handler.ts` ← terminal:get_contents, terminal:open_claude（from file-handler）
- [x] `generate_session_title` 從 message-handler → session-handler
- [x] 刪除 misc-handler.ts
- [x] chat-handler.ts register 更新
- [x] 369 server + 624 client tests pass（跟 main 一致，零遺失）

### 0.5 拆 misc test
- [x] chat-handler-misc.test.ts 拆分：
  - `chat-handler-connection.test.ts` ← init + get_provider_config 測試（get_provider_config 從 settings test 搬過來）
  - `chat-handler-file.test.ts` ← file:read, list_files 測試
  - `chat-handler-terminal.test.ts` ← terminal 測試
  - `chat-handler-speech.test.ts` ← speech 測試
  - 刪除 chat-handler-misc.test.ts
- [x] chat-handler-settings.test.ts：移除 get_provider_config 測試（已搬到 connection）
- [x] chat-handler-message.test.ts：移除 generate_session_title 測試（已搬到 session）
- [x] GREEN：369 server + 624 client tests（跟 main 一致）

## 1. Batch 1 — app + auth rename

> TDD：先改 ClientToServerEvents type → RED（client emit 不匹配），再改 client emit → GREEN。
> Server handler 同時 listen 新舊 name（向下相容）。

- [x] `init` → `app:init`
- [x] `get_provider_config` → `app:get_provider_config`
- [x] `login` → `auth:login`
- [x] `submit_oauth_code` → `auth:submit_oauth_code`
- [x] `get_auth_status` → `auth:get_status`
- [x] ClientToServerEvents type 更新
- [x] Server handler 同時 listen 新舊 name
- [x] Client emit 改新 name
- [x] Tests 更新
- [x] GREEN：所有測試通過

## 2. Batch 2 — settings rename

- [x] `set_model` → `settings:set_model`
- [x] `set_permission_mode` → `settings:set_permission_mode`
- [x] `set_thinking_level` → `settings:set_thinking_level`
- [x] `apply_settings` → `settings:apply`
- [x] `get_claude_state` → `settings:get_state`
- [x] `request_usage_update` → `settings:request_usage_update`
- [x] `set_proactive` → `settings:set_proactive`
- [x] `set_remote_control` → `settings:set_remote_control`
- [x] Tests 更新
- [x] GREEN：所有測試通過

## 3. Batch 3 — session bare events rename

- [x] `list_sessions_request` → `session:list`
- [x] `list_remote_sessions` → `session:list_remote`
- [x] `get_session_request` → `session:get`
- [x] `delete_session` → `session:delete`
- [x] `rename_session` → `session:rename`
- [x] `fork_conversation` → `session:fork`
- [x] `teleport_session` → `session:teleport`
- [x] `update_session_state` → `session:update_state`
- [x] `generate_session_title` → `session:generate_title`
- [x] Tests 更新
- [x] GREEN：所有測試通過

## 4. Batch 4 — chat bare events rename

- [x] `cancel_async_message` → `chat:cancel_async`
- [x] `hook_callback_respond` → `chat:hook_callback_respond`
- [x] `cancel_request` (C→S) → `chat:cancel_request`
- [x] `rewind_code` → `chat:rewind_code`
- [x] Tests 更新
- [x] GREEN：所有測試通過

## 5. Batch 5 — mcp rename

- [x] `get_mcp_servers` → `mcp:get_servers`
- [x] `set_mcp_server_enabled` → `mcp:set_enabled`
- [x] `reconnect_mcp_server` → `mcp:reconnect`
- [x] `mcp_set_servers` → `mcp:set_servers`
- [x] `mcp_message` → `mcp:message`
- [x] `authenticate_mcp_server` → `mcp:authenticate`
- [x] `clear_mcp_server_auth` → `mcp:clear_auth`
- [x] `submit_mcp_oauth_callback_url` → `mcp:oauth_callback`
- [x] `ensure_chrome_mcp_enabled` → `mcp:ensure_chrome`
- [x] `disable_chrome_mcp` → `mcp:disable_chrome`
- [x] `enable_jupyter_mcp` → `mcp:enable_jupyter`
- [x] `disable_jupyter_mcp` → `mcp:disable_jupyter`
- [x] `ask_debugger_help` → `mcp:ask_debugger`
- [x] Tests 更新
- [x] GREEN：所有測試通過

## 6. Batch 6 — file + git rename

- [x] `list_files_request` → `file:list`
- [x] `checkout_branch` → `git:checkout`
- [x] `check_git_status` → `git:status`
- [x] `update_skipped_branch` → `git:update_skipped_branch`
- [x] `exec` → `git:exec`
- [x] Tests 更新
- [x] GREEN：所有測試通過

## 7. Batch 7 — plugin + plan + speech + terminal rename

- [x] `install_plugin` → `plugin:install`
- [x] `uninstall_plugin` → `plugin:uninstall`
- [x] `set_plugin_enabled` → `plugin:set_enabled`
- [x] `list_plugins` → `plugin:list`
- [x] `list_marketplaces` → `plugin:list_marketplaces`
- [x] `add_marketplace` → `plugin:add_marketplace`
- [x] `remove_marketplace` → `plugin:remove_marketplace`
- [x] `refresh_marketplace` → `plugin:refresh_marketplace`
- [x] `comment` → `plan:comment`
- [x] `get_plan_comments` → `plan:get_comments`
- [x] `remove_plan_comment` → `plan:remove_comment`
- [x] `close_plan_preview` → `plan:close_preview`
- [x] `start_speech_to_text` → `speech:start`
- [x] `stop_speech_to_text` → `speech:stop`
- [x] Tests 更新
- [x] GREEN：所有測試通過

## 8. Code Review — DONE

- [x] 零 bare C→S events in ClientToServerEvents
- [x] 零 `as never` / `as any` in production
- [x] 零 inline import
- [x] Protocol files untouched（schemas, adapter）
- [x] 13 handler files aligned with namespaces

## 9. Cleanup — DONE

- [x] 零 bare event in ClientToServerEvents
- [x] Handler 檔案與 namespace 一致
- [x] 更新 socket-io skill 反映新命名慣例
- [x] 369 server + 624 client tests pass

## 10. CLI response `as` cast → Zod schema

> 15 處 `as Record<string, unknown>` / `as Type` cast on CLI response data。
> 為每種 control_request response 定義 Zod schema，用 safeParse 取代 as。

### 10.1-10.6 — DONE
- [x] cliInitResponseSchema + cliAuthenticateResponseSchema（4 tests）
- [x] session-handler：initResult.response → safeParse
- [x] auth-handler：controlResp.response → safeParse
- [x] mcp-handler：authUrl → String() conversion
- [x] file-handler：cwd → typeof guard
- [x] plugin-handler：JSON.parse → pluginInfoSchema/availablePluginSchema safeParse
- [x] session-handler：remove redundant clientOpts as cast
- [x] pluginInfoSchema/availablePluginSchema fields → optional + passthrough

### 10.7 handler as casts — DONE
- [x] message-handler：`as Record` → `{ ...spread }`
- [x] message-handler：`updatedInput as Record` → typeof guard
- [x] session-handler：`as Parameters<S2C>` → `buildSessionInitPayload` return SessionInitPayload
- [x] settings-handler：`as Parameters<S2C>` → inline typed payload
- [x] **零 `as` cast in handler production code**

## 11. Client context `as` casts → Zod / type narrowing

> 10 處 `as` cast in client contexts（ChannelConfig, ChannelControl, ChannelMessages）。
> Socket.IO typed event payload narrowing — 應用 Zod schema 或 typeof guard。

### 11.1 ChannelConfigContext — DONE
- [x] :131-133 CONFIG_MAP dynamic loop → 展開為 explicit field checks（消除 2 個 `as Record` cast）
- [x] :147 `summary.effort as ConfigState['effort']` → `toEffort()` helper with Set check
- [x] :170 `payload.fastModeState as string` → typeof guard
- [x] :184-185 `payload.models as Array` / `m as ModelInfo` → runtime type check + filter
- [x] :236 `result.response as Record<string, unknown>` → typeof + 'tools' in guard

### 11.2 ChannelControlContext — DONE
- [x] :189 `mcpMsg.id as string | number | null` → typeof guard

### 11.3 ChannelMessagesContext — DONE
- [x] :176 `joinRes.state as SessionStatus` → removed cast (ternary already narrows)
- [x] :268 `lastToolUse.meta?.partialInput as string` → typeof guard
- [x] :288 `last.meta?.citations as unknown[]` → Array.isArray guard
- [x] :342 `block.input as { file_path?: string }` → typeof + 'file_path' in guard
- [x] :458 `p.stats.modelUsage as ChatStats['modelUsage']` → 修正 sessionStatsSchema 使用 modelUsageEntrySchema
- [x] :593 `severity as 'info' | 'warning' | 'error'` → 移除（schema 已是 z.enum）
- [x] :627-636 rate limit casts → isTierKey type guard + 移除 usageQuota cast
- [x] :703 `p.data.name as string` → typeof guard
- [x] :733 `p.data.requestId as string` → String()
- [x] :768 `p.gates as Record<string, boolean>` → 修正 schema 為 z.record(z.string(), z.boolean())
- [x] :908-910 subscribeRawEvents casts → typeof guard

### 11.4 Code review + cleanup — DONE
- [x] grep 驗證零非 `as const` cast in handler + client context production code
- [x] 消除全部 5 個殘留 cast：toEffort/isTierKey 展開為 ===、modelInfoSchema.safeParse、isRecord() type guard
- [x] TIER_KEYS/isTierKey 移到 module level、requestId 用 local var narrowing
- [x] 比對 main branch test count（main: 363+612=975, feature: 373+624=997 ≥ main）
- [x] 全部測試通過：373 server + 624 client

## 12. Client types → Zod schema 派生

> 手寫 interface 應從 shared Zod schema 派生，消除重複定義。

### 12.1 PendingElicitation / PendingDiffReview — DONE
- [x] `PendingElicitation` → `Omit<ControlElicitationPayload, 'channelId'>`
- [x] `PendingDiffReview` → `Omit<ControlDiffReviewPayload, 'channelId'>`

### 12.2 PendingControl — DONE
- [x] `PermissionControl` = `Omit<ControlPermissionPayload, 'channelId' | 'suggestions'> & { subtype: 'can_use_tool'; permissionSuggestions? }`
- [x] `HookCallbackControl` = `Omit<ControlHookCallbackPayload, 'channelId'> & { subtype: 'hook_callback' }`
- [x] `PendingControl` = `PermissionControl | HookCallbackControl`（discriminated union on `subtype`）

### 12.3 驗證 — DONE
- [x] 全部測試通過：373 server + 624 client
- [x] 零手寫重複 interface

## 13. Event naming 二次對齊

> 去 `get_` 前綴、修歸屬、簡化冗長名、合併重複。
> TDD：先改 type → RED → 改 handler + client → GREEN。

### 13.1 去 `get_` 前綴（C→S，6 個）— DONE
- [x] `auth:get_status` → `auth:status`
- [x] `settings:get_state` → `settings:state`
- [x] `mcp:get_servers` → `mcp:servers`
- [x] `terminal:get_contents` → `terminal:read`
- [x] `plan:get_comments` → `plan:comments`
- [x] `app:get_provider_config` → `app:config`

### 13.2 歸屬修正（S→C 4 個 + C→S 合併 1 個）— DONE
- [x] `state:update` (S→C) → `settings:update`
- [x] `state:usage` (S→C) → `settings:usage`
- [x] `system:available_models` (S→C) → `app:models`
- [x] `system:experiment_gates` (S→C) → `app:experiment_gates`
- [x] 合併 `chat:set_fast_mode` + `settings:set_proactive` → `settings:set_proactive`（state push 邏輯併入）
- [x] 刪除 `chatSetFastModeSchema`，client 改用 `settings:set_proactive`

### 13.3 冗長簡化（3 個）— DONE
- [x] `settings:request_usage_update` → `settings:refresh_usage`
- [x] `chat:hook_callback_respond` → `chat:hook_respond`
- [x] `auth:submit_oauth_code` → `auth:oauth_code`

### 13.4 語義對齊（2 個）— DONE
- [x] `mcp:set_enabled` → `mcp:toggle`
- [x] `plugin:set_enabled` → `plugin:toggle`

### 13.5 S→C bare events 命名（5 個 + 1 刪除）— DONE
- [x] `close_channel` → 刪除（零使用，dead code）
- [x] `cancel_request` (S→C) → `chat:cancel_request`
- [x] `file_updated` (S→C) → `file:updated`
- [x] `plan_comment` → `plan:comment_added`
- [x] `removeComment` → `plan:comment_removed`
- [x] `speech_to_text_message` → `speech:message`

### 13.6 驗證 — DONE
- [x] ClientToServerEvents + ServerToClientEvents type 更新
- [x] Server handler + hooks 更新
- [x] Client emit 更新
- [x] Tests 更新
- [x] GREEN：373 server + 624 client

## 14. Speech protocol 接線

> `speech:start` / `speech:stop` 目前是 console.log stub。
> Extension 透過 stdin JSON `{ type: "start_speech_to_text", channelId }` 發給 CLI。
> 需要在 ProcessRunner 加方法，speech-handler 轉發到 CLI。

### 14.1 Summoner: speech_to_text_message schema + adapter — DONE
- [x] `claude-schemas.ts`: `speechToTextMessageSchema` + `KNOWN_EVENT_TYPES` + `ProtocolEvent` union
- [x] `claude-adapter.ts` `convertEvent()`: `speech_to_text_message` → `speech:message`

### 14.2 speech-handler: C→S relay — DONE
- [x] `speech:start` → `runner.write(JSON.stringify({ type: 'start_speech_to_text', channelId }))`
- [x] `speech:stop` → `runner.write(JSON.stringify({ type: 'stop_speech_to_text', channelId }))`
- [x] console.log stub 移除

### 14.3 測試 — DONE
- [x] `speech:start` → CLI 收到 `start_speech_to_text` protocol message
- [x] `speech:stop` → CLI 收到 `stop_speech_to_text` protocol message
- [x] CLI `speech_to_text_message` → client 收到 `speech:message`
- [x] GREEN：374 server + 624 client + 322 summoner

### 14.4 Protocol gaps 記錄
- [x] `session:close_channel` — 保留在 S2C type，CLI `close_channel` 對應，`session:closed` 已覆蓋 message channel 關閉語義

## 15. Adapter `as` casts → Zod schema 型別推導

> `claude-adapter.ts` 的 `convertOtherEvent` / `convertSystemEvent` 大量 `as unknown as { ... }`。
> ProtocolEvent 是 Zod union，dispatch 後應用 `Extract<ProtocolEvent, { type: T }>` 或直接存取 schema-inferred fields。
> TDD：expect 不變，只改 adapter production code。

### 15.1 convertOtherEvent — top-level types — DONE
- [x] `speech_to_text_message` → 直接存取 schema fields
- [x] `streamlined_text` / `streamlined_tool_use_summary` → 直接存取
- [x] `error` → 直接存取 `event.error.message`
- [x] `rate_limit_event` → 直接存取 `event.rate_limit_info.*`（resetsAt/utilization 保留 as，schema type mismatch）
- [x] `experiment_gates` / `available_models` / `notification` / `auth_url` → 直接存取
- [x] `auth_status` → 直接存取 + `.loose()` index access for account
- [x] `file_updated` dead code 移除（走 raw_event 路徑）、`raw_event` 合併到 fallback
- [x] `control_response` → 直接存取 `event.response.*`

### 15.2 convertSystemEvent — system subtypes — DONE
- [x] `init` → 直接存取 schema fields
- [x] `status` → 直接存取
- [x] `hook_started` / `hook_response` → 直接存取
- [x] `task_started` / `task_notification` / `task_progress` → 直接存取
- [x] `api_retry` → 直接存取
- [x] `bridge_state` / `compact_boundary` → loose index access（schema 無這些 fields）

### 15.3 convertAssistantEvent / convertUserEvent / convertStreamEvent — DONE
- [x] `parent_tool_use_id` → 直接存取 schema field（3 處）
- [x] `stream_event.event` → 直接存取

### 15.4 驗證 — DONE
- [x] `as unknown as` 殘留 3 處：rate_limit schema type mismatch (2) + raw fallback (1)
- [x] GREEN：374 server + 624 client + 322 summoner
- [x] 零 expect 變更

### 15.5 convertResultEvent — DONE
- [x] `event as Record` → 直接存取 schema fields
- [x] `usage` inner fields 保留 `as number`（`z.record(z.string(), z.unknown())` index access）

### 15.6 convertControlRequest — DONE
- [x] `can_use_tool`: `tool_name`、`tool_use_id`、`callback_id`、`decision_reason` → 直接存取
- [x] `hook_callback`: `callback_id`、`tool_use_id` → 直接存取
- [x] default fallback: 全部直接存取
- [x] `blocked_path`、`agent_id` 保留 `as`（不在 schema，走 `.loose()` index）
- [x] `request.input as Record` 保留（`z.unknown()` 無法 narrow）

### 15.7 content blocks — DONE
- [x] `convertAssistantEvent`: identity cast 移除，`as string` → `String()`
- [x] `convertUserEvent`: 同上

### 15.8 驗證 — DONE
- [x] GREEN：374 server + 624 client + 322 summoner
- [x] 零 expect 變更

### 15.9 Schema 精確化 — result usage — DONE
- [x] `resultSchema.usage` → typed object（`input_tokens`, `output_tokens`, `cache_*`）
- [x] adapter `convertResultEvent` 直接存取 typed fields

### 15.10 Schema 精確化 — control_request fields — DONE
- [x] `controlRequestSchema.request` 加 `blocked_path`, `agent_id`, `elicitation_id`, `mcp_server_name`
- [x] adapter `can_use_tool` 直接存取，移除 `as` casts

### 15.11 Schema 精確化 — rate_limit_event — DONE
- [x] `resetsAt` → `z.union([z.number(), z.string()])`, adapter 用 `String()`
- [x] `utilization` → `z.union([z.number(), z.record()])`, adapter 直接傳遞
- [x] 零 `as unknown as`

### 15.12 Schema 精確化 — stream event delta/block — DONE
- [x] `delta` → typed object（`type`, `text`, `thinking`, `partial_json`, `citations`, `signature`）
- [x] `content_block` → typed object（`type`, `id`, `name`, `input`）
- [x] adapter 直接存取 typed fields

### 15.13 Schema 精確化 — system subtypes — DONE
- [x] `systemBridgeStateSchema` 新增（`state`, `detail`）
- [x] `systemCompactBoundarySchema` 加 `compactMetadata`
- [x] adapter `bridge_state` / `compact_boundary` 直接存取

### 15.14 驗證 — DONE
- [x] `as unknown as` 殘留 1 處（raw fallback catch-all）
- [x] GREEN：374 server + 624 client + 322 summoner
- [x] 零 expect 變更

### 15.15 control_request input — isRecord guard — DONE
- [x] `elicitation`: `isRecord(request.input)` + `typeof` guards for all inner fields
- [x] `open_diff`: `isRecord` + `typeof` for `originalFilePath`, `newFilePath`
- [x] `mcp_message`: `isRecord` + `String()` for `server_name`
- [x] `open_url`: `isRecord` + `typeof` for `url`
- [x] `open_file`: `isRecord` + `typeof` for `file_path`, `isRecord` for `location`
- [x] `show_notification`: `isRecord` + `typeof` / `Array.isArray` for all fields

### 15.16 .loose() extra fields 補到 schema — DONE
- [x] `authStatusSchema` 加 `account`
- [x] delta schema 加 `citation`
- [x] adapter 直接存取

### 15.17 extractRespondedRequestIds — DONE
- [x] `JSON.parse` → `isRecord()` guard

### 15.18 驗證 — DONE
- [x] adapter 剩餘 `as` = 3 處（2 raw fallback + 1 session:init config）
- [x] GREEN：374 server + 624 client + 322 summoner
- [x] 零 expect 變更

## 16. app:config 回傳初始 models + effort

> 問題：`availableModels` 和 `effort` 在 session launch 前為空/null。
> UI 無法在第一次 connect 時顯示正確的模型列表和 effort 設定。
> Extension 也是 init 後才有，但它啟動就自動 launch session。

### 16.1 app:config 回傳 defaultModels + cachedModels — DONE
- [x] `providerClientConfigSchema` 加 `defaultModels` field
- [x] `ClaudeAdapter` 加 `defaultModels`（3 個預設模型 + effort/fastMode 資訊）
- [x] `GetProviderConfigResponse` schema 加 `models` optional field
- [x] `connection-handler` `app:config` 回傳 `cachedModels ?? settingsStore.get('models')`
- [x] `session-handler` launch 時 `settingsStore.set('models', models)`（持久化到 DB）
- [x] `ChannelConfigProvider` mount 時：`app:config.models` → `defaultModels` fallback chain

### 16.2 effort
- [x] effort 已透過 `settings:update` + `session:states` 推送，初始 fallback 為 `'max'`
- [x] 不需額外修改（model 的 `supportsEffort` / `supportedEffortLevels` 現在 mount 時就有）

### 16.3 測試 — DONE
- [x] `app:config` 回傳 `defaultModels` in providerConfig（before session launch）
- [x] `app:config` 回傳 `cachedModels`（after session launch + settingsStore persist）
- [x] GREEN：376 server + 624 client + 322 summoner

### 16.4 EFFORT_CYCLE → 從 model 的 supportedEffortLevels 取 — DONE
- [x] `EFFORT_CYCLE` hardcode → `DEFAULT_EFFORT_LEVELS` fallback
- [x] `effortLevels` 從 `modelEntry.supportedEffortLevels` 取
- [x] model 沒有 `supportsEffort` → `effortLevels = []`
- [x] `supportsFastMode` 直接從 `modelEntry` 取，移除 `modelDisplayMap` fallback

### 16.5 移除 modelDisplayMap — DONE
- [x] `model-utils.ts` 重寫：`shortModelName(id, models)` / `getModelDisplayInfo(id, models)` 直接從 `ModelInfo[]` 找
- [x] `ModelPickerPanel` / `HeaderBar` / `ComposeToolbar` 移除 `modelDisplayMap` prop
- [x] 刪除 `providerClientConfigSchema.modelDisplayMap`
- [x] 刪除 adapter 的 `modelDisplayMap` 配置
- [x] 更新 model-utils tests + provider-client-config tests
- [x] GREEN：378 server + 624 client

## 17. Summoner dead code 清理 + 結構調整

> 舊的 `ClaudeParser`/`InteractiveSession`/`schemas.ts` 已被 `ProcessRunner` + `ClaudeAdapter` 完全取代。
> `types.ts` 混了舊/新 type。結構需要整理。

### 17.1 刪除 dead code — DONE
- [x] 刪除 `claude-parser.ts`、`schemas.ts`、`session.ts`
- [x] 刪除 `__tests__/claude-parser.test.ts`、`__tests__/session.test.ts`

### 17.2 types.ts 清理 — DONE
- [x] 刪除 `ChatStreamEvent`、`ProcessFactory`（舊 type）
- [x] 保留 `ControlResponseEvent`、`InitializeOptions`、`ProcessHandle`、`ProcessProvider`、`RawEntry`

### 17.3 驗證 — DONE
- [x] summoner index.ts export 不變
- [x] GREEN：266 summoner + 378 server + 624 client

### 17.4 Summoner 結構微調 — DONE
- [x] `protocol/claude.ts` → `protocol/claude-protocol.ts`
- [x] `protocol/server-action.ts` 併入 `protocol/provider-adapter.ts`
- [x] 更新所有 import path（adapter, index, tests）
- [x] GREEN：266 summoner + 378 server + 624 client

## 18. Code review — cleanup + 可簡化

### 18.1 Dead code / 可移除 — DONE
- [x] `THINKING_LEVEL_TOKENS` 移除（inline `off ? 0 : 31999`），settings/session handler 不再 import `ClaudeAdapter`
- [x] `ProcessSpawnOptions` 空 interface 移除 → 直接用 `SpawnOptions`
- [x] `model-utils.ts` `findModel()` helper inline

### 18.2 可簡化 — DONE
- [x] `Channel.emit()` / `emitToOthers()` → 提取 `emitToSockets(exclude, event, ...args)`
- [x] `channel-hooks.ts` switch — 不拆。每個 case 1-20 行，共用 closure（ctx, channelId），拆成 function 需傳大量參數反增 indirection。178 行職責單一
- [x] `toEffort()` — 不改。4 個 `===` 直觀且 TS 自動 narrow

### 18.3 驗證 — DONE
- [x] GREEN：266 summoner + 378 server + 624 client
- [x] expect 不變或等價

### 18.4 SERVER_ENRICHED_SUBTYPES 解耦
> adapter hardcode 了 server 需要 enrichment 的 subtype list，違反層級分離。
> 方案：移除 adapter 的 auto_response 分流，全部交給 server hooks 的 onServerAction 處理。
> channel-hooks 的 `auto_respond` default case 已有 `ch.runner.respondToControlRequest()` 直接回覆。
- [x] `ClaudeAdapter.transform()` — 移除 `SERVER_ENRICHED_SUBTYPES` 過濾，全部 `auto_respond` 保留在 `serverActions`
- [x] `AdapterOutput.autoResponses` 移除
- [x] `ProcessRunner` 移除 `auto_response` event emit
- [x] `Channel.wireRunner` 移除 `onAutoResponse` listener
- [x] `AutoResponse` type 移除
- [x] `summoner/index.ts` 移除 `AutoResponse` export
- [x] 測試：`claude-adapter.test.ts` expect `autoResponses` → `serverActions.filter(auto_respond)`
- [x] 測試：`adapter-integration.test.ts` 同步更新
- [x] GREEN：266 summoner + 378 server + 624 client

### 18.5 測試檔案 rename — DONE
- [x] `adapter-integration.test.ts` → `claude-adapter-pipeline.test.ts`

### 18.6 手寫 discriminated union — 不改 Zod
> `ParseResult`、`ServerAction` 是內部 type（不解析外部資料），TypeScript type 已有 compile-time 檢查。
> `ProtocolEvent` 已是 Zod-inferred union。
> 結論：不需要改成 Zod schema。

### 18.7 ServerAction 拆成具名 type — DONE
- [x] `AutoRespondAction`, `ReadDiffAction`, `ForwardToClientAction`
- [x] `ServerAction = AutoRespondAction | ReadDiffAction | ForwardToClientAction`

### 18.8 移除 dead re-exports — DONE
- [x] `types.ts` `ControlPermissionResponse` re-export 移除
- [x] `provider-adapter.ts` `SocketEvent` re-export 保留（public API 語義）

### 18.9 ParseResult 拆成具名 type — DONE
- [x] `ParseOk`, `ParseSkip`, `ParseUnknown`, `ParseError`

### 18.10 驗證 — DONE
- [x] GREEN：266 summoner + 378 server + 624 client

### 18.13 findModel suffix strip + default fallback — DONE
- [x] `findModel()` strips `[1m]` context window suffix before matching
- [x] `CommandMenu` modelEntry falls back to `models[0]` when no match
- [x] Real CLI data: model `"claude-opus-4-6[1m]"` + availableModels only `default/sonnet/haiku`
- [x] GREEN：630 client + 378 server

## 19. 中影響力 cleanup

### 19.1 Magic numbers → named constants — DONE
- [x] `30000` → `DEFAULT_CONTROL_TIMEOUT`（channel.ts local const）
- [x] `10_000` → `MCP_MESSAGE_TIMEOUT`（channel-hooks.ts local const）
- [x] 各常數放在使用者旁邊，不集中到 helpers

### 19.2 JSON-RPC error 構造重複 — DONE
- [x] `jsonRpcError(id, message)` helper（channel-hooks.ts local function）
- [x] 兩處 inline 構造 → 呼叫 helper

### 19.3 session:init payload 展開 — 不需要
- [x] channel.ts（CLI→metaCache）和 chat-handler.ts（metaCache→socket emit）資料流方向不同，不適合共用

### 19.4 驗證 — DONE
- [x] GREEN：378 server

## 20. SettingsStore → Drizzle DB + provider scope

> settingsStore 從 JSON file 改為 Drizzle DB，加 provider scope，移除 getAll，models 不再存 settings。

### 20.1 Schema + DrizzleSettingsStore — DONE
- [x] `schema-columns.ts` 加 `SETTINGS_COLUMNS`
- [x] `schema-sqlite.ts` + `schema-mysql.ts` 加 `settings` table（provider + key = composite PK）
- [x] `DrizzleSettingsStore` — get/set/getMany with provider scope, JSON serialize
- [x] 8 unit tests pass

### 20.2 SettingsStore interface 改版 — DONE
- [x] `get(provider, key)` / `set(provider, key, value)` / `getMany(provider, keys[])` — 全 async
- [x] `getAll()` 移除
- [x] `InMemorySettingsStore` + `FileSettingsStore` 同步更新

### 20.3 Channel + ChannelManager 加 provider — 暫用 'claude' literal
- [x] handler 呼叫處暫用 `'claude'` literal（Channel.provider 待後續加入）

### 20.4 Handler 呼叫處更新 — DONE
- [x] `settings-handler.ts` — 4x `await set('claude', ...)`, `getMany('claude', [user pref keys])`
- [x] `session-handler.ts` — `await set('claude', 'models', models)`
- [x] `connection-handler.ts` — `app:init` + `app:config` 改 async + getMany/get
- [x] `channel-hooks.ts` — `get_settings` → `getMany('claude', ['model', 'permissionMode'])`

### 20.5 models 保留在 settingsStore — DONE
- [x] 持久化 `set('claude', 'models', models)`
- [x] `app:config` → `cachedModels ?? get('claude', 'models') ?? defaultModels`
- [x] `get_settings` 的 `getMany` 不含 `'models'` — 不洩漏給 CLI

### 20.6 Container DI — DONE
- [x] `buildStores()` 回傳 `settingsStores[]`（同 eventStores/sessionStores pattern）
- [x] SQLite 先、MySQL 後、default SQLite fallback
- [x] `FileSettingsStore` 建構移除（保留 class 供 fallback/test）

### 20.8 MySQL 相容性修正 — DONE
- [x] upsert 改為 select+update/insert pattern（SQLite + MySQL 通用）

### 20.9 Channel.provider + 消除 hardcoded 'claude' — DONE
- [x] `Channel` constructor 加 `readonly provider: string`
- [x] `ChannelManager` 加 `get provider()` + `new Channel(runner, channelId, this.provider)`
- [x] settings-handler → `channel.provider`
- [x] connection-handler → `ctx.channelManager.provider`
- [x] session-handler → `ctx.channelManager.provider`
- [x] channel-hooks → `ch.provider`
- [x] channel.test.ts 19 處更新

### 20.10 FileSettingsStore 保留為 file backend — DONE
- [x] `buildStores()` `config?.file` 分支加 `FileSettingsStore`

### 20.11 DB migration — DONE
- [x] `CREATE TABLE settings` 在 SQLite DB 執行

### 20.12 驗證 — DONE
- [x] GREEN：266 summoner + 386 server + 630 client = 1282
- [x] typecheck 通過

### 20.7 測試 — DONE
- [x] DrizzleSettingsStore 8 unit tests
- [x] 全部 handler tests 更新
- [x] GREEN：266 summoner + 386 server + 630 client = 1282

## 21. SocketEvent typed payload — 延後

> 問題：`SocketEvent.payload` 不含 `channelId`（adapter 層），但 S2C payload schemas 都含 `channelId`（socket 層）。
> 需要定義 adapter-level payload types，延後到下個 branch。

## Final — Code Review + Cleanup 完成

### Final code review — PASSED
- [x] 零問題（過度設計、code smell、可簡化、職責不清、向下相容殘留）
- [x] 零 unused import / export
- [x] 零 console.log in production
- [x] 零 inconsistent event naming
- [x] GREEN：266 summoner + 378 server + 630 client = **1274 tests**

### 18.11 Final review fixes — DONE

### 18.12 Final code review fixes — DONE
- [x] Magic number `31999` → `DEFAULT_THINKING_TOKENS` 常數（helpers.ts，session-handler + settings-handler 引用）
- [x] `interruptedChannels` — 非 memory leak（per-socket scope，socket disconnect 時 GC），`chat:send` 已有 cleanup，不需額外處理
- [x] GREEN：378 server
- [x] `shared/schemas/session.ts` 向下相容 re-export 移除
- [x] `shared/schemas/control.ts` `z.any()` → `z.unknown()`
- [x] `ChannelMessagesContext` `reverse().find()` → backward for loop（`findLast` 需 ES2023 lib）
- [x] GREEN：266 summoner + 378 server + 624 client

### 16.6 effort 預設值修正 — DONE
- [x] `settings-handler` `settings:apply` → `settingsStore.set('effortLevel', effort)`
- [x] `connection-handler` `app:config` → `effort: settingsStore.get('effortLevel')`
- [x] `GetProviderConfigResponse` schema 加 `effort` field
- [x] `ChannelConfigProvider` mount 時從 `app:config` response 初始化 effort
- [x] `ChannelConfigValue.effort` type → nullable（`ConfigState['effort']` = `... | null`）
- [x] 移除 `effort ?? 'max'` fallback — null = 未取得，UI 不顯示
- [x] consumer 端已處理 null：`EffortSwitch level?`, `SparkLegend effort?`, `CommandMenu effort | null`
- [x] GREEN：378 server + 624 client
