# Tasks — Protocol Alignment v2 (Extension 2.1.111)

## 實作規則

- **Protocol 優先**：每個 protocol 實作完立即確認，完成後再決定 client UI
- **Fixture 順序**：先查 DB → 有則用 real，沒有則從 extension 合成 synthetic fixture
- **Protocol TDD**：fixture jsonl → schema → transform → segments helper → adapter test
- **Client TDD**：fake summoner + real json + testing-library + component
- **一次一個**：每個 protocol 實作完需等確認再繼續

---

## 1. mirror_error（inbound: CLI → summoner）

**Fixture**: DB 無 → 需新增 `synthetic/system-mirror-error.jsonl`
```json
{"type":"system","subtype":"mirror_error","error":"Failed to write transcript","key":{"sessionId":"sess-abc"},"uuid":"uuid-1","session_id":"sess-abc"}
```

- [x] 新增 `synthetic/system-mirror-error.jsonl`
- [x] `schemas.ts` 新增 `systemMirrorErrorSchema`（`z.looseObject`）
- [x] `systemSubtypeRegistry` 加入 `mirror_error`
- [x] `ProtocolMessage` union 加入
- [x] `segments.ts` 新增 `mirrorError()` helper
- [x] `transforms/system.ts` 新增 `handleMirrorError` → ClientEvent `system:mirror_error`
- [x] Summoner test：fixture → transform → 驗 ClientMessage
- [x] Server handler：`dispatchRunnerMessage` 自動 broadcast，無需額外 handler
- [x] Client notification handler：`system:mirror_error` → `toast.warning('Mirror sync error: ...')`

---

## 2. seed_read_state（outbound: summoner → CLI）

**Fixture**: `synthetic/control-seed-read-state.jsonl` 已存在

- [x] `segments.ts` 新增 `seedReadState(path, mtime)` helper（用既有 fixture）
- [x] `adapter.ts` REQUEST_MAPPINGS 新增 `'transcript:seed_read_state': { subtype: 'seed_read_state' }`
- [x] Adapter test：`formatRequest('transcript:seed_read_state', ...)` → 驗 subtype + input

---

## 3. channel_enable（outbound: summoner → CLI）

**Fixture**: `synthetic/control-channel-enable.jsonl` 已存在

- [x] `segments.ts` 新增 `channelEnable(serverName)` helper（用既有 fixture）
- [x] `adapter.ts` REQUEST_MAPPINGS 新增 `'mcp:channel_enable': { subtype: 'channel_enable', mapPayload: serverNamePayload }`
- [x] Adapter test：`formatRequest('mcp:channel_enable', { serverName: 'slack-mcp' })` → 驗 subtype + server_name

---

## 4. reload_plugins（outbound: summoner → CLI）

**Fixture**: DB 無 → 需新增 `synthetic/control-reload-plugins.jsonl`
```json
{"type":"control_response","response":{"subtype":"success","request_id":"rp-1","response":{"status":"ok","reloaded":3}}}
```

- [x] 新增 `synthetic/control-reload-plugins.jsonl`
- [x] `adapter.ts` REQUEST_MAPPINGS 新增 `'plugin:reload': { subtype: 'reload_plugins' }`
- [x] Adapter test：`formatRequest('plugin:reload', {})` → 驗 subtype

### 4b. /reload-plugins UI（可與 protocol 同步實作）

- [x] `reload-plugins-feature.ts` 實作 `/reload-plugins` slash command
- [x] `ChannelMessagesContext` 新增 `reloadPlugins()` → `sendRequest('plugin:reload')`

---

## 5. ultrareview_launch（outbound: summoner → CLI）

**Fixture**: DB 無 → 需新增 `synthetic/control-ultrareview-launch.jsonl`
```json
{"type":"control_response","response":{"subtype":"success","request_id":"ur-1","response":{"launched":true}}}
```

- [x] 新增 `synthetic/control-ultrareview-launch.jsonl`
- [x] `adapter.ts` REQUEST_MAPPINGS 新增 `'ultrareview:launch': { subtype: 'ultrareview_launch' }`
- [x] Adapter test：`formatRequest('ultrareview:launch', { args: [], confirm: false })` → 驗 subtype + input

---

## 6. PermissionModePicker integration test（先做）

- [x] `config-from-session.test.tsx` 新增測試：點擊 PermissionModePicker → 選 "Plan mode" → 驗 socket 收到 `control_request` subtype `set_permission_mode` mode `plan`

---

## 7. auto permission mode（extension 2.1.45 新增）

### 7a. Auto mode 出現在選單 + 點擊發訊息（先做，不帶條件）

- [x] `config-from-session.test.tsx` 新增測試：點擊 PermissionModePicker → 選 "Auto mode" → 驗 CLI 收到 `set_permission_mode` mode `auto`
- [x] `getPermissionModes()` 加入 `auto` 選項
- [x] `PermissionModeIcons.tsx` 加 `AutoModeIcon` / `AutoModeSmallIcon`（lightning bolt）並加入 `PERMISSION_MODE_ICONS.auto`
- [x] `client-config.ts` `permissionModes` 加入 `auto`

### 7b. Auto mode 條件顯示（supportsAutoMode）

- [x] `modelInfoSchema` 加 `supportsAutoMode?: z.boolean().optional()`
- [x] `PermissionModePicker` 接收 `supportsAutoMode` prop，filter 掉不支援的模式
- [x] `ComposeToolbar` 從 context 算出 `supportsAutoMode` 傳給 `PermissionModePicker`
- [x] `config-from-session.test.tsx` 新增測試：model 支援 / 不支援 `supportsAutoMode` 時 Auto mode 顯示 / 隱藏

---

## 8. 更新 coverage matrix

- [x] `references/coverage-matrix.md` 更新為 extension 2.1.111，標記所有新項目狀態
