## Purpose

ResumableSocket wraps a TypedSocket to provide outbound event buffering and replay on reconnect. It maintains a monotonic seq counter and bounded ring buffer, enabling gap detection and automatic event recovery when a client reconnects.

## Requirements

### Requirement: ResumableSocket wraps TypedSocket with seq tracking and ring buffer
ResumableSocket SHALL implement the TypedSocket interface and wrap an inner TypedSocket. It SHALL maintain a monotonic seq counter and a bounded ring buffer of recent outbound events.

#### Scenario: emit forwards to inner and buffers
- **WHEN** `resumable.emit(event, data)` is called
- **THEN** the call SHALL be forwarded to `inner.emit(event, data)` AND stored in the ring buffer with an incrementing seq number

#### Scenario: id delegates to inner
- **WHEN** `resumable.id` is accessed
- **THEN** it SHALL return `inner.id`

#### Scenario: on delegates to inner
- **WHEN** `resumable.on(event, listener)` is called
- **THEN** it SHALL delegate to `inner.on(event, listener)`

### Requirement: Ring buffer caps at configured size
The ring buffer SHALL drop the oldest entry when it exceeds `bufferSize` (default 500).

#### Scenario: buffer overflow drops oldest
- **WHEN** more than `bufferSize` events are emitted
- **THEN** only the most recent `bufferSize` events SHALL be retained

### Requirement: resume replays buffered events
`resume(lastSeq)` SHALL replay all buffered events with `seq > lastSeq` through the inner socket.

#### Scenario: replay events after lastSeq
- **WHEN** `resume(1)` is called and buffer contains seq 1, 2, 3
- **THEN** events with seq 2 and 3 SHALL be replayed via `inner.emit`

#### Scenario: resume at or beyond newest replays nothing
- **WHEN** `resume(lastSeq)` is called where lastSeq >= highest buffered seq
- **THEN** no events SHALL be replayed and result SHALL be `{ kind: 'ok', replayed: 0 }`

#### Scenario: resume detects gap
- **WHEN** `resume(lastSeq)` is called where lastSeq < oldest buffered seq - 1
- **THEN** result SHALL be `{ kind: 'gap' }` and no events SHALL be replayed

### Requirement: rebind swaps inner socket preserving state
`rebind(newInner)` SHALL replace the inner socket while preserving the seq counter and ring buffer.

#### Scenario: rebind preserves seq across reconnect
- **WHEN** events are emitted, then `rebind(newInner)` is called, then more events are emitted
- **THEN** the seq counter SHALL continue from where it left off, and `resume(lastSeq)` SHALL work across the rebind boundary
