## ADDED Requirements

### Requirement: AssistantTurn groups blocks from one API message

一個 API message 的所有 content blocks（thinking, text, tool_use）合併為一個 AssistantTurn message，帶有 model, usage, stopReason, blocks[]。每個 block 有獨立 id。

#### Scenario: Live streaming — message_start creates turn
- **WHEN** `stream:message_start` arrives with model and usage
- **THEN** a new AssistantTurn is added to messages[] with `isStreaming=true`, model, and initial usage

#### Scenario: Live streaming — block_start adds block to turn
- **WHEN** `stream:block_start` arrives with blockType and contentBlock
- **THEN** an empty Block is pushed to the current streaming turn's blocks[]
- **AND** tool_use blocks have toolId, name, and empty input from contentBlock

#### Scenario: Live streaming — delta accumulates into block
- **WHEN** `stream:chunk` arrives with text/thinking/input_json content
- **THEN** content is appended to the corresponding block in the current streaming turn

#### Scenario: Live streaming — message:assistant completes turn
- **WHEN** `message:assistant` arrives and a streaming turn exists (matched by messageId or last streaming turn)
- **THEN** blocks are patched with complete content/input, partialInput is cleared, isStreaming is set to false

#### Scenario: Replay — message:assistant creates complete turn
- **WHEN** `message:assistant` arrives and no streaming turn exists
- **THEN** a new AssistantTurn is created with complete blocks[], isStreaming=false

#### Scenario: message_delta updates turn metadata
- **WHEN** `stream:message_delta` arrives with stopReason and output tokens
- **THEN** the current streaming turn's stopReason and usage.outputTokens are updated

### Requirement: tool_result patches block inside turn

#### Scenario: tool_result for a tool_use block
- **WHEN** a user message with tool_result arrives, referencing tool_use_id
- **THEN** the matching block in the AssistantTurn's blocks[] has its meta.result patched

### Requirement: parentToolUseId on block level

#### Scenario: Subagent blocks
- **WHEN** a block is created with parentToolUseId
- **THEN** parentToolUseId is stored on the Block, not the Message

### Requirement: Each block has a unique id

#### Scenario: Block id for fork/rewind
- **WHEN** blocks are created (via streaming or replay)
- **THEN** each block has a unique `id` field

### Requirement: Collapse — last turn tool_use defaultOpen

#### Scenario: Last turn's tool_use blocks are expanded
- **WHEN** rendering the last AssistantTurn in messages[]
- **THEN** tool_use blocks render with `defaultOpen=true`

#### Scenario: Previous turns' tool_use blocks are collapsed
- **WHEN** rendering a non-last AssistantTurn
- **THEN** tool_use blocks render with `defaultOpen=false`

#### Scenario: Thinking blocks always collapsed
- **WHEN** rendering any AssistantTurn
- **THEN** thinking blocks render with `defaultOpen=false` regardless of position

### Requirement: local_agent and local_bash result rendering

#### Scenario: local_agent task result
- **WHEN** a tool_use block has taskType=local_agent and result content
- **THEN** result is rendered with MarkdownContent

#### Scenario: local_bash task result
- **WHEN** a tool_use block has taskType=local_bash and result content
- **THEN** result is rendered with OutputContent (ANSI support)

### Requirement: UI visual equivalence

#### Scenario: Rendered output matches current UI
- **WHEN** the same protocol events are processed
- **THEN** the visual output (thinking collapsible, text markdown, tool_use collapsible with header) is equivalent to the current per-block rendering
