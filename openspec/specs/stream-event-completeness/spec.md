## ADDED Requirements

### Requirement: transformStream SHALL emit stream:message_start for message_start events

#### Scenario: message_start with usage data
- **WHEN** a stream_event with `event.type === 'message_start'` is received
- **THEN** transform SHALL return `{ name: 'stream:message_start', payload: { model, messageId, usage: { inputTokens, cacheCreationInputTokens, cacheReadInputTokens } } }`

### Requirement: transformStream SHALL emit stream:message_delta for message_delta events

#### Scenario: message_delta with stop_reason and output tokens
- **WHEN** a stream_event with `event.type === 'message_delta'` is received
- **THEN** transform SHALL return `{ name: 'stream:message_delta', payload: { stopReason, usage: { outputTokens } } }`

### Requirement: transformStream SHALL emit stream:block_stop for content_block_stop events

#### Scenario: content_block_stop with index
- **WHEN** a stream_event with `event.type === 'content_block_stop'` is received
- **THEN** transform SHALL return `{ name: 'stream:block_stop', payload: { index } }`

### Requirement: transformStream SHALL emit stream:compaction for compaction_delta events

#### Scenario: compaction_delta with content
- **WHEN** a content_block_delta with `delta.type === 'compaction_delta'` is received
- **THEN** transform SHALL return `{ name: 'stream:compaction', payload: { content } }`

### Requirement: transformSystem SHALL emit system:post_turn_summary for post_turn_summary events

#### Scenario: post_turn_summary with summary text
- **WHEN** a system event with `subtype === 'post_turn_summary'` is received
- **THEN** transform SHALL return `{ name: 'system:post_turn_summary', payload: { summary } }`

### Requirement: Client SHALL track token usage from stream events

#### Scenario: Accumulate input tokens from message_start
- **WHEN** client receives `stream:message_start`
- **THEN** channel state SHALL update `tokenUsage.inputTokens` with the received value

#### Scenario: Accumulate output tokens from message_delta
- **WHEN** client receives `stream:message_delta`
- **THEN** channel state SHALL update `tokenUsage.outputTokens` with the received value

### Requirement: Client SHALL end block streaming on stream:block_stop

#### Scenario: Thinking block stops streaming
- **WHEN** client receives `stream:block_stop` and current block is thinking
- **THEN** `isThinkingStreaming` SHALL be set to `false`
