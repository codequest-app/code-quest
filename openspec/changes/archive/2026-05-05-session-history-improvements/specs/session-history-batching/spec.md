## ADDED Requirements

### Requirement: Configurable batch size
Server 的 `historyBatchSize` 預設為 1000，可透過環境變數 `SESSION_HISTORY_BATCH_SIZE` 覆寫。

#### Scenario: Default batch size
- **WHEN** `SESSION_HISTORY_BATCH_SIZE` 未設定
- **THEN** server 使用 1000 作為每批最大事件數

#### Scenario: Custom batch size
- **WHEN** `SESSION_HISTORY_BATCH_SIZE=50`
- **THEN** server 每批最多傳送 50 個事件

### Requirement: Multi-batch history replay
當歷史事件數超過 `historyBatchSize` 時，server 分多批 emit `session:history` 事件。

#### Scenario: Events fit in one batch
- **WHEN** 歷史事件數 ≤ historyBatchSize
- **THEN** server emit 一個 `session:history` 事件，client 顯示所有訊息

#### Scenario: Events span multiple batches
- **WHEN** 歷史事件數 > historyBatchSize
- **THEN** server emit 多個 `session:history` 事件，client 全部顯示且無重複
