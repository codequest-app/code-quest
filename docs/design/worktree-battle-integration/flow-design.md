# Worktree-Battle 整合系統流程設計

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**狀態**: 設計階段

---

## 目錄

1. [核心流程](#核心流程)
2. [戰鬥啟動流程](#戰鬥啟動流程)
3. [戰鬥進行流程](#戰鬥進行流程)
4. [戰鬥完成流程](#戰鬥完成流程)
5. [後處理流程](#後處理流程)
6. [並行管理流程](#並行管理流程)
7. [錯誤處理流程](#錯誤處理流程)
8. [公會大廳管理流程](#公會大廳管理流程)

---

## 核心流程

### 整體流程概覽

```
┌──────────────────────────────────────────────────────────┐
│                  用戶提交 Prompt                          │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │  SmartRouter 分析       │
        │  • 類型判定             │
        │  • 複雜度計算           │
        │  • 路由決策             │
        └────────────┬────────────┘
                     │
        ┌────────────┴────────────┬──────────────┐
        │                         │              │
   complexity < 3           3 <= x < 8     complexity >= 8
        │                         │              │
        ▼                         ▼              ▼
 ┌──────────────┐       ┌──────────────┐  ┌──────────────┐
 │ 對話模式      │       │ 簡單任務模式  │  │ 戰鬥模式      │
 │              │       │              │  │              │
 │ 主 CLI       │       │ 主 CLI 同步  │  │ 檢查位置      │
 │ 立即響應      │       │ 15-30 秒    │  └──────┬───────┘
 │              │       │              │         │
 │ 不創建 WT    │       │ 不創建 WT    │    ┌────▼────┐
 └──────────────┘       └──────────────┘    │ 位置？   │
                                            └────┬─────┘
                                                 │
                        ┌────────────────────────┼───────────────┐
                        │                        │               │
                    在城鎮                     在野外          在副本
                        │                        │               │
                        ▼                        ▼               ▼
                ┌───────────────┐      ┌────────────────┐ ┌──────────┐
                │ ❌ 禁止戰鬥    │      │ ✅ 觸發戰鬥     │ │✅強制戰鬥│
                │ 提示前往野外   │      │ 遭遇率判定      │ │100% 觸發│
                └───────────────┘      └────────┬───────┘ └────┬─────┘
                                                │               │
                                                └───────┬───────┘
                                                        │
                        ┌───────────────────────────────▼────────────────┐
                        │           創建 Worktree + 啟動戰鬥              │
                        │  1. 生成 worktree 名稱                         │
                        │  2. git worktree add                           │
                        │  3. spawn Claude CLI (cwd = worktree path)     │
                        │  4. 生成敵人                                    │
                        │  5. 創建 BattleWorktreeBinding                 │
                        └───────────────────────────┬────────────────────┘
                                                    │
                        ┌───────────────────────────▼────────────────────┐
                        │              戰鬥進行中                         │
                        │  • Claude CLI 執行任務                         │
                        │  • 代碼修改在 worktree 中                       │
                        │  • 實時進度更新                                 │
                        │  • 用戶可繼續對話（不阻塞）                      │
                        └───────────────────────────┬────────────────────┘
                                                    │
                        ┌───────────────────────────▼────────────────────┐
                        │              戰鬥完成                           │
                        │  • CLI 任務完成                                 │
                        │  • 關閉 CLI 進程                                │
                        │  • 統計戰果（commits, files, lines）            │
                        │  • 進入後處理階段                                │
                        └───────────────────────────┬────────────────────┘
                                                    │
                        ┌───────────────────────────▼────────────────────┐
                        │          用戶選擇後處理方式                      │
                        └───────┬──────────┬──────────┬──────────────────┘
                                │          │          │
                          ┌─────▼───┐ ┌───▼────┐ ┌──▼─────┐
                          │ 合併    │ │ 保留    │ │ 放棄    │
                          └─────┬───┘ └───┬────┘ └──┬─────┘
                                │          │          │
                    ┌───────────▼──┐  ┌───▼──────┐  ┌▼─────────┐
                    │ git merge    │  │ 保留 WT   │  │ 刪除 WT   │
                    │ remove WT    │  │ 關閉 CLI  │  │ 刪除分支  │
                    │ 獲得獎勵     │  │ 可繼續開發│  │ 丟棄代碼  │
                    └──────────────┘  └───────────┘  └──────────┘
```

---

## 戰鬥啟動流程

### 流程 1: 複雜度分析與路由

```
┌─────────────────────────────────────────────┐
│  用戶提交 Prompt: "重構認證系統"             │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼────────────┐
      │  SmartRouter.analyze()  │
      └────────────┬────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 分析 Prompt 類型                             │
      │     • 檢查問題關鍵字 (what, why, how...)         │
      │     • 檢查任務關鍵字 (fix, create, refactor...)  │
      │     → 類型: 'task'                               │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 計算複雜度                                    │
      │     • 長度因素: prompt.length = 200 → +3 分      │
      │     • 重量級關鍵字: "重構" → +3 分               │
      │     • 範圍關鍵字: "整個", "系統" → +3 分         │
      │     • 技術深度: "認證", "架構" → +2 分           │
      │     → 總複雜度: 11 分                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 路由決策                                      │
      │     if (complexity >= 8) {                       │
      │       return 'battle_async'                      │
      │     }                                            │
      │     → 決策: 戰鬥模式 ✅                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 檢查用戶位置                                  │
      │     currentZone = mapStore.currentZone           │
      │     → 'wilderness' (野外) ✅                     │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 遭遇率判定 (僅野外)                           │
      │     baseRate = WILDERNESS_ENCOUNTER_RATES['forest'] │
      │     → 0.6 (60%)                                  │
      │     roll = Math.random()                         │
      │     → 0.45 < 0.6 → 觸發戰鬥 ✅                    │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 返回戰鬥觸發結果                              │
      │     {                                            │
      │       encounter: true,                           │
      │       complexity: 11,                            │
      │       zone: 'wilderness.forest',                 │
      │       createWorktree: true                       │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
                   ▼
         [進入戰鬥創建流程]
```

### 流程 2: Worktree 自動創建

```
┌─────────────────────────────────────────────┐
│  戰鬥觸發 (encounter: true)                  │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼────────────┐
      │  檢查並行戰鬥數量        │
      │  currentBattles = 2     │
      │  maxConcurrent = 3      │
      │  → 未達上限 ✅          │
      └────────────┬────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 生成 Worktree 名稱                            │
      │     const type = determineWorktreeType(prompt)   │
      │     → 'feature' (重構 = 新功能)                  │
      │                                                  │
      │     const summary = sanitize(prompt)             │
      │     → 'refactor-auth-system'                     │
      │                                                  │
      │     const name = `${type}/${summary}`            │
      │     → 'feature/refactor-auth-system'             │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 生成文件路徑                                  │
      │     const projectRoot = '/Users/recca/project'   │
      │     const worktreesDir = `${projectRoot}/../worktrees` │
      │     const path = `${worktreesDir}/feature-refactor-auth` │
      │     → '/Users/recca/worktrees/feature-refactor-auth' │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 檢查路徑衝突                                  │
      │     if (fs.existsSync(path)) {                   │
      │       path += `-${Date.now()}`  // 加時間戳       │
      │     }                                            │
      │     → 路徑可用 ✅                                 │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 執行 Git Worktree Add                        │
      │     const cmd = [                                │
      │       'git', 'worktree', 'add',                  │
      │       '-b', 'feature/refactor-auth-system',      │
      │       '/Users/recca/worktrees/feature-refactor-auth', │
      │       'main'                                     │
      │     ]                                            │
      │                                                  │
      │     execSync(cmd.join(' '))                      │
      │     → 執行成功 ✅                                 │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 驗證創建結果                                  │
      │     • 檢查路徑存在: fs.existsSync(path) ✅       │
      │     • 檢查 Git 狀態: git status (在 path 中) ✅  │
      │     • 檢查分支: git branch --show-current ✅     │
      │     → 驗證通過 ✅                                 │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 創建 Worktree 記錄                            │
      │     const worktree = {                           │
      │       id: 'wt_' + generateId(),                  │
      │       name: 'refactor-auth-system',              │
      │       type: 'feature',                           │
      │       branch: 'feature/refactor-auth-system',    │
      │       baseBranch: 'main',                        │
      │       path: '/Users/recca/worktrees/...',        │
      │       createdAt: Date.now(),                     │
      │       createdBy: 'battle'  // 標記為戰鬥創建     │
      │     }                                            │
      │     → 記錄已保存 ✅                               │
      └────────────┬─────────────────────────────────────┘
                   │
                   ▼
         [進入 CLI 實例創建流程]
```

### 流程 3: Claude CLI 實例啟動

```
┌─────────────────────────────────────────────┐
│  Worktree 創建成功                           │
│  path: /Users/recca/worktrees/feature-...   │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 準備啟動參數                                  │
      │     const options = {                            │
      │       cwd: worktree.path,  // 工作目錄 = worktree │
      │       stdio: ['pipe', 'pipe', 'pipe'],           │
      │       env: { ...process.env }                    │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 啟動 Claude CLI 進程                         │
      │     const cliProcess = spawn(                    │
      │       'claude',                                  │
      │       ['code'],                                  │
      │       options                                    │
      │     )                                            │
      │                                                  │
      │     processId = cliProcess.pid                   │
      │     → PID: 12345 ✅                              │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 設置輸出監聽                                  │
      │     cliProcess.stdout.on('data', (data) => {     │
      │       // 解析進度                                │
      │       parseProgress(data)                        │
      │       // 廣播更新                                │
      │       broadcastProgress(battleId, progress)      │
      │     })                                           │
      │                                                  │
      │     cliProcess.stderr.on('data', (data) => {     │
      │       // 捕獲錯誤                                │
      │       handleError(data)                          │
      │     })                                           │
      │                                                  │
      │     cliProcess.on('close', (code) => {           │
      │       // 處理完成/失敗                           │
      │       handleBattleEnd(code)                      │
      │     })                                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 發送初始 Prompt                              │
      │     const initialPrompt = buildPrompt({          │
      │       userPrompt: "重構認證系統",                │
      │       context: battleContext,                    │
      │       constraints: ['在 worktree 中工作']        │
      │     })                                           │
      │                                                  │
      │     cliProcess.stdin.write(initialPrompt + '\n') │
      │     → Prompt 已發送 ✅                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 創建 CLI 實例記錄                             │
      │     const cliInstance = {                        │
      │       processId: 12345,                          │
      │       workingDir: worktree.path,                 │
      │       status: 'running',                         │
      │       startedAt: Date.now(),                     │
      │       lastActivity: Date.now()                   │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
                   ▼
         [進入戰鬥實例綁定流程]
```

### 流程 4: 戰鬥實例綁定與啟動

```
┌─────────────────────────────────────────────┐
│  Worktree 已創建                             │
│  CLI 實例已啟動                              │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 生成敵人                                      │
      │     const enemy = generateEnemy({                │
      │       prompt: "重構認證系統",                     │
      │       complexity: 11,                            │
      │       zone: 'wilderness.forest'                  │
      │     })                                           │
      │                                                  │
      │     → {                                          │
      │         type: 'Legacy Code Dragon',              │
      │         level: 7,                                │
      │         hp: 1100,                                │
      │         attacks: ['Technical Debt', 'Code Smell'] │
      │       }                                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 創建戰鬥實例                                  │
      │     const battle = {                             │
      │       id: 'battle_' + generateId(),              │
      │       prompt: "重構認證系統",                     │
      │       complexity: 11,                            │
      │       enemy: enemy,                              │
      │       status: 'in_progress',                     │
      │       progress: 0,                               │
      │       startedAt: Date.now()                      │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 創建 BattleWorktreeBinding                   │
      │     const binding = {                            │
      │       id: 'bw_' + generateId(),                  │
      │       battle: battle,                            │
      │       worktree: worktree,                        │
      │       cliInstance: cliInstance,                  │
      │       binding: {                                 │
      │         createdBy: 'battle',                     │
      │         autoCreated: true,                       │
      │         canDetach: false  // 戰鬥期間不可解綁     │
      │       },                                         │
      │       lifecycle: {                               │
      │         phase: 'in_progress',                    │
      │         canMerge: false,  // 戰鬥中不可合併       │
      │         canDiscard: true  // 可取消              │
      │       }                                          │
      │     }                                            │
      │                                                  │
      │     battleWorktreeManager.add(binding)           │
      │     → Binding 已創建並保存 ✅                     │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 通知用戶                                      │
      │     const notification = {                       │
      │       type: 'battle_started',                    │
      │       title: '⚔️ 遭遇戰鬥！',                     │
      │       message: `                                 │
      │         敵人: Legacy Code Dragon (Lv.7)          │
      │         📂 已創建平行時間線:                      │
      │            feature/refactor-auth-system          │
      │         🤖 Claude CLI 已啟動，戰鬥開始...         │
      │       `,                                         │
      │       battleId: battle.id,                       │
      │       actions: [                                 │
      │         { label: '查看詳情', action: 'view' },   │
      │         { label: '前往公會大廳', action: 'guild' } │
      │       ]                                          │
      │     }                                            │
      │                                                  │
      │     websocket.emit('battle:started', notification) │
      │     → 用戶已收到通知 ✅                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 更新 UI 狀態                                  │
      │     • 戰鬥列表中添加新戰鬥                         │
      │     • 顯示進度條 (0%)                             │
      │     • 更新公會大廳"活躍戰鬥"計數                   │
      │     • 地圖上顯示"戰鬥中"標記                       │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 允許用戶繼續對話                              │
      │     mainCLI.status = 'idle'  // 釋放主 CLI       │
      │     → 用戶可以繼續提問 ✅                          │
      └──────────────────────────────────────────────────┘
```

---

## 戰鬥進行流程

### 流程 5: 進度追蹤與更新

```
┌─────────────────────────────────────────────┐
│  戰鬥進行中                                  │
│  CLI 進程輸出: stdout 數據流                 │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 監聽 CLI 輸出                                │
      │     cliProcess.stdout.on('data', (chunk) => {    │
      │       outputBuffer += chunk.toString()           │
      │       processOutput(outputBuffer)                │
      │     })                                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 解析輸出內容                                  │
      │     // 檢測工具調用                              │
      │     if (output.includes('<tool_use>')) {         │
      │       const tool = parseToolUse(output)          │
      │       recordToolUse(battleId, tool)              │
      │     }                                            │
      │                                                  │
      │     // 檢測 Git 操作                             │
      │     if (output.includes('git commit')) {         │
      │       stats.commits++                            │
      │     }                                            │
      │                                                  │
      │     // 檢測文件修改                              │
      │     if (output.includes('Modified:')) {          │
      │       const file = parseModifiedFile(output)     │
      │       stats.filesChanged.add(file)               │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 計算進度                                      │
      │     // 基於多種指標估算進度                       │
      │     const progress = calculateProgress({         │
      │       toolUsesCompleted: stats.toolUses.length,  │
      │       commitsCreated: stats.commits,             │
      │       filesModified: stats.filesChanged.size,    │
      │       estimatedComplexity: battle.complexity,    │
      │       elapsedTime: Date.now() - battle.startedAt │
      │     })                                           │
      │                                                  │
      │     → progress = 35% ✅                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 更新戰鬥狀態                                  │
      │     battle.progress = 35                         │
      │     battle.stats = stats                         │
      │     battle.lastActivity = Date.now()             │
      │                                                  │
      │     battleWorktreeManager.update(battleId, {     │
      │       progress: 35,                              │
      │       stats: stats                               │
      │     })                                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 廣播進度更新                                  │
      │     websocket.emit('battle:progress', {          │
      │       battleId: battle.id,                       │
      │       progress: 35,                              │
      │       stats: {                                   │
      │         commits: 3,                              │
      │         filesChanged: 8,                         │
      │         linesAdded: 150,                         │
      │         linesDeleted: 45                         │
      │       },                                         │
      │       currentAction: 'Refactoring auth service'  │
      │     })                                           │
      │     → UI 收到更新並刷新進度條 ✅                   │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 定期保存檢查點                                │
      │     if (progress % 10 === 0) {  // 每 10% 保存   │
      │       saveCheckpoint({                           │
      │         battleId,                                │
      │         progress,                                │
      │         worktreePath: worktree.path,             │
      │         gitStatus: execSync('git status'),       │
      │         timestamp: Date.now()                    │
      │       })                                         │
      │     }                                            │
      │     → 檢查點已保存 ✅                              │
      └──────────────────────────────────────────────────┘

      循環：繼續監聽 CLI 輸出，直到戰鬥完成
```

### 流程 6: Git 操作追蹤

```
┌─────────────────────────────────────────────┐
│  CLI 在 Worktree 中執行 Git 操作             │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  監控 Worktree 目錄變化                           │
      │  使用 fs.watch() 或 Git Hooks                    │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 檢測 Commit                                  │
      │     當執行: git commit -m "..."                  │
      │                                                  │
      │     記錄:                                        │
      │     {                                            │
      │       type: 'commit',                            │
      │       hash: 'abc123',                            │
      │       message: 'Refactor auth service',          │
      │       timestamp: Date.now(),                     │
      │       filesChanged: ['src/auth.ts', 'src/user.ts'], │
      │       linesAdded: 85,                            │
      │       linesDeleted: 32                           │
      │     }                                            │
      │                                                  │
      │     stats.commits++                              │
      │     stats.activities.push(commitRecord)          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 統計文件修改                                  │
      │     執行: git diff --stat HEAD~1 HEAD            │
      │                                                  │
      │     解析輸出:                                    │
      │     src/auth.ts     | 45 ++++++++++++---          │
      │     src/user.ts     | 28 +++++----              │
      │     tests/auth.test.ts | 56 +++++++++++++++++++ │
      │                                                  │
      │     更新:                                        │
      │     stats.filesChanged = 15                      │
      │     stats.linesAdded += 129                      │
      │     stats.linesDeleted += 32                     │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 檢測分支狀態                                  │
      │     執行: git status --porcelain                 │
      │                                                  │
      │     if (output.length > 0) {                     │
      │       flags.hasUncommitted = true                │
      │     }                                            │
      │                                                  │
      │     執行: git diff main...HEAD --name-only       │
      │     → 獲取與主分支的差異文件列表                  │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 廣播 Git 活動                                │
      │     websocket.emit('battle:git_activity', {      │
      │       battleId,                                  │
      │       activity: 'commit',                        │
      │       message: 'Refactor auth service',          │
      │       stats: stats                               │
      │     })                                           │
      │     → UI 更新統計顯示 ✅                          │
      └──────────────────────────────────────────────────┘
```

---

## 戰鬥完成流程

### 流程 7: CLI 任務完成檢測

```
┌─────────────────────────────────────────────┐
│  CLI 進程輸出結束信號                        │
│  cliProcess.on('close', (code) => {...})    │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 檢查退出碼                                    │
      │     if (code === 0) {                            │
      │       result = 'success'                         │
      │     } else {                                     │
      │       result = 'error'                           │
      │     }                                            │
      │     → code = 0 → 成功 ✅                         │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 收集最終統計                                  │
      │     // Git 統計                                  │
      │     const gitStats = execSync(                   │
      │       'git diff main...HEAD --stat',             │
      │       { cwd: worktree.path }                     │
      │     )                                            │
      │                                                  │
      │     // Commits 數量                              │
      │     const commits = execSync(                    │
      │       'git rev-list --count HEAD ^main',         │
      │       { cwd: worktree.path }                     │
      │     )                                            │
      │                                                  │
      │     finalStats = {                               │
      │       commits: 12,                               │
      │       filesChanged: 15,                          │
      │       linesAdded: 450,                           │
      │       linesDeleted: 120,                         │
      │       duration: Date.now() - battle.startedAt    │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 判定戰鬥結果                                  │
      │     if (result === 'success' && commits > 0) {   │
      │       battleResult = 'victory'                   │
      │     } else if (result === 'error') {             │
      │       battleResult = 'defeat'                    │
      │     } else {                                     │
      │       battleResult = 'flee'  // 無 commit = 逃跑 │
      │     }                                            │
      │     → battleResult = 'victory' ✅                │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 更新戰鬥狀態                                  │
      │     battle.status = 'completed'                  │
      │     battle.result = 'victory'                    │
      │     battle.completedAt = Date.now()              │
      │     battle.stats = finalStats                    │
      │                                                  │
      │     battleWorktreeManager.update(battleId, {     │
      │       status: 'completed',                       │
      │       result: 'victory',                         │
      │       stats: finalStats,                         │
      │       lifecycle: {                               │
      │         phase: 'post_battle',                    │
      │         canMerge: true,  // 現在可以合併          │
      │         canKeep: true,                           │
      │         canDiscard: true                         │
      │       }                                          │
      │     })                                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 關閉 CLI 實例                                │
      │     if (cliProcess && !cliProcess.killed) {      │
      │       cliProcess.kill('SIGTERM')                 │
      │     }                                            │
      │                                                  │
      │     cliInstance.status = 'stopped'               │
      │     cliInstance.stoppedAt = Date.now()           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 檢查隊列                                      │
      │     if (battleQueue.length > 0) {                │
      │       const nextBattle = battleQueue.shift()     │
      │       startBattle(nextBattle)  // 啟動下一個戰鬥  │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
                   ▼
         [進入後處理選項流程]
```

### 流程 8: 勝利通知與選項展示

```
┌─────────────────────────────────────────────┐
│  戰鬥結果: victory                           │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 計算獎勵                                      │
      │     const rewards = calculateRewards({           │
      │       result: 'victory',                         │
      │       complexity: battle.complexity,             │
      │       stats: finalStats                          │
      │     })                                           │
      │                                                  │
      │     → {                                          │
      │         exp: 120,  // 基於複雜度                 │
      │         gold: 85,  // 基於文件數和行數            │
      │         items: ['重構寶典', '性能藥水']           │
      │       }                                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 生成代碼差異預覽                              │
      │     const diff = execSync(                       │
      │       'git diff --stat main...HEAD',             │
      │       { cwd: worktree.path }                     │
      │     )                                            │
      │                                                  │
      │     const diffSummary = parseDiffStat(diff)      │
      │     → "15 files changed, 450 insertions(+), 120 deletions(-)" │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 構建後處理選項                                │
      │     const options = [                            │
      │       {                                          │
      │         id: 'merge',                             │
      │         label: '合併到主分支',                    │
      │         icon: '🔀',                              │
      │         description: '審查代碼並合併到 main',      │
      │         mpCost: 20,                              │
      │         action: 'merge'                          │
      │       },                                         │
      │       {                                          │
      │         id: 'keep',                              │
      │         label: '保留繼續開發',                    │
      │         icon: '💾',                              │
      │         description: 'Worktree 保持存在',         │
      │         mpCost: 0,                               │
      │         action: 'keep'                           │
      │       },                                         │
      │       {                                          │
      │         id: 'discard',                           │
      │         label: '放棄此分支',                      │
      │         icon: '🗑️',                              │
      │         description: '刪除 worktree 和所有修改',   │
      │         mpCost: 0,                               │
      │         action: 'discard',                       │
      │         confirm: true  // 需要二次確認            │
      │       }                                          │
      │     ]                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 發送通知                                      │
      │     websocket.emit('battle:completed', {         │
      │       battleId: battle.id,                       │
      │       result: 'victory',                         │
      │       enemy: battle.enemy,                       │
      │       stats: finalStats,                         │
      │       rewards: rewards,                          │
      │       diff: diffSummary,                         │
      │       options: options,                          │
      │       message: `                                 │
      │         🎉 戰鬥勝利！                             │
      │         成功重構認證系統                          │
      │                                                  │
      │         📊 戰果:                                  │
      │         • 12 commits                             │
      │         • 15 files changed                       │
      │         • +450 / -120 lines                      │
      │                                                  │
      │         🏆 獎勵:                                  │
      │         • +120 EXP                               │
      │         • +85 金幣                                │
      │       `                                          │
      │     })                                           │
      │     → 用戶收到完成通知 ✅                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. UI 顯示選項對話框                             │
      │     ┌──────────────────────────────────────┐    │
      │     │ 🎉 戰鬥勝利！Legacy Code Dragon      │    │
      │     ├──────────────────────────────────────┤    │
      │     │ 📊 戰果:                              │    │
      │     │ • 12 commits                         │    │
      │     │ • 15 files changed (+450/-120)       │    │
      │     ├──────────────────────────────────────┤    │
      │     │ 🔀 請選擇後續操作:                    │    │
      │     │                                      │    │
      │     │ [1] 合併到主分支  -20 MP             │    │
      │     │     審查代碼並合併到 main             │    │
      │     │                                      │    │
      │     │ [2] 保留繼續開發  免費               │    │
      │     │     Worktree 保持存在，稍後繼續       │    │
      │     │                                      │    │
      │     │ [3] 放棄此分支    免費               │    │
      │     │     刪除 worktree 和所有修改          │    │
      │     └──────────────────────────────────────┘    │
      └──────────────────────────────────────────────────┘

      等待用戶選擇...
```

---

## 後處理流程

### 流程 9: 選項 1 - 合併 (Merge)

```
┌─────────────────────────────────────────────┐
│  用戶選擇: 合併到主分支                      │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 檢查前置條件                                  │
      │     // 檢查 MP                                   │
      │     if (player.mp < 20) {                        │
      │       return error('MP 不足')                    │
      │     }                                            │
      │                                                  │
      │     // 檢查合併衝突                              │
      │     execSync('git fetch origin main')            │
      │     const conflicts = execSync(                  │
      │       'git merge-base --is-ancestor main HEAD',  │
      │       { cwd: worktree.path }                     │
      │     )                                            │
      │     if (conflicts) {                             │
      │       return error('存在合併衝突，請手動解決')    │
      │     }                                            │
      │     → 前置條件通過 ✅                             │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 顯示代碼差異審查                              │
      │     const fullDiff = execSync(                   │
      │       'git diff main...HEAD',                    │
      │       { cwd: worktree.path }                     │
      │     )                                            │
      │                                                  │
      │     UI 顯示:                                     │
      │     ┌────────────────────────────────────────┐  │
      │     │ 📝 代碼審查                            │  │
      │     ├────────────────────────────────────────┤  │
      │     │ src/auth.ts                            │  │
      │     │ + export class AuthService {           │  │
      │     │ +   async login(credentials) { ...     │  │
      │     │ - // Old login logic                   │  │
      │     │                                        │  │
      │     │ [顯示完整 diff...]                     │  │
      │     ├────────────────────────────────────────┤  │
      │     │ [取消] [確認合併]                      │  │
      │     └────────────────────────────────────────┘  │
      │                                                  │
      │     用戶點擊"確認合併" → 繼續                     │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 切換到主分支並合併                            │
      │     const projectRoot = '/Users/recca/project'   │
      │                                                  │
      │     // 在主項目目錄執行                           │
      │     execSync('git checkout main', {              │
      │       cwd: projectRoot                           │
      │     })                                           │
      │                                                  │
      │     execSync(                                    │
      │       `git merge feature/refactor-auth-system --no-ff -m "Merge: Refactor auth system"`, │
      │       { cwd: projectRoot }                       │
      │     )                                            │
      │     → 合併成功 ✅                                 │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 推送到遠程 (可選)                             │
      │     if (userPreferences.autoPush) {              │
      │       execSync('git push origin main', {         │
      │         cwd: projectRoot                         │
      │       })                                         │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 清理 Worktree                                │
      │     execSync(                                    │
      │       `git worktree remove ${worktree.path}`,    │
      │       { cwd: projectRoot }                       │
      │     )                                            │
      │                                                  │
      │     execSync(                                    │
      │       `git branch -d feature/refactor-auth-system`, │
      │       { cwd: projectRoot }                       │
      │     )                                            │
      │     → Worktree 和分支已刪除 ✅                    │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 扣除 MP 並發放獎勵                            │
      │     player.mp -= 20                              │
      │     player.exp += rewards.exp                    │
      │     player.gold += rewards.gold                  │
      │     player.inventory.add(rewards.items)          │
      │                                                  │
      │     // 檢查升級                                  │
      │     if (player.exp >= player.nextLevelExp) {     │
      │       levelUp(player)                            │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  7. 歸檔戰鬥記錄                                  │
      │     battleWorktreeManager.archive(battleId, {    │
      │       mergedAt: Date.now(),                      │
      │       mergeCommit: 'abc123',                     │
      │       status: 'merged'                           │
      │     })                                           │
      │                                                  │
      │     // 從活躍列表移除                            │
      │     battleWorktreeManager.remove(battleId)       │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  8. 通知用戶完成                                  │
      │     websocket.emit('battle:merged', {            │
      │       battleId,                                  │
      │       message: '✅ 成功合併到主分支！',           │
      │       rewards: {                                 │
      │         exp: 120,                                │
      │         gold: 85,                                │
      │         items: ['重構寶典']                       │
      │       },                                         │
      │       playerStats: {                             │
      │         level: player.level,                     │
      │         exp: player.exp,                         │
      │         mp: player.mp                            │
      │       }                                          │
      │     })                                           │
      │     → 用戶收到完成通知 ✅                          │
      └──────────────────────────────────────────────────┘
```

### 流程 10: 選項 2 - 保留 (Keep)

```
┌─────────────────────────────────────────────┐
│  用戶選擇: 保留繼續開發                      │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 確認操作                                      │
      │     UI 提示:                                     │
      │     "💾 Worktree 將保留，您可以稍後繼續開發或合併"  │
      │                                                  │
      │     [取消] [確認]                                │
      │                                                  │
      │     用戶點擊"確認" → 繼續                         │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 關閉 CLI 實例                                │
      │     if (cliProcess && !cliProcess.killed) {      │
      │       cliProcess.kill('SIGTERM')                 │
      │     }                                            │
      │                                                  │
      │     cliInstance.status = 'stopped'               │
      │     cliInstance.stoppedAt = Date.now()           │
      │     → CLI 已關閉 ✅                               │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 更新 Worktree 狀態                            │
      │     worktree.status = 'kept'                     │
      │     worktree.keptAt = Date.now()                 │
      │     worktree.keptReason = 'user_choice'          │
      │                                                  │
      │     battleWorktreeManager.update(battleId, {     │
      │       status: 'kept',                            │
      │       lifecycle: {                               │
      │         phase: 'kept',                           │
      │         canMerge: true,   // 稍後可合併           │
      │         canResume: true,  // 可恢復開發           │
      │         canDiscard: true  // 可刪除              │
      │       }                                          │
      │     })                                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 移動到"保留列表"                              │
      │     // 從活躍戰鬥列表移除                         │
      │     activeBattles.remove(battleId)               │
      │                                                  │
      │     // 添加到保留列表                            │
      │     keptWorktrees.add({                          │
      │       battleId,                                  │
      │       worktree,                                  │
      │       keptAt: Date.now(),                        │
      │       stats: finalStats                          │
      │     })                                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 不消耗 MP，不發放獎勵                         │
      │     // MP 消耗: 0                                │
      │     // 獎勵: 延遲到合併時發放                     │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 通知用戶                                      │
      │     websocket.emit('battle:kept', {              │
      │       battleId,                                  │
      │       worktree: {                                │
      │         name: worktree.name,                     │
      │         path: worktree.path,                     │
      │         branch: worktree.branch                  │
      │       },                                         │
      │       message: `                                 │
      │         💾 Worktree 已保留                        │
      │                                                  │
      │         📂 位置: ${worktree.path}                 │
      │         🌿 分支: ${worktree.branch}               │
      │                                                  │
      │         您可以在公會大廳管理此 worktree:           │
      │         • 繼續開發                                │
      │         • 稍後合併                                │
      │         • 刪除                                    │
      │       `,                                         │
      │       actions: [                                 │
      │         { label: '前往公會大廳', action: 'guild' }, │
      │         { label: '關閉', action: 'close' }        │
      │       ]                                          │
      │     })                                           │
      │     → 用戶收到通知 ✅                              │
      └──────────────────────────────────────────────────┘
```

### 流程 11: 選項 3 - 放棄 (Discard)

```
┌─────────────────────────────────────────────┐
│  用戶選擇: 放棄此分支                        │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 二次確認（防止誤操作）                        │
      │     UI 警告對話框:                               │
      │     ┌────────────────────────────────────────┐  │
      │     │ ⚠️ 確認放棄？                          │  │
      │     ├────────────────────────────────────────┤  │
      │     │ 此操作將:                              │  │
      │     │ • 刪除 worktree                        │  │
      │     │ • 刪除分支 feature/refactor-auth       │  │
      │     │ • 丟失所有代碼修改 (12 commits)        │  │
      │     │                                        │  │
      │     │ ⚠️ 此操作不可恢復！                    │  │
      │     ├────────────────────────────────────────┤  │
      │     │ [取消] [確認放棄]                      │  │
      │     └────────────────────────────────────────┘  │
      │                                                  │
      │     用戶點擊"確認放棄" → 繼續                     │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 關閉 CLI 實例                                │
      │     if (cliProcess && !cliProcess.killed) {      │
      │       cliProcess.kill('SIGTERM')                 │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 強制刪除 Worktree                            │
      │     const projectRoot = '/Users/recca/project'   │
      │                                                  │
      │     execSync(                                    │
      │       `git worktree remove ${worktree.path} --force`, │
      │       { cwd: projectRoot }                       │
      │     )                                            │
      │     → Worktree 目錄已刪除 ✅                      │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 強制刪除分支                                  │
      │     execSync(                                    │
      │       `git branch -D feature/refactor-auth-system`, │
      │       { cwd: projectRoot }                       │
      │     )                                            │
      │     → 分支已刪除 ✅                                │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 刪除戰鬥記錄                                  │
      │     battleWorktreeManager.delete(battleId)       │
      │                                                  │
      │     // 不歸檔，直接刪除                           │
      │     → 記錄已刪除 ✅                                │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 不消耗 MP，不發放獎勵                         │
      │     // MP 消耗: 0                                │
      │     // 獎勵: 無                                  │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  7. 通知用戶                                      │
      │     websocket.emit('battle:discarded', {         │
      │       battleId,                                  │
      │       message: `                                 │
      │         🗑️ Worktree 已放棄                       │
      │                                                  │
      │         已刪除:                                   │
      │         • Worktree: feature-refactor-auth        │
      │         • 分支: feature/refactor-auth-system     │
      │         • 12 commits, 15 files, 450+ lines       │
      │                                                  │
      │         代碼修改已全部丟失。                       │
      │       `                                          │
      │     })                                           │
      │     → 用戶收到通知 ✅                              │
      └──────────────────────────────────────────────────┘
```

---

## 並行管理流程

### 流程 12: 並行限制與排隊

```
┌─────────────────────────────────────────────┐
│  新戰鬥請求到達                              │
│  當前活躍戰鬥數: 3 (達到上限)                │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 檢查並行限制                                  │
      │     const activeBattles = battleWorktreeManager  │
      │       .getActive()                               │
      │       .length                                    │
      │     → activeBattles = 3                          │
      │                                                  │
      │     const maxConcurrent = 3                      │
      │                                                  │
      │     if (activeBattles >= maxConcurrent) {        │
      │       addToQueue()  // 加入隊列                  │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 創建排隊記錄                                  │
      │     const queueEntry = {                         │
      │       id: 'queue_' + generateId(),               │
      │       prompt: "優化資料庫查詢",                   │
      │       complexity: 9,                             │
      │       priority: 'normal',  // normal/high/urgent │
      │       queuedAt: Date.now(),                      │
      │       estimatedWaitTime: calculateWaitTime()     │
      │     }                                            │
      │                                                  │
      │     battleQueue.add(queueEntry)                  │
      │     → queuePosition = 1 ✅                       │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 計算預估等待時間                              │
      │     const activeBattlesRemaining = activeBattles │
      │       .map(b => b.estimatedRemainingTime)        │
      │                                                  │
      │     const minRemaining = Math.min(               │
      │       ...activeBattlesRemaining                  │
      │     )                                            │
      │     → minRemaining = 3 分鐘                      │
      │                                                  │
      │     queueEntry.estimatedWaitTime = minRemaining  │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 通知用戶排隊狀態                              │
      │     websocket.emit('battle:queued', {            │
      │       queueId: queueEntry.id,                    │
      │       position: 1,                               │
      │       estimatedWaitTime: '3-5 分鐘',             │
      │       currentActiveBattles: [                    │
      │         { id: 'battle_1', progress: 65% },       │
      │         { id: 'battle_2', progress: 40% },       │
      │         { id: 'battle_3', progress: 20% }        │
      │       ],                                         │
      │       message: `                                 │
      │         ⏸️ 當前並行上限已滿 (3/3)                │
      │                                                  │
      │         您的戰鬥已排隊:                           │
      │         • 位置: #1                               │
      │         • 預估等待: 3-5 分鐘                     │
      │                                                  │
      │         當有戰鬥完成時將自動啟動。                │
      │       `,                                         │
      │       actions: [                                 │
      │         { label: '取消排隊', action: 'cancel' },  │
      │         { label: '查看隊列', action: 'view_queue' } │
      │       ]                                          │
      │     })                                           │
      │     → 用戶收到排隊通知 ✅                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 定期更新排隊狀態                              │
      │     setInterval(() => {                          │
      │       const updatedWaitTime = recalculateWait()  │
      │       const newPosition = getQueuePosition()     │
      │                                                  │
      │       websocket.emit('battle:queue_update', {    │
      │         queueId: queueEntry.id,                  │
      │         position: newPosition,                   │
      │         estimatedWaitTime: updatedWaitTime       │
      │       })                                         │
      │     }, 30000)  // 每 30 秒更新                   │
      └──────────────────────────────────────────────────┘

      等待戰鬥完成...
```

### 流程 13: 自動啟動排隊戰鬥

```
┌─────────────────────────────────────────────┐
│  戰鬥 #2 完成（勝利/失敗）                   │
│  活躍戰鬥數: 3 → 2                           │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 檢測戰鬥完成事件                              │
      │     battleWorktreeManager.on('battle:completed', │
      │       (battleId) => {                            │
      │         checkQueue()  // 檢查隊列                │
      │       }                                          │
      │     )                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 檢查隊列是否為空                              │
      │     if (battleQueue.length === 0) {              │
      │       return  // 無排隊戰鬥                       │
      │     }                                            │
      │     → 隊列有 1 個戰鬥 ✅                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 取出第一個排隊戰鬥                            │
      │     const nextBattle = battleQueue.shift()       │
      │     → {                                          │
      │         id: 'queue_001',                         │
      │         prompt: "優化資料庫查詢",                 │
      │         complexity: 9                            │
      │       }                                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 通知用戶戰鬥即將啟動                          │
      │     websocket.emit('battle:queue_starting', {    │
      │       queueId: nextBattle.id,                    │
      │       message: '✅ 輪到您了！戰鬥即將開始...'     │
      │     })                                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 啟動戰鬥                                      │
      │     await startBattle({                          │
      │       prompt: nextBattle.prompt,                 │
      │       complexity: nextBattle.complexity,         │
      │       fromQueue: true,                           │
      │       queueId: nextBattle.id                     │
      │     })                                           │
      │     → 執行完整的戰鬥啟動流程                       │
      │        (創建 worktree + 啟動 CLI + 生成敵人)      │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  6. 更新隊列中其他戰鬥的位置                      │
      │     battleQueue.forEach((entry, index) => {      │
      │       entry.position = index + 1                 │
      │       websocket.emit('battle:queue_update', {    │
      │         queueId: entry.id,                       │
      │         position: entry.position                 │
      │       })                                         │
      │     })                                           │
      └──────────────────────────────────────────────────┘
```

---

## 錯誤處理流程

### 流程 14: Git 操作失敗

```
┌─────────────────────────────────────────────┐
│  Git Worktree Add 失敗                       │
│  Error: fatal: ... (各種 Git 錯誤)          │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 捕獲錯誤                                      │
      │     try {                                        │
      │       execSync('git worktree add ...')           │
      │     } catch (error) {                            │
      │       handleGitError(error)                      │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 分析錯誤類型                                  │
      │     const errorType = parseGitError(error)       │
      │                                                  │
      │     類型:                                        │
      │     • 'path_exists': 路徑已存在                  │
      │     • 'invalid_branch': 分支名稱無效             │
      │     • 'permission_denied': 權限不足              │
      │     • 'disk_full': 磁盤空間不足                  │
      │     • 'unknown': 未知錯誤                        │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 自動重試（某些錯誤）                          │
      │     if (errorType === 'path_exists') {           │
      │       // 生成新路徑                              │
      │       const newPath = generateUniquePath()       │
      │       retry(newPath)  // 重試最多 3 次           │
      │     }                                            │
      │                                                  │
      │     if (errorType === 'invalid_branch') {        │
      │       // 清理分支名稱                            │
      │       const cleanedName = sanitizeBranchName()   │
      │       retry(cleanedName)                         │
      │     }                                            │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 如果重試失敗或不可重試                        │
      │     // 取消戰鬥創建                              │
      │     cancelBattleCreation(battleId)               │
      │                                                  │
      │     // 清理已創建的資源                          │
      │     cleanup()                                    │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 通知用戶（非技術用語）                        │
      │     const userMessage = translateError(errorType) │
      │                                                  │
      │     示例翻譯:                                    │
      │     'path_exists' →                              │
      │       "⚠️ 無法創建平行時間線，路徑已被占用"       │
      │                                                  │
      │     'permission_denied' →                        │
      │       "⚠️ 權限不足，請確保有寫入權限"             │
      │                                                  │
      │     'disk_full' →                                │
      │       "⚠️ 磁盤空間不足，請清理文件後重試"         │
      │                                                  │
      │     websocket.emit('battle:creation_failed', {   │
      │       battleId,                                  │
      │       message: userMessage,                      │
      │       suggestion: getSuggestion(errorType),      │
      │       actions: [                                 │
      │         { label: '重試', action: 'retry' },      │
      │         { label: '取消', action: 'cancel' }      │
      │       ]                                          │
      │     })                                           │
      └──────────────────────────────────────────────────┘
```

### 流程 15: CLI 進程崩潰

```
┌─────────────────────────────────────────────┐
│  CLI 進程異常退出                            │
│  cliProcess.on('exit', (code, signal))      │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 檢測異常退出                                  │
      │     if (code !== 0 && code !== null) {           │
      │       // 非正常退出                              │
      │       handleCrash()                              │
      │     }                                            │
      │     → code = 1 (錯誤) ✅                         │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 保存當前進度                                  │
      │     const checkpoint = {                         │
      │       battleId,                                  │
      │       progress: battle.progress,                 │
      │       worktreePath: worktree.path,               │
      │       stats: battle.stats,                       │
      │       lastOutput: cliOutputBuffer,               │
      │       crashedAt: Date.now()                      │
      │     }                                            │
      │                                                  │
      │     saveCheckpoint(checkpoint)                   │
      │     → 檢查點已保存 ✅                              │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 分析崩潰原因                                  │
      │     const crashReason = analyzeCrash({           │
      │       exitCode: code,                            │
      │       signal: signal,                            │
      │       stderr: stderrBuffer,                      │
      │       lastOutput: cliOutputBuffer                │
      │     })                                           │
      │                                                  │
      │     可能原因:                                    │
      │     • 'oom': 內存不足                            │
      │     • 'compile_error': 編譯錯誤                  │
      │     • 'timeout': 超時                            │
      │     • 'network_error': 網絡錯誤                  │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 更新戰鬥狀態為"失敗"                          │
      │     battle.status = 'failed'                     │
      │     battle.failedAt = Date.now()                 │
      │     battle.failureReason = crashReason           │
      │                                                  │
      │     battleWorktreeManager.update(battleId, {     │
      │       status: 'failed',                          │
      │       error: crashReason                         │
      │     })                                           │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  5. 提供恢復選項                                  │
      │     websocket.emit('battle:failed', {            │
      │       battleId,                                  │
      │       reason: crashReason,                       │
      │       checkpoint: checkpoint,                    │
      │       message: `                                 │
      │         ⚠️ 戰鬥遇到困難！                        │
      │                                                  │
      │         原因: ${translateReason(crashReason)}    │
      │         進度已保存: ${battle.progress}%          │
      │                                                  │
      │         📂 Worktree 保持完整:                    │
      │            ${worktree.path}                      │
      │       `,                                         │
      │       options: [                                 │
      │         {                                        │
      │           id: 'restart',                         │
      │           label: '重新開始戰鬥',                  │
      │           mpCost: 10,                            │
      │           description: '重新啟動 CLI，從頭開始'   │
      │         },                                       │
      │         {                                        │
      │           id: 'keep',                            │
      │           label: '保留 Worktree 手動修復',        │
      │           mpCost: 0,                             │
      │           description: '在 Worktree 中手動解決問題' │
      │         },                                       │
      │         {                                        │
      │           id: 'discard',                         │
      │           label: '放棄戰鬥',                      │
      │           mpCost: 0,                             │
      │           description: '刪除 worktree 和修改'    │
      │         }                                        │
      │       ]                                          │
      │     })                                           │
      └──────────────────────────────────────────────────┘

      等待用戶選擇...
```

---

## 公會大廳管理流程

### 流程 16: 查看活躍戰鬥

```
┌─────────────────────────────────────────────┐
│  用戶進入公會大廳 (Guild Hall)               │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  1. 獲取所有活躍戰鬥                              │
      │     const activeBattles =                        │
      │       battleWorktreeManager.getActive()          │
      │                                                  │
      │     → [                                          │
      │         {                                        │
      │           id: 'battle_1',                        │
      │           enemy: 'Legacy Code Dragon',           │
      │           worktree: 'feature/refactor-auth',     │
      │           progress: 65,                          │
      │           stats: { commits: 8, files: 12 }       │
      │         },                                       │
      │         {                                        │
      │           id: 'battle_3',                        │
      │           enemy: 'Performance Demon',            │
      │           worktree: 'feature/db-optimization',   │
      │           progress: 35,                          │
      │           stats: { commits: 3, files: 5 }        │
      │         }                                        │
      │       ]                                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  2. 獲取排隊戰鬥                                  │
      │     const queuedBattles = battleQueue.getAll()   │
      │                                                  │
      │     → [                                          │
      │         {                                        │
      │           id: 'queue_1',                         │
      │           prompt: "優化資料庫查詢",               │
      │           position: 1,                           │
      │           estimatedWait: '2-3 分鐘'              │
      │         }                                        │
      │       ]                                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  3. 獲取保留的 Worktree                           │
      │     const keptWorktrees =                        │
      │       battleWorktreeManager.getKept()            │
      │                                                  │
      │     → [                                          │
      │         {                                        │
      │           id: 'battle_5',                        │
      │           worktree: 'feature/api-v2',            │
      │           keptAt: '2 天前',                      │
      │           stats: { commits: 25, files: 35 }      │
      │         }                                        │
      │       ]                                          │
      └────────────┬─────────────────────────────────────┘
                   │
      ┌────────────▼─────────────────────────────────────┐
      │  4. 渲染公會大廳 UI                               │
      │     ┌────────────────────────────────────────┐  │
      │     │ 🏛️ 公會大廳 - Worktree 管理中心        │  │
      │     ├────────────────────────────────────────┤  │
      │     │ 🎯 活躍戰鬥 (2)                         │  │
      │     │                                        │  │
      │     │ ⚔️ #1: Legacy Code Dragon              │  │
      │     │    📂 feature/refactor-auth            │  │
      │     │    ━━━━━━━━━━━━━━━━━━━━━ 65%          │  │
      │     │    🕐 5 分鐘前 | 8 commits, 12 files   │  │
      │     │    [詳情] [暫停] [取消]                │  │
      │     │                                        │  │
      │     │ ⚔️ #3: Performance Demon               │  │
      │     │    📂 feature/db-optimization          │  │
      │     │    ━━━━━━━━━ 35%                       │  │
      │     │    🕐 2 分鐘前 | 3 commits, 5 files    │  │
      │     │    [詳情] [暫停] [取消]                │  │
      │     ├────────────────────────────────────────┤  │
      │     │ ⏸️ 排隊中 (1)                           │  │
      │     │                                        │  │
      │     │ 🔄 #1: 優化資料庫查詢                  │  │
      │     │    等待位置釋放... (預估 2-3 分鐘)     │  │
      │     │    [取消]                              │  │
      │     ├────────────────────────────────────────┤  │
      │     │ 📦 保留的 Worktree (1)                  │  │
      │     │                                        │  │
      │     │ ⚔️ API Redesign (已完成)               │  │
      │     │    📂 feature/api-v2                   │  │
      │     │    🕐 2 天前 | 25 commits, 35 files    │  │
      │     │    [繼續開發] [合併] [刪除]            │  │
      │     └────────────────────────────────────────┘  │
      └──────────────────────────────────────────────────┘
```

---

## 總結

本流程設計文檔詳細描述了 Worktree-Battle 整合系統的所有關鍵流程：

**核心流程**:
1. ✅ 戰鬥啟動流程（複雜度分析 → Worktree 創建 → CLI 啟動 → 綁定）
2. ✅ 戰鬥進行流程（進度追蹤 → Git 操作監控）
3. ✅ 戰鬥完成流程（結果判定 → 選項展示）
4. ✅ 後處理流程（合併/保留/放棄三種路徑）

**特殊流程**:
5. ✅ 並行管理流程（排隊機制 → 自動啟動）
6. ✅ 錯誤處理流程（Git 錯誤 → CLI 崩潰 → 恢復選項）
7. ✅ 公會大廳管理流程（統一管理界面）

**設計特點**:
- 🎯 完全自動化：用戶只需發起請求和做決策
- 🎯 完全隔離：每個戰鬥獨立環境
- 🎯 容錯機制：錯誤處理和恢復選項
- 🎯 用戶友好：非技術術語，清晰的提示

**下一步**:
- 技術實現細節（implementation.md）
