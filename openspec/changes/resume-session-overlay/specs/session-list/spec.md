## MODIFIED Requirements

### Requirement: session:list 支援 cwd 過濾
`session:list` event payload SHALL 支援 optional `cwd` 參數。當提供 cwd 時，只回傳 cwd 匹配的 sessions。

#### Scenario: 帶 cwd 過濾的 session:list
- **WHEN** client emit `session:list { cwd: '/projects/foo', limit: 50 }`
- **THEN** server 只回傳 cwd 為 `/projects/foo` 的 sessions

#### Scenario: 不帶 cwd 的 session:list（向下相容）
- **WHEN** client emit `session:list { limit: 50 }`
- **THEN** server 回傳所有 sessions（不過濾 cwd）
