## ADDED Requirements

### Requirement: UUID-based deduplication in ChannelState
`ChannelState` 包含 `seenUuids: Set<string>`，記錄已處理過的 `message:assistant` uuid。

#### Scenario: History replay dedup
- **WHEN** 多批 history 包含相同 uuid 的 `message:assistant`
- **THEN** 只顯示一條訊息

#### Scenario: Live stream dedup
- **WHEN** history 處理完 uuid X 後，同一 uuid X 又從 live socket 事件到達
- **THEN** live 事件被忽略，訊息不重複
