## 1. WorkspaceLayout 接 defaultCwd prop

- [x] 1.1 WorkspaceLayout.test 改用 renderWithWorkspace（移除 mock，對齊 production 流程）
- [x] 1.2 WorkspaceLayout 加 `defaultCwd` prop
- [x] 1.3 App.tsx 傳 `defaultCwd={config.defaultCwd}` 給 WorkspaceLayout
- [x] 1.4 renderWithWorkspace 傳 `defaultCwd` 給 WorkspaceLayout

## 2. fallback EditorArea → EmptyState

- [x] 2.1 EmptyState 加 `onNewTab` prop（"New Session" 按鈕 + data-testid）
- [x] 2.2 WorkspaceLayout fallback 改成 `<EmptyState onNewTab={...} />`，onNewTab 呼叫 `addProject(defaultCwd)`
- [x] 2.3 renderWithWorkspace 先點 EmptyState 再點 New tab
- [x] 2.4 TabContext.test tab bar UI tests — 先點 EmptyState 再操作
- [x] 2.5 title-from-messages.test — 先點 EmptyState 再操作
- [x] 2.6 App.test — expect 改為沒 project 時顯示 EmptyState 而非 TabBar

## 3. 移除外層 TabProvider

- [x] 3.1 App.tsx 移除外層 TabProvider
- [x] 3.2 DocumentTitle 移到 WorkspaceLayout（讀 ProjectContext sessions state）
- [x] 3.3 renderWithWorkspace 移除外層 TabProvider
- [x] 3.4 確認所有 test pass

## 4. TabProvider defaultCwd → cwd

- [x] 4.1 TabProvider prop `defaultCwd` 改名為 `cwd`
- [x] 4.2 WorkspaceLayout 傳 `cwd={project.cwd}` 給 per-project TabProvider
- [x] 4.3 createNewTab 用 TabProvider 的 `cwd`
- [x] 4.4 沒 project 時沒有 TabProvider → 無法 createNewTab

## 5. EmptyState 簡化為只有 Add Project

- [x] 5.1 EmptyState 移除 `onNewTab` prop，只保留 `onAddProject`
- [x] 5.2 WorkspaceLayout 的 EmptyState 改成開 AddProjectDialog
- [x] 5.3 移除 WorkspaceLayout 的 `defaultCwd` prop
- [x] 5.4 移除 App.tsx 傳的 `defaultCwd`
- [x] 5.5 renderWithWorkspace 改成先點 "Add Project" → 選 cwd → 再點 "New tab"
- [x] 5.6 TabContext.test tab bar UI — 同步更新 setup
- [x] 5.7 App.test — expect EmptyState 有 "Add Project" 按鈕
- [x] 5.8 確認所有 test pass

## 6. 沒 project 時只顯示 EmptyState

- [ ] 6.1 WorkspaceLayout 在 `projects.length === 0` 時不 render ActivityBar 和 sidebar
- [ ] 6.2 只 render EmptyState + AddProjectDialog
- [ ] 6.3 更新相關測試
