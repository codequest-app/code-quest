TDD：每個 phase 先寫 test → red → 最少 code 過關 → refactor。
**重要**：phase 順序故意把 GitService 契約層放最前面 — 先 real（tmpdir 真 git）、
再 fake，避免 fake 滿足 spec 但 real 做不到的契約 drift。

## Phase 0 — GitService 契約層（real 先，fake 鏡像）

### Tests first — contract function（real / fake 共用）

- [x] 新檔 `apps/summoner/src/git/__tests__/git-service.contract.ts`
- [x] 抽 `gitServiceContract(name, setup)` 函式，包含：
  - [x] `initRepo`: non-git → `{ branch: 'main' }` + `.git` 存在 + log 有 1 commit
  - [x] `initRepo`: 已是 repo → throws `AlreadyRepoError`
  - [x] `listWorktrees`: non-git path → throws `NotARepoError`
  - [x] `listWorktrees`: git repo → 至少回 main worktree

### Phase 0.1 — LocalGitService.initRepo + listWorktrees on non-git

- [x] `local-git-service.test.ts` 用 tmpdir 跑 contract（real）
- [x] 新增 `NotARepoError` / `AlreadyRepoError` 到 `apps/summoner/src/git/errors.ts`
- [x] `LocalGitService.initRepo`：`git init -b main` + `git commit --allow-empty -m "Initial commit"`
- [x] `LocalGitService.listWorktrees`：`getRepoRoot` 為 null → throw `NotARepoError`
- [x] `parseWorktreeList`：包含 main worktree（從原本只回 `.claude/worktrees/*` 擴大）

### Phase 0.2 — FakeGitService 鏡像同契約

- [x] `fake-git-service.test.ts` 跑同一組 contract（fake）
- [x] `FakeGitService.initRepo`：in-memory 標記 cwd 為 git repo + 加一筆 main worktree
- [x] `FakeGitService.listWorktrees`：未標記為 git → throw `NotARepoError`
- [x] 新 `markAsRepo(path)` setter；預設 seed `/repo` 保向下相容

### Phase 0.3 — 既有 GitService caller 處理新例外

- [x] grep 既有 `listWorktrees` caller：只有 `worktree.ts handleList`，已有 try/catch（NotARepoError 走 errMsg 路徑）
- [x] 既有測試全綠（summoner 342 / server 577 / client 1383）

## Phase 1 — Server: worktree:initRepo handler

### Tests first
- [x] non-git path → init 成功 → 回 `{ ok: true, branch: 'main' }` + 廣播 `worktree:added`
- [x] 已是 git repo → 回 `{ error: 'already_a_repo' }`，不執行 init
- [x] init 後 `worktree:list` 立刻回 main

### Implement
- [x] 加 `worktree:initRepo` event + `worktree:added/removed` event types 到 shared schema
- [x] handler 用 `gitService.initRepo`，catch `AlreadyRepoError`

## Phase 2 — Server: worktree broadcast 對稱化

### Tests first
- [x] `worktree:create` 成功時廣播 `worktree:added`
- [x] `worktree:delete` 成功時廣播 `worktree:removed`
- [x] `worktree:initRepo` 成功時廣播 `worktree:added`
- [x] 失敗時不廣播

### Implement
- [x] handler 在 success path 加 `emitter.broadcastAll`
- [x] payload schema 加進 shared（與 Phase 1 一起完成）

## Phase 3 — Server: worktree:list 區分 not_a_repo

### Tests first
- [x] git path → 回 `{ ok: true, worktrees: [...] }`
- [x] non-git path → 回 `{ error: 'not_a_repo' }` (不再回空陣列)
- [x] 既有 caller 改用新 shape

### Implement
- [x] handler 偵測非 git（`getProjectRoot` null + `NotARepoError`）改回 `err('not_a_repo')`
- [x] `WorktreeContext.listing`: 新 `NOT_A_REPO` sentinel，型別 `WorktreeInfo[] | 'not_a_repo'`
- [x] `list()` 回傳改為 `WorktreeInfo[] | { error }`，消費端可 narrow

## Phase 4 — Client: WorktreeContext 訂閱廣播 + initRepo action

### Tests first
- [x] 收到 `worktree:added` → listings cache 增加（already-fetched project only）
- [x] 收到 `worktree:removed` → listings cache 減少
- [x] 未 fetch 過的 project 收到 broadcast → cache 不變（lazy 原則）
- [x] `initRepo(cwd)` 呼叫 server → 成功後 cache 透過 broadcast 含 main
- [x] 已是 git repo → action 回 `{ ok: false }`

### Implement
- [x] 新增 `useEffect` 訂閱 `worktree:added / worktree:removed`
- [x] Patch 策略：只改已有的 cache entry；未 fetch 的 project 忽略廣播
- [x] 新增 `initRepo` action（type `InitRepoResult`）

## Phase 5 — Client: ProjectTree component（取代 ProjectList 的渲染）

### Tests first
- [x] 渲染 Pinned / Recent 分組（同 ProjectList）
- [x] active project 預設展開（chevron 向下）
- [x] 非 active project 預設收合
- [x] 點 chevron → 展開並 fetch worktrees，顯示 branch name
- [x] non-git project：fetch 後 listing 為 `NOT_A_REPO` → 不渲染 chevron
- [x] 展開狀態存 localStorage，重新 mount 可恢復
- [x] `+ Add Project` 按鈕同 ProjectList

### Implement
- [x] 新 hook `useExpandedProjects`（localStorage-backed Set）
- [x] 新檔 `ProjectTree.tsx`（ProjectRow 每列處理 chevron + ProjectCard + 子 worktree 清單）
- [x] Worktree 子清單 inline minimal 渲染（Phase 6 抽成 `WorktreeRow`）

## Phase 6 — Client: WorktreeRow

### Tests first
- [x] 顯示 branch name（fallback 到 worktree.name）
- [x] live session > 0 時顯示 pill 含計數（使用 `pluralize` util）
- [x] live session = 0 時不顯示 pill
- [x] active 狀態：加 `border-accent` class
- [x] 點 row → 觸發 `onSelect` callback
- [x] 點 ⋯ → 觸發 `onMoreActions(anchor)`，不觸發 onSelect（stopPropagation）

### Implement
- [x] 新檔 `WorktreeRow.tsx`（pure presentational，靠 props 驅動）
- [x] ProjectTree `WorktreeChildList` 用 WorktreeRow 取代 inline div，
      live session 計數從 `useProjectState().sessions` 導出
- [x] Click 邏輯（open-or-switch tab）在 Phase 10.5 完成（`WorktreeChildList.tsx:37-39`、`ProjectTree.test.tsx:255`）

## Phase 7 — Client: WorktreeContextMenu + RemoveWorktreeConfirmDialog

### Tests first
- [x] menu 有 Copy path / Delete
- [x] Copy path → 觸發 callback + 關閉
- [x] Delete + 無 active session → confirm dialog (Delete button)
- [x] Delete + 有 active session → blocked dialog（OK only，顯示 N active sessions）
- [x] Cancel 關閉對話框而不觸發 onConfirm
- [x] Escape 關閉 context menu

### 砍掉
- **Open in Finder**：web app 場景下需要 server-side shell event，留給後續 change

### Implement
- [x] 新檔 `WorktreeContextMenu.tsx`（Copy path + Delete）
- [x] 新檔 `RemoveWorktreeConfirmDialog.tsx`（複用 `RemoveProjectConfirmDialog` 的
      blocked/allowed 兩態模板 + `pluralize`）
- [x] ProjectTree 的 WorktreeChildList 整合：onMoreActions → 開 menu；
      Copy path → `navigator.clipboard`；Delete → 開 confirm dialog → `remove()`

## Phase 8 — Client: Initialize as git repo 入口

### Tests first
- [x] non-git project 顯示 inline `[+ Initialize as git repo]` dashed 按鈕
- [x] git project 不顯示 inline 按鈕
- [x] non-git project ⋯ menu 有 `Initialize as git repo` 選項
- [x] git project ⋯ menu 沒有該選項
- [x] 點擊成功 → 廣播 `worktree:added`（listing 透過 broadcast 刷新）

### Implement
- [x] `ProjectContextMenu` 加 `onSelectInitRepo?` 選項
- [x] `ProjectCard` 加 `onSelectInitRepo?` prop 轉接到 menu
- [x] `ProjectTree.ProjectRow` 在 `nonGit` 時傳入 `onSelectInitRepo` +
      渲染 inline button（dashed border，展開區塊下方）

## Phase 9 — Client: + New worktree 按鈕複用既有 dialog

### Tests first
- [x] git project 展開區尾巴有 `+ New worktree…` 按鈕
- [x] non-git project 不顯示該按鈕（必須先 init）
- [x] 點擊開啟既有 `CreateWorktreeDialog`（Dialog textbox 出現）

### Implement
- [x] `WorktreeChildList` 尾巴加 dashed 按鈕 + state 觸發 `CreateWorktreeDialog`
- [x] 建立成功後 worktree 透過 `worktree:added` broadcast 自動出現在 tree
      （Phase 4 訂閱邏輯已處理）

## Phase 10 — Sidebar 切換到 ProjectTree

### Tests first
- [x] sidebar 渲染 ProjectTree 而非 ProjectList（WorkspaceLayout.tsx swap）
- [x] 既有 ProjectList tests 仍綠（component 留著供 storybook 用）
- [x] 既有 TabContext UI test 加 `WorktreeProvider` 解決新依賴

### Implement
- [x] `WorkspaceLayout.tsx`: `ProjectList` → `ProjectTree`，prop 從 `onSelect` → `onSelectProject`
- [x] 不刪 ProjectList（仍供 storybook 使用）
- [x] WorktreeProvider 早已 wrap 於 `App.tsx` — 實機不需額外修改

## Phase 10.5 — WorktreeRow onSelect wire (Phase 10 debt)

重讀 mockup 後發現 Phase 10 收得太早；WorktreeRow.onSelect 還是 no-op。

### Tests first
- [x] ProjectTree: 點 wt-row 設 `requestOpenWorktree` intent
- [x] TabProvider: pendingOpenWorktree 與 cwd 相符 + 無 tab → createNewTab(wtCwd)
- [x] TabProvider: 不相符 → 忽略

### Implement
- [x] `ProjectContext` 新增 `pendingOpenWorktree` state + `requestOpenWorktree` /
      `clearPendingOpenWorktree` actions（延伸既有 pendingActivate intent pattern）
- [x] `TabContext` 加 useEffect 消費 intent：match cwd → find-by-cwd or createNewTab
- [x] `ProjectTree` 用 `requestOpenWorktree` 取代 no-op onSelect

## Phase 10.6 — Tab label 以 branch 為主

mockup 每個 tab 顯示 `⎇ branch` badge；現在顯示 folder basename，導致 main
worktree 與 project 名重複、分不清。

### Tests first
- [x] 有 branch 的 tab 顯示 `⎇ branch` 格式
- [x] 無 branch 但有 worktree 的 tab fallback 到 `⎇ name`
- [x] Worktree listing 沒 cache → badge 根本不顯示（等 listing fetch 回來再 render）

### Implement
- [x] `TabInfo.worktree` 加 optional `branch` 欄位
- [x] TabBar badge 改顯示 `⎇ {branch ?? name}`
- [x] `EditorArea` 從 `useWorktreeState().listing` 找符合 tab.cwd 的 WorktreeInfo
      並填入 TabInfo.worktree（含 branch）
- [x] `findWorktreeByCwd` helper 跨 project 搜尋 listing（cache miss 回 null → 不顯示 badge）

## Phase 10.7 — WorktreeContextMenu: 補 "Open in new chat"

### Tests first
- [x] menu 渲染 "Open in new chat" 在最上面
- [x] 點擊觸發 `onOpenInNewChat` + 關閉 menu
- [x] Copy path / Delete 維持原行為（所有測試更新簽名）
- [x] `forceNew=true` 時 TabProvider 總是建新 tab（即使有相同 cwd 的 tab）

### Implement
- [x] `WorktreeContextMenu` 加 required `onOpenInNewChat` prop + 第一個 menu item
- [x] `ProjectContext.pendingOpenWorktree` 加 `forceNew: boolean` 欄位
- [x] `requestOpenWorktree(projectCwd, worktreeCwd, forceNew?)` 第三參數
- [x] `TabContext` 消費時：`forceNew` 直接 createNewTab 不搜尋
- [x] ProjectTree wire：onOpenInNewChat → `requestOpenWorktree(..., true)`

## Phase 10.8 — CreateWorktreeDialog 升級成 mockup 版本

現在 dialog 只有一個 name 輸入；mockup 有 2-tab 設計（Checkout existing vs
Create new branch）+ base branch + path + live command preview + "Open new
session here" checkbox。

拆成三個 sub-phase 實作：**10.8a server contract → 10.8b client actions + helpers → 10.8c dialog UI**

### Phase 10.8a — Server (done)
- [x] `GitService.listBranches(repoRoot): string[]`
- [x] `GitService.createWorktree(root, opts)` — options object
      （existingBranch / newBranch+baseBranch / legacy name）
- [x] Contract test 同時驗證 Local 與 Fake
- [x] `worktree:listBranches` event + schema
- [x] `worktree:create` payload 擴充 `existingBranch?` / `newBranch?` /
      `baseBranch?` / `path?`
- [x] Handler 測試 4 個（listBranches git/non-git + create 兩種新模式）

### Phase 10.8b — Client contract + helpers (done)
- [x] `WorktreeActions.create(args | cwd, name?)` — 接 options object 或舊簽名
- [x] `WorktreeActions.listBranches(cwd)` — 回 `string[] | { error }`
- [x] 新 `worktree-dialog-helpers.ts`:
      - `branchToSlug('feature/my-thing')` → `my-thing`
      - `autoDerivePath(projectCwd, branch)` → `../<project>-<slug>`
      - `buildWorktreeCommand({ mode, branch, baseBranch?, path })` 含 placeholder
- [x] Helper 測試 9 個，actions 測試 2 個

### Phase 10.8c — Dialog UI (done)
- [x] Tab 結構：`Checkout existing`（預設）/ `Create new branch`
- [x] Tab A: branch dropdown + path input（auto-derive placeholder）
- [x] Tab B: new branch input + base branch dropdown + path input
- [x] Live command preview（testid=`worktree-command-preview`）
- [x] "Open new session here" checkbox（預設 checked）→ 勾了才呼叫 requestActivateChannel
- [x] `listBranches` 在 dialog 開啟時 fetch 一次
- [x] Submit 依 mode 組 payload 呼叫 `create()`
- [x] `CreateWorktreeFlow.test.tsx` 整合測試更新用新 tab / label

## Phase 10.9 — Align with claude-code conventions + click/visual cleanup

重讀 extension 原始碼 + 反思使用體感，發現四個問題需要修。

### Phase 10.9a — Worktree path 對齊 extension convention

Extension 原始碼 `/Users/user/Desktop/anthropic.claude-code-2.1.45/src/core/main.js:16319`
用 `<repoRoot>/.claude/worktrees/<name>`。Phase 10.8c 的 `autoDerivePath` 錯用 mockup
虛構的 `../<project>-<slug>`，要修。

### Tests first
- [x] `autoDerivePath('/Users/me/repos/cc-office', 'feature/x')` → `/Users/me/repos/cc-office/.claude/worktrees/x`
- [x] `autoDerivePath('/repos/foo', '')` → `/repos/foo/.claude/worktrees/worktree`

### Implement
- [x] `autoDerivePath` 改回 `<projectCwd>/.claude/worktrees/<slug>`
- [x] `buildWorktreeCommand` 測試更新成 subdirectory path
- [x] Dialog path placeholder 自動顯示新路徑（透過 autoDerivePath）

## Phase 10.9b — Visual: folder icon for worktree rows

目前 wt-row 用 `⎇` 讓它看起來像 branch ref，但實際是 folder 身份，混淆。改用 folder icon。

### Tests first
- [x] WorktreeRow 渲染 `wt-folder-icon` (FolderIcon heroicon)
- [x] 不再含 `⎇` 字符
- [x] Primary label 仍為 branch（ `branch ?? name`）
- [x] Tab bar 保留 `⎇ branch` badge 不變

### Implement
- [x] WorktreeRow: 用 `@heroicons/react/24/outline FolderIcon` 取代 `⎇` 字符
- [x] Size: `w-3.5 h-3.5` 對齊 row 的 text-[12px] 大小

## Phase 10.9c — Click wt-row 改為純 focus（不建新 tab）

Sidebar 應該是 focus navigator 而非 tab creator。要建新 tab 改由 TabBar 的 `+` 或
⋯ menu 的 "Open in new chat"。

### Tests first
- [x] Click wt-row 有現存 tab → 切過去（switch-only）
- [x] Click wt-row 無現存 tab → **tab count 不變**（純 focus）
- [x] ⋯ menu "Open in new chat" (`forceNew=true`) 仍會每次建新 tab

### Implement
- [x] TabContext 分流：`forceNew` → 無條件 createNewTab；否則 switch-only（找到 tab 才切，找不到不動）
- [x] openWorktree test 更新：no-existing-tab case 改斷言 tab count = 0

## Phase 10.9d — Active-session dot on wt-row

有活躍 session 的 worktree 加個小 dot（綠色實心圓）與 live-pill 區分（pill 含計數）。

### Tests first
- [x] `liveSessions > 0` 時 WorktreeRow 顯示 `data-testid="wt-active-dot"` 綠色 dot
- [x] `liveSessions === 0` 時不顯示 dot
- [x] dot 與 live-pill 並存（pill 顯示數量，dot 是二元指示）

### Implement
- [x] WorktreeRow 加 1.5px × 1.5px 實心綠色 dot（`bg-success rounded-full`），`title="Has active session"`

## Phase 10.10 — Worktree row 視覺/互動修正（對齊 mockup）

重讀 mockup 發現 10.9b/c/d 都改錯方向 —— mockup 的 wt-row 用 `⎇ branch`
可點 badge、dot 是 uncommitted changes、click row 是 open-or-switch。

### Tests first
- [x] WorktreeRow 用 `⎇` glyph + branch label
- [x] branch 部分為獨立 clickable element（`onBranchClick` callback，不觸發 row onSelect）
- [x] dot 改接 `changes: number` prop，orange warning color
- [x] Click row 回 open-or-switch（revert 10.9c）
- [x] Project row 點擊 toggle expand

### Implement
- [x] WorktreeRow: 文字 `⎇` 取代 FolderIcon；branch span 用 role=button
- [x] 新 prop `onBranchClick(anchor)` + `changes` number
- [x] TabContext pendingOpenWorktree: 無 existing → createNewTab（revert）
- [x] ProjectTree ProjectRow: 整列點擊 toggle expand

## Phase 10.11 — Server: git:checkout + git:status handlers

`GitService` 已有 checkout/status 方法。補 socket handlers。

### Tests first
- [x] `worktree:checkout { cwd, branch }` → ok + broadcast `worktree:branchChanged`
- [x] `worktree:checkout` 非 git path → error, no broadcast
- [x] `worktree:status { cwd }` → ok { branch, isClean, changedFilesCount }
- [x] `worktree:status` 非 git path → error

### Implement
- [x] Shared schemas: `worktreeCheckoutPayload/Response`, `worktreeStatusPayload/Response`,
      `WorktreeBranchChangedEvent`
- [x] Server `handlers/worktree.ts` 加 `handleCheckout` + `handleStatus`
- [x] `worktree:branchChanged` 廣播事件

## Phase 10.12 — BranchPopover component

### Tests first
- [x] 渲染 branch list，current branch 顯示 ✓
- [x] 點別的 branch → 呼叫 onSelect(branch) + 關閉 popover
- [x] `+ New branch (worktree)...` → 觸發 onCreateBranch + 關閉
- [x] Esc 關閉

### Implement
- [x] 新檔 `BranchPopover.tsx`（menu role，outside-click + Escape）
- [x] WorktreeActions 加 `checkout(worktreeCwd, branch)`
- [x] ProjectTree wire：onBranchClick → `listBranches(projectCwd)` → 開 popover →
      onSelect → `checkout`；onCreateBranch → setCreateOpen(true)

## Phase 10.13 — Branch change 廣播 + listing 同步

### Tests first
- [x] `worktree:branchChanged` 廣播時，WorktreeContext listing 對應 entry `branch` 更新 in-place
- [x] 未 fetch 的 project 忽略（lazy 原則；useEffect subscribes only if entry exists）

### Implement
- [x] WorktreeContext onBranchChanged handler，用 `Array.isArray(entry)` 守門
- [x] （Schema 已於 Phase 10.11 完成）

## Phase 10.14 — wt-menu 補三項

### Tests first
- [x] menu 新增 `Open here (switch)`、`Rename…`、`Archive`
- [x] Open here → onOpenHere callback + 關閉
- [x] (Rename / Archive 測試透過新 menu 渲染全六項測試覆蓋)

### Implement
- [x] WorktreeContextMenu: `onOpenHere` / `onRename` / `onArchive` optional props
- [x] ProjectTree wire：Open here → requestOpenWorktree(forceNew=false)；
      Rename / Archive 目前 console.info stub，留後續 change TBD

## Phase 10.15 — Tab scope-tag

mockup 每個 tab 顯示 `project/worktree` 小字 scope-tag。

### Tests first
- [x] TabBar 顯示 `data-testid="tab-scope-tag"` 含 `<projectName>/<branch>`
- [x] 無 worktree tab 不顯示 scope-tag

### Implement
- [x] TabInfo 加 optional `projectName`
- [x] EditorArea findWorktreeByCwd 回傳 `projectCwd`，取 basename 當 projectName
- [x] TabBar 渲染 scope-tag（worktree-badge 前）

## Phase 10.16 — Changes dot 串接 git status

### Tests first
- [x] WorktreeRow `changes > 0` 顯示 `wt-changes-dot`（Phase 10.10 已驗）
- [x] `changes === 0` 不顯示（Phase 10.10）

### Implement
- [x] WorktreeActions.status(cwd) — server roundtrip 拿 `changedFilesCount`
- [x] WorktreeChildList useEffect: 每個 wt 掛載時 fetch 一次 status，存 changesByPath state
- [x] 傳 changes count 給 WorktreeRow
- [~] (deferred, optimization) 未來優化：branchChanged 事件時重新 fetch — 現階段可靠展開 project 重取

## Phase 11 — Regression

- [x] 所有 client tests pass — 1417/1417
- [x] 所有 server tests pass — 583/583
- [x] 所有 summoner tests pass — 342 passed + 47 skipped (integration gated by RUN_INTEGRATION)
- [x] tsc clean across all packages
- [x] biome clean（commit hooks 綠）
- [~] (deferred, manual QA) Storybook 建得起來 — 需要手動啟動 `pnpm storybook` 驗視覺

## Phase 12 — Manual QA (deferred to smoke testing session)

- [~] (deferred, manual QA) 開 cc-office，左 pane 看到 cc-office 可展開
- [~] (deferred, manual QA) 展開後看到 main worktree
- [~] (deferred, manual QA) 點 ⋯ → Open in Finder 真開
- [~] (deferred, manual QA) Copy path 真複製
- [~] (deferred, manual QA) 開新 worktree → tree 立刻多一列
- [~] (deferred, manual QA) 多 tab 開：tab1 建 worktree → tab2 立刻看到
- [~] (deferred, manual QA) 在非 git folder（建一個 `/tmp/notes`）→ Add Project → ⋯ → Initialize as git repo → 立刻可展開
- [~] (deferred, manual QA) localStorage 展開狀態：reload 後維持

## Phase 13 — Archive

- [x] `openspec verify worktree-tree-ui`（2026-04-24 audit pass — all tasks DONE or DEFERRED with reason）
- [x] 全部 task 完成
- [~] 手動驗證完（Phase 12 deferred items）
- [ ] `openspec archive worktree-tree-ui`（pending — will run after all changes archived together）
