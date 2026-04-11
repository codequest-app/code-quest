## Context

ProjectContext 目前 import `useTabActions` + `useTabState`，在 `addProject()` 裡呼叫 `createNewTab()`，在 `setActiveProject()` 裡呼叫 `setActiveTab()`。這讓 ProjectContext 無法獨立測試（需要 TabProvider wrapper）。

## Goals / Non-Goals

**Goals:**
- ProjectContext 零依賴 TabContext
- 協調邏輯在 WorkspaceLayout（component 層）
- 兩個 context 可獨立測試
- 改動最小，不改 provider nesting

**Non-Goals:**
- 不改 TabContext
- 不改 ChannelProvider
- 不改 provider nesting 順序

## Decisions

### D1: ProjectContext 只管 project 狀態

```typescript
// Before
function addProject(cwd) {
  setProjects(prev => [...prev, { cwd, name }]);
  setActiveProjectCwd(cwd);
  createNewTab({ cwd });     // ← 移除
}

// After
function addProject(cwd) {
  setProjects(prev => [...prev, { cwd, name }]);
  setActiveProjectCwd(cwd);
  // 不做 tab 操作 — 由 caller 處理
}
```

### D2: WorkspaceLayout 協調

```typescript
// WorkspaceLayout
function handleAddProject(cwd) {
  addProject(cwd);           // ProjectContext
  createNewTab({ cwd });     // TabContext
  setDialogOpen(false);
}

function handleSwitchProject(cwd) {
  // Save current tab
  if (activeProjectCwd && activeTabId) {
    savedTabs.current.set(activeProjectCwd, activeTabId);
  }
  setActiveProject(cwd);     // ProjectContext
  const saved = savedTabs.current.get(cwd);
  if (saved) setActiveTab(saved);  // TabContext
}
```

Active tab 記憶移到 WorkspaceLayout（useRef），不在 ProjectContext。

### D3: EditorArea 接收 filter 而非自己讀 ProjectContext

EditorArea 不再 import ProjectContext。filter 由 WorkspaceLayout 傳 props 或 EditorArea 自己讀 ProjectContext 的 activeProjectCwd（保持現狀也可接受）。

## Risks / Trade-offs

### [Trade-off] 協調邏輯在 component 裡
WorkspaceLayout 多了 2 個函式。但邏輯簡單（各 2-3 行），不構成 "fat component" 問題。
