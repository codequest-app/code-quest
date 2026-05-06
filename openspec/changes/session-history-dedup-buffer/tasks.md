## 1. Server: Multi-batch history test

- [ ] 1.1 補 server 測試：historyBatchSize=1 時多批次都能完整傳送

## 2. Client: seenUuids deduplication

- [ ] 2.1 `ChannelState` 加入 `seenUuids: Set<string>`，`initialChannelState` 初始化為 `new Set()`
- [ ] 2.2 `onMessageAssistant`（handlers/message.ts）加入 uuid 檢查與記錄
- [ ] 2.3 `ChannelMessagesContext` 加入 `seenUuidsRef`，與 `state.seenUuids` 同步
- [ ] 2.4 `wireStreamingHandlers` 接受 `seenUuidsRef`，live `onMessageAssistant` 也做 uuid 去重
- [ ] 2.5 補 client 測試：同一 uuid 從 history 後再從 live stream 來只顯示一條

## 3. Client: StateBuffer

- [ ] 3.1 新增 `handlers/state-buffer.ts`（`createStateBuffer` pure function）
- [ ] 3.2 補單元測試 `handlers/__tests__/state-buffer.test.ts`（7 個測試）
- [ ] 3.3 `ChannelMessagesContext` 接入 buffer：`joinSession` start/drain，router 與 wireStreamingHandlers 改用 bufferedSetChannelState
