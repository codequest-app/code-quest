## ADDED Requirements

### Requirement: Auto-scroll follows streaming content when user is at bottom
The system SHALL auto-scroll to bottom during streaming delta updates when the user's scroll position is at or near the bottom (within 50px threshold).

#### Scenario: User at bottom during streaming
- **WHEN** user is at bottom and a streaming delta arrives (content appended to last message)
- **THEN** the view SHALL scroll to keep the bottom visible

#### Scenario: User scrolled up during streaming
- **WHEN** user has scrolled up (more than 50px from bottom) and streaming deltas arrive
- **THEN** the view SHALL NOT auto-scroll — user's scroll position is preserved

### Requirement: Pending action does not force scroll
The system SHALL NOT force scroll to bottom when a `pending_action` message appears if the user has scrolled away from bottom.

#### Scenario: Permission request while user reads earlier content
- **WHEN** user has scrolled up and a pending_action message is added
- **THEN** the view SHALL NOT auto-scroll to the pending action
- **AND** the scroll-to-bottom button SHALL be visible

#### Scenario: Permission request while user is at bottom
- **WHEN** user is at bottom and a pending_action message is added
- **THEN** the view SHALL auto-scroll to show the pending action (same as any new message)

### Requirement: Instant scroll during streaming, smooth for discrete events
The system SHALL use `behavior: 'instant'` for auto-scroll during active streaming to avoid animation backlog and jitter. The system SHALL use `behavior: 'smooth'` only for discrete events (scroll-to-bottom button click, new user message sent).

#### Scenario: High-frequency streaming deltas
- **WHEN** streaming deltas arrive at high frequency (multiple per second)
- **THEN** each auto-scroll SHALL use instant behavior (no animation)

#### Scenario: User clicks scroll-to-bottom button
- **WHEN** user clicks the scroll-to-bottom button
- **THEN** the view SHALL smooth-scroll to bottom

### Requirement: Reliable programmatic scroll detection
The system SHALL detect the end of programmatic scrolling via scroll event settlement rather than a fixed timeout, to avoid race conditions with slow/fast scroll animations.

#### Scenario: Programmatic scroll completes
- **WHEN** a programmatic scroll finishes (scroll position stabilizes)
- **THEN** the system SHALL resume tracking user scroll input within one frame
