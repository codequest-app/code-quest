# 異步戰鬥系統 (Async Battle System)

**創建日期**: 2026-02-06
**版本**: v1.0
**來源**: `/docs/design/async-battle-system/requirements.md`

---

## 目錄

1. [系統概述](#系統概述)
2. [依賴關係](#依賴關係)
3. [核心規則](#核心規則)
4. [內部地圖](#內部地圖)
5. [系統整合](#系統整合)
6. [設計決策](#設計決策)

---

## 系統概述

### 核心概念

異步戰鬥系統解決傳統 CLI 工具的阻塞問題，實現「用戶永不阻塞」的非阻塞雙軌架構。

**問題陳述**：
```
傳統 CLI 工具的阻塞問題：
❌ 用戶輸入命令後必須等待執行完成
❌ 無法同時進行多個任務
❌ 長時間運行的任務會鎖住整個界面
❌ 用戶體驗差，無法進行其他操作
```

**解決方案：非阻塞雙軌系統**：
```
┌─────────────────────────────────────┐
│     User Input (Main Thread)        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│        SmartRouter                   │
│    (Complexity Analysis)             │
└─────────────────────────────────────┘
           ↓
    ┌──────┴──────┐
    ↓             ↓
┌────────┐   ┌─────────────┐
│ Dialog │   │   Battle    │
│ Track  │   │   Track     │
└────────┘   └─────────────┘
 (即時)        (異步)
```

### 設計原則

**1. 用戶永不阻塞**：
- 任何輸入都立即得到響應
- 複雜任務在後台執行
- 用戶可以繼續輸入新命令或對話

**2. 智能路由**：
- 自動分析任務複雜度
- 根據複雜度選擇執行路徑
- 簡單任務立即執行，複雜任務異步處理

**3. 狀態可見**：
- 後台任務狀態實時更新
- 進度可視化展示
- 完成時主動通知用戶

**4. 資源控制**：
- 限制並發戰鬥數量（最多 3 個）
- 超出限制時排隊等待
- 防止資源耗盡

**5. 代碼隔離（Battle Async 專屬）**：
- 每個並發戰鬥自動創建獨立 worktree
- 避免代碼修改互相干擾
- 戰鬥完成後自動合併和清理
- 確保並發執行的安全性

---

## 依賴關係

### 上游依賴

```
異步戰鬥系統依賴：
├─ 戰鬥系統（L2）- 提供戰鬥邏輯
├─ SmartRouter（L2）- 複雜度分析和路由
├─ Worktree 系統（L3）- Battle Async 自動創建 worktree
└─ Bridge Layer（L1）- Claude CLI 進程管理
```

### 下游依賴

```
影響的系統：
├─ UI 系統（L3）- 三面板布局（對話 + 戰鬥列表）
├─ 通知系統（L3）- 戰鬥完成通知
└─ 成就系統（L3）- 多任務成就
```

### 系統架構位置

```
L4: 展示層
    └─ 異步戰鬥 UI（三面板）
L3: 業務層 ⭐
    └─ 異步戰鬥系統（本系統）
L2: 核心層
    ├─ SmartRouter（路由決策）
    └─ 戰鬥系統
L1: 基礎層
    └─ Bridge Layer（CLI 管理）
L0: 數據層
    └─ 戰鬥實例數據
```

---

## 核心規則

### 規則 1：三種處理路徑

#### 1.1 路徑 1：對話型（Dialog Mode）

**適用場景**：
- 簡單問答
- 信息查詢
- 指令確認
- 快速咨詢

**特點**：
```
dialogMode = {
  complexity: [0, 2],        // 複雜度 0-2 分
  execution: 'main_thread',  // 主線程直接響應
  responseTime: '< 1s',      // 響應時間 < 1 秒
  battleSystem: false        // 無需戰鬥系統
}
```

**判斷條件**：
```
if (complexity >= 0 && complexity <= 2) {
  return 'dialog';
}
```

**示例**：
```
用戶: "現在是什麼模式？"
系統: [立即響應] "當前在探索模式"

用戶: "我有多少金幣？"
系統: [立即響應] "你有 3,450 金幣"
```

**處理流程**：
```
用戶輸入
    ↓
SmartRouter 判斷（複雜度 < 3）
    ↓
直接回應（無戰鬥界面）
    ↓
顯示結果
```

#### 1.2 路徑 2：簡單任務（Main CLI Sync）

**適用場景**：
- 單文件編輯
- 簡單 bug 修復
- 快速查找
- 配置更新

**特點**：
```
mainSync = {
  complexity: [3, 7],         // 複雜度 3-7 分
  execution: 'main_thread',   // 主線程同步執行
  display: 'battle_ui',       // 顯示戰鬥 UI
  responseTime: '幾秒到十幾秒',
  worktree: false,            // **不需要 worktree**
  reason: '同步執行，無並發衝突'
}
```

**判斷條件**：
```
if (complexity >= 3 && complexity < 8) {
  return 'main_sync';
}
```

**為什麼不需要 Worktree？**

Main Sync 任務：
- 主線程阻塞，用戶必須等待完成
- 同一時間只有一個任務執行
- 沒有並發衝突問題
- 在主目錄執行即可，無需隔離

**示例**：
```
用戶: "修復 login.ts 的類型錯誤"
系統: [主線程執行於主工作目錄]
      ⚔️ 戰鬥開始！
      敵人：Bug怪物 (簡單)
      [執行工具...]
      [進度條: ████████ 100%]
      ✅ 戰鬥勝利！

時間：15 秒
用戶狀態：等待中（無法進行其他操作）
```

#### 1.3 路徑 3：複雜任務（Battle Async）

**適用場景**：
- 多文件重構
- 系統遷移
- 完整功能開發
- 架構優化

**特點**：
```
battleAsync = {
  complexity: [8, 15],              // 複雜度 8+ 分
  execution: 'separate_instance',   // 獨立戰鬥實例
  display: 'full_battle_ui',        // 完整戰鬥系統
  responseTime: '幾分鐘到幾十分鐘',
  concurrent: 3,                    // 最多 3 個並發
  worktree: true,                   // **自動創建 Git Worktree**
  reason: '並發執行需要代碼隔離'
}
```

**判斷條件**：
```
if (complexity >= 8) {
  return 'battle_async';
}
```

**為什麼需要 Worktree？**

當多個戰鬥並發執行時，如果都在同一個工作目錄修改代碼，會造成：

```
❌ 問題場景：無 Worktree
戰鬥 #1: 正在修改 auth.ts (添加 OAuth)
戰鬥 #2: 同時修改 auth.ts (修復 bug)
戰鬥 #3: 也在修改 auth.ts (重構)
→ 文件衝突！代碼互相覆蓋！
```

**解決方案：自動 Worktree 隔離**

```
✅ 每個戰鬥獨立目錄
戰鬥 #1 → worktrees/battle_1/  (auth.ts 添加 OAuth)
戰鬥 #2 → worktrees/battle_2/  (auth.ts 修復 bug)
戰鬥 #3 → worktrees/battle_3/  (auth.ts 重構)
→ 各自獨立，互不干擾！
```

**自動流程**：
```
1. 創建戰鬥實例
   ↓
2. 自動創建 worktree 分支（battle/<id>）
   ↓
3. 在 worktree 目錄執行 Claude CLI
   ↓
4. 戰鬥完成
   ↓
5. 自動合併到主分支
   ↓
6. 清理 worktree 目錄
```

**示例**：
```
用戶: "重構整個認證系統，添加 OAuth 支持"
系統: [創建戰鬥實例 #1]
      🌲 創建 worktree: worktrees/battle_1
      🎮 戰鬥 #1 已開始！
      敵人：魔王級 Bug (複雜)
      [後台執行於 worktrees/battle_1/...]

[用戶可以繼續輸入]

用戶: "當前有哪些戰鬥？"
系統: 📋 進行中的戰鬥：
      • 戰鬥 #1: 重構認證系統 (進度 45%)
        📂 worktrees/battle_1

用戶: "創建新的支付功能"
系統: [創建戰鬥實例 #2]
      🌲 創建 worktree: worktrees/battle_2
      🎮 戰鬥 #2 已開始！
      [並發執行，互不干擾]
```

---

### 規則 2：SmartRouter 路由決策

#### 2.1 複雜度評分算法

SmartRouter 根據以下因素計算複雜度分數（0-15 分）：

**1. 長度因素（0-3 分）**：
```
lengthScore = {
  '>200 chars': 3,
  '100-200 chars': 2,
  '<100 chars': 1
}
```

**2. 關鍵字權重**：

重量級關鍵字（×3）：
- 重構、遷移、升級、整個、所有、完整、系統、架構

中量級關鍵字（×2）：
- 創建、實作、開發、優化、設計、集成

輕量級關鍵字（×1）：
- 修復、更新、檢查、查看、顯示

**3. 文件數量（0-3 分）**：
```
fileScore = {
  multiple_explicit: 3,  // 多個文件明確提及
  multiple_implicit: 2,  // 暗示多個文件
  single_or_none: 1      // 單個文件或無文件
}
```

**4. 工具複雜度（0-3 分）**：
```
toolScore = {
  multiple_tools: 3,     // 需要多個工具
  complex_tools: 2,      // 需要複雜工具（如 Plan Mode）
  simple_tools: 1        // 簡單工具
}
```

**5. 依賴關係（0-2 分）**：
```
dependencyScore = {
  cross_system: 2,       // 涉及系統間依賴
  independent: 0         // 獨立任務
}
```

#### 2.2 路由決策表

| 複雜度分數 | 等級 | 執行路徑 | 預計時間 | 示例 |
|----------|------|---------|---------|------|
| 0-2 | 對話型 | Dialog Track | < 1s | "現在什麼模式？" |
| 3-4 | 簡單 | Main Sync | 5-15s | "修復這個類型錯誤" |
| 5-7 | 一般 | Main Sync | 15-60s | "添加一個新函數" |
| 8-10 | 複雜 | Battle Async | 1-5min | "重構認證模塊" |
| 11-13 | 困難 | Battle Async | 5-15min | "遷移到新架構" |
| 14-15 | 魔王級 | Battle Async | 15min+ | "重寫整個系統" |

#### 2.3 路由決策流程

```
用戶輸入
    ↓
分析提示詞
    ↓
計算複雜度分數
    ↓
┌─────────────────────┐
│ 分數 < 3？          │
│ Yes → Dialog Track  │
│ No → 繼續           │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ 分數 < 8？          │
│ Yes → Main Sync     │
│ No → Battle Async   │
└─────────────────────┘
```

**示例代碼**：
```
class SmartRouter {
  route(prompt) {
    const complexity = this.analyzeComplexity(prompt);

    if (complexity < 3) {
      return { track: 'dialog', reason: '簡單問答' };
    } else if (complexity < 8) {
      return { track: 'main_sync', reason: '簡單任務', worktree: false };
    } else {
      return { track: 'battle_async', reason: '複雜任務', worktree: true };
    }
  }

  analyzeComplexity(prompt) {
    let score = 0;

    // 1. 長度因素
    score += this.analyzLength(prompt);

    // 2. 關鍵字權重
    score += this.analyzeKeywords(prompt);

    // 3. 文件數量
    score += this.analyzeFiles(prompt);

    // 4. 工具複雜度
    score += this.analyzeTools(prompt);

    // 5. 依賴關係
    score += this.analyzeDependencies(prompt);

    return Math.min(score, 15);  // 上限 15
  }
}
```

---

### 規則 3：戰鬥實例池管理

#### 3.1 並發控制

**最大並發數：3**

```
class BattleInstancePool {
  constructor() {
    this.maxConcurrent = 3;   // 最多 3 個並發戰鬥
    this.activeInstances = [];
    this.queue = [];          // 超出時排隊
  }

  async createBattle(config) {
    // 檢查當前運行數量
    if (this.activeInstances.length >= this.maxConcurrent) {
      // 加入隊列
      this.queue.push(config);
      return {
        queued: true,
        position: this.queue.length,
        message: `已加入隊列，前面有 ${this.queue.length - 1} 個戰鬥`
      };
    }

    // 創建戰鬥實例
    const battle = await this.instantiateBattle(config);
    this.activeInstances.push(battle);

    return { success: true, battle };
  }

  async onBattleComplete(battleId) {
    // 移除完成的戰鬥
    const index = this.activeInstances.findIndex(b => b.id === battleId);
    if (index !== -1) {
      this.activeInstances.splice(index, 1);
    }

    // 從隊列取出下一個
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      await this.createBattle(next);
    }
  }
}
```

#### 3.2 排隊機制

```
排隊流程：

1. 新戰鬥請求到達
   ↓
2. 檢查當前運行數量
   ├─ < 3 → 立即執行
   └─ = 3 → 加入隊列
   ↓
3. 顯示排隊通知
   ┌─────────────────────────┐
   │ ⏳ 戰鬥已加入隊列        │
   │ 當前位置：第 2 位        │
   │ 預計等待：~3 分鐘       │
   └─────────────────────────┘
   ↓
4. 有戰鬥完成時
   ↓
5. 從隊列取出下一個
   ↓
6. 開始執行
```

#### 3.3 戰鬥生命週期

```
battleLifecycle = {
  // 1. 創建
  create: async (config) => {
    const battle = {
      id: generateBattleId(),
      config: config,
      status: 'preparing',
      worktree: null,
      process: null,
      startTime: Date.now()
    };

    // 創建 worktree（Battle Async only）
    if (config.track === 'battle_async') {
      battle.worktree = await createBattleWorktree(battle.id);
    }

    return battle;
  },

  // 2. 準備
  prepare: async (battle) => {
    battle.status = 'preparing';

    // 啟動 Claude CLI 進程
    if (battle.worktree) {
      // 在 worktree 目錄啟動
      battle.process = spawnClaudeCLI({
        cwd: battle.worktree.path
      });
    } else {
      // 在主目錄啟動
      battle.process = spawnClaudeCLI();
    }

    battle.status = 'ready';
  },

  // 3. 執行
  execute: async (battle) => {
    battle.status = 'running';
    battle.startTime = Date.now();

    // 發送提示詞到 Claude
    battle.process.stdin.write(battle.config.prompt);

    // 監聽輸出
    battle.process.stdout.on('data', (data) => {
      handleBattleOutput(battle, data);
    });
  },

  // 4. 完成/失敗
  complete: async (battle, result) => {
    battle.status = result.success ? 'completed' : 'failed';
    battle.endTime = Date.now();
    battle.duration = battle.endTime - battle.startTime;

    // 關閉進程
    battle.process.kill();

    // 合併和清理 worktree（Battle Async only）
    if (battle.worktree) {
      if (result.success) {
        await mergeWorktree(battle.worktree);
      }
      await cleanupWorktree(battle.worktree);
    }

    // 通知用戶
    notifyUser({
      title: result.success ? '✅ 戰鬥勝利！' : '❌ 戰鬥失敗',
      message: `${battle.config.task}`,
      duration: formatDuration(battle.duration)
    });

    // 從實例池移除
    battlePool.onBattleComplete(battle.id);
  },

  // 5. 清理
  cleanup: async (battle) => {
    // 釋放資源
    if (battle.process) {
      battle.process.kill();
    }

    // 清理 worktree
    if (battle.worktree) {
      await removeWorktree(battle.worktree.path);
    }

    // 清理臨時文件
    await cleanupTempFiles(battle.id);
  }
}
```

---

### 規則 4：Worktree 自動管理

#### 4.1 自動創建

```
async function createBattleWorktree(battleId) {
  // 1. 生成 worktree 路徑和分支名
  const path = `worktrees/battle_${battleId}`;
  const branch = `battle/${battleId}`;

  // 2. 創建 worktree
  await execGit(`worktree add ${path} -b ${branch}`);

  // 3. 返回 worktree 資訊
  return {
    id: battleId,
    path: path,
    branch: branch,
    createdAt: Date.now(),
    type: 'battle_async'  // 標記為戰鬥類型
  };
}
```

#### 4.2 自動合併

```
async function mergeWorktree(worktree) {
  // 1. 檢查是否有變更
  const hasChanges = await hasCommits(worktree.branch);

  if (!hasChanges) {
    // 無變更，直接清理
    return { merged: false, reason: 'no_changes' };
  }

  // 2. 切換到主分支
  await execGit('checkout main');

  // 3. 合併戰鬥分支
  try {
    await execGit(`merge ${worktree.branch} --no-ff -m "Merge battle ${worktree.id}"`);
    return { merged: true };
  } catch (error) {
    // 合併衝突
    return {
      merged: false,
      hasConflicts: true,
      conflicts: await getConflicts()
    };
  }
}
```

#### 4.3 自動清理

```
async function cleanupWorktree(worktree) {
  // 1. 移除 worktree
  await execGit(`worktree remove ${worktree.path}`);

  // 2. 刪除分支
  await execGit(`branch -D ${worktree.branch}`);

  // 3. 清理元數據
  worktreeRegistry.remove(worktree.id);

  // 4. 記錄日誌
  logger.info(`Worktree cleaned: ${worktree.path}`);
}
```

---

### 規則 5：錯誤處理

#### 5.1 路由錯誤

```
// SmartRouter 分析失敗
if (!complexityScore) {
  // 默認 Main Sync
  return { track: 'main_sync', reason: '無法判斷複雜度，使用默認' };
}

// 無法判斷複雜度
if (ambiguous) {
  // 詢問用戶
  const choice = await askUser({
    message: '無法自動判斷任務複雜度',
    options: [
      { label: '簡單任務（幾秒內完成）', track: 'main_sync' },
      { label: '複雜任務（幾分鐘以上）', track: 'battle_async' }
    ]
  });

  return choice;
}
```

#### 5.2 執行錯誤

```
// Dialog Track 失敗
dialogTrack.on('error', (error) => {
  showError(error);
  // 繼續對話，不影響後續操作
});

// Main Sync 失敗
mainSync.on('error', (error) => {
  showError(error);
  saveProgress();  // 保存進度
  // 提供重試選項
});

// Battle Async 失敗
battleAsync.on('error', (battle, error) => {
  battle.status = 'failed';
  battle.error = error;

  // 清理 worktree
  if (battle.worktree) {
    cleanupWorktree(battle.worktree);
  }

  // 通知用戶
  notifyUser({
    title: '❌ 戰鬥失敗',
    message: error.message,
    actions: [
      { label: '重試', action: 'retry' },
      { label: '查看詳情', action: 'details' }
    ]
  });
});
```

#### 5.3 並發錯誤

```
// 超過最大並發數
if (activeInstances.length >= maxConcurrent) {
  // 自動排隊
  queue.push(config);

  showNotification({
    message: `已加入隊列，當前位置：第 ${queue.length} 位`,
    type: 'info'
  });
}

// 實例池滿
if (queue.length >= maxQueueSize) {
  showError({
    message: '戰鬥隊列已滿，請稍後再試',
    suggestion: '等待當前戰鬥完成，或取消部分戰鬥'
  });
}
```

---

### 規則 6：超時機制

```
timeoutSettings = {
  dialogTrack: 5000,      // 5 秒
  mainSync: 120000,       // 2 分鐘
  battleAsync: 1800000    // 30 分鐘
}

// 超時處理
function setupTimeout(battle) {
  const timeout = timeoutSettings[battle.config.track];

  battle.timer = setTimeout(() => {
    // 超時，強制終止
    battle.status = 'timeout';
    battle.process.kill();

    // 清理
    if (battle.worktree) {
      cleanupWorktree(battle.worktree);
    }

    // 通知
    notifyUser({
      title: '⏱️ 戰鬥超時',
      message: `${battle.config.task} 執行超過 ${formatDuration(timeout)}`,
      actions: [
        { label: '重試', action: 'retry' },
        { label: '取消', action: 'cancel' }
      ]
    });
  }, timeout);
}
```

---

## 內部地圖

### 三面板布局

```
┌─────────────────────────────────────────────────────────┐
│  Code Quest - 異步戰鬥模式                              │
├───────────────────────────┬─────────────────────────────┤
│                           │                             │
│  主對話區                 │  戰鬥列表                   │
│  (Dialog + Main Sync)     │  (Battle Async)             │
│                           │                             │
│  💬 用戶: "重構認證系統"  │  📋 進行中的戰鬥 (2/3)      │
│                           │                             │
│  🧙 Claude: "我將開始重構 │  ┌────────────────────────┐│
│  認證系統，這是一個複雜任 │  │ ⚔️ 戰鬥 #1            ││
│  務，將在後台執行..."     │  │ 重構認證系統          ││
│                           │  │ 進度: ████████░░ 80%  ││
│  ✅ 戰鬥 #1 已創建        │  │ 用時: 8 分鐘          ││
│                           │  │ [查看] [取消]         ││
│  [輸入框...]              │  └────────────────────────┘│
│  [發送]                   │                             │
│                           │  ┌────────────────────────┐│
│                           │  │ ⚔️ 戰鬥 #2            ││
│                           │  │ 添加支付功能          ││
│                           │  │ 進度: ████░░░░░░ 40%  ││
│                           │  │ 用時: 3 分鐘          ││
│                           │  │ [查看] [取消]         ││
│                           │  └────────────────────────┘│
│                           │                             │
│                           │  ⏳ 隊列中 (1)             │
│                           │  • 優化資料庫查詢          │
├───────────────────────────┴─────────────────────────────┤
│  當前戰鬥詳情：戰鬥 #1 - 重構認證系統                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 敵人：架構挑戰 Lv.10                            │   │
│  │ HP: ████████░░ 85/100                          │   │
│  │                                                 │   │
│  │ 最近動作：                                       │   │
│  │ 🧙 施放「代碼生成術」→ 創建 auth.service.ts     │   │
│  │ ⚔️ 攻擊成功！造成 45 傷害                       │   │
│  │ 📖 使用「讀心術」→ 分析舊代碼結構                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### SmartRouter 決策流程圖

```
用戶輸入 Prompt
    ↓
┌─────────────────────────┐
│   SmartRouter           │
│   分析提示詞            │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│  計算複雜度分數          │
│  1. 長度因素 (0-3)      │
│  2. 關鍵字權重          │
│  3. 文件數量 (0-3)      │
│  4. 工具複雜度 (0-3)    │
│  5. 依賴關係 (0-2)      │
│  總分：0-15 分          │
└─────────────────────────┘
    ↓
    ├─ 分數 < 3 → Dialog Track
    │   ├─ 無戰鬥界面
    │   ├─ 即時響應
    │   └─ < 1 秒
    │
    ├─ 分數 3-7 → Main Sync
    │   ├─ 戰鬥界面
    │   ├─ 同步執行
    │   ├─ 主工作目錄
    │   └─ 幾秒到 1 分鐘
    │
    └─ 分數 >= 8 → Battle Async
        ├─ 完整戰鬥界面
        ├─ 異步執行
        ├─ 自動創建 worktree
        ├─ 並發執行（最多 3 個）
        └─ 幾分鐘到幾十分鐘
```

### Battle Async Worktree 流程

```
戰鬥開始
    ↓
┌─────────────────────────┐
│ 1. 創建 Worktree        │
│    分支: battle/<id>    │
│    路徑: worktrees/     │
│          battle_<id>/   │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ 2. 啟動 Claude CLI      │
│    工作目錄: worktree   │
│    獨立進程             │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ 3. 執行戰鬥             │
│    • 代碼修改隔離       │
│    • 並發執行安全       │
│    • 實時進度更新       │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ 4. 戰鬥完成             │
│    檢查結果             │
└─────────────────────────┘
    ↓
    ├─ ✅ 成功 → 自動合併
    │   ├─ git checkout main
    │   ├─ git merge battle/<id>
    │   └─ 通知用戶
    │
    └─ ❌ 失敗 → 保留分支
        ├─ 不合併
        ├─ 保留 worktree 供檢查
        └─ 通知用戶
    ↓
┌─────────────────────────┐
│ 5. 清理 Worktree        │
│    • git worktree remove│
│    • git branch -D      │
│    • 釋放資源           │
└─────────────────────────┘
```

---

## 系統整合

### 與場景系統整合

```
sceneSystem.on('user_input', async (input) => {
  // 路由決策
  const route = smartRouter.route(input);

  if (route.track === 'dialog') {
    // 對話型：保持探索模式
    handleDialogTrack(input);
  } else if (route.track === 'main_sync') {
    // 簡單任務：進入戰鬥模式（同步）
    await sceneSystem.switchTo('battle', { sync: true });
    await handleMainSync(input);
  } else {
    // 複雜任務：創建異步戰鬥實例
    const battle = await battlePool.createBattle({
      prompt: input,
      track: 'battle_async'
    });

    // 用戶繼續在探索模式
    notifyUser({
      message: `戰鬥 #${battle.id} 已在後台開始`,
      action: { label: '查看戰鬥', target: battle.id }
    });
  }
});
```

### 與 Worktree 系統整合

```
// 區分手動 worktree 和戰鬥 worktree
worktreeRegistry = {
  manual: [],      // 用戶手動創建的 worktree
  battle: []       // 戰鬥自動創建的 worktree
}

// 戰鬥 worktree 自動管理
battleWorktreeManager = {
  create: async (battleId) => {
    const worktree = await createBattleWorktree(battleId);
    worktreeRegistry.battle.push(worktree);
    return worktree;
  },

  cleanup: async (battleId) => {
    const worktree = worktreeRegistry.battle.find(w => w.id === battleId);
    if (worktree) {
      await cleanupWorktree(worktree);
      worktreeRegistry.battle = worktreeRegistry.battle.filter(w => w.id !== battleId);
    }
  },

  // 列表中區分顯示
  list: () => {
    return {
      manual: worktreeRegistry.manual,    // 顯示完整管理選項
      battle: worktreeRegistry.battle     // 只顯示狀態，不可操作
    };
  }
}
```

### 與 UI 系統整合

```
// 三面板布局
uiSystem.setupAsyncBattleLayout({
  mainPanel: {
    type: 'dialog',
    position: 'left',
    width: '60%'
  },
  battleList: {
    type: 'battle_list',
    position: 'top-right',
    height: '50%'
  },
  battleDetail: {
    type: 'battle_detail',
    position: 'bottom-right',
    height: '50%'
  }
});

// 實時更新
battlePool.on('battle_update', (battle) => {
  uiSystem.updateBattleList(battle);
  if (uiSystem.selectedBattle === battle.id) {
    uiSystem.updateBattleDetail(battle);
  }
});

// 完成通知
battlePool.on('battle_complete', (battle) => {
  uiSystem.showNotification({
    title: battle.status === 'completed' ? '✅ 戰鬥勝利' : '❌ 戰鬥失敗',
    message: battle.config.task,
    duration: 5000,
    actions: [
      { label: '查看結果', action: () => showBattleResult(battle) }
    ]
  });
});
```

---

## 設計決策

### 決策 1：為什麼需要三種路徑？

**理由**：
1. **Dialog**：即時響應，不需要戰鬥系統（問答類）
2. **Main Sync**：簡單任務，顯示進度但同步執行
3. **Battle Async**：複雜任務，完全異步，支持並發

不同複雜度的任務需要不同的處理方式，三種路徑平衡了響應速度和用戶體驗。

### 決策 2：為什麼 Main Sync 不需要 Worktree？

**理由**：
- Main Sync 是同步執行，用戶必須等待
- 同一時間只有一個 Main Sync 任務
- 沒有並發衝突問題
- 在主目錄執行即可，避免不必要的 worktree 開銷

### 決策 3：為什麼 Battle Async 必須使用 Worktree？

**理由**：
- Battle Async 支持最多 3 個並發執行
- 如果都在主目錄修改代碼，會互相衝突
- Worktree 提供代碼隔離，確保並發安全
- 自動合併和清理，用戶無需關心

### 決策 4：為什麼限制最多 3 個並發？

**理由**：
1. **資源控制**：防止創建過多進程耗盡資源
2. **用戶體驗**：3 個足夠並行，更多會造成混亂
3. **性能考量**：Claude CLI 進程佔用資源較大
4. **可追蹤性**：3 個戰鬥易於追蹤和管理

### 決策 5：為什麼需要排隊機制？

**理由**：
- 超過 3 個並發時，不應拒絕用戶
- 排隊讓用戶知道任務會被執行
- 提供預計等待時間，管理預期
- 有戰鬥完成時自動啟動下一個

---

**文檔完成日期**: 2026-02-06
**總字數**: ~7,500
**章節**: 6
**來源文件**: `/docs/design/async-battle-system/requirements.md` (411 lines)
