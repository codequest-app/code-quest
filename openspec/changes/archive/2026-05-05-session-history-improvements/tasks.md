## 1. Server: Configurable batch size

- [x] 1.1 `apps/server/src/config.ts` — `historyBatchSize` 預設改為 1000
- [x] 1.2 `apps/server/.env.example` / `.env` — 加入 `SESSION_HISTORY_BATCH_SIZE=1000` 說明

## 2. Server: Multi-batch history emit

- [x] 2.1 `session:history` 改為分批 emit（cursor-based），超過 historyBatchSize 的事件拆成多個 batch
      > 2.2 multi-batch test、seenUuids 去重、StateBuffer 移至 session-history-dedup-buffer change

## 5. Client: isConnecting state + scroll fix

- [x] 5.1 `ChannelMessagesValue` 加入 `isConnecting: boolean`，`MessagesStateValue` Pick 同步更新
- [x] 5.2 `ChannelMessagesContext` 加入 `isConnecting` useState（初始 true）
       - join useEffect 重跑時 reset 為 true
       - `onJoinSuccess`（原 `applyJoinSnapshot`）設為 false
       - `recordJoinError` 設為 false
       - 加入 context value
- [x] 5.3 將 `applyJoinSnapshot` 重新命名為 `onJoinSuccess`
- [x] 5.4 `MessageList` 消費 `isConnecting`：
       - `isConnecting` 期間所有 scroll behavior 改為 `instant`
       - `isConnecting` → false 時強制 instant scroll to bottom
- [x] 5.5 `MessageList` loading UI：`messages.length === 0 && isConnecting` 時，沿用 empty state 的 ✦ + "CC Office" 風格，文字改為 "Connecting…" 並加 `animate-pulse`
- [x] 5.6 補 client 測試：isConnecting 在 join 完成後變為 false，scroll 行為正確

## 7. Client: MessageList virtualizer layout fix

根本問題：`SpinnerVerb` 放在 `height: totalSize; position: relative` 容器之後（正常文件流），但 VirtualItem 是 `position: absolute`。當 totalSize 因測量延遲偏小時：
- SpinnerVerb 位置錯誤（視覺上疊進最後一個 item）
- Item 內容超出容器被 ancestor overflow clip 掉（切換 tab 才恢復）

Fix：將 `SpinnerVerb` 移到 `<section aria-label="message-content-wrapper">` 外部。

- [x] 7.1 RED: 加測試 — `SpinnerVerb` 不在 `message-content-wrapper` section 的 DOM 子樹內
- [x] 7.2 GREEN: `MessageList.tsx` 將 `{isProcessing && <SpinnerVerb />}` 移到 `</section>` 之後
- [x] 7.3 確認所有測試全綠

## 6. Server: resume tab 立刻出現（eager create）

根本問題：`channelManager.create()` 內部 `await channel.sendRequest('session:initialize')` 需要等 CLI 完整啟動（--resume 可能需數秒），導致 `session:created` 和 ack 都延遲。

Fix 方向：拆分 create 的兩個階段，讓 `session:created` + ack 在 CLI init 前就發出，join 再等 ready。

- [x] 6.1 `Channel` 加入 `readyPromise: Promise<void>`，預設為 `Promise.resolve()`；新增 `setReadyPromise(p: Promise<void>)` 
- [x] 6.2 `ChannelManager` 新增 `createEager(channelId, opts)` — 同步 setup + spawn，不 await sendRequest；把 initResultPromise 存進 `channel.readyPromise`；回傳 `{ channel, initResultPromise: Promise<ControlResponse> }`
- [x] 6.3 `handleResume` 改用 `createEager`：spawn 後立刻 `broadcastAll(session:created)` + `callback(ok(...))`，initResultPromise 在背景跑 `applyInitResponseAndBroadcast` + `updateMetaCache`
- [x] 6.4 `handleJoin` 取到 channel 後加 `await channel.readyPromise`，確保 history replay 在 CLI init 完成後才開始
- [x] 6.5 補 server 測試：`session:created` 在 CLI 還沒回應時就已廣播（slow-CLI 情境）
- [x] 6.6 補 server 測試：`session:join` 在 `readyPromise` resolve 之後才回傳 ack
