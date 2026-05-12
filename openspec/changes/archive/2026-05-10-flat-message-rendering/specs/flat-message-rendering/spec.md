## ADDED Requirements

### Requirement: renderableGroups 一次遍歷 yield groups

#### Scenario: 連續 assistant messages 分成 timeline group
- **WHEN** messages 包含 3 則連續 assistant tool_use
- **THEN** yield 一個 `{ kind: 'timeline', messages: [3則] }`

#### Scenario: tool_result 不 yield
- **WHEN** messages 包含 tool_result
- **THEN** tool_result 被 skip，不出現在 groups 裡

#### Scenario: parentToolUseId messages 不 yield
- **WHEN** message 有 parentToolUseId（subagent）
- **THEN** 被 skip，由 parent component 的 childrenIndex 處理

#### Scenario: user message 打斷 timeline group
- **WHEN** assistant messages 後接 user message
- **THEN** 前面的 assistant 作為 timeline group yield，user 作為 single yield

### Requirement: childrenIndex 建 parent-children 對應

#### Scenario: subagent messages
- **WHEN** 3 則 messages 有 parentToolUseId = 'toolu_1'
- **THEN** childrenIndex.get('toolu_1') 回傳 3 則

#### Scenario: 無 children
- **WHEN** tool_use 沒有 subagent messages
- **THEN** childrenIndex.get(toolId) 回傳 undefined

### Requirement: NodeContent 接 Message + childrenIndex

#### Scenario: tool_use 有 children
- **WHEN** message.type = 'tool_use', childrenIndex 有對應 children
- **THEN** render tool body + SubagentLayout with children

#### Scenario: task/result 從 store 精準讀取
- **WHEN** task_progress 更新 tasks Map
- **THEN** 只有對應的 NodeContent re-render，其他不動

### Requirement: 精準 re-render

#### Scenario: 新 message append
- **WHEN** 一則新 message append 到 messages[]
- **THEN** 只有新 message 的 component mount，既有 component 不 re-render（memo）
