## ADDED Requirements

### Requirement: SpinnerVerb 顯示 elapsed time
SpinnerVerb 在有 startTime 時，於 verb 旁顯示 live elapsed time。

#### Scenario: 無 startTime
- **WHEN** SpinnerVerb 未傳入 startTime
- **THEN** 只顯示 icon + verb，不顯示時間

#### Scenario: 有 startTime
- **WHEN** SpinnerVerb 傳入 startTime
- **THEN** 在 verb 右側顯示 `"X.XXs"` 格式的已過時間，每 100ms 更新
