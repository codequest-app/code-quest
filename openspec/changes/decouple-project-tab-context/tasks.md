## 1. TabProvider 與 socket 解耦（expect 不變）

- [x] 1.1 TabProvider 的 socket 監聽（app:init, session:created/dead/resume）搬到獨立 hook `useSessionSync`
- [x] 1.2 `useSessionSync` 呼叫 TabActions（syncFromServer, addTab, removeTab, replaceActiveTab）— 行為與搬前完全一致
- [x] 1.3 `useSessionSync` 放在 App.tsx（SessionSync component 在 TabProvider 內）+ test helpers
- [x] 1.4 TabProvider 移除 socket 依賴（不再 import useSocket, 不再監聽 socket events）
- [x] 1.5 TabProvider 測試不動（全部 expect 不變，用 initialState 的路徑不受影響）
- [x] 1.6 全套 unit tests 通過（741 passed）

## 2. ProjectContext 解耦（expect 不變）

- [x] 2.1 ProjectContext 移除 `useTabActions` / `useTabState` import
- [x] 2.2 `addProject()` 只做 setProjects + setActiveProjectCwd，不呼叫 createNewTab
- [x] 2.3 `setActiveProject()` 只做 setActiveProjectCwd，不呼叫 setActiveTab，移除 activeTabPerProject ref
- [x] 2.4 WorkspaceLayout 協調：handleAddProject 呼叫 addProject + createNewTab，handleSwitchProject 記憶/還原 active tab
- [x] 2.5 ProjectContext 測試簡化 wrapper（移除 TabProvider），expect 不變
- [x] 2.6 全套 unit tests 通過（741 passed）

## 3. ProjectProvider 接管 sessions（需求變更，expect 可更新）

- [x] 3.1 Server: broadcastSessionState 補 cwd，schema cwd 改 optional
- [x] 3.2 Nesting 翻轉：App.tsx 改為 Session → Project → Tab
- [x] 3.3 ProjectProvider 監聯 app:init + session:created/dead/states，持有 sessions[]
- [x] 3.4 ProjectProvider 從 sessions 推導 projects（group by cwd）
- [x] 3.5 useSessionSync 讀 ProjectProvider sessions → sync TabContext（橋接 component）
- [ ] 3.6 移除 useSessionSync：將 tab sync 邏輯合併到 ProjectProvider 內部（待 per-project 階段）
- [x] 3.7 syncFromServer 帶入 cwd（TabMeta 從 sessions 取 cwd）— expect 更新：does not store cwd → stores cwd
- [x] 3.8 useSessionSync 改為 incremental addTab/removeTab（不用 syncFromServer 避免 destructive replace）
- [x] 3.9 全套 unit tests 通過（741 passed）

## 4. 驗證

- [x] 4.1 全套 unit tests 通過（server 435 + client 741）
- [ ] 4.2 reload 後 tabs 保留 cwd、project list 正確還原（手動驗證）
