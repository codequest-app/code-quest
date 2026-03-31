# Tasks: cross-window-processing-sync

- [x] Task 1: ChannelMessagesContext 監聯 session:states 更新 status
  - joinedRef gate: 忽略 initial join 前的 broadcast
  - state 'busy' → 'busy', 'idle' → 'idle', 'exited' → 'disconnected'
  - 不覆蓋 processing/cancelling

- [x] Task 2: 驗證 busy/idle sync
  - TDD: session:states busy → Stop 出現, idle → Send 回來

- [x] Task 3: 合併 session:join 和 session:states 到同一個 useEffect
  - joinedRef 在同一個 closure 內管理，避免跨 effect 共享 mutable ref
  - TDD: 現有測試不改 expect

- [x] Task 4: renderWithWorkspace 回傳 channelId
  - renderWithWorkspace result 加 channelId
  - 測試不再需要 socket.on('session:init') hack
  - TDD: 更新測試使用 channelId
