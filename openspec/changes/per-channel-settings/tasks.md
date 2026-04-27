## Tasks

### Server

- [x] **S1** — `handleSetModel` 改為 per-channel emit
  - `settings.ts` — 改 `broadcastAll` → `emitter.emit(channelId, ...)`
  - 新增 `ch.updateSessionConfig({ model })` + emit `modelSetting`
  - 保留 `settingsStore.set()` 寫 DB 預設

- [x] **S2** — `handleSetPermissionMode` 改為 per-channel emit
  - `settings.ts` — 改 `broadcastAll` → `emitter.emit(channelId, ...)`
  - 保留 `settingsStore.set()` 寫 DB 預設

- [x] **S3** — `broadcastSessionState` 改為 per-channel emit
  - `channel-manager.ts` — 改 `broadcastAll` → `emitter.emit(channelId, ...)`
  - 保留 `session:states` 廣播（session list 顯示用）

- [x] **S4** — Channel 啟動時從 DB 讀預設值套用到 sessionConfig
  - 已由 `app:init` → `handleInit` 回傳 DB 預設值，client 端透過 `initialConfig` 套用

### Client

- [x] **C1** — 新 channel 從 `app:init` 的 DB 預設值初始化 model/permissionMode
  - `SessionContext.tsx` — 新增 `defaultSettings` state，從 `app:init` 回傳的 `settings` 存入
  - `ChannelContext.tsx` — 透過 `initialConfig` 傳入 `ChannelConfigProvider`

- [x] **C2** — `ChannelConfigContext` Effect 3 移除 model/permissionMode 同步
  - 只保留 effort 同步，model/permissionMode 改為只依賴 `settings:update` 事件和 `initialConfig`

- [x] **C3** — `setModel` 已有 optimistic update（原本就有）

- [x] **C4** — `setPermissionMode` 已有 optimistic update（原本就有）

### Tests

- [x] **T1** — Server: setModel 只通知當前 channel，不影響其他 channel
- [x] **T2** — Server: setPermissionMode 只通知當前 channel
- [x] **T3** — Server: 新 channel 啟動時讀 DB 預設值
- [x] **T4** — Client: setModel optimistic update（原本就有測試）
- [x] **T5** — Client: 其他 channel 改 model 不影響當前 channel state（透過 S1/S2 server 端隔離）
- [x] **T6** — Client: 新 channel 打開時從 initialConfig 顯示 DB 預設 model/mode

### Follow-up（本 branch 一併處理）

- [x] **F1** — ~~`session:states` broadcastAll → per-channel emit~~ (false positive：session:states 維護全域 session 列表，sidebar 需要看到所有 channel，broadcastAll 是正確的)
- [x] **F2** — `SessionContext` onStates 雙路徑 cast 修正
  - `SessionContext.tsx` — `parsed.success` 為 false 時仍把 `raw as SessionStatesPayload` 傳給 listeners，應統一：parse 失敗就不通知 listeners
