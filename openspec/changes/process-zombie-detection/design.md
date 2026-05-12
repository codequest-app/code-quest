## Context

Server 用 channel.ts 管理 CLI process。`_isProcessing` flag 在 `startProcessing()` 設 true，只在 `message:result` 事件時 `endProcessing()` 設 false。CLI process 的 `onExit` handler（line 367-374）reject pending control requests 但不 reset `_isProcessing`。

Client 端 `cancelling` 狀態沒有 timeout，`processing` 也只靠 `message:result` 結束。

## Goals / Non-Goals

**Goals:**
- CLI process 意外退出時，server 自動 reset `_isProcessing` 並通知 client
- Client `cancelling` 狀態有 timeout fallback
- UI 不會永遠卡在 spinner

**Non-Goals:**
- 不做 process health check / heartbeat ping（太複雜）
- 不做自動重啟 process

## Decisions

### 1. Server: onExit 合成 result

在 channel.ts 的 `onExit` handler 裡：如果 `_isProcessing === true`，合成一個 `message:result(isError=true)` 事件送給 client，然後 `endProcessing()`。這樣 client 的 `onResult` handler 會正常把 status 轉為 idle + 顯示 error。

### 2. Client: cancelling timeout

在 abort() 設定 `cancelling` 後，啟動 15s timeout。超時後強制 status → idle + 顯示 error message「Request timed out」。如果 `message:result` 先到就清 timeout。

### 3. session:closed 清 status

`session:closed` event 已存在（status → disconnected），確認它也清除 cancelling/processing 相關狀態。

## Risks / Trade-offs

- **[Risk] 合成 result 可能和真實 result 競爭** — 如果 process 死前剛好送出 result，client 可能收到兩個。用 flag guard 避免。
- **[Trade-off] timeout 時長** — 15s 可能太長或太短，先設一個合理值，可配置化留給未來。
