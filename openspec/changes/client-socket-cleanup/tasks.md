## 規則

- Server 400 test + Client 619 test + Summoner 271 test 全部 pass
- 測試不變：不修改任何測試檔案的 expect（expect 不變或等價）
- TDD：FakeClaude + real JSON + testing-library，先寫測試再寫 code
- named function（不用 arrow）
- 每個 case 獨立完成：adapter test(RED) → adapter(GREEN) → server handler → 全量 test pass → 下一個

## 1. 消除 ServerAction（已完成）

- [x] 所有 control_request subtypes 轉為 SocketEvent
- [x] 新建 auto-respond.ts handler
- [x] 移除 ServerAction type + server_action runner event + onServerAction hook
- [x] 補 CLI-initiated set_model/set_permission_mode/get_settings 測試

## 2. Event naming + cleanup（已完成）

- [x] 2.1–2.13 全部完成
- [x] 400 server + 619 client + 271 summoner test pass

## 3. Code review 修正

### 3.1 P0: plan.ts closePreview catch 回 success: true

- [ ] 3.1a 修正 catch block 回 `{ success: false, error: ... }`
- [ ] 3.1b test pass

### 3.2 P0: permission.ts onOpenDiff Promise 無 catch

- [ ] 3.2a 加 catch handler
- [ ] 3.2b test pass

### 3.3 P1: session handler middleware 補齊

session/command.ts、session/fork.ts、session/query.ts 有 callback 的 handler 都沒加 middleware。
ch null 時不回 error 給 client。

- [ ] 3.3a 評估每個 handler 是否需要 withChannel/withError
- [ ] 3.3b 加 middleware
- [ ] 3.3c test pass

### 3.4 P1: settings.ts silent catch

`handleSetProactive`、`handleSetRemoteControl` silent catch，其他 handler 有 error callback。

- [ ] 3.4a 統一 error handling pattern
- [ ] 3.4b test pass

### 3.5 Channel.sendRequest：handler 不碰原生 protocol

handler 直接用 `ch.sendControlRequest('set_model', { model })` 是 Claude-specific。
改為 `ch.sendRequest('settings:set_model', { model })`，Channel 內部透過 adapter 轉換。

#### 3.5a adapter 加 reverse mapping

adapter 新增 `formatRequest(event, payload) → { subtype, input }`。
在 summoner `ProviderAdapter` interface 定義，Claude adapter 實作 mapping。

event name → protocol subtype 對照表：

| event name | protocol subtype | handler |
|---|---|---|
| `settings:set_model` | `set_model` | settings.ts |
| `settings:set_permission_mode` | `set_permission_mode` | settings.ts |
| `settings:set_thinking_level` | `set_max_thinking_tokens` | settings.ts |
| `settings:set_proactive` | `set_proactive` | settings.ts |
| `settings:remote_control` | `remote_control` | settings.ts |
| `settings:apply` | `apply_flag_settings` | settings.ts |
| `settings:get_context_usage` | `get_context_usage` | settings.ts |
| `message:interrupt` | `interrupt` | message.ts |
| `message:stop_task` | `stop_task` | message.ts |
| `message:cancel_async` | `cancel_async_message` | message.ts |
| `message:rewind` | `rewind_files` | message.ts |
| `session:generate_title` | `generate_session_title` | command.ts |
| `session:initialize` | `initialize` | connect.ts |
| `mcp:reconnect` | `mcp_reconnect` | mcp.ts |
| `mcp:toggle` | `mcp_toggle` | mcp.ts |
| `mcp:servers` | `mcp_status` | mcp.ts |
| `mcp:set_servers` | `mcp_set_servers` | mcp.ts |
| `mcp:message` | `mcp_message` | mcp.ts |
| `mcp:authenticate` | `mcp_authenticate` | mcp.ts |
| `mcp:clear_auth` | `mcp_clear_auth` | mcp.ts |
| `mcp:oauth_callback` | `mcp_oauth_callback_url` | mcp.ts |

- [ ] 3.5a summoner: `ProviderAdapter` interface 加 `formatRequest(event, payload)`
- [ ] 3.5b summoner: ClaudeAdapter 實作 reverse mapping
- [ ] 3.5c summoner test pass

#### 3.5b Channel.sendRequest

Channel 新增 `sendRequest(event, payload)` method，內部呼叫 `adapter.formatRequest` + `sendControlRequest`。

- [ ] 3.5d Channel 新增 `sendRequest`
- [ ] 3.5e server test pass

#### 3.5c handler 逐步遷移

每個 handler 改用 `ch.sendRequest(event, payload)` 取代 `ch.sendControlRequest(subtype, input)`。
一次改一個 handler 檔案，改完跑 test。

- [ ] 3.5f settings.ts
- [ ] 3.5g message.ts
- [ ] 3.5h mcp.ts
- [ ] 3.5i session/connect.ts
- [ ] 3.5j session/command.ts
- [ ] 3.5k 移除 Channel.sendControlRequest（確認無人使用）
- [ ] 3.5l 全量 test pass

### 3.6 驗證

- [ ] 3.6a typecheck pass
- [ ] 3.6b 400 server + 619 client + 271 summoner test pass
