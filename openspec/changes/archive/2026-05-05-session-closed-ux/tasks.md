## 1. Fix Status Guard in ChannelMessagesContext

- [x] 1.1 In `onSessionStates`, extend the early-return guard to include `'disconnected'`: `if (prev.status === 'processing' || prev.status === 'cancelling' || prev.status === 'disconnected') return prev;`

## 2. Fix Message Type in ChannelControlContext

- [x] 2.1 Verify `onSessionClosed` inserts the end message with `type: 'error'` (partial fix already in working tree — confirm and finalize)

## 3. Tests

- [x] 3.1 Add test in `ChannelMessagesContext` tests: `session:states` broadcast does NOT override `'disconnected'` status after session ends
- [x] 3.2 Add test in `ChannelControlContext` tests: `session:closed` inserts a message with `type: 'error'` and text "CLI session has ended."
