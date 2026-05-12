# node-content Specification

## Purpose
TBD - created by archiving change node-content-refactor. Update Purpose after archive.
## Requirements
### Requirement: NodeContent 根據 message.type 分派到對應 Content component

#### Scenario: tool_use Bash
- **WHEN** node.message.type = 'tool_use', content = 'Bash'
- **THEN** render BashContent with command, result, task props

#### Scenario: text message
- **WHEN** node.message.type = 'text'
- **THEN** render TextContent with content, role, citations props

#### Scenario: thinking message
- **WHEN** node.message.type = 'thinking', content is empty
- **THEN** render nothing (null)

#### Scenario: unknown type
- **WHEN** node.message.type is not in known list
- **THEN** render fallback (plain text)

### Requirement: NodeContent 遞迴 render children

#### Scenario: node with children
- **WHEN** node.children has 2 items
- **THEN** render NodeContent for each child with appropriate layout

### Requirement: Content component 接受 typed props

#### Scenario: BashContent
- **WHEN** BashContent receives command, result, task
- **THEN** renders Labeled + Copyable + Highlight (same output as current)

### Requirement: task/result 由 parent lookup 傳入

#### Scenario: tasks Map 更新
- **WHEN** tasks Map changes (task_progress)
- **THEN** 只有對應的 NodeContent re-render，tree 不重建

