## ADDED Requirements

### Requirement: Channel connection status state machine

ChannelContext SHALL manage connection status as a four-state machine: `connecting`, `ready`, `connected`, `error`.

- `connecting`: session:launch in progress (only for mode='new' path)
- `ready`: channel is ready for join (launch succeeded, or resume path initial state)
- `connected`: session:join completed successfully
- `error`: launch failed

#### Scenario: New session (mode='new') — join waits for launch
- **WHEN** a new tab is created with `mode='new'`
- **THEN** status starts as `connecting`
- **AND** `session:launch` is emitted
- **AND** `session:join` SHALL NOT be emitted until `session:launch` callback succeeds
- **AND** status transitions to `ready` after launch callback
- **AND** `session:join` is emitted after status becomes `ready`
- **AND** status transitions to `connected` after join callback succeeds

#### Scenario: Resume session (mode='resume') — immediate join
- **WHEN** an existing session tab is mounted with `mode='resume'`
- **THEN** status starts as `ready`
- **AND** `session:launch` SHALL NOT be emitted
- **AND** `session:join` is emitted immediately on mount

#### Scenario: Launch failure shows error with retry
- **WHEN** `session:launch` callback returns an error
- **THEN** status transitions to `error`
- **AND** error UI with retry button is displayed
- **AND** `session:join` SHALL NOT be emitted

#### Scenario: Connecting spinner during launch and join
- **WHEN** status is `connecting` or `ready`
- **THEN** SpinnerVerb SHALL be displayed
- **AND** children SHALL NOT be rendered

#### Scenario: Connected renders children
- **WHEN** status is `connected`
- **THEN** children SHALL be rendered
- **AND** SpinnerVerb SHALL NOT be displayed

### Requirement: onJoinSettled callback replaces onJoinComplete

ChannelMessagesProvider SHALL accept `onJoinSettled` callback (replacing `onJoinComplete`) which is invoked when session:join settles (success or error), signaling the outer ChannelContext to transition status to `connected` (unless already in error state).

#### Scenario: Join success triggers connected
- **WHEN** `session:join` callback returns success
- **THEN** `onJoinSettled` is invoked
- **AND** outer ChannelContext transitions to `connected`

#### Scenario: Join error still triggers settled
- **WHEN** `session:join` callback returns an error
- **THEN** `onJoinSettled` is invoked
- **AND** outer ChannelContext remains in current state if already `error`

### Requirement: No internal isConnecting state

ChannelMessagesProvider SHALL NOT maintain its own `isConnecting` state. Connecting UI is controlled entirely by the outer ChannelContext status.

#### Scenario: isConnecting removed from context value
- **WHEN** consuming `useChannelMessages()`
- **THEN** `isConnecting` SHALL NOT be present in the returned value

### Requirement: readyToJoin prop gates join timing

ChannelMessagesProvider SHALL accept a `readyToJoin` boolean prop. `session:join` SHALL only be emitted when `readyToJoin` is `true`.

#### Scenario: Join deferred until readyToJoin is true
- **WHEN** ChannelMessagesProvider mounts with `readyToJoin=false`
- **THEN** `session:join` SHALL NOT be emitted
- **WHEN** `readyToJoin` transitions to `true`
- **THEN** `session:join` SHALL be emitted
