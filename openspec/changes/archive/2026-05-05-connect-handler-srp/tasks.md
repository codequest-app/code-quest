## 1. 拆 applyInitResponseAndBroadcast

- [x] 1.1 抽出 `parseInitResponse(response)` pure function
- [x] 1.2 抽出 `persistModels(settingsStore, models)` — 命名反映持久化職責
- [x] 1.3 確認 `applyInitResponseAndBroadcast` 變成純 orchestration，不含 detail 邏輯

## 2. 拆 finalizeAndNotify

- [x] 2.1 抽出 `ackAndBroadcastCreated(channel, socket, callback, result)` — 封裝 ack + broadcastAll
- [x] 2.2 函式名稱更新為如實反映行為
- [x] 2.3 確認所有 session-connect 測試 expect 不變

## 3. 拆 handleResume

- [x] 3.1 抽出 `resolveResumeCwd(session, opts)` pure function
- [x] 3.2 抽出 `resolveResumeProjectRoot` 步驟函式
- [x] 3.3 確認 handleResume 降至 orchestration 層，無 detail 邏輯

## 4. onSessionInit 職責分離

- [x] 4.1 評估 broadcast / DB upsert / project upsert 是否可各自獨立（event-driven）
      > 結論：不拆。三步驟共用 projectRoot，拆成 event-driven 增加 wiring 複雜度無實質收益。onSessionInit 維持現狀。
- [x] 4.2 實作分離（不適用，評估結論為維持）
- [x] 4.3 確認所有測試通過
