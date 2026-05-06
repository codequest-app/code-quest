## Context

`session:history` 事件機制已完成（`7d05affe`）：server 在 client join 時 emit 所有歷史事件，client 用相同的 handler 重播。目前缺少三項改進：分批傳輸、uuid 去重、join 期間的 live 事件緩衝。

## Goals / Non-Goals

**Goals:**
- historyBatchSize 可設定，預設 1000（避免 payload 過大）
- `seenUuids` 確保同一 uuid 的 `message:assistant` 不論從 history 還是 live stream 來都只出現一次
- `StateBuffer` 確保 live 事件在 join callback 之前不套用到 state，避免 history 與 live 順序錯亂

**Non-Goals:**
- 不修改 result divider 顯示邏輯（另外的 issue）
- 不處理 stream:chunk 的分段 buffer（streaming 本身已有 wasStreamedViaDelta 保護）

## Decisions

**分批傳輸**：server 用 `historyBatchSize` 控制每批 event 數量，連續 emit 多個 `session:history` 事件。Client 的 handler 每批都執行 reduce，不重置既有 messages。

**uuid 去重**：
- `ChannelState.seenUuids: Set<string>` 存放已處理的 uuid
- History handler 的 `onMessageAssistant` 檢查並更新 `seenUuids`
- `wireStreamingHandlers` 透過 `seenUuidsRef`（useRef，與 state 同步）做同樣的檢查，避免 live 事件重複

**StateBuffer**：
- pure function `createStateBuffer()` 封裝 buffering 邏輯（方便單元測試）
- `joinSession()` 呼叫 `buffer.start()`
- `router.register` 和 `wireStreamingHandlers` 改用 `bufferedSetChannelState`（透過 `buffer.apply`）
- Join callback 成功/失敗都呼叫 `buffer.drain(setChannelState)`
- `session:history` handler 直接用 `setChannelState`（不經 buffer）

## Risks / Trade-offs

- Buffer drain 時機：join callback 在 server 端是同步的（history 批次全 emit 後才 ack），fake socket 的 queueMicrotask 保證 history 先於 callback，所以 drain 時 history 一定已套用完畢
- `seenUuidsRef` 用 `useLayoutEffect` 同步，在 render 完成後才更新，極短暫的 race window 由 seenUuids state 作為備援
