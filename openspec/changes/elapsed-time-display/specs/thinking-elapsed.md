## ADDED Requirements

### Requirement: ThinkingBlock 顯示執行時間
ThinkingBlock 在 streaming 中顯示 live elapsed，完成後顯示靜態時間。

#### Scenario: streaming 中，有 startTime
- **WHEN** isStreaming=true 且 startTime 有值
- **THEN** header 顯示 `"Thinking... X.XXs"`，每 100ms 更新

#### Scenario: 完成後，有 durationMs
- **WHEN** isStreaming=false 且 durationMs 有值
- **THEN** header 顯示 `"Thought for X.XXs"`（靜態）

#### Scenario: 完成後，無 durationMs
- **WHEN** isStreaming=false 且 durationMs 為 null/undefined
- **THEN** header 顯示 `"Thinking"`（不變）
