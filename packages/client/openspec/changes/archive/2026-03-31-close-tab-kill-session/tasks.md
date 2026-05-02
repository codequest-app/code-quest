## Close Tab = Kill Session

> 目前 Close Tab 只移除前端 tab，CLI process 變成 orphan。
> Kill button 在 HeaderBar，和 Close Tab 是兩個獨立操作。
> 合併：Close Tab = confirm → session:close（kill process）+ removeTab。
> close 在 WorkspaceLayout 用 useSocket().emit，channelId = tab id。

---

### 1. WorkspaceLayout — handleCloseTab

- [ ] 1.1 WorkspaceLayout 加 `handleCloseTab(id)` — `socket.emit('session:close', { channelId: id })` + `removeTab(id)`
- [ ] 1.2 `onCloseTab={removeTab}` → `onCloseTab={handleCloseTab}`
- [ ] 1.3 測試：close tab emit session:close + 移除 tab

### 2. TabBar — confirm dialog

- [ ] 2.1 TabBar ✕ 按鈕點擊後顯示 confirm（不直接 close）
- [ ] 2.2 Confirm → 呼叫 onCloseTab
- [ ] 2.3 Cancel → 取消
- [ ] 2.4 測試：confirm flow

### 3. 移除 Kill button

- [ ] 3.1 HeaderBar 移除 KillButton component
- [ ] 3.2 更新 HeaderBar tests（移除 kill 相關 test case 或改 expect）
- [ ] 3.3 ChannelMessagesContext 的 kill action 保留（server 也用，不只 UI）
