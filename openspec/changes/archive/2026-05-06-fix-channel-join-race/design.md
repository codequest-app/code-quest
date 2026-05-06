## Context

`ChannelContext` 負責管理 channel 的生命週期。目前 `mode='new'` 時，`ChannelContext` 發 `session:launch` 同時 always render `ChannelMessagesProvider`，後者在 mount 時立即發 `session:join`。因為 launch 是 async，join 先到 server 時 channel 尚未建立，導致 "Session not found"。

舊版在 `connecting` 狀態時 early return 不 render provider tree，但為了讓 join 過程也顯示 connecting spinner，改為 always render，引入了這個 race condition。

## Goals / Non-Goals

**Goals:**
- 消除 launch/join race condition，new session 正常運作
- 統一 connecting 狀態管理，launch 和 join 階段都顯示 spinner
- 移除 `ChannelMessagesProvider` 內部的 `isConnecting`，由外層 status 統一控制
- TDD 重構：所有現有測試 expect 保持不變或等價

**Non-Goals:**
- 不改 server 端邏輯
- 不改 socket event protocol
- 不改 TabContext 或 SessionContext

## Decisions

1. **四段 status state machine**：`connecting → ready → connected → error`
   - `connecting`：launch 進行中（僅 mode='new' 路徑）
   - `ready`：channel 已建立，可以 join（launch 成功 or resume 路徑初始值）
   - `connected`：join 完成，顯示 children
   - `error`：launch 失敗
   - Why：比加額外 boolean 更語義化

2. **`mode: SessionMode` 取代 `launchOnMount: boolean`**：
   - `'new'`：client 透過 session:launch 建立新 session
   - `'resume'`：server 已有 channel，直接 join
   - Why：union type 比 boolean 語意更明確

3. **ChannelMessagesProvider 用 `readyToJoin` prop 控制 join 時機**：
   - 接收 `readyToJoin` boolean prop，僅在 `true` 時 fire `joinSession`
   - Why：單一來源控制，不再需要內部 `isConnecting`

4. **`onJoinSettled` callback**：
   - join success 和 error 都觸發，外層根據自己的 error state 決定是否轉 connected
   - Why：語意準確反映 callback 在兩種結果都會觸發

5. **UI 顯示邏輯**：
   - `connecting` / `ready`：外層顯示 SpinnerVerb
   - `connected`：render children
   - `error`：顯示 EmptyState + Retry

## Risks / Trade-offs

- `ready` 狀態名稱可能讓人誤以為是「完全可用」，但實際語意是「已準備好可 join」。可接受，搭配 `readyToJoin` prop 使用時意圖清楚
- 移除 isConnecting 需確認沒有其他地方依賴它（TypeScript 編譯已保證）
