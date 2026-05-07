## Why

Phase 1 (`persistent-projects-table`) 把 Project 變成 first-class entity（可
存 `pinned` / `name override` / `lastOpenedAt`），但 UI **完全沒用上這些 metadata**
— 視覺上跟之前一樣，使用者也無法 pin / rename / remove project。

這個 change 把 Project 區的 UI 升級成 F mockup 的樣子（**只動 project，
不碰 worktree / files / git / spec / terminal**），讓使用者實際感受到資料
持久化的好處：

- Pin 常用 project（開 cc-office 立刻看到，不用滑動）
- Rename 自訂顯示名稱（解 `basename` 不夠語意化的問題）
- Remove 不再需要的 project（清理 list）
- Top scope switcher 提供 ⌘P-style 快速切換

## What Changes

**Client UI**
- `WorkspaceLayout` 上方加 **Top scope switcher**：顯示當前 project，下拉列出全部（Pin 群組在上 / Recent 在下）
- `ProjectList` / `ProjectCard` 重構成 F mockup 樣式：
  - Pin star 按鈕（hover 出現，點 → toggle pinned）
  - 右鍵 / `⋯` button → context menu：Rename / Remove
  - Pinned 在上、Recent 在下兩段排序
- 新增 `RenameProjectDialog`（簡單 input dialog）
- 新增 `RemoveProjectConfirmDialog`（含 active session 警告）

**Client state**
- `ProjectActions` 加 `pinProject(cwd, pinned)` / `renameProject(cwd, name)` / `removeProject(cwd)`
- 都是 async，呼叫 `socket.emit('projects:update' | 'projects:remove')`
- Remove on `project_has_active_sessions` error → toast + dialog 顯示「N session(s) active, close them first」

**不動的東西**
- `ProjectContext` 對外 state shape (`projects: Project[]`) 不變 — 只加 actions
- Sidebar 主結構不變（仍只有 Projects tab，沒有 Files/Git/Spec）
- 中央 Chat / 底部 Terminal — 不動
- Worktree 子層級展開 — 不做（留給後續 change）
- Live sessions overview / Right pane / xterm — 不做

## Capabilities

### Modified Capabilities
- `project-workspace`: project list UI 加上 pin / rename / remove + top scope switcher

## Impact

**新增檔案**
- `apps/web/src/components/TopScopeSwitcher.tsx`（新 + stories + test）
- `apps/web/src/components/RenameProjectDialog.tsx`（新 + stories + test）
- `apps/web/src/components/RemoveProjectConfirmDialog.tsx`（新 + stories + test）

**修改檔案**
- `apps/web/src/contexts/ProjectContext.tsx` — `Project` 型別加 `pinned/lastOpenedAt`；actions 加 `pin/rename/remove`
- `apps/web/src/contexts/__tests__/ProjectContext.test.tsx` — 新增 actions tests
- `apps/web/src/components/ProjectList.tsx` — Pin/Recent 分組
- `apps/web/src/components/ProjectCard.tsx` — pin star + ⋯ menu trigger
- `apps/web/src/components/ProjectContextMenu.tsx` — 加 Rename / Remove items
- `apps/web/src/components/WorkspaceLayout.tsx` — 在 top 區渲染 `TopScopeSwitcher`
- `apps/web/src/components/__tests__/...` — 對應 component tests

**Server / Shared**
- 完全不動 — 後端 endpoints (`projects:update`/`projects:remove`) 在 Phase 1 已實作完成

## Open questions（implement 階段確認）

1. Top scope switcher 點 project → 切 active project + 是否同時 navigate？
2. Pinned 多個時要「拖曳排序」嗎？（建議先不做，pin = boolean，按 lastOpenedAt 排）
3. Color picker UI 要不要做？（建議不做，schema 有 `color` 欄但 UI 留空）
4. Remove 失敗（有 active session）→ dialog 顯示哪些 session？還是只顯示 count？
