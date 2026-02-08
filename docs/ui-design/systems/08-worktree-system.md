# Worktree 手動系統 (Worktree Manual System)

**創建日期**: 2026-02-06
**更新日期**: 2026-02-07
**版本**: v1.1
**來源**: `/docs/design/worktree-manual-system/requirements.md`

💡 **快速參考**:
- 使用 `/battle-management` skill 了解 Worktree 隔離如何支援多 AI 並行戰鬥
- 使用 `/project-overview` skill 了解系統架構與多時間線設計

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

Worktree 手動系統將 Git Worktree 功能 RPG 化為「平行世界/時間線」管理系統，允許玩家在探索模式中手動創建、管理和切換多個獨立的開發環境。

**Git Worktree → RPG 映射**：
```
Git 概念                  RPG 概念
─────────────────────────────────
Worktree          →      平行世界/時間線
Branch            →      任務線/劇情線
Checkout          →      傳送/切換世界
多個 Worktree 同時 →      多重任務並行
Stash             →      暫存寶箱
Merge             →      時空融合
```

**世界觀設定**：
```
你的專案存在於多個平行時間線中
每個時間線都是獨立的開發環境
你可以同時在不同時間線工作
不同時間線之間可以互相融合

主世界 (main)
  └─ 穩定的生產環境，受到保護

平行時間線
  ├─ 冒險世界 (feature/*) - 開發新功能
  ├─ 修復世界 (fix/*) - Bug修復
  ├─ 實驗世界 (experiment/*) - 技術實驗
  └─ 緊急世界 (hotfix/*) - 緊急修復
```

### 與 Async Battle System 的區別

| 特性 | Worktree Manual System | Async Battle System |
|-----|----------------------|-------------------|
| **觸發方式** | 用戶主動創建 | 戰鬥自動創建 |
| **使用場景** | 探索模式、手動開發 | 戰鬥模式、並發任務 |
| **生命週期** | 長期（幾天到幾週） | 短暫（幾分鐘到幾小時） |
| **管理方式** | 用戶手動管理 | 系統自動管理 |
| **目的** | 並行開發多個任務 | 解決並發戰鬥代碼衝突 |
| **Worktree 路徑** | `worktrees/<name>/` | `worktrees/battle_<id>/` |
| **分支命名** | `feature/<name>`, `fix/<name>` | `battle/<id>` |
| **合併** | 用戶決定何時合併 | 戰鬥完成自動合併 |
| **清理** | 用戶手動刪除或提醒 | 戰鬥結束自動清理 |

**設計理念**：
- 手動系統：長期開發，用戶完全控制
- 自動系統：短期戰鬥，系統自動管理
- 兩者互不干擾，各司其職

---

## 依賴關係

### 上游依賴

```
Worktree 手動系統依賴：
├─ Git 系統（L0）- 提供 Git Worktree 功能
├─ 檔案系統（L0）- 管理 worktree 目錄
├─ MP 系統（L1）- 全局 MP 消耗
└─ 場景系統（L2）- 只能在探索模式操作
```

### 下游依賴

```
影響的系統：
├─ UI 系統（L3）- 時空管理器界面
├─ 成就系統（L3）- Worktree 相關成就
└─ 教學系統（L3）- Worktree 教學
```

### 系統架構位置

```
L4: 展示層
    └─ 時空管理器 UI
L3: 業務層 ⭐
    └─ Worktree 手動系統（本系統）
L2: 核心層
    └─ 場景系統（限制只能探索模式）
L1: 基礎層
    └─ MP 系統（全局 MP 池）
L0: 數據層
    └─ Git + 檔案系統
```

---

## 核心規則

### 規則 1：平行世界類型

#### 1.1 主世界（Main）

```
mainWorld = {
  id: 'main',
  icon: '🏰',
  name: '主世界',
  description: '穩定的生產環境，受到保護',
  color: '#4A90E2',

  protection: 'high',  // 保護等級

  allowedActions: [
    'view',          // 查看
    'merge_into'     // 允許其他分支合併進來
  ],

  restrictions: [
    'direct_commit'  // 禁止直接提交
  ],

  features: {
    autoBackup: true,      // 自動備份
    requireReview: true    // 需要代碼審查
  }
}
```

**特點**：
- 最高保護級別
- 禁止直接提交
- 只能接受合併
- 自動備份
- 需要代碼審查

#### 1.2 冒險世界（Feature）

```
featureWorld = {
  id: 'feature',
  icon: '⚔️',
  name: '冒險世界',
  description: '開發新功能的平行時間線',
  color: '#50C878',

  protection: 'low',

  allowedActions: [
    'commit',
    'push',
    'merge',
    'delete'
  ],

  features: {
    autoCleanup: true,      // 合併後自動清理
    suggestionEnabled: true // AI 建議
  },

  summonCost: {
    mp: 10,
    cooldown: 0
  }
}
```

**適用場景**：
- 開發新功能
- 長期開發任務
- 需要多次提交的任務

**MP 消耗**：10 MP（基礎成本）

#### 1.3 修復世界（Fix）

```
fixWorld = {
  id: 'fix',
  icon: '🛡️',
  name: '修復世界',
  description: '快速修復問題的緊急時間線',
  color: '#E27D60',

  protection: 'medium',
  priority: 'high',

  allowedActions: [
    'commit',
    'push',
    'merge',
    'delete'
  ],

  features: {
    quickMerge: true,       // 快速合併
    autoTest: true          // 自動測試
  },

  summonCost: {
    mp: 15,
    cooldown: 0
  }
}
```

**適用場景**：
- Bug 修復
- 問題排查
- 緊急問題處理

**MP 消耗**：15 MP

#### 1.4 實驗世界（Experiment）

```
experimentWorld = {
  id: 'experiment',
  icon: '🔮',
  name: '實驗世界',
  description: '安全的實驗空間，可隨時放棄',
  color: '#9B59B6',

  protection: 'none',
  temporary: true,

  allowedActions: [
    'commit',
    'delete',
    'abandon'
  ],

  features: {
    safeZone: true,         // 安全區域
    autoExpire: 7           // 7天後自動過期
  },

  summonCost: {
    mp: 5,
    cooldown: 0
  }
}
```

**適用場景**：
- 技術實驗
- 概念驗證
- 嘗試新方案

**MP 消耗**：5 MP（最低）

**特點**：
- 無保護，完全自由
- 臨時性質
- 可隨時放棄
- 7天後自動過期提醒

#### 1.5 緊急世界（Hotfix）

```
hotfixWorld = {
  id: 'hotfix',
  icon: '🚨',
  name: '緊急世界',
  description: '緊急修復生產環境問題',
  color: '#FF4444',

  protection: 'medium',
  priority: 'critical',

  allowedActions: [
    'commit',
    'push',
    'merge_to_main'
  ],

  features: {
    fastTrack: true,        // 快速通道
    skipCI: false,          // 不跳過 CI
    notifyTeam: true        // 通知團隊
  },

  summonCost: {
    mp: 20,
    cooldown: 300           // 5分鐘冷卻
  }
}
```

**適用場景**：
- 生產環境緊急問題
- 嚴重 bug 修復
- 安全漏洞修補

**MP 消耗**：20 MP（最高）

**冷卻時間**：5 分鐘（防止濫用）

---

### 規則 2：資源管理與戰鬥系統分離

#### 2.1 獨立 MP 池

**設計決策**：Worktree 操作使用全局 MP，與戰鬥 MP 分離

```
worktreeSystem = {
  // 使用全局 MP（非戰鬥 MP）
  mpPool: 'global',

  // 只能在戰鬥外操作
  availableWhen: 'outOfBattle',

  // MP 消耗規則
  costs: {
    create: 10,      // 創建新世界: -10 全局 MP
    switch: 5,       // 切換世界: -5 全局 MP
    merge: 20,       // 合併世界: -20 全局 MP
    delete: 0        // 刪除世界: 免費
  },

  // 戰鬥中限制
  battleRestrictions: {
    canCreate: false,
    canSwitch: false,
    canMerge: false,
    canView: true    // 只能查看，不能操作
  }
}
```

#### 2.2 操作前檢查

```
function canPerformWorktreeAction(action) {
  // 1. 檢查是否在戰鬥中
  if (gameState.inBattle) {
    return {
      allowed: false,
      error: '⚔️ 戰鬥中無法操作平行世界！請先完成當前戰鬥。'
    };
  }

  // 2. 檢查全局 MP
  const cost = worktreeSystem.costs[action];
  if (player.globalMp < cost) {
    return {
      allowed: false,
      error: `⚡ MP 不足！需要 ${cost} MP，當前 ${player.globalMp} MP。`
    };
  }

  return { allowed: true };
}
```

#### 2.3 設計理由

1. **避免衝突**：Worktree 操作是開發流程管理，與戰鬥的技能/召喚系統性質不同
2. **專注戰鬥**：戰鬥中玩家應專注戰術決策，不被 Git 操作干擾
3. **資源分離**：全局 MP 用於日常開發操作，戰鬥 MP 用於技能施放
4. **UX 優化**：防止在緊張的戰鬥中誤觸 Worktree 功能

---

### 規則 3：Worktree 生命週期管理

#### 3.1 創建流程

```
async function createWorktree(config) {
  // 1. 驗證輸入
  const validation = validateWorktreeConfig(config);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // 2. 檢查 MP 和場景
  const check = canPerformWorktreeAction('create');
  if (!check.allowed) {
    return { error: check.error };
  }

  // 3. 生成 worktree 路徑和分支名
  const path = `worktrees/${config.name}`;
  const branch = `${config.type}/${config.name}`;

  // 4. 執行 Git 命令
  try {
    await execGit(`worktree add ${path} -b ${branch}`);
  } catch (error) {
    return { error: `創建失敗: ${error.message}` };
  }

  // 5. 扣除 MP
  player.globalMp -= worktreeSystem.costs.create;

  // 6. 記錄元數據
  const worktree = {
    id: generateId(),
    name: config.name,
    type: config.type,
    path: path,
    branch: branch,
    baseBranch: config.baseBranch || 'main',
    description: config.description,
    tags: config.tags || [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    stats: initStats()
  };

  worktreeRegistry.add(worktree);

  // 7. 返回成功
  return { success: true, worktree };
}
```

**創建動畫**：
```
1. 魔法陣展開（0.5s）
2. 時空裂縫出現（0.3s）
3. 新世界形成（0.4s）
4. 完成特效（0.2s）

總時長：1.4 秒
音效：召喚音效 → 時空音效 → 完成音
```

#### 3.2 切換流程

```
async function switchWorktree(targetId) {
  // 1. 檢查條件
  const check = canPerformWorktreeAction('switch');
  if (!check.allowed) {
    return { error: check.error };
  }

  // 2. 檢查未提交變更
  const currentWorktree = getCurrentWorktree();
  const hasChanges = await checkUncommittedChanges(currentWorktree);

  if (hasChanges) {
    // 提示用戶
    const choice = await promptUser({
      message: '當前世界有未提交的變更',
      options: [
        { label: '暫存到寶箱 (Stash)', action: 'stash' },
        { label: '提交變更 (Commit)', action: 'commit' },
        { label: '放棄變更 (Discard)', action: 'discard' },
        { label: '取消切換', action: 'cancel' }
      ]
    });

    if (choice === 'cancel') {
      return { cancelled: true };
    }

    // 處理變更
    await handleChanges(choice, currentWorktree);
  }

  // 3. 切換目錄
  const target = worktreeRegistry.get(targetId);
  process.chdir(target.path);

  // 4. 扣除 MP
  player.globalMp -= worktreeSystem.costs.switch;

  // 5. 更新狀態
  currentWorktree.lastActivity = Date.now();
  target.lastActivity = Date.now();

  // 6. 返回成功
  return { success: true, target };
}
```

**切換動畫**：
```
1. 時空門打開（0.3s）
2. 傳送效果（0.5s）
3. 到達新世界（0.3s）

總時長：1.1 秒
音效：傳送門音效 → 傳送中 → 到達音
```

#### 3.3 合併流程

```
async function mergeWorktree(sourceId, targetBranch = 'main') {
  // 1. 檢查條件
  const check = canPerformWorktreeAction('merge');
  if (!check.allowed) {
    return { error: check.error };
  }

  // 2. 獲取源 worktree
  const source = worktreeRegistry.get(sourceId);

  // 3. 檢查衝突
  const conflicts = await detectConflicts(source.branch, targetBranch);

  if (conflicts.length > 0) {
    // 顯示衝突
    return {
      hasConflicts: true,
      conflicts: conflicts,
      options: [
        { label: '手動解決', action: 'manual' },
        { label: 'AI 輔助解決', action: 'ai', mpCost: 10 },
        { label: '放棄合併', action: 'abort' }
      ]
    };
  }

  // 4. 執行合併
  try {
    await execGit(`checkout ${targetBranch}`);
    await execGit(`merge ${source.branch}`);
  } catch (error) {
    return { error: `合併失敗: ${error.message}` };
  }

  // 5. 扣除 MP
  player.globalMp -= worktreeSystem.costs.merge;

  // 6. 自動清理（如果啟用）
  if (source.features.autoCleanup) {
    await deleteWorktree(sourceId);
  }

  // 7. 返回成功
  return { success: true, merged: source };
}
```

**合併動畫**：
```
1. 兩個世界靠近（0.4s）
2. 融合特效（0.6s）
3. 合併完成（0.3s）

總時長：1.3 秒
音效：融合音效 → 合併中 → 完成音
```

#### 3.4 刪除流程

```
async function deleteWorktree(worktreeId) {
  // 1. 獲取 worktree
  const worktree = worktreeRegistry.get(worktreeId);

  // 2. 確認刪除
  const confirmed = await confirmDelete(worktree);
  if (!confirmed) {
    return { cancelled: true };
  }

  // 3. 檢查未合併的提交
  const unmergedCommits = await checkUnmergedCommits(worktree.branch);

  if (unmergedCommits.length > 0) {
    const choice = await promptUser({
      message: `此世界有 ${unmergedCommits.length} 個未合併的提交`,
      options: [
        { label: '先合併再刪除', action: 'merge_first' },
        { label: '保留分支，只刪除 worktree', action: 'keep_branch' },
        { label: '強制刪除（丟失提交）', action: 'force', warning: true },
        { label: '取消', action: 'cancel' }
      ]
    });

    if (choice === 'cancel') {
      return { cancelled: true };
    }

    await handleDeleteChoice(choice, worktree);
  }

  // 4. 執行刪除
  try {
    await execGit(`worktree remove ${worktree.path}`);
    await execGit(`branch -D ${worktree.branch}`);  // 可選
  } catch (error) {
    return { error: `刪除失敗: ${error.message}` };
  }

  // 5. 移除元數據
  worktreeRegistry.remove(worktreeId);

  // 6. 返回成功（刪除免費）
  return { success: true };
}
```

---

### 規則 4：暫存管理（Stash）

#### 4.1 暫存寶箱

**概念**：將未提交的變更暫存到「寶箱」中

```
stashSystem = {
  icon: '📦',
  name: '暫存寶箱',
  description: '暫時保存未完成的工作',

  operations: {
    save: {
      cost: 0,  // 免費
      effect: '保存當前變更到寶箱'
    },
    list: {
      cost: 0,
      effect: '查看所有暫存'
    },
    apply: {
      cost: 0,
      effect: '恢復暫存的變更'
    },
    drop: {
      cost: 0,
      effect: '刪除暫存'
    }
  }
}
```

#### 4.2 暫存操作

```
// 保存暫存
async function saveStash(worktreeId, message) {
  const worktree = worktreeRegistry.get(worktreeId);

  // 切換到 worktree 目錄
  process.chdir(worktree.path);

  // 執行 stash
  const result = await execGit(`stash push -m "${message}"`);

  // 記錄
  worktree.stashes.push({
    id: generateId(),
    message: message,
    timestamp: Date.now(),
    files: result.files
  });

  return { success: true };
}

// 應用暫存
async function applyStash(worktreeId, stashId) {
  const worktree = worktreeRegistry.get(worktreeId);
  const stash = worktree.stashes.find(s => s.id === stashId);

  process.chdir(worktree.path);

  // 應用 stash
  await execGit(`stash apply ${stash.gitIndex}`);

  return { success: true };
}
```

---

### 規則 5：元數據追蹤

#### 5.1 Worktree 數據結構

```typescript
interface Worktree {
  // 基本資訊
  id: string;
  name: string;
  type: 'feature' | 'fix' | 'experiment' | 'hotfix';

  // Git 資訊
  path: string;
  branch: string;
  baseBranch: string;

  // 描述與標籤
  description: string;
  tags: string[];

  // 時間資訊
  createdAt: number;
  lastActivity: number;
  lastCommit: number;

  // 統計資訊
  stats: {
    commits: number;
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    workingHours: number;
  };

  // 進度追蹤
  progress: {
    status: 'planning' | 'in_progress' | 'review' | 'completed';
    completion: number;  // 0-1
    milestones: Milestone[];
  };

  // 活動記錄
  activities: Activity[];

  // 狀態標記
  flags: {
    hasUncommitted: boolean;
    hasConflicts: boolean;
    needsReview: boolean;
    isStale: boolean;
  };

  // 元數據
  metadata: {
    assignedTo: string;
    reviewers: string[];
    linkedIssue: string;
    estimatedTime: number;
    actualTime: number;
  };
}
```

#### 5.2 自動統計

```
// 自動更新統計
function updateWorktreeStats(worktreeId) {
  const worktree = worktreeRegistry.get(worktreeId);

  // 獲取 Git 統計
  const stats = execGitStats(worktree.path);

  worktree.stats = {
    commits: stats.commitCount,
    filesChanged: stats.filesChanged,
    linesAdded: stats.insertions,
    linesDeleted: stats.deletions,
    workingHours: calculateWorkingHours(worktree)
  };

  // 更新進度
  worktree.progress.completion = estimateCompletion(worktree);

  // 檢查標記
  worktree.flags = {
    hasUncommitted: await hasUncommittedChanges(worktree.path),
    hasConflicts: await hasConflicts(worktree.branch),
    needsReview: worktree.progress.status === 'review',
    isStale: isStale(worktree.lastActivity)
  };
}
```

---

### 規則 6：智能功能

#### 6.1 自動清理建議

```
// 檢測可清理的 worktree
function detectCleanableWorktrees() {
  const suggestions = [];

  worktreeRegistry.forEach(worktree => {
    // 已合併且過期
    if (worktree.progress.status === 'completed' &&
        daysSince(worktree.lastActivity) > 7) {
      suggestions.push({
        worktree,
        reason: '已完成且 7 天未活動',
        action: 'delete'
      });
    }

    // 實驗世界過期
    if (worktree.type === 'experiment' &&
        daysSince(worktree.createdAt) > 7) {
      suggestions.push({
        worktree,
        reason: '實驗世界已超過 7 天',
        action: 'archive_or_delete'
      });
    }

    // 長期未活動
    if (daysSince(worktree.lastActivity) > 30) {
      suggestions.push({
        worktree,
        reason: '30 天未活動',
        action: 'review'
      });
    }
  });

  return suggestions;
}
```

#### 6.2 衝突預警

```
// 檢測潛在衝突
async function detectPotentialConflicts(worktreeId) {
  const worktree = worktreeRegistry.get(worktreeId);
  const warnings = [];

  // 檢查與主分支的差異
  const diff = await gitDiff(worktree.branch, worktree.baseBranch);

  if (diff.conflicts > 0) {
    warnings.push({
      type: 'merge_conflict',
      severity: 'high',
      message: `與 ${worktree.baseBranch} 有 ${diff.conflicts} 個潛在衝突`
    });
  }

  // 檢查其他 worktree 的衝突
  const others = worktreeRegistry.getAll().filter(w => w.id !== worktreeId);

  for (const other of others) {
    const overlap = await detectFileOverlap(worktree, other);

    if (overlap.files.length > 0) {
      warnings.push({
        type: 'parallel_edit',
        severity: 'medium',
        message: `與 ${other.name} 同時編輯了 ${overlap.files.length} 個文件`
      });
    }
  }

  return warnings;
}
```

---

### 規則 7：成就與獎勵

```
worktreeAchievements = [
  {
    id: 'time_traveler',
    name: '時空探索者',
    description: '創建第一個時間線',
    icon: '🌍',
    reward: { gold: 200, exp: 100 }
  },
  {
    id: 'multitasker',
    name: '多重任務大師',
    description: '同時維護 3 個以上時間線',
    icon: '⚡',
    reward: { gold: 500, special: '切換 MP 消耗 -20%' }
  },
  {
    id: 'merger',
    name: '時空融合',
    description: '成功合併第一個時間線',
    icon: '🔀',
    reward: { gold: 300, exp: 150 }
  },
  {
    id: 'conflict_resolver',
    name: '衝突調停者',
    description: '解決 10 次合併衝突',
    icon: '🛡️',
    reward: { gold: 800, special: 'AI 輔助解決免費' }
  },
  {
    id: 'janitor',
    name: '整潔大師',
    description: '清理 20 個已完成的時間線',
    icon: '🧹',
    reward: { gold: 1000, exp: 500 }
  },
  {
    id: 'portal_master',
    name: '時空旅行者',
    description: '切換 100 次',
    icon: '⏰',
    reward: { gold: 1500, special: '切換時間 -50%' }
  },
  {
    id: 'parallel_world_master',
    name: '平行世界大師',
    description: '同時維護 10 個時間線',
    icon: '🌀',
    reward: { gold: 3000, special: '時間線上限 +5' }
  }
];
```

---

## 內部地圖

### 時空管理器 UI

```
┌─────────────────────────────────────────────────────────┐
│  ⏰ 時空管理器 (Worktree Manager)        💰 4,200      │
│  「管理你的平行世界」                      ⚡ MP: 85/100│
├─────────────────────────────────────────────────────────┤
│  [列表視圖] [時間線圖] [看板視圖]                        │
│  篩選：[全部] [feature] [fix] [experiment]              │
│  排序：[最近活動▼] [創建時間] [完成度]                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏰 主世界 (main)                         [當前]       │
│  ├─ 狀態：生產環境                                      │
│  ├─ 保護：🔒 高                                         │
│  └─ 操作：[查看] [接受合併]                             │
│                                                         │
│  ⚔️ user-authentication (feature)        [活躍]       │
│  ├─ 描述：實作用戶登入和註冊功能                        │
│  ├─ 進度：████████░░ 80%                               │
│  ├─ 提交：12 | 變更：15 文件                            │
│  ├─ 最後活動：2 小時前                                  │
│  └─ 操作：[切換 5MP] [合併 20MP] [詳情] [刪除]         │
│                                                         │
│  🛡️ payment-bug-fix (fix)                [就緒]       │
│  ├─ 描述：修復支付超時問題                              │
│  ├─ 進度：██████████ 100%                             │
│  ├─ 提交：5 | 變更：3 文件                              │
│  ├─ 最後活動：1 天前                                    │
│  ├─ ⚠️ 建議：已完成，可以合併                          │
│  └─ 操作：[切換 5MP] [合併 20MP] [詳情] [刪除]         │
│                                                         │
│  🔮 graphql-experiment (experiment)      [實驗]       │
│  ├─ 描述：測試 GraphQL 方案                             │
│  ├─ 進度：████░░░░░░ 40%                               │
│  ├─ 提交：8 | 變更：20 文件                             │
│  ├─ 最後活動：5 天前                                    │
│  ├─ ⏰ 警告：將於 2 天後自動過期                        │
│  └─ 操作：[切換 5MP] [放棄] [詳情]                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  總計：4 個時間線（1 主世界 + 3 平行）                   │
│  [創建新世界 10MP] [批量操作] [清理建議]                │
└─────────────────────────────────────────────────────────┘
```

### 創建世界 UI

```
┌─────────────────────────────────────────────────────────┐
│  🌟 創建新的平行世界                                    │
├─────────────────────────────────────────────────────────┤
│  步驟：[1.類型] → [2.資訊] → [3.確認]                   │
├─────────────────────────────────────────────────────────┤
│  步驟 1：選擇世界類型                                    │
│                                                         │
│  ◉ ⚔️ 冒險世界 (Feature)             [10 MP]          │
│     開發新功能的平行時間線                               │
│     適合：長期開發、新功能實作                           │
│                                                         │
│  ○ 🛡️ 修復世界 (Fix)                 [15 MP]          │
│     快速修復問題的緊急時間線                             │
│     適合：Bug 修復、問題排查                             │
│                                                         │
│  ○ 🔮 實驗世界 (Experiment)          [5 MP]           │
│     安全的實驗空間，可隨時放棄                           │
│     適合：技術實驗、概念驗證                             │
│     ⚠️ 7 天後自動過期                                   │
│                                                         │
│  ○ 🚨 緊急世界 (Hotfix)              [20 MP] ⏱️ 5min  │
│     緊急修復生產環境問題                                 │
│     適合：嚴重 bug、安全漏洞                             │
│     ⚠️ 有 5 分鐘冷卻時間                                │
│                                                         │
│  [下一步] [取消]                                        │
└─────────────────────────────────────────────────────────┘
```

### 合併衝突 UI

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ 發現合併衝突                                        │
├─────────────────────────────────────────────────────────┤
│  嘗試合併：user-authentication → main                   │
│  發現 3 個文件有衝突                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  衝突文件：                                              │
│                                                         │
│  1. src/auth/login.ts                                  │
│     ├─ 你的版本：添加了 OAuth 支援                      │
│     ├─ main 版本：修復了安全漏洞                        │
│     └─ 衝突行：42-68 (26 行)                            │
│                                                         │
│  2. src/auth/register.ts                               │
│     ├─ 你的版本：新增驗證邏輯                           │
│     ├─ main 版本：更新了密碼規則                        │
│     └─ 衝突行：15-20 (5 行)                             │
│                                                         │
│  3. package.json                                       │
│     ├─ 你的版本：添加了 passport                        │
│     ├─ main 版本：升級了 express                        │
│     └─ 衝突行：12-14 (2 行)                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  解決方案：                                              │
│                                                         │
│  [🔧 手動解決] 在編輯器中手動解決衝突                   │
│                                                         │
│  [🤖 AI 輔助解決 10MP] Claude 分析並提供解決建議        │
│                                                         │
│  [❌ 放棄合併] 取消合併，保持現狀                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 系統整合

### 與場景系統整合

```
// 限制只能在探索模式操作
sceneSystem.on('enter_battle', () => {
  worktreeSystem.setEnabled(false);
  worktreeUI.showBattleRestriction();
});

sceneSystem.on('enter_exploration', () => {
  worktreeSystem.setEnabled(true);
  worktreeUI.enable();
});

// 檢查場景
function canAccessWorktreeSystem() {
  if (sceneSystem.currentScene === 'battle') {
    return {
      allowed: false,
      message: '⚔️ 戰鬥中無法操作時空管理！請先完成戰鬥。'
    };
  }

  return { allowed: true };
}
```

### 與 MP 系統整合

```
// 使用全局 MP
function deductWorktreeMp(action) {
  const cost = worktreeSystem.costs[action];

  if (player.globalMp < cost) {
    return {
      success: false,
      error: `MP 不足！需要 ${cost} MP`
    };
  }

  player.globalMp -= cost;

  return { success: true };
}

// 與戰鬥 MP 分離
mpSystem = {
  globalMp: {
    current: 85,
    max: 100,
    recovery: 10  // 每小時恢復 10
  },
  battleMp: {
    current: 60,
    max: 100,
    recovery: 1   // 戰鬥中每 10 秒恢復 1
  }
}
```

### 與成就系統整合

```
// 觸發成就
worktreeSystem.on('worktree_created', (worktree) => {
  // 第一次創建
  if (worktreeRegistry.count() === 1) {
    achievementSystem.unlock('time_traveler');
  }

  // 多重任務
  if (worktreeRegistry.count() >= 3) {
    achievementSystem.unlock('multitasker');
  }
});

worktreeSystem.on('worktree_merged', (worktree) => {
  // 第一次合併
  const mergeCount = player.stats.worktreeMerges;
  if (mergeCount === 1) {
    achievementSystem.unlock('merger');
  }
});
```

---

## 設計決策

### 決策 1：為什麼與戰鬥系統使用不同的 MP 池？

**理由**：
1. **性質不同**：Worktree 是開發流程管理，與戰鬥技能性質不同
2. **專注分離**：戰鬥中專注戰術，探索中專注開發
3. **避免混淆**：使用不同資源池避免玩家困惑
4. **平衡性**：可以獨立調整兩個系統的資源消耗

### 決策 2：為什麼戰鬥中禁用 Worktree 操作？

**理由**：
1. **UX 考量**：戰鬥中不應被 Git 操作干擾
2. **防止誤操作**：緊張戰鬥中可能誤觸
3. **邏輯合理**：戰鬥是「執行任務」，不是「管理任務」
4. **系統分離**：Async Battle 有自己的 worktree 管理

### 決策 3：為什麼需要 5 種世界類型？

**理由**：
1. **Feature**：長期開發，最常用
2. **Fix**：Bug 修復，優先級高
3. **Experiment**：實驗性質，可放棄
4. **Hotfix**：緊急修復，有冷卻防止濫用
5. **Main**：主分支，受保護

每種類型有不同的特性和限制，滿足不同使用場景。

### 決策 4：為什麼刪除 Worktree 免費？

**理由**：
1. **鼓勵清理**：清理是好習慣，不應懲罰
2. **已付出成本**：創建時已經付費
3. **降低負擔**：避免玩家囤積無用 worktree

### 決策 5：為什麼需要自動過期機制？

**理由**：
1. **實驗世界**：7 天過期鼓勵及時決策
2. **防止囤積**：避免太多無用 worktree
3. **提醒功能**：過期前提醒玩家處理
4. **可配置**：玩家可以延期或關閉

---

**文檔完成日期**: 2026-02-06
**總字數**: ~6,800
**章節**: 6
**來源文件**: `/docs/design/worktree-manual-system/requirements.md` (619 lines)
