## Context

file-explorer-panel change 會建立 ActivityBar + resizable Sidebar 基礎設施（WorkspaceLayout 作為 layout shell、EditorArea 承載 TabBar + ChatPanel）。本 change 在此基礎上新增第二個 sidebar panel：Session History。

現有相關基礎設施：
- `SessionHistory` component — 已有搜尋、選擇、rename、delete 功能，接收 `sessions` props
- `SessionDropdown` — `SessionHistory` 的 overlay wrapper，用於 ChatInputArea 的 resume 流程
- `useSession().listSessions({ limit })` — 回傳 `{ sessions: SessionSummary[], total }`
- `SessionSummary` — 已包含 `cwd?: string` 欄位
- `session:list` API — server 端已實作，不需改動

## Goals / Non-Goals

**Goals:**
- 在 ActivityBar 新增 History Panel，按 project（cwd）分組顯示歷史 sessions
- 引入 SidebarContext 解決 sidebar 切換的 prop drilling
- 復用現有 SessionHistory component（不重寫）
- Double-click session resume、double-click project header 開新 tab

**Non-Goals:**
- 不改動 ChatInputArea 的 resume overlay 功能（SessionDropdown 保持不變）
- 不改動 server 端 session:list API
- 不做 session 的建立/刪除（那些已在 SessionDropdown 中有）
- 不做即時更新（panel 打開時 fetch，不做 websocket push 更新列表）

## Decisions

### D1: 引入 SidebarContext

```tsx
// SidebarContext.tsx
interface SidebarContextValue {
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
}
```

- 放在 WorkspaceLayout 內部 provide（不需要在 App.tsx 層級）
- WorkspaceLayout 的 `activePanel` local state 搬進 SidebarContext
- ActivityBar 和 FileExplorerPanel 改用 `useSidebar()`
- 未來任何深層 component（如 ChatInputArea）也可以用 `useSidebar().setActivePanel('history')` 打開 History

**替代方案：** prop drilling。但 EditorArea → ChatPanel → ChatInputArea 要穿三層，且未來每加一個需要控制 sidebar 的地方就要多穿一次。Context 成本極低，值得。

### D2: Sessions 按 cwd 分組，用 headless-tree 或簡單 accordion

```
🕐 History
├── 📁 /Users/user/projects/cc-office     ← group header
│   ├── 🟢 fix auth bug — 2hr ago              ← isActive session
│   ├── ⚪ add tests — yesterday
│   └── ⚪ refactor parser — 3 days ago
├── 📁 /Users/user/projects/my-app
│   └── ⚪ setup project — 1hr ago
└── 📁 (no project)                            ← cwd 為空的 sessions
    └── ⚪ quick chat — 5 days ago
```

**用簡單 accordion（不用 headless-tree）：**
- Session list 是平面資料（一次 fetch 全部），不需要 lazy load
- 只有兩層（project → sessions），不是真正的 tree
- 自建 accordion 更簡單：project header 點擊 toggle，sessions 列表顯示/隱藏

**分組邏輯：**
```typescript
function groupByProject(sessions: SessionSummary[]) {
  const groups = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    const key = s.cwd ?? '(no project)';
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }
  return groups;
}
```

### D3: 復用 SessionHistory 的搜尋邏輯，不復用整個 component

`SessionHistory` component 內部有搜尋過濾邏輯，但它的 UI 是 flat list。SessionHistoryPanel 需要 grouped UI。

**做法：** 提取搜尋邏輯為 utility function，SessionHistoryPanel 自己做分組 render。原 `SessionHistory` component 不動（SessionDropdown 繼續用它）。

### D4: 互動方式

| 操作 | 行為 |
|------|------|
| 單擊 project header | 展開/收合 session 列表 |
| Double-click project header | 在該 cwd 開新 tab（`createNewTab({ cwd })`） |
| 單擊 session | 選中（highlight） |
| Double-click session | resume session 到新 tab |
| 右鍵 session | Context menu: Resume / Rename / Delete |

### D5: Panel 打開時 fetch，不做即時更新

- `setActivePanel('history')` 時觸發 `listSessions({ limit: 100 })`
- 結果存在 panel local state
- 不做 websocket push（session 列表變化不頻繁，手動刷新或重開 panel 即可）
- 可加一個 refresh button

## Risks / Trade-offs

### [Risk] Sessions 很多時 UI 效能
一次 fetch 100 筆 sessions，如果有幾十個 project 每個幾十個 session，render 量可能大。
→ **Mitigation:** MVP 先用 limit 100。之後可加 pagination 或 virtualization。

### [Trade-off] 不改 SessionDropdown
保留兩套 session 瀏覽入口（ChatInputArea overlay + Sidebar panel），功能有重疊。
→ **Accepted:** 用途不同。ChatInputArea 的是快速 resume 當前 tab，History Panel 是全域瀏覽。移除 SessionDropdown 是另一個 change 的事。
