# Worktree Manual System - Requirements

## 核心概念

### 問題陳述

**開發中的痛點**：
- 經常需要在不同分支間切換
- 傳統 `git checkout` 會中斷當前工作
- 多任務並行很困難
- 切換分支時需要暫存或提交未完成的工作

**解決方案：Git Worktree 的 RPG 化**
```
Git Worktree = 平行世界/時間線
多個 worktree 可以同時存在
在不同「世界」中並行工作
每個世界都是獨立的開發環境
```

### 與 Async Battle System 的區別

| 特性 | Worktree Manual System | Async Battle System |
|-----|----------------------|-------------------|
| 觸發方式 | 用戶主動創建 | 戰鬥自動創建 |
| 使用場景 | 探索模式、手動開發 | 戰鬥模式、並發任務 |
| 生命週期 | 長期（幾天到幾週） | 短暫（幾分鐘到幾小時） |
| 管理方式 | 用戶手動管理 | 系統自動管理 |
| 目的 | 並行開發多個任務 | 解決並發戰鬥代碼衝突 |
| Worktree 路徑 | `worktrees/<name>/` | `worktrees/battle_<id>/` |
| 分支命名 | `feature/<name>`, `fix/<name>` | `battle/<id>` |
| 合併 | 用戶決定何時合併 | 戰鬥完成自動合併 |
| 清理 | 用戶手動刪除或提醒 | 戰鬥結束自動清理 |

### Git 概念到 RPG 的映射

```
Git概念          →    RPG概念
─────────────────────────────────
Worktree         →    平行世界/時間線
Branch           →    任務線/劇情線
Checkout         →    傳送/切換世界
多個Worktree同時  →    多重任務並行
Stash            →    暫存寶箱
Merge            →    時空融合
```

### 世界觀設定

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

## 資源管理與戰鬥系統分離

### 重要設計決策

**Worktree 操作與戰鬥系統使用獨立的 MP 池**：

```javascript
worktreeSystem: {
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

// 操作前檢查
function canPerformWorktreeAction(action) {
  // 戰鬥中禁用所有操作（除了查看）
  if (gameState.inBattle) {
    return {
      allowed: false,
      error: '⚔️ 戰鬥中無法操作平行世界！請先完成當前戰鬥。'
    };
  }

  // 檢查全局 MP
  const cost = worktreeSystem.costs[action];
  if (player.mp < cost) {
    return {
      allowed: false,
      error: `⚡ MP 不足！需要 ${cost} MP，當前 ${player.mp} MP。`
    };
  }

  return { allowed: true };
}
```

### 設計理由

1. **避免衝突**：Worktree 操作是開發流程管理，與戰鬥的技能/召喚系統性質不同
2. **專注戰鬥**：戰鬥中玩家應專注戰術決策，不被 Git 操作干擾
3. **資源分離**：全局 MP 用於日常開發操作，戰鬥 MP 用於技能施放
4. **UX 優化**：防止在緊張的戰鬥中誤觸 Worktree 功能

## 平行世界類型

### 1. 主世界（Main）

```javascript
main: {
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
    autoBackup: true,
    requireReview: true
  }
}
```

**特點**：
- 最高保護級別
- 禁止直接提交
- 只能接受合併
- 自動備份
- 需要代碼審查

---

### 2. 冒險世界（Feature）

```javascript
feature: {
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

**特點**：
- 保護級別低，自由度高
- 合併後自動清理
- AI 輔助建議
- 創建成本：10 MP
- 無冷卻時間

---

### 3. 修復世界（Fix）

```javascript
fix: {
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

**特點**：
- 中等保護級別
- 高優先級
- 快速合併通道
- 自動執行測試
- 創建成本：15 MP

---

### 4. 實驗世界（Experiment）

```javascript
experiment: {
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

**特點**：
- 無保護，完全自由
- 臨時性質
- 可隨時放棄
- 7天後自動過期提醒
- 創建成本最低：5 MP

---

### 5. 緊急世界（Hotfix）

```javascript
hotfix: {
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

**特點**：
- 中等保護級別
- 最高優先級（critical）
- 直達主分支的快速通道
- 不跳過 CI/CD
- 自動通知團隊
- 創建成本最高：20 MP
- **有冷卻時間**：5分鐘（防止濫用）

## 使用場景

### 場景 1：並行開發多個功能

```
問題：我需要同時開發「用戶認證」和「支付系統」

解決：
1. 創建冒險世界 #1: feature/user-auth
2. 創建冒險世界 #2: feature/payment
3. 在兩個世界間自由切換
4. 每個功能獨立開發，互不干擾
5. 完成後分別合併到主世界
```

### 場景 2：功能開發中遇到緊急 Bug

```
情況：正在開發新功能，生產環境出現 bug

解決：
1. 當前在 feature/new-ui
2. 創建緊急世界: hotfix/critical-bug
3. 切換到 hotfix 世界修復 bug
4. 快速合併到 main 並部署
5. 切換回 feature/new-ui 繼續開發
```

### 場景 3：技術方案選型

```
問題：不確定該用方案 A 還是方案 B

解決：
1. 創建實驗世界 #1: experiment/solution-a
2. 創建實驗世界 #2: experiment/solution-b
3. 分別實現兩個方案
4. 比較結果，選擇更好的
5. 保留選中的，刪除另一個
```

### 場景 4：代碼審查

```
情況：需要審查同事的代碼

解決：
1. 創建修復世界: fix/review-changes
2. 基於同事的分支創建
3. 在獨立環境中測試和修改
4. 給出反饋或直接修復
5. 合併或提交建議
```

## 時間線數據結構

```javascript
{
  worktree: {
    // 基本資訊
    id: 'wt_001',
    name: 'user-authentication',
    type: 'feature',              // feature/fix/experiment/hotfix

    // Git 資訊
    path: '/Users/xxx/worktrees/user-auth',
    branch: 'feature/user-authentication',
    baseBranch: 'main',

    // 描述與標籤
    description: '實作用戶登入和註冊功能',
    tags: ['auth', 'security', 'user-management'],

    // 時間資訊
    createdAt: '2026-02-02T10:00:00Z',
    lastActivity: '2026-02-05T15:30:00Z',
    lastCommit: '2026-02-05T15:30:00Z',

    // 統計資訊
    stats: {
      commits: 12,
      filesChanged: 15,
      linesAdded: 450,
      linesDeleted: 120,
      workingHours: 8.5
    },

    // 進度追蹤
    progress: {
      status: 'in_progress',     // planning/in_progress/review/completed
      completion: 0.8,            // 80%
      milestones: [
        { name: '設計', done: true },
        { name: '實現', done: true },
        { name: '測試', done: false },
        { name: '文檔', done: false }
      ]
    },

    // 活動記錄
    activities: [
      {
        timestamp: '2026-02-05T15:30:00Z',
        type: 'commit',
        message: '完成密碼加密功能',
        author: 'user_001'
      }
    ],

    // 狀態標記
    flags: {
      hasUncommitted: true,
      hasConflicts: false,
      needsReview: false,
      isStale: false
    },

    // 元數據
    metadata: {
      assignedTo: 'user_001',
      reviewers: ['user_002', 'user_003'],
      linkedIssue: 'ISSUE-123',
      estimatedTime: 16,          // 預估16小時
      actualTime: 8.5             // 實際8.5小時
    }
  }
}
```

## 功能需求

### 1. 基礎操作

- **創建時間線**：選擇類型、填寫信息、自動創建 worktree 和分支
- **列出時間線**：顯示所有活躍的時間線，包含狀態和統計
- **切換時間線**：安全切換工作目錄，處理未提交變更
- **刪除時間線**：清理 worktree 和分支，可選擇保留或刪除分支

### 2. 高級操作

- **合併時間線**：衝突檢測、AI 輔助解決、自動測試
- **暫存管理（Stash）**：暫存未提交變更、列出暫存、恢復暫存
- **時間線比較**：對比兩個時間線的差異、文件變更統計
- **狀態監控**：實時監控活躍時間線、資源使用、進程狀態

### 3. 智能功能

- **自動清理**：檢測可清理的時間線、建議刪除或歸檔
- **衝突預警**：檢測潛在衝突、團隊成員協作提醒
- **模板系統**：快速創建常用類型的時間線
- **進度追蹤**：里程碑管理、完成度估算

## 系統整合

### 與 Scene System 整合

```
探索模式：
- 可以自由創建/管理 worktree
- 訪問時空管理器
- 查看和切換時間線

戰鬥模式：
- 禁止創建/切換/合併操作
- 只能查看時間線狀態
- 戰鬥 worktree 由 Async Battle System 管理
```

### 與 MP System 整合

```
全局 MP 系統：
- Worktree 操作消耗全局 MP
- 不影響戰鬥 MP
- MP 恢復機制獨立

MP 消耗表：
- 創建冒險世界：10 MP
- 創建修復世界：15 MP
- 創建實驗世界：5 MP
- 創建緊急世界：20 MP
- 切換時間線：5 MP
- 合併時間線：20 MP
- 刪除時間線：0 MP
```

### 與成就系統整合

```
相關成就：
- 🌍 時空探索者：創建第一個時間線
- ⚡ 多重任務大師：同時維護3個以上時間線
- 🔀 時空融合：成功合併第一個時間線
- 🛡️ 衝突調停者：解決10次合併衝突
- 🧹 整潔大師：清理20個已完成的時間線
- ⏰ 時空旅行者：切換100次
- 🌀 平行世界大師：同時維護10個時間線
```

## 實現優先級

### Phase 1: MVP 基礎（Week 1-8）

**目標**：基本可用的 worktree 管理

✅ **必須實現**：
- 創建/刪除 worktree
- 列表顯示（簡單列表視圖）
- 基本元數據管理
- 切換工作目錄
- 基本狀態檢查

❌ **暫不實現**：
- 複雜動畫
- 協作功能
- 自動清理
- 時間線圖

---

### Phase 2: UI 美化（Week 9-12）

**目標**：完整的用戶體驗

✅ **實現內容**：
- 完整的 UI 設計（時空管理器）
- 動畫效果（創建、切換、合併）
- 音效（傳送、融合）
- 狀態監控面板
- Stash 功能
- 快速切換列表

---

### Phase 3: 進階功能（Week 13+）

**目標**：生產力工具

✅ **實現內容**：
- 合併系統（衝突檢測、AI 輔助）
- 自動清理建議
- 時間線比較
- 三種視圖模式（列表、時間線圖、看板）
- 模板系統
- 協作功能（團隊視圖、衝突警告）

## 成功標準

### 功能完整性
- ✅ 支持 5 種世界類型
- ✅ 完整的創建/切換/合併/刪除流程
- ✅ 與戰鬥系統隔離
- ✅ 全局 MP 管理

### 用戶體驗
- ✅ RPG 化的界面和交互
- ✅ 流暢的動畫和音效
- ✅ 清晰的狀態指示
- ✅ 友好的錯誤提示

### 性能指標
- 創建時間線 < 2 秒
- 切換時間線 < 1 秒
- 列表刷新 < 500ms
- 支持最多 10 個並發時間線

### 穩定性
- 自動保存元數據
- 異常情況恢復
- Git 操作錯誤處理
- 文件系統容錯
