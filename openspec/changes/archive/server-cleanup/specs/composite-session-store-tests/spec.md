## ADDED Requirements

### Requirement: CompositeSessionStore requires at least one store
The constructor SHALL throw an Error when given an empty stores array.

#### Scenario: Empty stores array
- **WHEN** CompositeSessionStore is constructed with an empty array
- **THEN** it SHALL throw an Error with message "CompositeSessionStore requires at least one store"

### Requirement: persist fan-out to all stores
The persist method SHALL call persist on all stores concurrently.

#### Scenario: All stores succeed
- **WHEN** persist is called and all stores succeed
- **THEN** no error SHALL be thrown

#### Scenario: Partial failure
- **WHEN** persist is called and some (but not all) stores fail
- **THEN** no error SHALL be thrown
- **THEN** a console.warn SHALL be emitted for each failure

#### Scenario: All stores fail
- **WHEN** persist is called and all stores fail
- **THEN** an AggregateError SHALL be thrown with message "All session stores failed to persist"

### Requirement: Read operations delegate to first store only
The list, getById, rename, and updateStatus methods SHALL only delegate to stores[0].

#### Scenario: list delegates to first store
- **WHEN** list is called with options
- **THEN** only stores[0].list SHALL be called with the same options

#### Scenario: getById delegates to first store
- **WHEN** getById is called
- **THEN** only stores[0].getById SHALL be called

#### Scenario: rename delegates to first store
- **WHEN** rename is called
- **THEN** only stores[0].rename SHALL be called

#### Scenario: updateStatus delegates to first store
- **WHEN** updateStatus is called
- **THEN** only stores[0].updateStatus SHALL be called

### Requirement: delete fan-out to all stores
The delete method SHALL call delete on all stores concurrently.

#### Scenario: Any store returns true
- **WHEN** delete is called and at least one store returns true
- **THEN** the result SHALL be true

#### Scenario: All stores return false
- **WHEN** delete is called and all stores return false
- **THEN** the result SHALL be false

### Requirement: interruptedChannels cleanup on session close
The message-handler SHALL remove channelId from interruptedChannels when the channel's session closes.

#### Scenario: Channel session closes after interrupt
- **WHEN** a channel was interrupted (added to interruptedChannels)
- **AND** the session:closed event is received for that channelId
- **THEN** the channelId SHALL be removed from interruptedChannels

### Requirement: No duplicate pending-request rejection in channel-hooks onExit
The channel-hooks onExit SHALL NOT iterate or clear pendingRequests, as channel.ts already handles this.

#### Scenario: onExit does not touch pendingRequests
- **WHEN** the runner process exits
- **THEN** channel-hooks onExit SHALL only broadcast session state and emit session:closed
- **THEN** channel-hooks onExit SHALL NOT call pendingRequests.clear() or reject pending requests
