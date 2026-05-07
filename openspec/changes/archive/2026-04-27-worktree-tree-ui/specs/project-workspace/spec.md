# project-workspace — worktree-tree delta

## ADDED Requirements

### Requirement: Sidebar 必須能展開 git project 顯示 worktree 子列表

對 git project，sidebar 的 project row MUST 提供展開/收合控制（chevron），
展開後 MUST 顯示該 project 的所有 worktree（含 main 與 linked）。每個 worktree
row MUST 顯示 branch name、live session 計數、⋯ 按鈕。展開狀態 MUST 存
localStorage 跨 reload 保留；當前 active project 預設展開、其他預設收合。

#### Scenario: 展開 git project 顯示 worktree

- **WHEN** 使用者點 git project 的 chevron
- **THEN** 顯示該 project 的所有 worktree（含 main 與 linked）
- **AND** 每個 worktree row 顯示 branch name、live session 數量、⋯ 按鈕

#### Scenario: 展開狀態跨 session 持久化

- **WHEN** 使用者展開或收合一個 project
- **THEN** 狀態存入 localStorage
- **AND** 重新整理頁面後維持

#### Scenario: Active project 預設展開

- **WHEN** 使用者首次載入應用且 localStorage 無紀錄
- **THEN** 當前 active project 預設展開、其他預設收合

### Requirement: Worktree row 點擊必須開啟對應 folder 的 chat tab

點擊 worktree row MUST 開啟 cwd 指向 `worktree.path` 的 chat tab。若該
worktree 已有現存 tab，MUST 切換到該 tab；否則 MUST 建新 tab。

#### Scenario: 點擊有現存 tab 的 worktree

- **WHEN** 使用者點 worktree row 且該 worktree 已有 chat tab
- **THEN** 切換到該 tab，不建新 tab

#### Scenario: 點擊無 tab 的 worktree

- **WHEN** 使用者點 worktree row 且該 worktree 沒有 chat tab
- **THEN** 建立新 chat tab，cwd 指向該 worktree.path

### Requirement: Worktree row 必須顯示 active session 計數

Worktree row MUST 根據當前 sessions 計算 live 數量（`projectRoot === worktree.path`
且 `state ≠ 'exited'`）。>0 MUST 顯示 live pill 含計數，=0 MUST 隱藏。

#### Scenario: 有活躍 session

- **WHEN** 該 worktree 的 path 等於某個 session.projectRoot 且 state ≠ 'exited'
- **THEN** worktree row 顯示 live pill 含計數

#### Scenario: 無活躍 session

- **WHEN** 該 worktree 沒有任何活躍 session
- **THEN** worktree row 不顯示 live pill

### Requirement: Worktree ⋯ menu 必須提供基礎操作

Worktree row 上的 ⋯ MUST 開出 context menu，提供 Open in Finder / Copy path /
Delete。Delete MUST 在有活躍 session 時阻擋。Rename / Archive 不在第一版範圍。

#### Scenario: Open in Finder

- **WHEN** 使用者選 ⋯ → Open in Finder
- **THEN** 呼叫系統 file explorer 打開 worktree.path

#### Scenario: Copy path

- **WHEN** 使用者選 ⋯ → Copy path
- **THEN** worktree.path 寫入剪貼簿

#### Scenario: Delete worktree（無活躍 session）

- **WHEN** 使用者選 ⋯ → Delete 且該 worktree 無活躍 session
- **THEN** 顯示確認 dialog
- **AND** 確認後呼叫 `worktree:delete`，server 跑 `git worktree remove`
- **AND** 廣播 `worktree:removed`，所有 tab 即時更新

#### Scenario: Delete worktree（有活躍 session 阻擋）

- **WHEN** 使用者選 ⋯ → Delete 且該 worktree 有活躍 session
- **THEN** 顯示阻擋 dialog 含 active session 數量
- **AND** 只提供 OK 按鈕，不允許刪除

### Requirement: 非 git project 必須提供 Initialize as git repo 入口

對非 git directory 的 project，sidebar MUST 提供「升級成 git repo」入口
（⋯ menu 的選項 + 展開區塊的 inline 按鈕）。Server MUST 執行 `git init`
加上 empty initial commit，使新建 worktree 立即可用。

#### Scenario: Inline 按鈕 + menu 選項

- **WHEN** project 是 non-git directory
- **THEN** project row 不顯示 chevron
- **AND** project ⋯ menu 提供 `Initialize as git repo`
- **AND** 展開區塊提供 inline `[ Initialize as git repo ]` dashed button

#### Scenario: 點擊 Initialize 成功

- **WHEN** 使用者點 Initialize as git repo
- **THEN** server 跑 `git init` + `git commit --allow-empty -m "Initial commit"`
- **AND** 回應後 project 變成 git project，立刻可展開、可新增 worktree
- **AND** 廣播 `worktree:added`，其他 tab 同步看到

#### Scenario: 點擊 Initialize 失敗（已是 git repo）

- **WHEN** 該 path 已含 `.git` 目錄
- **THEN** 回應 `{ error: 'already_a_repo' }`
- **AND** UI 顯示 toast，不重複初始化

### Requirement: Server 必須廣播 worktree 變動事件

`worktree:create / delete / initRepo` 成功後，server MUST 廣播對應事件給所有
tab，跟 `projects:added / removed` 對稱。失敗時 MUST NOT 廣播。

#### Scenario: worktree:create 廣播

- **WHEN** 任一 tab 成功建立 worktree
- **THEN** server 廣播 `worktree:added { projectCwd, worktree }` 給所有 tab

#### Scenario: worktree:delete 廣播

- **WHEN** 任一 tab 成功刪除 worktree
- **THEN** server 廣播 `worktree:removed { projectCwd, name }` 給所有 tab

#### Scenario: worktree:initRepo 廣播

- **WHEN** 任一 tab 成功初始化 git repo
- **THEN** server 廣播 `worktree:added { projectCwd, worktree: main }` 給所有 tab

### Requirement: Worktree 列表必須懶載入並 cache

Worktree listing MUST 在 user 展開 project 時才 fetch（不主動全抓）。結果 MUST
cache 在 WorktreeContext，後續展開不重抓。`worktree:added / removed` 廣播
MUST 局部 patch cache，不重新抓完整列表。

#### Scenario: 首次展開觸發 fetch

- **WHEN** 使用者展開未曾 fetch 的 project
- **THEN** 呼叫 `worktree:list { cwd }`，結果 cache 在 WorktreeContext

#### Scenario: 已 cache 的展開不重新 fetch

- **WHEN** 使用者收合再展開同一 project
- **THEN** 直接用 cache，不打 server

#### Scenario: 變動事件 invalidate cache

- **WHEN** 收到 `worktree:added` / `worktree:removed`
- **THEN** 對應 project 的 cache 局部 patch（add 或 remove 一筆），不重抓全部
