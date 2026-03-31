## ADDED Requirements

### Requirement: session:states busy/idle 同步 channelState.status
ChannelMessagesContext SHALL 監聽 `session:states` 事件，當 state 為 `busy` 時更新 status 為 `'busy'`，`idle` 時更新為 `'idle'`。

#### Scenario: B 視窗收到 busy 顯示 spinner
- **WHEN** A 視窗 send message，server broadcast `session:states { state: 'busy' }`
- **THEN** B 視窗的 channelState.status 變為 `'busy'`，spinner 出現，send 按鈕變 stop

#### Scenario: B 視窗收到 idle 隱藏 spinner
- **WHEN** A 視窗的 message result 回來，server broadcast `session:states { state: 'idle' }`
- **THEN** B 視窗的 channelState.status 變為 `'idle'`，spinner 消失

#### Scenario: 不覆蓋本地 processing/cancelling
- **WHEN** A 視窗自己 send message（status = processing），收到自己的 broadcast busy
- **THEN** status 保持 `'processing'`（不被覆蓋為 `'busy'`）
