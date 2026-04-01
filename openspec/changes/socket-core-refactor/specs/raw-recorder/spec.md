## ADDED Requirements

### Requirement: RawRecorder wires stdout/stdin/stderr persistence to a channel
RawRecorder SHALL attach listeners to a channel's runner for `stdout`, `stdin`, and `stderr` events, persisting each line to RawEventStore with direction, timestamp, and sequence number.

#### Scenario: Record stdout line with known sessionId
- **WHEN** runner emits `stdout` and channel has a non-null `sessionId`
- **THEN** RawEventStore.append SHALL be called with `{ sessionId, direction: 'out', raw: line, timestamp, seq }`

#### Scenario: Buffer events before sessionId is available
- **WHEN** runner emits `stdout` before channel's `sessionId` is set
- **THEN** the entry SHALL be buffered in memory with timestamp and seq

#### Scenario: Flush buffered events once sessionId becomes available
- **WHEN** a subsequent event arrives after `sessionId` is set and there are buffered entries
- **THEN** all buffered entries SHALL be flushed to RawEventStore with the resolved sessionId before recording the current entry

### Requirement: RawRecorder tracks stderr as lastError on channel
RawRecorder SHALL set `channel.lastError` to the stderr line content in addition to persisting it.

#### Scenario: Stderr updates lastError
- **WHEN** runner emits `stderr` with content "connection refused"
- **THEN** `channel.lastError` SHALL be set to "connection refused" AND the line SHALL be persisted with `direction: 'err'`

### Requirement: RawRecorder maintains monotonic sequence counter per channel
Each RawRecorder instance SHALL maintain an independent sequence counter starting at 0, incrementing for every recorded event (stdout, stdin, stderr) regardless of direction.

#### Scenario: Sequence increments across directions
- **WHEN** runner emits stdout (seq 0), stdin (seq 1), stderr (seq 2)
- **THEN** each persisted entry SHALL have the corresponding seq value
