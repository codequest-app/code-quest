## Context

目前 cc-office 是 tab-centric：每個 tab 獨立帶 channelId + cwd，`TabContext` 管 flat map `{ [channelId]: TabMeta }`。sidebar 的 FileExplorerPanel 是 launcher — double-click 開新 tab。

已有基礎設施：
- `DirectoryTree` — 自建 tree view，透過 `useExplorerBrowse` + socket `explorer:browse` 載入目錄
- `FileExplorerPanel` — 組合 DirectoryTree + Recents
- `ActivityBar` — sidebar icon 列
- `TabContext`（`useTabState` + `useTabActions`）— tab 管理
- `ChannelProvider` — per-tab session，接受 `channelId` + `cwd`
- Server sessions table — 有 `cwd` 欄位，可 group by

## Goals / Non-Goals

**Goals:**
- Project 是頂層單位，切換 project 切換整組 tabs
- Sidebar 顯示 project card 列表 + Add 按鈕
- Dialog 選目錄加入 project
- 從 server sessions group by cwd 推導 project 列表
- Active project 有視覺 highlight

**Non-Goals:**
- 不做 project 刪除 / 移除
- 不做 session count 顯示
- 不做 project settings / rename
- 不做 project persist 到獨立 table（從 sessions 推導）
- 不做 file tree 在 sidebar（只在 dialog 裡）

## Decisions

### D1: Project 資料來源 — 從 sessions group by cwd

不新增 project table。Project 列表 = `SELECT DISTINCT cwd FROM sessions WHERE cwd IS NOT NULL`。

Server 可透過現有 `session:states` 推送 sessions，client 端自行 group by cwd 推導 projects。不需要新的 socket event。

**替代方案：** 新增 project table + CRUD API。但 MVP 不需要，增加複雜度。Sessions 的 cwd 已經足夠表達 project。

### D2: Client 狀態管理 — 新建 ProjectContext

```typescript
interface ProjectState {
  projects: Map<string, Project>;  // key = cwd
  activeProjectCwd: string | null;
}

interface Project {
  cwd: string;
  name: string;           // basename(cwd)
  tabIds: string[];       // channelIds belonging to this project
}
```

`ProjectContext` wrap `TabContext`，負責：
- 從 sessions group by cwd 建立 project 列表
- 管理 active project
- 切換 project 時切換 visible tabs
- Add project 時 create new tab with cwd

`TabContext` 不改 — 仍然管 flat tabs。`ProjectContext` 是上層 orchestrator。

**替代方案：** 在 TabContext 加 project grouping。但會讓 TabContext 職責過重，且 project 是新概念，獨立 context 更乾淨。

### D3: Sidebar — ProjectList component

```
┌──────────────┐
│ PROJECTS     │
│              │
│ ╔════════════╗
│ ║ 📁 cc-office║  ← accent border
│ ╚════════════╝
│ ┌────────────┐
│ │ 📁 DQ       │
│ └────────────┘
│              │
│ [＋ Add]     │
└──────────────┘
```

- 每個 project 一個 `ProjectCard`（name only，MVP）
- 點 card → set active project
- Active project card 有 `border-accent` highlight
- 底部 `[＋ Add]` 按鈕

### D4: AddProjectDialog — 複用 DirectoryTree

Modal dialog，內含：
- 標題 "Select Project Directory"
- `DirectoryTree` component（複用現有）
- 選中目錄後 highlight + 顯示路徑
- Cancel / Open 按鈕

Open 後：
1. 以選中的 cwd 建立新 project（如果不存在）
2. 在該 project 下建立第一個 tab
3. 切換到該 project

### D5: 首次使用 — Empty State

沒有任何 session / project 時：
```
┌──────────────────────────────────┐
│                                  │
│      📁                          │
│                                  │
│    No projects yet               │
│                                  │
│    [＋ Add Project]              │
│                                  │
└──────────────────────────────────┘
```

大按鈕佔滿主區域。點擊後開 AddProjectDialog。

### D6: 切換 Project 的行為

點 ProjectCard(DQ)：
1. `setActiveProjectCwd('/path/to/DQ')`
2. TabBar 顯示 DQ 的 tabs
3. ChatPanel 顯示 DQ 的 active tab session
4. cc-office 的 sessions 保持 alive（背景運行）

切回 cc-office 時，sessions 還在原來的狀態。

### D7: WorkspaceLayout 調整

```
WorkspaceLayout
├── ActivityBar (icon: 📋 Projects)
├── Sidebar (ProjectList + Add button)
└── Main area
    ├── Empty State (no project)
    └── EditorArea (has active project)
        ├── TabBar (filtered by active project)
        └── ChannelProvider + ChatPanel
```

`EditorArea` 需要知道 active project 的 cwd，傳給 `createNewTab({ cwd })`。

## Risks / Trade-offs

### [Risk] Session 沒有 cwd
有些 session 可能沒有 cwd（server 預設 process.cwd()）。這些 session 歸屬哪個 project？
→ **Mitigation:** 歸到一個 "Default" project，或用 server cwd 作為 fallback。

### [Risk] Group by cwd 的 path 不一致
同一個目錄可能有不同 path（symlink、relative vs absolute）。
→ **Mitigation:** Server 端 resolve 成 absolute path 再存。目前 `channel.cwd` 已經是 resolve 後的。

### [Trade-off] 不 persist project 列表
Project 從 sessions 推導，沒有獨立的 "add/remove project" 操作。使用者不能移除一個 project（除非刪除所有 sessions）。
→ **Accepted:** MVP 足夠。之後可加 project table 支援 pin/unpin。
