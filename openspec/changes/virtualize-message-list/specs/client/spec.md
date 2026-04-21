## ADDED Requirements

### Requirement: MessageList render cost is independent of total message count
The chat MessageList SHALL virtualize off-screen messages so only visible rows (and a small overscan buffer) render. Total render cost SHALL be O(visible), not O(total messages).

#### Scenario: Long conversation scroll
- **WHEN** a channel contains 500 messages and the user scrolls
- **THEN** only messages within the viewport plus a small buffer are rendered; messages far from the viewport are unmounted; no visible scroll jank

#### Scenario: New message at bottom preserves follow-output
- **WHEN** the user is scrolled to the bottom and a new message arrives
- **THEN** the list smoothly scrolls to include the new message and the scroll-to-bottom button remains hidden

#### Scenario: New message while scrolled up does not hijack scroll
- **WHEN** the user has scrolled up and a new message arrives
- **THEN** the scroll position does not jump and the scroll-to-bottom button becomes visible

#### Scenario: Jump to message via scrollToMessage
- **WHEN** external code calls `ref.current.scrollToMessage(id)`
- **THEN** the list scrolls the target message into the viewport, triggers the spotlight-highlight animation, and expands any collapsed timeline that contained it first

#### Scenario: Search / filter updates do not break scroll
- **WHEN** the search query or visibility filter changes, removing/adding rows
- **THEN** the list remains usable, the remaining rows render correctly, and pressing the scroll-to-bottom button still reaches the last visible row

#### Scenario: Streaming tool-use updates do not force a full re-render
- **WHEN** a tool_use message is receiving streaming partialInput updates
- **THEN** only the affected row re-renders; off-screen rows stay unchanged

### Requirement: RawEventPanel render cost is independent of total event count
The raw-events debug panel SHALL virtualize off-screen events so render cost stays O(visible) regardless of how many protocol events accumulate over a session (typically thousands on long sessions).

#### Scenario: Long event stream
- **WHEN** the panel displays 1000+ events
- **THEN** only the visible subset (plus small overscan) is rendered; scroll and filter interactions remain responsive

#### Scenario: Streaming append keeps auto-scroll
- **WHEN** new events arrive via `onSubscribe` and the user is at the bottom
- **THEN** the list follows output and new events become visible without the user manually scrolling

#### Scenario: User scrolled up sees no hijack
- **WHEN** the user has scrolled up to inspect an earlier event and a new event arrives
- **THEN** scroll position does not jump

### Requirement: Variable-height rows measured automatically
The virtualized list SHALL measure each row's actual rendered height without requiring pre-declared sizes; this is required because messages range from one-line text to multi-hundred-line tool_result blocks.

#### Scenario: Mixed short and long messages
- **WHEN** the list contains a mix of one-line text messages and 100-line tool_result messages
- **THEN** each row occupies exactly the space its content needs; no fixed-height clipping; no gaps

#### Scenario: Row content grows (streaming)
- **WHEN** a row's content grows (e.g. streaming assistant text)
- **THEN** the measured height updates and subsequent rows reflow accordingly
