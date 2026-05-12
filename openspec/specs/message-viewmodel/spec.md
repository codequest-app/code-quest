# message-viewmodel Specification

## Purpose
TBD - created by archiving change message-viewmodel. Update Purpose after archive.
## Requirements
### Requirement: toViewModel 轉換 MessageNode 為 typed ViewModel

`toViewModel(node, ctx)` 接受 MessageNode 和 ViewModelContext，回傳對應的 ViewModel discriminated union。

#### Scenario: Bash tool_use
- **WHEN** message.type = 'tool_use', content = 'Bash', meta.input.command = 'echo hi'
- **THEN** 回傳 `{ kind: 'bash', toolId, command: 'echo hi', ... }`

#### Scenario: Read tool_use
- **WHEN** message.type = 'tool_use', content = 'Read', meta.input.file_path = '/src/app.ts'
- **THEN** 回傳 `{ kind: 'read', toolId, filePath: '/src/app.ts', lang: 'typescript', ... }`

#### Scenario: Agent tool_use with task
- **WHEN** message.type = 'tool_use', content = 'Task', ctx.tasks has matching entry with status 'completed'
- **THEN** 回傳 `{ kind: 'agent', task: { status: 'completed', ... }, ... }`

#### Scenario: text message
- **WHEN** message.type = 'text', content = 'hello'
- **THEN** 回傳 `{ kind: 'text', content: 'hello', role: message.role }`

#### Scenario: assistant_turn with blocks
- **WHEN** message.type = 'assistant_turn', blocks = [thinking, text, tool_use]
- **THEN** 回傳 `{ kind: 'assistant-turn', blocks: [ThinkingVM, TextVM, ToolUseVM] }`

### Requirement: ViewModelRenderer 純呈現

`<ViewModelRenderer vm={vm} />` 根據 `vm.kind` render 對應的 component，不從 store 讀資料。

#### Scenario: bash ViewModel
- **WHEN** `vm = { kind: 'bash', command: 'echo hi', result: 'hi' }`
- **THEN** render Bash IN/OUT 區塊（Labeled + Copyable + Highlight）

#### Scenario: unknown kind fallback
- **WHEN** `vm.kind` 不在已知清單
- **THEN** render 通用 fallback（顯示 content）

### Requirement: children 遞迴

#### Scenario: Agent with subagent children
- **WHEN** node.children 有 3 個 MessageNode
- **THEN** ViewModelNode.children 有 3 個 ViewModelNode，各自經過 toViewModel 轉換

### Requirement: mergeToolResult 最終移除

#### Scenario: tool_result 保留為獨立 message
- **WHEN** buildMessageTree 不再呼叫 mergeToolResult
- **THEN** tool_result 作為獨立 MessageNode 存在，toViewModel 用 toolId lookup result

#### Scenario: 移除後行為等價
- **WHEN** 相同的 messages 序列
- **THEN** render 出來的畫面與移除前相同

