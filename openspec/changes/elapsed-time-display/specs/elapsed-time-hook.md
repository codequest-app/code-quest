## ADDED Requirements

### Requirement: elapsed time formatting
`useElapsedTime(startTime)` 回傳以 100ms 更新的已過時間字串。

#### Scenario: startTime 為 null
- **WHEN** startTime 為 null
- **THEN** 回傳 null

#### Scenario: startTime 有值
- **WHEN** startTime 為有效的 Date.now() 數值
- **THEN** 回傳 `"X.XXs"` 格式字串，每 100ms 更新

#### Scenario: unmount 清理
- **WHEN** component unmount
- **THEN** interval 被 clearInterval 清除
