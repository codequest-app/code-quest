## MODIFIED Requirements

### Requirement: Multi-batch history replay
當歷史事件數超過 `historyBatchSize` 時，server 分多批 emit `session:history` 事件。

#### Scenario: Events span multiple batches — test coverage
- **WHEN** historyBatchSize=1 且 session 有 2 條歷史訊息
- **THEN** server emit 2 個 `session:history` 事件，client 兩條都顯示且無重複
