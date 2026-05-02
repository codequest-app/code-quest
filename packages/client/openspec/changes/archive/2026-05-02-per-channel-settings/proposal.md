## Why

目前 cc-office 改 model 或 permission mode 時，會透過 `broadcastAll` 同步給所有 channel，導致改一個 tab 全部 tab 都跟著變。Extension 因為只有一個全域 model 所以這樣合理，但 cc-office 是 multi-channel 架構，每個 channel 對應獨立 CLI process，應該要能各自選不同的 model 和 mode。

另外，啟動時預設 model/mode 的來源不明確 — 有時吃 DB、有時吃 CLI session:init，行為不一致。

## What Changes

### 核心策略：改當前 channel + 寫 DB 當預設，不廣播給其他 channel

參考 extension 的做法，但適配 multi-channel：

| 操作 | Extension | cc-office (改後) |
|---|---|---|
| 使用者改 model | 改 CLI + 寫 settings.json + 廣播全部 tab | 改當前 channel + 寫 DB 預設 + **不廣播** |
| 使用者改 mode | 改 CLI + 持久化 globalState + 廣播全部 tab | 改當前 channel + 寫 DB 預設 + **不廣播** |
| 系統觸發 mode 變更 | 只改 CLI，不持久化 | 只改當前 channel，不持久化 |
| 新 session 啟動 | 讀 settings.json / globalState | 讀 DB 預設值 |

### Server

- **`handleSetModel`** (`settings.ts`):
  - 改當前 channel 的 `sessionConfig.model`
  - 寫 DB (`settingsStore.set(provider, 'model', model)`) 作為預設
  - 只 emit 給當前 channel 的 sockets，不 `broadcastAll`
  - 不再呼叫 `broadcastSessionState()` 更新所有 session

- **`handleSetPermissionMode`** (如有類似 handler):
  - 同 model 策略：改當前 channel + 寫 DB + 不廣播
  - 區分 `userInitiated`：使用者主動 → 持久化；系統觸發 → 不持久化

- **Channel 啟動** (`onSessionInit` / channel 建立時):
  - 從 DB 讀預設 model 和 permissionMode
  - 套用到新 channel 的 `sessionConfig`

### Client

- **`ChannelConfigContext`**:
  - `setModel` 後不再期待 `broadcastAll` 回傳來更新，改為 optimistic update 當前 channel state
  - `SessionContext` 裡其他 channel 的 modelSetting 不受影響

- **`SessionContext`**:
  - `session:states` broadcast 仍保留（用於顯示 session list 裡每個 session 的 model），但各 channel 各自回報自己的 model

## Out of Scope

- Fast mode — 已經是 per-channel，不持久化，行為正確
- Model list / available models — 全域共享，不需改
- Thinking level — 可以之後用同樣策略處理，但不在此次範圍
- 「設定預設值」的獨立 UI — 暫不需要，使用者最後選的自然成為預設
