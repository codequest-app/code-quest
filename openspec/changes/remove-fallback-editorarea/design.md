## Context

目前 WorkspaceLayout 有 fallback path：`projects.length === 0` 時直接 render `<EditorArea />`，使用 App.tsx 的外層 TabProvider。這條路徑不走 sessions sync，行為跟有 project 時不一致。

## Goals / Non-Goals

**Goals:**
- 所有 tab 統一走 project → TabProvider(sessions) → EditorArea
- 點 + 時自動建 project（從 session cwd 推導，已有 `deriveProjects` 邏輯）
- 沒 project 時顯示 empty state 或自動 launch

**Non-Goals:**
- 不改 server 端邏輯
- 不改 socket event schema

## Decisions

### 1. 移除 fallback EditorArea 和外層 TabProvider

App.tsx 不再包 TabProvider。WorkspaceLayout 不再有 `projects.length === 0 && <EditorArea />`。所有 EditorArea 都在 project loop 裡。

### 2. 沒 project 時自動 launch session

WorkspaceLayout 在 `projects.length === 0` 且無 active session 時，自動觸發 session launch（帶 defaultCwd）。Server 回 `session:created` 帶 cwd → `deriveProjects` 建 project → UI 自動顯示。

### 3. DocumentTitle 搬到 project 內或改用不同機制

`DocumentTitle` 目前在 App.tsx 的 TabProvider 裡。移除外層 TabProvider 後需要調整位置。

## Risks / Trade-offs

- [風險] 自動 launch 可能在 server 未連接時觸發 → 需要等 socket connected
