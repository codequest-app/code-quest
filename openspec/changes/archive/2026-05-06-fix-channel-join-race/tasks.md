## 1. 補測試重現 race condition

- [x] 1.1 新增測試：mode='new' 時 session:join 不會在 session:launch callback 回來前被送出
- [x] 1.2 確認現有測試全部通過（baseline）

## 2. 重構 ChannelContext status state machine

- [x] 2.1 將 `launchOnMount` boolean 改為 `mode: SessionMode`（'new' | 'resume'），四段 status（connecting | ready | connected | error），launch 成功後切到 `ready`，resume 路徑初始為 `ready`
- [x] 2.2 UI 顯示邏輯：connecting/ready 顯示 SpinnerVerb，connected 顯示 children，error 顯示 EmptyState
- [x] 2.3 `onJoinComplete` callback 改名為 `onJoinSettled`（success 和 error 都觸發）

## 3. 重構 ChannelMessagesProvider

- [x] 3.1 新增 `readyToJoin` boolean prop，僅在 `readyToJoin === true` 時 fire `joinSession`
- [x] 3.2 移除內部 `isConnecting` state，connecting 顯示由外層控制
- [x] 3.3 移除 MessageList 的 isConnecting 依賴

## 4. 驗證

- [x] 4.1 所有現有測試 expect 不變或等價，全部通過
- [x] 4.2 code review + simplify 通過
