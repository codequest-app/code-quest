## 1. Server: 所有 session events 帶 cwd

- [x] 1.1–1.7 TDD RED: 修改既有 expect → GREEN: server + schema

## 2. Client: TabMeta 加 channelId 欄位

- [x] 2.1–2.6 TDD RED: createNewTab/setChannelId/syncFromServer tests → GREEN: 實作

## 3. ChannelProvider onChange + launch/join

- [x] 3.1–3.4 TDD RED: launch mode test → GREEN: ChannelProvider launch useEffect

## 4. WorkspaceLayout 整合

- [x] 4.1–4.3 TDD RED: WorkspaceLayout tests → GREEN: channelId from TabMeta + onChange

## 5. 清理

- [x] 5.1 移除 duplicate onTitleChange/onStatusChange from WorkspaceLayout
- [x] 5.2 ChannelMessagesProvider: cwd/onTitleChange/onStatusChange → onChange
- [x] 5.3 onWorktree → onNewChannel(cwd)

## 6. Launch 中關 tab — orphan session 防護

- [x] 6.1 TDD RED: ChannelProvider unmount during launch test
- [x] 6.2 TDD GREEN: cancelled flag + session:close on callback
- [x] 6.3 TDD RED: 正常關 tab → 既有 test 覆蓋
- [x] 6.4 TDD GREEN: handleCloseTab 用 tabs[id]?.channelId
- [x] 6.5 Run all tests green (1389)

## 7. Duplicate tab 防護

- [x] 7.1 TDD RED: test "new tab creates exactly one tab, not two"
- [x] 7.2 TDD GREEN: server callback before broadcast + client alreadyExists check
- [x] 7.3 Run all tests green (1389)

## 8. Commit + push

- [x] 8.1 Run all tests green (1389)
- [x] 8.2 Commit + push
