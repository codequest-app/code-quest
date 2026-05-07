# Tab 架構重構方向

## 問題

目前 Tab 是 ChatPanel 的子元件（導航概念），messages/sessionId/status 全局共用，
切換 tab 時 clearMessages → 重新拉 history，是假的 multi-tab。

## 正確方向

**Tab 有多個 ChatPanel，而不是 ChatPanel 內有 TabBar。**

```
TabContainer
  ├── Tab A → ChatPanel A (own messages[], sessionId, status, ...)
  ├── Tab B → ChatPanel B (own messages[], sessionId, status, ...)
  └── Tab C → ChatPanel C (own messages[], sessionId, status, ...)
```

## Store 設計

```typescript
// 現在（錯誤）
{
  sessionId: string | null        // 全局唯一
  messages: Message[]             // 全局唯一
  status: Status
  openTabs: [{ sessionId, title, status }]
  activeTabId: string | null
}

// 應該
{
  tabs: Record<tabId, {
    sessionId: string | null
    messages: Message[]
    status: Status
    stats: ChatStats | null
    pendingControls: PendingControl[]
    // 其他 per-tab 狀態
  }>
  activeTabId: string | null
}
```

## useChat hook

- 現在：全局一個 hook，所有 tab 共用
- 應該：每個 ChatPanel instance 有自己的 `useChat(socket, tabId)`，state 來自 `tabs[tabId]` slice

## chat:event 路由

- 現在：所有事件往全局 messages 塞
- 應該：server event 帶 sessionId → 找對應 tabId → 更新該 tab 的 messages（背景 tab 也保留，只是不顯示）

## Reload 恢復

- 現在：localStorage 只持久化一個 sessionId
- 應該：持久化整個 tabs map（各 tab 的 sessionId）→ reload 後每個 tab 都能 rejoin 自己的 session

## 已知問題（待 Tab 重構後一併修正）

### resumeSession 沒有載入 history

`resumeSession`（從 session list 或切換 tab 觸發）流程：
1. `clearMessages()`
2. `chat:join` 成功 → `setSessionId` + `setStatus('idle')` → **結束，畫面空白**
3. `chat:join` 失敗 → fallback `chat:create --resume` → 同樣沒有 history

`chat:history` 只在 `onConnect` 裡有，`resumeSession` 是獨立路徑，未接上。

### 為什麼不現在修

- 問題根源是沒有 per-tab messages cache，補 `chat:history` 只是 workaround
- Tab 重構後每個 ChatPanel 有自己的 messages，`useChat(socket, tabId)` 初始化時
  自然走 join → history，`resumeSession` 本身可能就不需要存在
- 現在修是在舊架構貼補丁，Tab 重構時還要再改一次

## 實作順序

1. Kill — 獨立功能，不影響架構
2. Tab 重構 — per-tab state，useChat per-tab，chat:history 自然整合
3. resumeSession / history — Tab 重構後自然解決
