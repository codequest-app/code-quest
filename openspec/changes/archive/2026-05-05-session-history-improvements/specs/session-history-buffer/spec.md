## ADDED Requirements

### Requirement: Live event buffering during join
Client 在 `session:join` 發出到 join callback 回來這段期間，所有 live 事件（透過 router 與 wireStreamingHandlers）都先 buffer，不立刻套用到 state。

#### Scenario: Buffer drains after history
- **WHEN** join callback 回來（history 已全部套用）
- **THEN** buffer 依序 drain，live 事件套用到已含 history 的 state

#### Scenario: Channel reconnect clears stale buffer
- **WHEN** channel 重新 join（channelId 或 socket 變更）
- **THEN** 舊的 buffer queue 清空，重新開始 buffering

### Requirement: StateBuffer utility
`createStateBuffer()` 是純函數，封裝 buffering 邏輯，可獨立單元測試。提供 `start()`、`drain(setState)`、`apply(setState, updater)`、`isBuffering()` 介面。
