## Why

目前的 tab model 是 flat 的 — 每個 tab 獨立帶 cwd，沒有 project 概念。使用者開多個不同 cwd 的 session 後，sidebar 的 File Explorer 跟 tab 之間沒有關聯，無法快速在不同 project 間切換。

改為 JetBrains 風格的 project-centric model：project 是頂層單位，每個 project 下有自己的 tab group（多個 Claude session）。切換 project 就切換整組 tabs。

## What Changes

- Sidebar 從 File Explorer 改為 **Project 列表**（Card 呈現）
- 點擊 Card 切換 active project → 切換整組 tabs
- `[＋ Add]` 按鈕 → 彈出 **DirectoryTree dialog** 選目錄 → 加入 project
- Project 列表從 server sessions table `GROUP BY cwd` 取得（不需新 table）
- `TabContext` 改為 project-aware：每個 project 持有自己的 tabs
- `FileExplorerPanel` 從 sidebar 移到 dialog 裡
- `ActivityBar` 保留，sidebar icon 從 Explorer 改為 Projects

### MVP scope
- Card 只顯示 project name（basename of cwd）
- 不做 ✕ 移除 project
- 不做 session count 顯示
- 首次無 project 時顯示 "Add Project" 大按鈕

## Capabilities

### New Capabilities
- `project-workspace`: Project 作為頂層單位管理 tab groups。包含 project 列表、active project 切換、per-project tabs、project 資料從 sessions group by cwd 取得。
- `project-add-dialog`: DirectoryTree dialog 選目錄加入 project。複用現有 DirectoryTree component。

### Modified Capabilities
- `workspace-layout`: Sidebar 從 FileExplorerPanel 改為 ProjectList + Add button
- `file-explorer`: FileExplorerPanel 改為 dialog 形式（DirectoryTree + Open/Cancel buttons）

## Impact

- `apps/web/src/contexts/TabContext.tsx` — 加入 project grouping 或新建 ProjectContext
- `apps/web/src/components/WorkspaceLayout.tsx` — sidebar 改為 ProjectList
- `apps/web/src/components/FileExplorerPanel.tsx` — 改為 dialog component
- `apps/web/src/components/ProjectCard.tsx` — 新 component
- `apps/web/src/components/ProjectList.tsx` — 新 component
- `apps/web/src/components/AddProjectDialog.tsx` — 新 component（包含 DirectoryTree）
- `apps/server/` — 可能需要新的 socket event 查詢 projects（或從 session:states 推導）
