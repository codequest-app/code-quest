## 1. SidebarContext

- [ ] 1.1 建立 `SidebarContext`（`activePanel: string | null` + `setActivePanel`），提供 `useSidebar` hook
- [ ] 1.2 在 WorkspaceLayout 中 provide SidebarContext，將原本的 `activePanel` local state 搬進去
- [ ] 1.3 ActivityBar 和 FileExplorerPanel 改用 `useSidebar()` 取代 props
- [ ] 1.4 為 SidebarContext 撰寫測試：toggle 行為、re-click 同一 panel 收合、outside provider throws

## 2. Session History Panel — 分組邏輯

- [ ] 2.1 建立 `groupSessionsByProject` utility function：接收 `SessionSummary[]`，回傳 `Map<string, SessionSummary[]>`（key = cwd or '(no project)'），groups 按 path 字母排序，sessions 按 createdAt 降序
- [ ] 2.2 為 `groupSessionsByProject` 撰寫測試：正常分組、無 cwd 歸入 (no project)、排序正確

## 3. Session History Panel — Component

- [ ] 3.1 建立 `SessionHistoryPanel` component：panel 可見時 fetch `listSessions({ limit: 100 })`，顯示 loading state
- [ ] 3.2 實作分組 accordion UI：project header 單擊展開/收合、session 列表顯示 title + createdAt + active indicator
- [ ] 3.3 實作搜尋過濾：search input 過濾 sessions by title/id，空 group 隱藏
- [ ] 3.4 實作 refresh button：重新 fetch sessions
- [ ] 3.5 實作 double-click session → 開新 tab + resume session
- [ ] 3.6 實作 double-click project header → `createNewTab({ cwd })`
- [ ] 3.7 實作右鍵 context menu：Resume / Rename / Delete（復用 `useSession` 的 rename/delete）

## 4. 整合 ActivityBar

- [ ] 4.1 在 WorkspaceLayout 的 ActivityBar items 新增 History entry（id: 'history', icon: 🕐）
- [ ] 4.2 sidebar panel render 新增 `activePanel === 'history' && <SessionHistoryPanel />`

## 5. 測試

- [ ] 5.1 SessionHistoryPanel unit test：fetch on open、分組 render、search filter、loading state
- [ ] 5.2 SessionHistoryPanel interaction test：double-click session resume、double-click project header 開 tab、right-click context menu
- [ ] 5.3 Integration test：ActivityBar History icon toggle、sidebar 切換 Explorer ↔ History
