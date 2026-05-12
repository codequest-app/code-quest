## ADDED Requirements

### Requirement: Raw events ordered by createdAt and id
Raw events and raw deltas SHALL be ordered by `(sessionId, createdAt, id)` without relying on a `seq` column.

#### Scenario: Query events by session returns time-ordered results
- **WHEN** querying raw events for a session
- **THEN** results are returned in ascending `(createdAt, id)` order

#### Scenario: Appending events across reconnections maintains correct order
- **WHEN** multiple events are appended across different WebSocket connections within the same session
- **THEN** their relative order is determined by `createdAt` and `id`, not by any per-connection counter

### Requirement: No seq column in raw_events or raw_deltas
The `seq` column SHALL NOT exist in `raw_events` or `raw_deltas` tables.

#### Scenario: Schema has no seq column
- **WHEN** inspecting the raw_events or raw_deltas table schema
- **THEN** no `seq` column is present

#### Scenario: Appending a raw event does not set seq
- **WHEN** a raw event is appended via RawEventStore
- **THEN** no seq value is written to the database
