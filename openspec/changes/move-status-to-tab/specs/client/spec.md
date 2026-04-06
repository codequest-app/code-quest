## CHANGED Requirements

### Requirement: TabBar shows real-time SessionStatus per tab

Each tab in TabBar displays a colored status dot reflecting the session's current `SessionStatus`.

#### Scenario: Tab shows green dot when session is idle
- **WHEN** session status is `idle`
- **THEN** tab shows a green (`bg-success`) status dot

#### Scenario: Tab shows pulsing dot when session is processing
- **WHEN** session status is `processing`, `busy`, or `connecting`
- **THEN** tab shows a pulsing purple (`bg-accent animate-pulse`) status dot

#### Scenario: Tab shows pulsing warning dot when cancelling
- **WHEN** session status is `cancelling`
- **THEN** tab shows a pulsing yellow (`bg-warning animate-pulse`) status dot

#### Scenario: Tab shows red dot when disconnected
- **WHEN** session status is `disconnected`
- **THEN** tab shows a red (`bg-danger`) status dot

### Requirement: HeaderBar no longer shows status indicator

HeaderBar displays model badge, thinking level, session title, and Raw button — but no status dot or status label.

#### Scenario: HeaderBar renders without status dot
- **WHEN** HeaderBar is rendered
- **THEN** no status dot element is present
- **AND** no status label text (Connected/Processing/etc.) is shown
- **AND** model badge, title, and Raw button are still visible

### Requirement: SessionStatus flows from ChannelMessagesContext to TabBar

The `onChange` callback passes the real `SessionStatus` value, not a simplified tri-state.

#### Scenario: Status changes propagate to tab
- **WHEN** ChannelMessagesContext status changes to `processing`
- **THEN** the corresponding tab's status dot updates to pulsing purple

## REMOVED Requirements

### Requirement: TabBar tri-state status (default/pending/done)

The `'default' | 'pending' | 'done'` tab status type is removed. `'pending'` and `'done'` were never set.
