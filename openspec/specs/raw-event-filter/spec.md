# raw-event-filter Specification

## Purpose
TBD - created by archiving change raw-event-panel-filter. Update Purpose after archive.
## Requirements
### Requirement: Multi-select type filter with tag toggles

Each unique event type renders as a clickable tag showing the type name and count. Clicking a tag toggles its visibility.

#### Scenario: Toggle a type to hidden
- **WHEN** user clicks an active (visible) type tag
- **THEN** events of that type are hidden from the list, tag shows muted/strikethrough style

#### Scenario: Toggle a type back to visible
- **WHEN** user clicks a hidden type tag
- **THEN** events of that type reappear in the list, tag shows active style

#### Scenario: Tag shows event count
- **WHEN** events are present
- **THEN** each type tag displays the count of events of that type (e.g. `content_block_delta (142)`)

### Requirement: Delta events hidden by default

#### Scenario: New type containing "delta" arrives
- **WHEN** a new event type is first seen and its name contains "delta" (case-insensitive)
- **THEN** it is automatically added to the hidden set

#### Scenario: User can override delta default
- **WHEN** user clicks a hidden delta type tag
- **THEN** delta events become visible (override the default)

### Requirement: Auto-scroll toggle

#### Scenario: Auto-scroll enabled (default)
- **WHEN** auto-scroll is on and a new event arrives via streaming
- **THEN** the event list scrolls to show the latest event

#### Scenario: User scrolls up to pause
- **WHEN** user manually scrolls up while auto-scroll is on
- **THEN** auto-scroll is automatically disabled

#### Scenario: Re-enable auto-scroll
- **WHEN** user clicks the auto-scroll button while disabled
- **THEN** auto-scroll is re-enabled and list scrolls to bottom

### Requirement: Search text filter preserved

#### Scenario: Search and type filter work together
- **WHEN** both search text and type filter are active
- **THEN** only events matching both criteria are shown

