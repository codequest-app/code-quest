## ADDED Requirements

### Requirement: registry SHALL dispatch by message type

#### Scenario: known type
- **WHEN** message.type = 'tool_use'
- **THEN** registry 回傳 ToolUseContent component

#### Scenario: unknown type
- **WHEN** message.type 不在 registry
- **THEN** 回傳 FallbackContent（顯示 content 純文字）

### Requirement: tool use sub-registry SHALL dispatch by toolName

#### Scenario: Bash tool
- **WHEN** message.type = 'tool_use', toolName = 'Bash'
- **THEN** tool registry 回傳 BashContent component

#### Scenario: unknown tool
- **WHEN** toolName 不在 tool registry
- **THEN** 回傳 DefaultToolContent

### Requirement: StoreMessage MUST use zod inferred types

#### Scenario: tool_use message
- **WHEN** handler 收到 tool_use payload
- **THEN** store 存 `MessageBase & ToolUseBlock`（zod validated），無 meta 欄位

#### Scenario: text message
- **WHEN** handler 收到 text payload
- **THEN** store 存 `MessageBase & TextBlock`，無 meta 欄位

### Requirement: renderer MUST read typed fields directly

#### Scenario: BashContent
- **WHEN** BashContent 收到 message
- **THEN** 讀 `message.input.command`（不是 `message.meta.input.command`）

### Requirement: tasks/results/parentToolUseId MUST not be affected

#### Scenario: task lifecycle
- **WHEN** task_progress event 到達
- **THEN** state.tasks Map 更新，對應的 renderer re-render

#### Scenario: tool_result
- **WHEN** tool_result 到達
- **THEN** state.results Map 更新，對應的 renderer re-render
