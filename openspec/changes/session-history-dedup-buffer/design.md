## Context

`session-history-improvements` 已實作分批傳輸（`streamSessionHistory`）、isConnecting 狀態、eager resume。本 change 補完去重與 buffer 機制。

## Goals / Non-Goals

**Goals:**
- `seenUuids` 確保同一 uuid 的 `message:assistant` 不論從 history 還是 live stream 來都只出現一次
- `StateBuffer` 確保 live 事件在 join callback 之前不套用到 state，避免 history 與 live 順序錯亂
- 補 server 測試覆蓋多批次 history 傳輸路徑

**Non-Goals:**
- 不修改分批傳輸邏輯（已完成）
- 不處理 stream:chunk 的分段 buffer

## Decisions

**uuid 去重**：
- `ChannelState.seenUuids: Set<string>` 存放已處理的 uuid
- `onMessageAssistant` 檢查 uuid 是否已在 seenUuids，是則跳過並返回 prev state
- `seenUuidsRef`（useRef，useLayoutEffect 同步）供 wireStreamingHandlers 使用
- 避免在 live stream 時因 state 非同步更新而重複顯示

**StateBuffer**：
- pure function `createStateBuffer()` 封裝 buffering 邏輯（方便單元測試）
- `joinSession()` 呼叫 `buffer.start()`
- `router.register` 和 `wireStreamingHandlers` 改用 `bufferedSetChannelState`（透過 `buffer.apply`）
- Join callback 成功/失敗都呼叫 `buffer.drain(setChannelState)`
- `session:history` handler 直接用 `setChannelState`（不經 buffer，history 本身就是正確順序）

## Risks / Trade-offs

- Buffer drain 時機：join callback 在 server 端是同步的（history 批次全 emit 後才 ack），fake socket 的 queueMicrotask 保證 history 先於 callback，所以 drain 時 history 一定已套用完畢
- `seenUuidsRef` 用 `useLayoutEffect` 同步，在 render 完成後才更新，極短暫的 race window 由 seenUuids state 作為備援
