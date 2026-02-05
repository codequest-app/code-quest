# Worktree-Battle 整合系統需求定義

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**狀態**: 設計階段

---

## 目錄

1. [核心概念](#核心概念)
2. [設計目標](#設計目標)
3. [統一模型](#統一模型)
4. [使用場景](#使用場景)
5. [關鍵需求](#關鍵需求)

---

## 核心概念

### 問題陳述

**原設計的分離問題**:
```
❌ 舊設計：戰鬥系統 ≠ Worktree 系統

戰鬥系統：
- 處理複雜任務
- 創建獨立 Claude CLI 實例
- 背景執行
- 但沒有專屬工作目錄

Worktree 系統：
- 提供獨立開發環境
- 手動創建/管理
- 與戰鬥無關聯
- 需要手動切換

問題：
1. 戰鬥中修改代碼沒有隔離環境
2. 可能污染主分支
3. 需要手動創建 worktree
4. 戰鬥結束後 worktree 管理混亂
```

### 統一設計理念

**新設計：每個戰鬥 = 每個 Worktree = 每個功能開發**

```
✅ 新設計：戰鬥 === Worktree === Feature

┌──────────────────────────────────────────────┐
│         戰鬥開始 (complexity >= 8)            │
│                                              │
│  用戶提問：「重構認證系統」                   │
│         ↓                                    │
│  1. 分析複雜度 = 12  ✅                       │
│  2. 創建 worktree: feature/refactor-auth     │
│  3. 在該 worktree 啟動 Claude CLI            │
│  4. 戰鬥在該環境中進行                        │
│         ↓                                    │
│  戰鬥進行中...                               │
│         ↓                                    │
│  戰鬥結束 (勝利/失敗)                         │
│         ↓                                    │
│  選擇：                                      │
│  • 合併到主分支 (merge)                      │
│  • 保留 worktree 繼續開發 (keep)             │
│  • 放棄修改 (discard)                        │
└──────────────────────────────────────────────┘
```

**關鍵洞察**:
- 🎯 戰鬥 = 完成一個功能/修復
- 🎯 每個戰鬥需要隔離環境
- 🎯 Worktree 天然提供這種隔離
- 🎯 戰鬥結束 = 功能完成 = 合併/放棄決策

### 空間概念映射

從 Map System 視角看整合：

```
🗺️ 地圖系統層級

城鎮（Town Zone）- 主分支 (main)
├─ 商業街 - 查看商店（只讀）
├─ 酒館 - AI 對話（只讀）
├─ 靜止之間 - Plan Mode（只讀）
├─ 公會大廳 - Worktree 管理中心 ⭐
└─ 玩家之家 - 個人設置（只讀）

野外（Wilderness Zone）- 遭遇戰觸發區域
├─ 森林 (Forest)
├─ 山脈 (Mountains)          觸發戰鬥
├─ 荒地 (Wasteland)          ↓
└─ 火山 (Volcano)      自動創建 Worktree
                              ↓
                       進入平行時間線

平行時間線（Parallel Worlds）- Worktree 空間
├─ ⚔️ 冒險世界 (feature/*)
│   └─ feature/refactor-auth  ← 戰鬥 #1 在此
├─ 🛡️ 修復世界 (fix/*)
│   └─ fix/payment-bug       ← 戰鬥 #2 在此
└─ 🔮 實驗世界 (experiment/*)
    └─ experiment/new-arch   ← 戰鬥 #3 在此

戰鬥結束後
├─ 勝利 → 合併回主世界 (main)
├─ 保留 → 繼續在平行世界開發
└─ 失敗 → 刪除平行世界
```

---

## 設計目標

### 1. 自動化工作流

**目標**: 零手動操作，戰鬥即開發

```typescript
// 用戶視角
用戶: "重構認證系統"
    ↓
系統自動:
✅ 分析複雜度
✅ 創建 worktree: feature/refactor-auth
✅ 啟動 Claude CLI 在該 worktree
✅ 開始戰鬥
✅ 實時進度更新
✅ 戰鬥結束提供選項

用戶只需:
⚡ 發起請求
⚡ 在公會大廳查看進度
⚡ 戰鬥結束後決定合併/保留/放棄
```

### 2. 完全隔離

**目標**: 每個戰鬥在獨立環境中，互不干擾

```
主分支 (main)  ← 永遠安全，不受影響
    │
    ├─ worktree #1: feature/auth      ← 戰鬥 #1
    │   └─ Claude CLI Instance #1
    │
    ├─ worktree #2: fix/payment       ← 戰鬥 #2
    │   └─ Claude CLI Instance #2
    │
    └─ worktree #3: feature/ui        ← 戰鬥 #3
        └─ Claude CLI Instance #3

✅ 完全獨立文件系統
✅ 完全獨立 Git 分支
✅ 完全獨立 CLI 進程
✅ 互不干擾
```

### 3. 並行支持

**目標**: 多個戰鬥同時進行

```
時間線：
T0  用戶: "重構認證"         → 戰鬥 #1 啟動
    ↓                           (feature/auth)
T1  用戶: "修復支付 Bug"     → 戰鬥 #2 啟動
    ↓                           (fix/payment)
T2  戰鬥 #1: 35% 進行中...
    戰鬥 #2: 20% 進行中...
    ↓
T3  用戶: "新增黑暗模式"     → 戰鬥 #3 啟動
    ↓                           (feature/dark-mode)
T4  戰鬥 #1: 85% 接近完成
    戰鬥 #2: 60% 進行中
    戰鬥 #3: 10% 剛開始

✅ 並行上限: 3 個戰鬥
✅ 超過上限自動排隊
✅ 在公會大廳統一管理
```

### 4. 清晰生命週期

**目標**: 戰鬥和 Worktree 共享同一生命週期

```
生命週期階段：

1️⃣ 創建 (Creation)
   ├─ 分析 prompt 複雜度
   ├─ 生成 worktree 名稱
   ├─ 執行 git worktree add
   ├─ 啟動 Claude CLI
   └─ 記錄戰鬥實例

2️⃣ 進行 (In Progress)
   ├─ Claude CLI 執行任務
   ├─ 代碼修改在 worktree 中
   ├─ 實時進度追蹤
   └─ 用戶可查看狀態

3️⃣ 完成 (Completion)
   ├─ Claude CLI 任務完成
   ├─ 戰鬥結果判定
   └─ 觸發後處理選項

4️⃣ 後處理 (Post-Battle)
   ├─ 選項 A: 合併 (Merge)
   │   ├─ 審查修改
   │   ├─ git merge feature/xxx → main
   │   └─ git worktree remove
   │
   ├─ 選項 B: 保留 (Keep)
   │   ├─ Worktree 保持活躍
   │   └─ 稍後繼續開發
   │
   └─ 選項 C: 放棄 (Discard)
       ├─ git worktree remove
       └─ 刪除分支
```

### 5. 資源管理

**目標**: 成本可控，按需分配

```javascript
資源限制規則：

// 並行限制
maxConcurrentBattles: 3,  // 最多 3 個戰鬥同時進行

// 自動清理
autoCleanup: {
  onBattleEnd: true,       // 戰鬥結束時提示清理
  staleDays: 7,            // 7 天無活動自動標記
  autoRemoveStale: false   // 不自動刪除，需確認
},

// MP 消耗設計
mpCosts: {
  // 戰鬥啟動時
  battleStart: 0,          // 免費（已包含在複雜度判定中）

  // Worktree 操作
  worktreeCreate: 0,       // 戰鬥創建時自動，免費

  // 後處理操作
  merge: 20,               // 合併回主分支: -20 MP
  keep: 0,                 // 保留: 免費
  discard: 0,              // 放棄: 免費

  // 手動 Worktree 操作（非戰鬥）
  manualCreate: 10,        // 手動創建: -10 MP
  manualSwitch: 5,         // 切換: -5 MP
  manualMerge: 20          // 手動合併: -20 MP
}
```

---

## 統一模型

### 戰鬥-Worktree 綁定模型

```typescript
interface BattleWorktreeBinding {
  // 唯一標識
  id: string;                    // "bw_001"

  // 戰鬥資訊
  battle: {
    id: string;                  // "battle_001"
    prompt: string;              // 原始請求
    complexity: number;          // 複雜度 (8-20)
    enemy: EnemyType;            // 敵人類型
    status: BattleStatus;        // 戰鬥狀態
    progress: number;            // 0-100
    startedAt: timestamp;
    completedAt?: timestamp;
  };

  // Worktree 資訊
  worktree: {
    id: string;                  // "wt_001"
    name: string;                // "refactor-auth"
    type: WorktreeType;          // feature/fix/experiment/hotfix
    branch: string;              // "feature/refactor-auth"
    baseBranch: string;          // "main"
    path: string;                // 文件系統路徑
    createdAt: timestamp;
  };

  // Claude CLI 實例
  cliInstance: {
    processId: number;           // Node.js 進程 ID
    workingDir: string;          // CLI 工作目錄 = worktree.path
    status: 'running' | 'idle' | 'error';
    lastActivity: timestamp;
  };

  // 綁定關係
  binding: {
    createdBy: 'battle';         // 標記為戰鬥自動創建
    autoCreated: true;
    canDetach: boolean;          // 是否允許解綁
  };

  // 統計資訊
  stats: {
    commits: number;
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
  };

  // 生命週期狀態
  lifecycle: {
    phase: 'creating' | 'in_progress' | 'completed' | 'post_battle';
    canMerge: boolean;
    canDiscard: boolean;
    canKeep: boolean;
  };
}
```

### 戰鬥啟動決策樹

```
用戶提交 Prompt
    ↓
┌─────────────────┐
│ 分析複雜度       │
│ analyzePrompt() │
└────────┬────────┘
         │
         ├─ complexity < 3  → 對話模式 (主 CLI)
         │                   不創建 worktree
         │
         ├─ 3 <= complexity < 8  → 簡單任務 (主 CLI 同步)
         │                         不創建 worktree
         │
         └─ complexity >= 8  → 複雜任務 ✅
                 ↓
         ┌───────────────┐
         │ 檢查位置      │
         └───────┬───────┘
                 │
                 ├─ 在城鎮 (Town)  → ❌ 不允許戰鬥
                 │                    提示前往野外
                 │
                 ├─ 在野外 (Wilderness)  → ✅ 觸發戰鬥
                 │         ↓
                 │   ┌────────────────────┐
                 │   │ 自動創建 Worktree   │
                 │   │ + 啟動戰鬥          │
                 │   └────────────────────┘
                 │
                 └─ 在副本 (Dungeon)  → ✅ 強制戰鬥
                           ↓
                     ┌────────────────────┐
                     │ 自動創建 Worktree   │
                     │ + 啟動戰鬥          │
                     └────────────────────┘
```

---

## 使用場景

### 場景 1: 單個戰鬥完整流程

```
用戶操作流程：

1. 在野外區域提交任務
   用戶: "重構用戶認證系統，支援 OAuth2.0"

2. 系統自動處理
   ✅ 分析複雜度 = 14
   ✅ 確認在野外區域
   ✅ 創建 worktree: feature/refactor-auth-oauth
   ✅ 啟動 Claude CLI 在該 worktree
   ✅ 生成敵人: "Legacy Code Dragon (Lv.7)"
   ✅ 戰鬥開始

   顯示通知:
   "⚔️ 遭遇戰鬥！Legacy Code Dragon (Lv.7)
    📂 已創建平行時間線: feature/refactor-auth-oauth
    🤖 Claude CLI 已啟動，戰鬥開始..."

3. 戰鬥進行中
   用戶可以:
   • 繼續與主 CLI 對話（不阻塞）
   • 前往公會大廳查看戰鬥進度
   • 查看 worktree 中的代碼變更

   系統自動:
   • 實時更新戰鬥進度
   • 記錄 commits
   • 統計文件修改

4. 戰鬥結束
   ✅ 戰鬥勝利！

   顯示選項:
   "🎉 戰鬥勝利！成功重構認證系統

    📊 戰果:
    • 12 commits
    • 15 files changed
    • +450 / -120 lines

    🔀 請選擇後續操作:
    [1] 合併到主分支 (merge)  -20 MP
    [2] 保留繼續開發 (keep)   免費
    [3] 放棄此分支 (discard)  免費"

5. 用戶決策
   選項 1 - 合併:
   ✅ 審查代碼差異
   ✅ 執行 git merge feature/refactor-auth-oauth → main
   ✅ 刪除 worktree
   ✅ 刪除分支
   ✅ 消耗 20 MP
   ✅ 獲得經驗值和金幣獎勵

   選項 2 - 保留:
   ✅ Worktree 保持存在
   ✅ 可以稍後繼續開發
   ✅ 在公會大廳可查看/管理

   選項 3 - 放棄:
   ✅ 刪除 worktree
   ✅ 刪除分支
   ✅ 代碼變更全部丟棄
```

### 場景 2: 多戰鬥並行

```
時間線展開：

T0: 09:00
用戶: "重構認證系統"
→ 戰鬥 #1 啟動
  └─ worktree: feature/refactor-auth
  └─ Claude CLI Instance #1
  └─ 預估時間: 8 分鐘

T1: 09:02
用戶: "修復支付超時 Bug"
→ 戰鬥 #2 啟動
  └─ worktree: fix/payment-timeout
  └─ Claude CLI Instance #2
  └─ 預估時間: 5 分鐘

T2: 09:04
用戶: "新增深色模式"
→ 戰鬥 #3 啟動
  └─ worktree: feature/dark-mode
  └─ Claude CLI Instance #3
  └─ 預估時間: 10 分鐘

T3: 09:05
用戶: "優化資料庫查詢"
→ 戰鬥 #4 排隊 ⏸️
  └─ 等待前面戰鬥完成
  └─ 提示: "當前並行上限 3，請稍候..."

T4: 09:07
戰鬥 #2 完成 ✅
→ 用戶選擇合併
  └─ 合併到 main
  └─ 刪除 worktree
→ 戰鬥 #4 自動啟動
  └─ worktree: feature/db-optimization
  └─ Claude CLI Instance #2 (重用)

T5: 09:10
戰鬥 #1 完成 ✅
→ 用戶選擇保留
  └─ Worktree 保持存在
  └─ CLI Instance #1 關閉

T6: 09:14
戰鬥 #3 完成 ✅
→ 用戶選擇合併

T7: 09:18
戰鬥 #4 完成 ✅
→ 用戶選擇合併

最終狀態:
✅ 戰鬥 #2 已合併
✅ 戰鬥 #3 已合併
✅ 戰鬥 #4 已合併
⏸️ 戰鬥 #1 worktree 保留
```

### 場景 3: 在公會大廳管理

```
用戶前往公會大廳（Guild Hall）

顯示界面:
┌────────────────────────────────────────────┐
│ 🏛️ 公會大廳 - Worktree 管理中心            │
├────────────────────────────────────────────┤
│                                            │
│ 🎯 活躍戰鬥 (2)                             │
│                                            │
│ ⚔️ 戰鬥 #1: Legacy Code Dragon            │
│   📂 feature/refactor-auth                │
│   ━━━━━━━━━━━━━━━━━━━━━ 65%              │
│   🕐 開始: 5 分鐘前                        │
│   📊 8 commits, 12 files changed          │
│   [查看詳情] [暫停] [取消]                 │
│                                            │
│ ⚔️ 戰鬥 #3: Performance Demon             │
│   📂 feature/db-optimization              │
│   ━━━━━━━━━ 35%                           │
│   🕐 開始: 2 分鐘前                        │
│   📊 3 commits, 5 files changed           │
│   [查看詳情] [暫停] [取消]                 │
│                                            │
├────────────────────────────────────────────┤
│ ⏸️ 排隊中 (1)                               │
│                                            │
│ 🔄 戰鬥 #4: Test Coverage Goblin          │
│   📂 feature/add-tests (待創建)           │
│   等待位置釋放...                          │
│                                            │
├────────────────────────────────────────────┤
│ 📦 保留的 Worktree (1)                      │
│                                            │
│ ⚔️ 戰鬥 #5: API Redesign (已完成)          │
│   📂 feature/api-v2                       │
│   🕐 完成: 2 天前                          │
│   📊 25 commits, 35 files changed         │
│   [繼續開發] [合併] [刪除]                 │
│                                            │
└────────────────────────────────────────────┘

可用操作:
• 查看任意戰鬥詳情
• 暫停/恢復戰鬥
• 取消戰鬥（刪除 worktree）
• 管理保留的 worktree
• 手動創建 worktree（非戰鬥）
```

### 場景 4: 戰鬥失敗處理

```
戰鬥失敗情況：

1. Claude CLI 錯誤
   ❌ CLI 進程崩潰
   ❌ 代碼編譯失敗
   ❌ 測試失敗

   系統處理:
   "⚠️ 戰鬥遇到困難！

    錯誤: 編譯失敗 - 語法錯誤

    🔀 選擇操作:
    [1] 重新開始戰鬥  -10 MP
    [2] 保留 worktree 手動修復
    [3] 放棄 worktree"

2. 超時
   ❌ 戰鬥時間超過 30 分鐘

   系統處理:
   "⏰ 戰鬥超時！

    任務過於複雜，建議分解為子任務

    🔀 選擇操作:
    [1] 延長時間 (+15 分鐘)  -15 MP
    [2] 保留 worktree，分解任務
    [3] 放棄 worktree"

3. 資源不足
   ❌ 磁盤空間不足
   ❌ Worktree 數量達到上限

   系統處理:
   "🚨 資源不足！

    當前 worktree 數量: 10 (上限 10)

    請清理不需要的 worktree:
    [前往公會大廳管理]"
```

---

## 關鍵需求

### 功能性需求

#### FR-1: 自動 Worktree 創建

```
需求描述:
當戰鬥觸發時（complexity >= 8），系統必須自動創建 worktree

前置條件:
• 用戶在野外或副本區域
• Prompt 複雜度 >= 8
• 當前並行戰鬥數量 < 3

執行流程:
1. 生成 worktree 名稱
   規則: {type}/{sanitized-prompt-summary}
   範例: "feature/refactor-auth-system"

2. 生成文件路徑
   規則: {projectRoot}/../worktrees/{worktreeName}
   範例: "/Users/recca/project/../worktrees/feature-refactor-auth"

3. 執行 git worktree add
   命令: git worktree add -b {branch} {path} {baseBranch}

4. 驗證創建成功
   檢查: 路徑存在 && git branch 顯示新分支

5. 記錄到系統
   保存: BattleWorktreeBinding 實例

後置條件:
• Worktree 創建成功
• 文件系統路徑可訪問
• Git 分支存在
• Binding 記錄已保存

異常處理:
• Git 命令失敗 → 取消戰鬥，通知用戶
• 路徑衝突 → 生成新名稱重試
• 權限不足 → 通知用戶，提示檢查權限
```

#### FR-2: CLI 實例綁定

```
需求描述:
每個戰鬥必須在對應的 worktree 中啟動獨立的 Claude CLI 實例

前置條件:
• Worktree 已創建成功
• 文件路徑有效

執行流程:
1. 啟動 Claude CLI 進程
   命令: spawn('claude', ['code'], { cwd: worktreePath })

2. 設置工作目錄
   工作目錄 = worktree.path

3. 發送初始 prompt
   通過 stdin 發送用戶的原始請求

4. 監聽進程輸出
   stdout → 解析進度和結果
   stderr → 捕獲錯誤

5. 綁定到戰鬥實例
   battleInstance.cliProcess = process
   battleInstance.cliPid = process.pid

後置條件:
• CLI 進程運行中
• 工作目錄正確
• 進程 ID 已記錄
• 輸出監聽已設置

異常處理:
• 進程啟動失敗 → 清理 worktree，通知用戶
• 進程崩潰 → 標記戰鬥失敗，提供恢復選項
```

#### FR-3: 戰鬥-Worktree 生命週期同步

```
需求描述:
戰鬥和 worktree 必須共享相同的生命週期階段

生命週期映射:

1. 創建階段
   戰鬥: 初始化戰鬥實例
   Worktree: git worktree add
   CLI: spawn Claude CLI
   狀態: creating

2. 進行階段
   戰鬥: 戰鬥進行中
   Worktree: 代碼修改中
   CLI: 執行任務
   狀態: in_progress

3. 完成階段
   戰鬥: 任務完成/失敗
   Worktree: 代碼已修改
   CLI: 進程結束
   狀態: completed

4. 後處理階段
   戰鬥: 等待用戶決策
   Worktree: 等待合併/保留/刪除
   CLI: 已關閉
   狀態: post_battle

   分支決策:
   • 合併 → git merge → worktree remove → 戰鬥歸檔
   • 保留 → worktree 保持 → 戰鬥暫停 → 可恢復
   • 放棄 → worktree remove → 戰鬥取消 → 刪除記錄

狀態轉換規則:
• creating → in_progress: 自動（CLI 啟動成功）
• in_progress → completed: 自動（CLI 任務完成）
• completed → post_battle: 自動（生成後處理選項）
• post_battle → archived: 手動（用戶選擇後）

不允許的狀態轉換:
• ❌ creating → completed (跳過戰鬥)
• ❌ post_battle → in_progress (不允許恢復戰鬥)
```

#### FR-4: 並行管理

```
需求描述:
系統必須支持最多 3 個戰鬥同時進行，超過則自動排隊

並行限制:
maxConcurrentBattles = 3

隊列機制:
當第 4 個戰鬥請求到達:
1. 分析複雜度 → 確認需要戰鬥
2. 檢查當前並行數 → 發現達到上限
3. 加入隊列
   queuePosition = queue.length + 1
   estimatedWaitTime = 計算前面戰鬥的預估剩餘時間
4. 通知用戶
   "⏸️ 當前並行上限已滿（3/3）
    您的戰鬥已排隊，位置: #1
    預估等待時間: 3-5 分鐘"

自動啟動:
當任意戰鬥完成:
1. 檢查隊列是否為空
2. 如果有排隊戰鬥 → 取出第一個
3. 啟動戰鬥（創建 worktree + CLI）
4. 通知用戶
   "✅ 您的戰鬥已開始！
    敵人: Performance Demon (Lv.5)"

隊列操作:
• 取消排隊戰鬥 → 從隊列移除
• 調整優先級 → 重新排序（需權限）
• 查看隊列狀態 → 在公會大廳顯示
```

#### FR-5: 後處理選項

```
需求描述:
戰鬥結束後，用戶必須選擇如何處理 worktree

選項 1: 合併 (Merge)

前置條件:
• 戰鬥狀態 = completed
• 沒有合併衝突

執行流程:
1. 顯示代碼差異
   git diff main...{branch}

2. 用戶確認合併

3. 執行合併
   git checkout main
   git merge {branch} --no-ff

4. 推送到遠程（可選）
   git push origin main

5. 清理 worktree
   git worktree remove {path}
   git branch -d {branch}

6. 更新統計
   獲得經驗值、金幣
   戰鬥歸檔

MP 消耗: -20

後置條件:
• 代碼已合併到 main
• Worktree 已刪除
• 分支已刪除
• 戰鬥記錄歸檔

---

選項 2: 保留 (Keep)

前置條件:
• 戰鬥狀態 = completed

執行流程:
1. 關閉 CLI 實例
2. 保留 worktree 和分支
3. 更新狀態為 "保留"
4. 在公會大廳顯示

MP 消耗: 0

後置條件:
• Worktree 保持存在
• 分支保持存在
• CLI 已關閉
• 可稍後繼續開發或合併

使用場景:
• 需要手動測試
• 需要等待 Code Review
• 想要分多次迭代

---

選項 3: 放棄 (Discard)

前置條件:
• 戰鬥狀態 = completed

執行流程:
1. 確認放棄（防止誤操作）
   "⚠️ 確定放棄所有修改？此操作不可恢復！"

2. 關閉 CLI 實例
3. 刪除 worktree
   git worktree remove {path} --force
4. 刪除分支
   git branch -D {branch}
5. 刪除戰鬥記錄

MP 消耗: 0

後置條件:
• Worktree 已刪除
• 分支已刪除
• 代碼修改全部丟失
• 戰鬥記錄刪除
```

### 非功能性需求

#### NFR-1: 性能

```
要求:
• Worktree 創建時間: < 2 秒
• CLI 啟動時間: < 3 秒
• 合併操作時間: < 5 秒
• 並行戰鬥不影響主 CLI 性能

測量指標:
• worktreeCreationTime
• cliSpawnTime
• mergeOperationTime
• mainCLIResponseTime (應保持 < 2 秒)
```

#### NFR-2: 可靠性

```
要求:
• Worktree 創建成功率: > 99%
• CLI 進程穩定性: > 95%
• 數據一致性: 100% (戰鬥-Worktree 綁定)

容錯機制:
• Git 操作失敗自動重試（最多 3 次）
• CLI 崩潰自動保存進度
• 系統重啟後恢復未完成戰鬥
```

#### NFR-3: 可用性

```
要求:
• 用戶無需學習 Git Worktree 概念
• 所有操作通過 RPG 界面完成
• 錯誤提示清晰易懂（非技術用語）

示例:
❌ 錯誤: "git worktree add failed: fatal: invalid reference"
✅ 正確: "⚠️ 無法創建平行時間線，請確保主分支是最新的"
```

#### NFR-4: 可維護性

```
要求:
• 戰鬥和 Worktree 數據分開存儲
• 詳細的日誌記錄
• 支持手動清理孤立 worktree

日誌級別:
• INFO: 戰鬥啟動、完成、合併
• WARN: 排隊、超時
• ERROR: Git 操作失敗、CLI 崩潰
```

---

## 總結

**核心價值**:
1. ✅ **簡化開發流程**: 戰鬥即開發，無需手動管理分支
2. ✅ **完全隔離**: 每個任務在獨立環境，互不干擾
3. ✅ **並行開發**: 支持多個功能同時開發
4. ✅ **安全**: 主分支永遠不受影響
5. ✅ **靈活**: 戰鬥結束後可合併、保留或放棄

**統一模型**:
```
每個戰鬥 = 每個 Worktree = 每個功能 = 每個 Git 分支
```

**下一步**:
- 設計詳細的流程圖（flow-design.md）
- 技術實現細節（implementation.md）
