## 1. buildMessagesActions 拆職責

- [x] 1.1 抽出 `registerMessageFeatures(registry, deps)` — 只做 registry.register 呼叫
- [x] 1.2 `buildMessagesActions` 只組裝 actions 物件，呼叫 `registerMessageFeatures`
- [x] 1.3 確認 ChannelContext 測試 expect 不變

## 2. joinSession parse 分離

- [x] 2.1 RED: 為 join response parse 邏輯寫 pure function 測試
- [x] 2.2 GREEN: 抽出 `parseJoinResponse(raw)` pure function
- [x] 2.3 `joinSession` 改用，確認整合測試 expect 不變

## 3. session:history handler 拆職責

- [x] 3.1 抽出 `shouldApplyBatch(replayIdRef, replayId): boolean` — dedup guard
- [x] 3.2 抽出 `applyHistoryBatch(state, events, allHandlers): ChannelState` — pure reducer
- [x] 3.3 補單元測試，確認整合測試 expect 不變

## 4. applyUserContent 拆職責（handlers/message.ts）

- [x] 4.1 抽出 `deduplicateUserMessage(messages, uuid, text)` pure function
- [x] 4.2 抽出 `extractToolResultText(rawContent)` pure function
- [x] 4.3 確認 message handler 測試 expect 不變

## 5. Title 邏輯移出 Provider

- [x] 5.1 移到 TabContent 需曝露 channel messages（增加複雜度），改抽成 `useTitleFromFirstMessage` hook
- [x] 5.2 抽出 hook，Provider useEffect 移除（改呼叫 hook）
- [x] 5.3 確認測試通過（16 tests passed）
