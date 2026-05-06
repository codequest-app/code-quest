## 1. ChannelProvider: 永遠 render provider tree，只替換 children

- [ ] 1.1 RED: ChannelContext.test — resume join test（SpinnerVerb before ACK, children after ACK）
- [ ] 1.2 GREEN: ChannelProvider 改為永遠 render provider tree
  - `launchOnMount=false` 初始 `status='connecting'`
  - useEffect 發 `session:join`，ACK → `connected`
  - connecting 時 `{content}` = SpinnerVerb，connected 時 = children
  - error 時 = EmptyState（launch path 保留 retry）
- [ ] 1.3 REFACTOR: 清理 launch path，統一 content 替換邏輯

## 2. ChannelMessagesProvider: 移除 join 邏輯

- [ ] 2.1 移除 `joinSession()` / `onJoinSuccess()` / `recordJoinError()`
- [ ] 2.2 移除 join useEffect（保留 subscribeSessionStates）
- [ ] 2.3 `joinedRef` 移除或改為由 ChannelProvider 傳入
- [ ] 2.4 `isConnecting` useState 保留（供 scroll behavior），初始改為 false

## 3. MessageList / ChatView: 移除 connecting UI

- [ ] 3.1 MessageList 移除 `isConnecting` SpinnerVerb 判斷（保留 scroll behavior）
- [ ] 3.2 ChatView 不再隱藏 input area（已被 ChannelProvider gate）

## 4. 測試更新

- [ ] 4.1 ChannelContext.test: 加 resume join tests
- [ ] 4.2 session-history.test: isConnecting tests 調整
- [ ] 4.3 MessageList.test: resume connecting test 調整
- [ ] 4.4 全部 test pass
