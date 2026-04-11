## 1. ProjectContext — 狀態管理

- [x] 1.1 建立 `ProjectContext` + `useProjectState()` + `useProjectActions()` + 測試
- [x] 1.2 State：`projects: Map<string, Project>`、`activeProjectCwd: string | null`
- [x] 1.3 Actions：`setActiveProject(cwd)`、`addProject(cwd)` — addProject 建立第一個 tab 並設為 active
- [x] 1.4 從 `session:states` 推導 projects（group by cwd）
- [x] 1.5 切換 project 時記住每個 project 的 active tab，切回時還原

## 2. ProjectCard + ProjectList — sidebar component

- [x] 2.1 建立 `ProjectCard` component + 測試：顯示 project name，active 有 accent border，點擊呼叫 onSelect
- [x] 2.2 建立 `ProjectList` component + 測試：列出 ProjectCards + `[＋ Add]` 按鈕，onAdd callback
- [x] 2.3 整合到 `WorkspaceLayout` sidebar — 取代 FileExplorerPanel

## 3. AddProjectDialog — 選目錄 dialog

- [x] 3.1 建立 `AddProjectDialog` component + 測試：modal overlay、DirectoryTree、Cancel/Open 按鈕
- [x] 3.2 DirectoryTree 選中目錄後 highlight + 顯示路徑 + Open 按鈕
- [x] 3.3 double-click 目錄呼叫 `addProject(selectedCwd)` + close dialog
- [x] 3.4 Cancel 關閉 dialog，不做任何事

## 4. Empty State — 首次使用

- [x] 4.1 建立 `EmptyState` component + 測試：無 project 時顯示大按鈕 "Add Project"
- [x] 4.2 點擊 "Add Project" 開啟 AddProjectDialog
- [ ] 4.3 整合到 WorkspaceLayout — 無 active project 時顯示 EmptyState（需重新設計 init flow，暫未啟用）

## 5. WorkspaceLayout + EditorArea 調整

- [x] 5.1 WorkspaceLayout sidebar 改為 ProjectList（取代 FileExplorerPanel）
- [x] 5.2 EditorArea 的 TabBar 只顯示 active project 的 tabs
- [x] 5.3 EditorArea 的 `[+]` new tab 使用 active project 的 cwd
- [x] 5.4 ActivityBar icon 從 Explorer 改為 Projects

## 6. 整合驗證

- [x] 6.1 Playwright：Add → 選目錄 → project 出現 → tab 開啟
- [x] 6.2 Playwright：多 project 切換 → tab group 切換 → 切回還原
- [x] 6.3 全套 unit tests 通過（750 pass + 2 skipped + 4 todo）
