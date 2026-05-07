## Why

ProjectContext 直接呼叫 TabContext 的 `createNewTab()` 和 `setActiveTab()`，造成兩個 context 緊耦合。「加 project 後開 tab」是 UI 行為，不是 project 的 domain 邏輯。應由 component 層（WorkspaceLayout）協調。

## What Changes

- ProjectContext 移除對 TabContext 的依賴（不再 import `useTabActions`/`useTabState`）
- ProjectContext 只管 project list + active project
- WorkspaceLayout 負責協調：addProject → createNewTab，switchProject → setActiveTab
- EditorArea 的 tab filtering 邏輯搬到 WorkspaceLayout 或由 props 傳入
- Provider nesting 不變，測試不需要改 wrapper 順序

## Capabilities

### New Capabilities

### Modified Capabilities
- `project-workspace`: ProjectContext 移除 TabContext 依賴，協調邏輯移到 WorkspaceLayout

## Impact

- `apps/web/src/contexts/ProjectContext.tsx` — 移除 TabContext import + 呼叫
- `apps/web/src/components/WorkspaceLayout.tsx` — 加入協調邏輯
- `apps/web/src/components/EditorArea.tsx` — tab filtering 可能調整
- `apps/web/src/contexts/__tests__/ProjectContext.test.tsx` — 簡化（不需要 TabProvider）
