## Why

`WorkspaceLayout` 有兩條 path：有 project 時走 `TabProvider sessions={filtered}` + `EditorArea`，沒 project 時 fallback 到外層 `TabProvider`（不走 sessions sync）。這造成行為不一致——fallback path 的 tab 不受 project sessions 管理。

應統一：所有 tab 都走 project 路徑。點 + 時 launch session 帶 `defaultCwd`，server 回 `session:created` 帶 cwd，自動建 project。

## What Changes

- 移除 `WorkspaceLayout` 的 `projects.length === 0 && <EditorArea />` fallback
- 移除 `App.tsx` 的外層 `TabProvider`（不再需要）
- 點 + 建新 tab 時，若無 project 則自動建 project（從 session cwd 推導）
- `EmptyState` 或類似 UI 引導使用者建第一個 session

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

（無既有 spec 需修改）

## Impact

- `packages/client/src/components/WorkspaceLayout.tsx` — 移除 fallback
- `packages/client/src/App.tsx` — 移除外層 TabProvider
- 相關測試需更新（`renderWithWorkspace` 等）
