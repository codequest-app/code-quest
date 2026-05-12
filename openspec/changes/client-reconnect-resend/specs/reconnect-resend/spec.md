## MODIFIED Requirements

### Requirement: Message queue flush on reconnect

#### Scenario: Reconnect with queued messages
- **WHEN** socket reconnects and session:join ACK is received
- **AND** `messageQueueRef` has pending messages
- **THEN** each queued message is sent via `channelEmit(chat:send)`
- **AND** queue is emptied after all messages are sent

#### Scenario: Reconnect with empty queue
- **WHEN** socket reconnects and session:join ACK is received
- **AND** `messageQueueRef` is empty
- **THEN** no messages are sent

### Requirement: Status management on disconnect/reconnect

#### Scenario: Disconnect during processing
- **WHEN** socket disconnects while status is `processing`
- **THEN** status changes to `connecting`

#### Scenario: Reconnect restores idle
- **WHEN** socket reconnects successfully
- **THEN** status changes to `idle`
