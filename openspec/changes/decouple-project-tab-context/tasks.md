## 1. ProjectContext 解耦

- [ ] 1.1 ProjectContext 移除 `useTabActions` / `useTabState` import
- [ ] 1.2 `addProject()` 只做 setProjects + setActiveProjectCwd，不呼叫 createNewTab
- [ ] 1.3 `setActiveProject()` 只做 setActiveProjectCwd，不呼叫 setActiveTab，移除 activeTabPerProject ref
- [ ] 1.4 ProjectContext 測試簡化：不需要 TabProvider / SocketProvider wrapper
- [ ] 1.5 ProjectContext 測試驗證：addProject 不觸發 tab 操作

## 2. WorkspaceLayout 協調

- [ ] 2.1 WorkspaceLayout 加入 `useTabActions` 的 `createNewTab` / `setActiveTab`
- [ ] 2.2 `handleAddProject(cwd)`：呼叫 addProject + createNewTab
- [ ] 2.3 `handleSwitchProject(cwd)`：儲存當前 active tab、呼叫 setActiveProject、還原目標 project 的 active tab
- [ ] 2.4 active tab 記憶用 `useRef<Map>` 放在 WorkspaceLayout
- [ ] 2.5 WorkspaceLayout 測試驗證協調邏輯

## 3. 驗證

- [ ] 3.1 全套 unit tests 通過
- [ ] 3.2 Playwright：add project → tab 建立、multi-project 切換
