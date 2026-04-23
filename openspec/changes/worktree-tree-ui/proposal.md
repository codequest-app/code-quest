## Why

`direction-f-project-ui` 把 project 區做完了，但 mockup 的左 pane 是
**hierarchical tree**：每個 project 可展開出 worktree 子列表，每個 worktree
是一個獨立的工作面（own folder, own branch）。目前 cc-office 雖然底層已有
`worktree:create / list / delete` 跟 `WorktreeContext`，但 UI 層完全沒呈現
這個階層，使用者沒辦法在 sidebar 看到或切換 worktree。

這個 change 把 worktree 帶到 sidebar，並補上「非 git project → 一鍵變 git」
的入口。Git diff / branch popover / 檔案樹等 git ops 留給下一個 change。

## What Changes

**Client UI — Sidebar 從平面 list 變 tree**
- `ProjectList` 渲染改 hierarchical：每個 project row 帶 chevron，可展開
- 展開後顯示 worktree 子列表：`⎇ branch-name` + live session pill + `⋯` menu
- 展開狀態：active project 預設展開、其他收合，手動 toggle 後存 localStorage
- 每個 project 的 worktree 列尾巴一個 `+ New worktree…`（複用既有 dialog）
- 非 git project：不顯示 chevron，行為同現在的 ProjectCard，⋯ menu 加
  `Initialize as git repo`；展開區塊另外給一個 inline `[ Initialize as git repo ]` 按鈕

**Worktree row 行為**
- 點 row → 開該 worktree folder 的 chat tab（已有就切過去；無則建新）
- Active：`activeTab.cwd === worktree.path` 時左邊 accent border
- ⋯ menu：Open in Finder / Copy path / Delete（**不做** Rename / Archive — 砍掉）
- Live session pill：`sessions.filter(s => s.projectRoot === worktree.path && s.state !== 'exited').length`，>0 才顯示

**新增對話框 / 元件**
- `RemoveWorktreeConfirmDialog`：照 `RemoveProjectConfirmDialog` 模板（blocked when active sessions / allowed states）
- `WorktreeContextMenu`：照 `ProjectContextMenu` 模板
- `ProjectTree`（取代 / 並存於 `ProjectList`）

**Server**
- 新事件 `worktree:initRepo { cwd }` → `git init` + `git commit --allow-empty -m "Initial commit"` → 回 `{ ok, branch: 'main' }`
- 既有 `worktree:create / delete` 加 broadcast `worktree:added / removed`（跟 `projects:*` 對稱）
- `worktree:list` 對非 git path 回 `{ error: 'not_a_repo' }`（不再回空陣列，client 用這個區分）
- handler 用既有 `GitService`（看 `services/git-service.ts`）

**Client state**
- `WorktreeContext` 訂閱新廣播事件，自動 refresh listings
- 新增 `WorktreeContext.initRepo(cwd)` action
- `ProjectContext` 新增 derived `isGitRepo(cwd): boolean | 'unknown'`（從 worktree:list 結果或快取推導）

**Persistence / DB**
- **不進 DB**。Worktree 完全靠 `git worktree list` 取得，純 source-of-truth from git。
- 等真的需要 lastOpenedAt 排序 / custom alias 再加 `worktree_metadata` cache 表（後續 change）

**不動的東西**
- 既有 ProjectCard / RenameProjectDialog / RemoveProjectConfirmDialog 邏輯
- Top scope switcher（worktree 切換靠 sidebar 點擊，不上 switcher）
- TopScopeSwitcher / TabBar / WorktreeBanner 行為
- Chat panel / Terminal / 任何 git ops UI（diff / status / commit / push / pull / branch popover / changes 計數橘點 — 留下個 change）

## Capabilities

- `project-workspace`：擴充 sidebar 從 flat project list 變成 project → worktree
  tree；新增非 git project 一鍵升級流程。
