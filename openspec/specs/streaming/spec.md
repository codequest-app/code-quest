## ADDED Requirements

### Requirement: stream:block_start creates tool_use placeholder

When a `stream:block_start` event arrives with `blockType === 'tool_use'`, a tool_use message is created with the toolId and name from `contentBlock`, and `streamingToolUseId` is set on ChannelState.

#### Scenario: First tool_use in a turn
- **WHEN** `stream:block_start` arrives with `contentBlock: { type: "tool_use", id: "toolu_1", name: "Edit" }`
- **THEN** a tool_use message is added with `meta.toolId = "toolu_1"`, `content = "Edit"`, `meta.input = {}`

#### Scenario: Second tool_use in same message (index=1)
- **WHEN** a second `stream:block_start [tool_use]` arrives with a different toolId
- **THEN** a new tool_use message is added without affecting the first

### Requirement: input_json_delta patches correct tool_use via streamingToolUseId

`onInputJsonChunk` uses `streamingToolUseId` from ChannelState to find the target message, not "last tool_use".

#### Scenario: Chunks arrive for streaming tool_use
- **WHEN** `stream:chunk(input_json)` arrives and `streamingToolUseId` is set
- **THEN** `partialInput` is appended to the message matching `streamingToolUseId`

#### Scenario: No streamingToolUseId set
- **WHEN** `stream:chunk(input_json)` arrives and `streamingToolUseId` is null
- **THEN** state is returned unchanged (no patch)

### Requirement: message:assistant patches existing tool_use placeholder

When `message:assistant` arrives with a tool_use block, it updates the existing placeholder rather than adding a new message.

#### Scenario: Placeholder exists (live streaming)
- **WHEN** `message:assistant` arrives with tool_use block whose toolId matches an existing message
- **THEN** the existing message's `input` is updated with complete data, `partialInput` is cleared

#### Scenario: No placeholder exists (history replay)
- **WHEN** `message:assistant` arrives with tool_use block whose toolId has no matching message
- **THEN** a new tool_use message is added (backwards compatible)

### Requirement: stream:block_stop clears streamingToolUseId

#### Scenario: Block streaming ends
- **WHEN** `stream:block_stop` arrives
- **THEN** `streamingToolUseId` is set to undefined

### Requirement: Edit partialInput shows diff preview

#### Scenario: partialInput is parseable JSON with old_string/new_string
- **WHEN** Edit tool_use has `partialInput` that parses as JSON with `old_string` and `new_string`
- **THEN** DiffViewer renders the diff

#### Scenario: partialInput is incomplete JSON
- **WHEN** Edit tool_use has `partialInput` that fails JSON.parse
- **THEN** a streaming indicator is shown (not raw JSON)

#### Scenario: Complete input exists
- **WHEN** Edit tool_use has `input` with keys (complete) and also has `partialInput`
- **THEN** `partialInput` is ignored, complete `input` is used
