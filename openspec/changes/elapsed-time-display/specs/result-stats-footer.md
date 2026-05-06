## ADDED Requirements

### Requirement: result stats 附著在 assistant message footer
turn 結束時的統計資訊顯示在最後一則 assistant message 的下方，而非獨立分隔線。

#### Scenario: turn 結束，最後一則為 assistant message
- **WHEN** result message 緊接在 assistant message 之後
- **THEN** stats（cost、durationMs、tokens）顯示在 assistant message 的 footer
- **THEN** result message 本身不獨立渲染

#### Scenario: durationMs 精度
- **WHEN** stats 顯示 durationMs
- **THEN** 格式為 `"X.XXs"`（兩位小數，toFixed(2)）

#### Scenario: 無 result message
- **WHEN** assistant message 後沒有 result message
- **THEN** assistant message 正常顯示，無 footer stats
