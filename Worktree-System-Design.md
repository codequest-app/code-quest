# RPG-CLI Git Worktree 平行世界系統設計

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**狀態**: 詳細設計階段

---

## 目錄

1. [核心概念](#核心概念)
2. [平行世界系統](#平行世界系統)
3. [時間線管理](#時間線管理)
4. [互動功能](#互動功能)
5. [進階功能](#進階功能)
6. [技術實現](#技術實現)
7. [開發路線圖](#開發路線圖)

---

## 核心概念

### 設計理念

```
Git Worktree 的 RPG 化設計

問題:
開發時經常需要在不同分支間切換
傳統 git checkout 會中斷當前工作
多任務並行很困難

解決方案:
Worktree = 平行世界/時間線
多個 worktree 可以同時存在
在不同「世界」中並行工作
```

### 概念映射

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
概念說明:

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

---

## 平行世界系統

### 一、時間線類型

#### 類型定義

```javascript
const worldTypes = {
  // 主世界（主分支）
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
  },

  // 功能開發世界
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
  },

  // Bug修復世界
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
  },

  // 實驗世界
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
  },

  // Hotfix 緊急世界
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
}
```

---

### 二、時間線數據結構

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
      },
      {
        timestamp: '2026-02-05T13:00:00Z',
        type: 'commit',
        message: '新增JWT驗證',
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

---

### 三、主介面設計

#### 時空管理器主視圖

```
┌────────────────────────────────────────────────────────┐
│  🌍 時空管理器                        [+ 新時間線]      │
├────────────────────────────────────────────────────────┤
│  視圖: [●列表] [○時間線圖] [○看板]   排序: [最近活動▼] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🏰 主世界 (main)                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📍 /Users/recca/project                          │ │
│  │ 📊 狀態: 穩定                                     │ │
│  │ 🔒 保護: 高 - 禁止直接提交                        │ │
│  │ 📅 最後更新: 2小時前                              │ │
│  │ 📈 總提交: 1,247                                  │ │
│  │                                                  │ │
│  │ [查看詳情]                        [受保護 🔒]    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ⚔️ 冒險世界 (3個活躍)                                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │ feature/user-authentication                      │ │
│  │ 📍 /Users/recca/worktrees/user-auth              │ │
│  │ ──────────────────────────────────────────────  │ │
│  │ 描述: 實作用戶登入和註冊功能                      │ │
│  │ 創建: 3天前  |  活動: 30分鐘前                    │ │
│  │                                                  │ │
│  │ 📊 統計:                                          │ │
│  │ • 提交: 12個  |  修改: 15個文件                   │ │
│  │ • +450 / -120 行                                 │ │
│  │ • 工作時數: 8.5h / 16h (預估)                    │ │
│  │                                                  │ │
│  │ 進度: ████████░░ 80%                            │ │
│  │ ✓ 設計  ✓ 實現  ○ 測試  ○ 文檔                  │ │
│  │                                                  │ │
│  │ 最近活動:                                         │ │
│  │ • 30分鐘前: 完成密碼加密                          │ │
│  │ • 2小時前: 新增JWT驗證                           │ │
│  │                                                  │ │
│  │ ⚠️  12個文件未提交                                │ │
│  │                                                  │ │
│  │ [進入] [提交] [合併] [關閉]                       │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  🛡️ 修復世界 (1個活躍)                                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │ fix/login-redirect-bug                           │ │
│  │ 📍 /Users/recca/worktrees/login-fix              │ │
│  │ ──────────────────────────────────────────────  │ │
│  │ 描述: 修復登入後重定向錯誤                        │ │
│  │ 創建: 1小時前  |  活動: 10分鐘前                  │ │
│  │                                                  │ │
│  │ 📊 統計:                                          │ │
│  │ • 提交: 3個  |  修改: 3個文件                     │ │
│  │ • 優先級: 🚨 高                                   │ │
│  │                                                  │ │
│  │ 進度: ██████░░░░ 60%                            │ │
│  │                                                  │ │
│  │ [進入] [快速合併] [關閉]                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  🔮 實驗世界 (1個活躍)                                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │ experiment/new-ui-redesign                       │ │
│  │ 📍 /Users/recca/worktrees/new-ui                 │ │
│  │ ──────────────────────────────────────────────  │ │
│  │ 描述: 嘗試全新的UI設計方向                        │ │
│  │ 創建: 5天前  |  活動: 1天前                       │ │
│  │                                                  │ │
│  │ 📊 統計:                                          │ │
│  │ • 提交: 8個  |  修改: 25個文件                    │ │
│  │ • ⚗️ 實驗性 - 可隨時放棄                          │ │
│  │ • ⏰ 2天後自動過期                                │ │
│  │                                                  │ │
│  │ [進入] [決定保留/放棄]                            │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘

右側統計面板:
┌────────────────┐
│ 📊 統計        │
├────────────────┤
│ 活躍時間線: 5   │
│ 總提交數: 1,270 │
│ 本週活動: 45    │
│ 磁碟使用: 1.2GB │
│                │
│ 🏆 成就        │
│ ✓ 時空旅行者   │
│ ✓ 多重任務     │
│ ○ 時空大師     │
└────────────────┘
```

---

## 時間線管理

### 一、創建時間線

#### 創建流程

```
完整創建流程:

┌──────────────┐
│ 點擊「創建新時間線」│
└────────┬─────┘
         │
         ▼
┌─────────────────────────┐
│ 選擇時間線類型           │
│                         │
│ ⚔️  冒險世界（新功能）    │
│     MP: 10              │
│     適合: 功能開發       │
│     [選擇]              │
│                         │
│ 🛡️  修復世界（Bug修復）  │
│     MP: 15              │
│     適合: 問題修復       │
│     [選擇]              │
│                         │
│ 🔮  實驗世界（試驗想法）  │
│     MP: 5               │
│     適合: 技術實驗       │
│     [選擇]              │
│                         │
│ 🚨  緊急世界（Hotfix）   │
│     MP: 20  冷卻: 5分   │
│     適合: 緊急修復       │
│     [選擇]              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 填寫時間線資訊           │
│                         │
│ 名稱:                   │
│ ┌─────────────────────┐ │
│ │ user-authentication  │ │
│ └─────────────────────┘ │
│                         │
│ 基於分支:                │
│ ┌─────────────────────┐ │
│ │ main            ▼  │ │
│ └─────────────────────┘ │
│                         │
│ 描述:                   │
│ ┌─────────────────────┐ │
│ │ 實作用戶登入和註冊   │ │
│ │ 功能，包含JWT驗證    │ │
│ └─────────────────────┘ │
│                         │
│ 標籤: (可選)             │
│ ┌─────────────────────┐ │
│ │ #auth #security      │ │
│ └─────────────────────┘ │
│                         │
│ 預估時間: (可選)         │
│ ┌─────────────────────┐ │
│ │ 16 小時          ▼  │ │
│ └─────────────────────┘ │
│                         │
│ 💰 消耗: MP -10         │
│                         │
│ [取消]      [創建時間線] │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 執行 Git 操作            │
│                         │
│ $ git worktree add      │
│   ../worktrees/xxx      │
│   -b feature/xxx        │
│   main                  │
│                         │
│ [執行中...]             │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 時空裂縫開啟動畫         │
│                         │
│      ✨  🌀  ✨         │
│    ✨   🚪   ✨        │
│      ✨  🌀  ✨         │
│                         │
│  正在開啟新時間線...     │
│                         │
│ [音效: portal_open.wav] │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 創建成功                │
│                         │
│ ✓ 新時間線已開啟         │
│                         │
│ ⚔️ user-authentication  │
│ 📍 /worktrees/user-auth │
│                         │
│ 接下來要做什麼?          │
│                         │
│ [立即進入並開啟編輯器]   │
│ [查看時間線詳情]         │
│ [稍後處理]              │
└─────────────────────────┘
```

#### 模板系統

```
快速創建模板:

┌────────────────────────────────────┐
│  📋 時間線模板                      │
├────────────────────────────────────┤
│                                    │
│  選擇模板快速創建:                  │
│                                    │
│  ⚔️ 新功能開發                      │
│  ├─ 基於: main                     │
│  ├─ 命名: feature/{name}           │
│  ├─ 包含: README.md, tests/        │
│  ├─ 自動: 創建分支結構              │
│  └─ [使用模板]                     │
│                                    │
│  🛡️ Bug修復                         │
│  ├─ 基於: main                     │
│  ├─ 命名: fix/{name}               │
│  ├─ 包含: 測試案例範本              │
│  ├─ 自動: 創建 issue 連結          │
│  └─ [使用模板]                     │
│                                    │
│  🚨 緊急Hotfix                      │
│  ├─ 基於: main                     │
│  ├─ 命名: hotfix/{name}            │
│  ├─ 包含: 回滾腳本                  │
│  ├─ 自動: 通知團隊                  │
│  └─ [使用模板]                     │
│                                    │
│  🔮 技術實驗                        │
│  ├─ 基於: develop                  │
│  ├─ 命名: experiment/{name}        │
│  ├─ 包含: 實驗記錄模板              │
│  ├─ 自動: 7天後提醒清理             │
│  └─ [使用模板]                     │
│                                    │
│  [+ 創建自訂模板]                   │
└────────────────────────────────────┘
```

---

### 二、時間線視圖模式

#### 列表視圖（預設）

已在上方主介面中展示

#### 時間線圖視圖

```
Git 分支圖視覺化:

時間 →
──────────────────────────────────────────→

main     ●─────●─────●─────●────────●
         │                      ╱
         │                  ╱ (merge)
feature  └──●──●──●──●──●──╱
            ↑
          3天前

main     ●─────●─────●─────●
         │           ╲
         │            ╲ (branch)
hotfix   │             ●──●──●
         │                  ╲
         │                   ╲ (merge)
         ●────────────────────●

main     ●─────●─────●
         │
         └──●──●──● experiment
            試驗中 (可能放棄)

圖例:
● 提交點
─ 時間線
╲╱ 分支/合併
🏰 main
⚔️ feature
🛡️ fix
🔮 experiment
🚨 hotfix

互動:
• 點擊提交點查看詳情
• 拖拽查看歷史
• 縮放時間軸
```

#### 看板視圖

```
Kanban 模式:

┌───────────┬───────────┬───────────┬───────────┐
│  📝 計畫中 │  🔨 進行中 │  ✅ 審查中 │  🎉 已完成 │
├───────────┼───────────┼───────────┼───────────┤
│           │           │           │           │
│ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │ ┌───────┐ │
│ │⚔️     │ │ │⚔️     │ │ │🛡️     │ │ │⚔️     │ │
│ │新功能A │ │ │用戶認證│ │ │Bug修復│ │ │支付整合│ │
│ │       │ │ │80%    │ │ │需審查  │ │ │已合併  │ │
│ │0%     │ │ │8.5h/16h│ │ │3提交  │ │ │2天前  │ │
│ └───────┘ │ └───────┘ │ └───────┘ │ └───────┘ │
│           │           │           │           │
│ ┌───────┐ │ ┌───────┐ │           │ ┌───────┐ │
│ │🔮     │ │ │🛡️     │ │           │ │🛡️     │ │
│ │UI實驗 │ │ │登入修復│ │           │ │緊急修復│ │
│ │       │ │ │60%    │ │           │ │已合併  │ │
│ │0%     │ │ │2h/4h  │ │           │ │1天前  │ │
│ └───────┘ │ └───────┘ │           │ └───────┘ │
│           │           │           │           │
└───────────┴───────────┴───────────┴───────────┘

功能:
• 拖拽卡片改變狀態
• 點擊查看詳情
• 篩選和排序
• 設定優先級
```

---

## 互動功能

### 一、時間線切換（傳送）

#### 切換流程

```
完整切換流程:

當前世界: feature/user-auth
目標世界: fix/critical-bug

步驟1: 點擊「進入」按鈕
  ↓
步驟2: 檢查當前世界狀態
┌────────────────────────────┐
│ ⚠️  當前世界有未保存的變更  │
│                            │
│ 12個文件已修改但未提交      │
│                            │
│ 請選擇操作:                 │
│                            │
│ 📦 提交變更                 │
│    保存所有變更到Git         │
│    [需要填寫commit訊息]     │
│                            │
│ 💾 暫存到寶箱               │
│    暫時保存，稍後繼續        │
│    [使用 git stash]         │
│                            │
│ 🗑️ 放棄變更                 │
│    丟棄所有未保存的變更      │
│    ⚠️ 此操作無法撤銷         │
│                            │
│ [取消切換]                  │
└────────────────────────────┘

步驟3: 執行選擇的操作
  ↓
步驟4: 傳送動畫
┌────────────────────────────┐
│                            │
│   當前世界      目標世界    │
│      🚪  ~~~>     🚪       │
│   ✨🌀✨      ✨🌀✨      │
│                            │
│   正在傳送...               │
│                            │
│ [音效: teleport.wav]       │
│ [粒子特效動畫]              │
└────────────────────────────┘

步驟5: 切換工作目錄
  ↓ process.chdir(...)
  ↓ 通知編輯器重新載入

步驟6: 抵達新世界
┌────────────────────────────┐
│ ✓ 已傳送到修復世界          │
│                            │
│ 🛡️ fix/critical-bug        │
│ 📍 /worktrees/critical-bug │
│                            │
│ 世界狀態:                   │
│ • 3個文件已修改             │
│ • 最後活動: 1小時前         │
│ • 基於: main               │
│                            │
│ 開啟編輯器:                 │
│ [✓] VSCode                 │
│ [ ] Vim                    │
│ [ ] 稍後手動開啟            │
│                            │
│ [確定]                     │
└────────────────────────────┘
```

#### 快速切換

```
快捷切換列表:

┌────────────────────────────┐
│  ⚡ 快速切換                │
├────────────────────────────┤
│  最近使用:                  │
│                            │
│  ⚔️ user-auth (30分鐘前)   │
│  🛡️ login-fix (2小時前)    │
│  🔮 ui-redesign (1天前)    │
│                            │
│  固定:                      │
│  🏰 main (主世界)           │
│                            │
│  [查看全部]                │
└────────────────────────────┘

快捷鍵:
Ctrl+1~9: 切換到常用時間線
Ctrl+0: 切換到主世界
Ctrl+`: 切換到上一個時間線
```

---

### 二、暫存寶箱（Stash）

#### 暫存系統

```
暫存介面:

┌────────────────────────────────────┐
│  💎 暫存寶箱                        │
├────────────────────────────────────┤
│                                    │
│  當前世界有未提交變更，請選擇:       │
│                                    │
│  ┌────────────────────────────┐   │
│  │ 💾 暫存到寶箱               │   │
│  │                            │   │
│  │ 保存變更但不提交            │   │
│  │ 可隨時取出繼續工作          │   │
│  │                            │   │
│  │ 給這個暫存命名: (可選)      │   │
│  │ ┌────────────────────────┐ │   │
│  │ │用戶認證功能 WIP          │ │   │
│  │ └────────────────────────┘ │   │
│  │                            │   │
│  │ 包含未追蹤文件? [✓]         │   │
│  │                            │   │
│  │ [暫存]                     │   │
│  └────────────────────────────┘   │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  已存放的寶箱 (3個):                │
│                                    │
│  ┌────────────────────────────┐   │
│  │ 📦 用戶認證功能 WIP         │   │
│  │ feature/user-auth          │   │
│  │ 2小時前 · 12個文件          │   │
│  │                            │   │
│  │ 變更摘要:                   │   │
│  │ • src/auth/login.js (+85)  │   │
│  │ • src/auth/register.js (+92│   │
│  │ • ... 查看全部              │   │
│  │                            │   │
│  │ [取出] [查看] [刪除]        │   │
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │ 📦 實驗性UI改動             │   │
│  │ experiment/new-ui          │   │
│  │ 1天前 · 8個文件             │   │
│  │ [取出] [查看] [刪除]        │   │
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │ 📦 臨時修改                 │   │
│  │ main                       │   │
│  │ 3天前 · 2個文件             │   │
│  │ [取出] [查看] [刪除]        │   │
│  └────────────────────────────┘   │
│                                    │
└────────────────────────────────────┘

對應 git 指令:
暫存: git stash push -m "訊息" --include-untracked
列表: git stash list
取出: git stash pop stash@{0}
查看: git stash show -p stash@{0}
刪除: git stash drop stash@{0}
```

---

### 三、時間線合併

#### 合併流程

```
完整合併流程:

源時間線: feature/user-auth
目標時間線: main

步驟1: 點擊「合併」按鈕
  ↓
步驟2: 合併前檢查
┌────────────────────────────────────┐
│  🔍 合併前檢查                      │
├────────────────────────────────────┤
│                                    │
│  ✓ 所有變更已提交                   │
│  ✓ 與目標分支同步                   │
│  ⚠️  偵測到潛在衝突                 │
│                                    │
│  建議先解決以下問題:                │
│  • 執行測試確保功能正常              │
│  • 更新文檔                         │
│  • Code Review                     │
│                                    │
│  [繼續合併] [稍後處理]              │
└────────────────────────────────────┘

步驟3: 合併配置
┌────────────────────────────────────┐
│  🔀 合併時間線                      │
├────────────────────────────────────┤
│                                    │
│  即將合併:                          │
│  ⚔️ feature/user-auth              │
│  ──────────────→                   │
│  🏰 main                           │
│                                    │
│  變更摘要:                          │
│  • 新增文件: 8                      │
│  • 修改文件: 12                     │
│  • 刪除文件: 2                      │
│  • +450 / -120 行                  │
│  • 12 個提交                        │
│                                    │
│  ⚠️  偵測到衝突: 3個文件             │
│  • src/auth/index.js (14行)        │
│  • src/config.js (5行)             │
│  • src/routes.js (8行)             │
│                                    │
│  合併策略:                          │
│  ┌────────────────────────────┐   │
│  │ ● 自動合併                  │   │
│  │   讓AI處理簡單衝突          │   │
│  │                            │   │
│  │ ○ 手動解決                  │   │
│  │   你來決定如何合併          │   │
│  │                            │   │
│  │ ○ 創建Pull Request         │   │
│  │   在GitHub/GitLab上審查     │   │
│  └────────────────────────────┘   │
│                                    │
│  合併後操作:                        │
│  [✓] 刪除源時間線                   │
│  [✓] 推送到遠端                     │
│  [ ] 通知團隊                       │
│                                    │
│  [取消]              [開始合併]     │
└────────────────────────────────────┘

步驟4: 執行合併
┌────────────────────────────┐
│  🔄 正在合併...             │
│                            │
│  ████████░░░░░░ 60%       │
│                            │
│  當前步驟:                  │
│  • ✓ 切換到目標分支         │
│  • ✓ 檢查衝突               │
│  • 🔄 自動合併檔案          │
│  • ⏳ 解決衝突              │
│  • ⏳ 執行測試               │
│  • ⏳ 提交合併               │
│                            │
└────────────────────────────┘

步驟5: 衝突解決（如需要）
┌────────────────────────────────────┐
│  ⚠️  衝突解決                       │
├────────────────────────────────────┤
│  src/auth/index.js (14行衝突)       │
│                                    │
│  <<<<<<< feature/user-auth         │
│  import { validateToken } from ... │
│  =======                           │
│  import { checkAuth } from ...     │
│  >>>>>>> main                      │
│                                    │
│  選擇保留:                          │
│  [保留當前分支]                     │
│  [保留目標分支]                     │
│  [保留兩者]                         │
│  [手動編輯]                         │
│                                    │
│  AI建議:                            │
│  💡 這兩個import可以合併:           │
│  import { validateToken, checkAuth }│
│      from './auth';                │
│                                    │
│  [採用AI建議]                       │
│                                    │
│  進度: 1/3 個衝突                   │
│  [下一個]                           │
└────────────────────────────────────┘

步驟6: 合併動畫
┌────────────────────────────┐
│                            │
│  ⚔️ feature   🏰 main      │
│     │          │           │
│     │  🌀🌀🌀  │           │
│     └──────────┘           │
│        合併中...            │
│                            │
│ [音效: merge.wav]          │
│ [粒子融合動畫]              │
└────────────────────────────┘

步驟7: 合併成功
┌────────────────────────────────────┐
│  ✓ 時間線合併成功                   │
│                                    │
│  🎉 用戶認證功能已整合到主世界       │
│                                    │
│  合併摘要:                          │
│  • 12個提交已合併                   │
│  • 20個文件變更                     │
│  • 3個衝突已解決                    │
│  • 所有測試通過 ✓                   │
│                                    │
│  獲得獎勵:                          │
│  • EXP +100                        │
│  • 金幣 +50                         │
│  • 成就: 🔀 時空融合者              │
│                                    │
│  源時間線已關閉並清理                │
│                                    │
│  [太棒了！] [查看主世界]            │
└────────────────────────────────────┘
```

---

### 四、時間線狀態監控

#### 即時監控面板

```
時空監控中心:

┌────────────────────────────────────┐
│  📊 時空監控中心                    │
├────────────────────────────────────┤
│                                    │
│  活躍時間線: 3/5                    │
│  ████░░                            │
│                                    │
│  ⚔️ feature/user-auth              │
│  ├─ 狀態: 🟢 活躍中                │
│  ├─ 進程: VSCode (PID: 12345)     │
│  ├─ CPU: ██░░░░░░░░ 20%           │
│  ├─ 記憶體: 145 MB                 │
│  ├─ 未提交: 12 files               │
│  ├─ 最後活動: 5分鐘前               │
│  └─ [進入] [提交]                  │
│                                    │
│  🛡️ fix/critical-bug               │
│  ├─ 狀態: 🟡 閒置                  │
│  ├─ 進程: 無                       │
│  ├─ CPU: ░░░░░░░░░░ 0%            │
│  ├─ 記憶體: 12 MB                  │
│  ├─ 未提交: 3 files                │
│  ├─ 最後活動: 2小時前               │
│  └─ [進入]                         │
│                                    │
│  🔮 experiment/new-ui              │
│  ├─ 狀態: 🟡 閒置                  │
│  ├─ 進程: 無                       │
│  ├─ CPU: ░░░░░░░░░░ 0%            │
│  ├─ 記憶體: 8 MB                   │
│  ├─ 未提交: 25 files               │
│  ├─ 最後活動: 1天前                 │
│  ├─ ⚠️  即將過期 (2天)              │
│  └─ [進入] [決定保留/放棄]          │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  系統資源:                          │
│  磁碟使用: ██████░░░░ 1.2GB/2GB   │
│  總進程數: 3                        │
│  總記憶體: 165 MB                   │
│                                    │
│  [清理閒置] [優化空間] [設定限制]   │
└────────────────────────────────────┘
```

---

## 進階功能

### 一、智能清理系統

```
自動清理建議:

┌────────────────────────────────────┐
│  🧹 時空清理建議                    │
├────────────────────────────────────┤
│                                    │
│  檢測到可清理的時間線:               │
│                                    │
│  🔮 experiment/old-ui              │
│  ├─ 最後活動: 30天前                │
│  ├─ 佔用空間: 245 MB               │
│  ├─ 未合併變更: 15個文件            │
│  └─ 建議: 放棄並刪除               │
│     [保留] [刪除] [歸檔]           │
│                                    │
│  ⚔️ feature/payment-v1             │
│  ├─ 狀態: 已合併到main (15天前)    │
│  ├─ 佔用空間: 120 MB               │
│  └─ 建議: 安全刪除                 │
│     [保留] [刪除]                  │
│                                    │
│  🛡️ fix/temp-solution              │
│  ├─ 最後活動: 45天前                │
│  ├─ 佔用空間: 85 MB                │
│  ├─ 未合併變更: 5個文件             │
│  └─ 建議: 檢查後決定               │
│     [查看詳情] [保留] [刪除]        │
│                                    │
│  ────────────────────────────────  │
│                                    │
│  預計釋放空間: 450 MB               │
│  建議操作數: 3                      │
│                                    │
│  [全部保留] [接受建議] [自訂]       │
└────────────────────────────────────┘

清理規則:
• 已合併且30天未活動 → 提醒刪除
• 實驗分支7天未活動 → 提醒決定
• 標記「臨時」的分支 → 自動清理
• 磁碟空間<200MB → 強制提醒
```

---

### 二、時間線比較

```
對比兩個時間線:

┌────────────────────────────────────────────────┐
│  🔍 時間線比較                                  │
├────────────────────────────────────────────────┤
│  對比: [feature/user-auth ▼] vs [main ▼]      │
├────────────────────────────────────────────────┤
│                                                │
│  📊 差異統計                                    │
│  ┌──────────────────────────────────────────┐ │
│  │  新增文件:    8                          │ │
│  │  修改文件:    12                         │ │
│  │  刪除文件:    2                          │ │
│  │  新增行數:    +450                       │ │
│  │  刪除行數:    -120                       │ │
│  │  淨變化:      +330 行                    │ │
│  │  提交數:      12                         │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  📁 變更文件列表                                │
│  ┌──────────────────────────────────────────┐ │
│  │ + src/auth/login.js          +85  -0    │ │
│  │ + src/auth/register.js       +92  -0    │ │
│  │ + src/auth/validate.js       +67  -0    │ │
│  │ + src/middleware/auth.js     +45  -0    │ │
│  │ M src/routes/index.js        +12  -5    │ │
│  │ M src/config/database.js     +8   -3    │ │
│  │ M src/app.js                 +15  -8    │ │
│  │ M package.json               +3   -0    │ │
│  │ D src/legacy/oldAuth.js      +0   -45   │ │
│  │ D src/temp/test.js           +0   -12   │ │
│  │ ... 查看全部 (22個文件)                  │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ⚠️  潛在衝突                                   │
│  ┌──────────────────────────────────────────┐ │
│  │ src/routes/index.js (14行可能衝突)       │ │
│  │ src/config.js (5行可能衝突)              │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [查看詳細Diff] [並排比較] [導出報告]          │
└────────────────────────────────────────────────┘
```

---

### 三、協作功能

```
團隊時空視圖:

┌────────────────────────────────────┐
│  👥 團隊時空                        │
├────────────────────────────────────┤
│  篩選: [團隊▼] [我的] [全部]        │
├────────────────────────────────────┤
│                                    │
│  我的時間線 (3):                    │
│  ⚔️ feature/user-auth (我)         │
│     活躍中 · 30分鐘前               │
│  🛡️ fix/payment-bug (我)           │
│     閒置 · 2小時前                  │
│  🔮 experiment/ai (我)             │
│     閒置 · 1天前                    │
│                                    │
│  團隊成員時間線:                    │
│  ⚔️ feature/dashboard (Alice)      │
│     活躍中 · 剛剛                   │
│     可能與你的分支有衝突 ⚠️         │
│  🛡️ fix/security (Bob)             │
│     活躍中 · 10分鐘前               │
│  ⚔️ feature/api-v2 (Charlie)       │
│     閒置 · 3小時前                  │
│                                    │
│  ⚠️  衝突警告:                      │
│  ┌────────────────────────────┐   │
│  │ 你的 user-auth 與           │   │
│  │ Alice 的 dashboard          │   │
│  │ 可能有衝突                  │   │
│  │                            │   │
│  │ 衝突文件:                   │   │
│  │ • src/routes/index.js      │   │
│  │ • src/components/Nav.js    │   │
│  │                            │   │
│  │ [查看詳情] [協調]           │   │
│  └────────────────────────────┘   │
│                                    │
│  [刷新] [設定通知]                  │
└────────────────────────────────────┘
```

---

## 技術實現

### 核心 API 設計

```javascript
class WorktreeManager {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.worktreesPath = path.join(projectPath, '..', 'worktrees');
    this.metadataPath = path.join(this.worktreesPath, '.metadata.json');
    this.activeWorktrees = new Map();

    this.ensureWorktreesDir();
    this.loadMetadata();
  }

  /**
   * 創建新時間線
   */
  async createWorktree(options) {
    const {
      name,           // 時間線名稱
      type,           // feature/fix/experiment/hotfix
      baseBranch,     // 基於哪個分支
      description,
      tags,
      estimatedTime
    } = options;

    // 檢查 MP
    const worldType = worldTypes[type];
    if (user.mp < worldType.summonCost.mp) {
      throw new Error('MP不足');
    }

    // 檢查冷卻
    if (worldType.summonCost.cooldown > 0) {
      const lastSummon = this.getLastSummonTime(type);
      const elapsed = Date.now() - lastSummon;
      if (elapsed < worldType.summonCost.cooldown * 1000) {
        const remaining = Math.ceil(
          (worldType.summonCost.cooldown * 1000 - elapsed) / 1000
        );
        throw new Error(`冷卻中，剩餘 ${remaining} 秒`);
      }
    }

    // 生成分支名稱
    const branchName = `${type}/${name}`;
    const worktreePath = path.join(this.worktreesPath, name);

    // 檢查是否已存在
    if (fs.existsSync(worktreePath)) {
      throw new Error('時間線已存在');
    }

    // 執行 git worktree add
    await this.exec(
      `git worktree add "${worktreePath}" -b ${branchName} ${baseBranch}`
    );

    // 創建元數據
    const metadata = {
      id: generateId(),
      name,
      type,
      path: worktreePath,
      branch: branchName,
      baseBranch,
      description: description || '',
      tags: tags || [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      lastCommit: null,
      stats: {
        commits: 0,
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0,
        workingHours: 0
      },
      progress: {
        status: 'planning',
        completion: 0,
        milestones: []
      },
      activities: [],
      flags: {
        hasUncommitted: false,
        hasConflicts: false,
        needsReview: false,
        isStale: false
      },
      metadata: {
        assignedTo: user.id,
        reviewers: [],
        linkedIssue: null,
        estimatedTime: estimatedTime || 0,
        actualTime: 0
      }
    };

    // 保存元數據
    this.saveWorktreeMetadata(metadata);
    this.activeWorktrees.set(metadata.id, metadata);

    // 消耗 MP
    user.mp -= worldType.summonCost.mp;

    // 記錄召喚時間（用於冷卻）
    this.recordSummonTime(type);

    // 播放動畫
    await this.playCreateAnimation(worldType);

    return metadata;
  }

  /**
   * 列出所有時間線
   */
  async listWorktrees() {
    // 執行 git worktree list
    const output = await this.exec('git worktree list --porcelain');
    const worktrees = this.parseWorktreeList(output);

    // 合併元數據
    const enriched = worktrees.map(wt => {
      const metadata = this.loadWorktreeMetadata(wt.branch);
      return {
        ...wt,
        ...metadata,
        // 更新狀態
        flags: {
          ...metadata.flags,
          hasUncommitted: this.checkUncommitted(wt.path)
        }
      };
    });

    return enriched;
  }

  /**
   * 切換到時間線
   */
  async switchToWorktree(worktreeId) {
    const worktree = this.activeWorktrees.get(worktreeId);
    if (!worktree) {
      throw new Error('時間線不存在');
    }

    // 檢查當前目錄狀態
    const currentPath = process.cwd();
    const hasChanges = await this.checkUncommittedChanges(currentPath);

    if (hasChanges) {
      // 提示用戶處理未提交的變更
      const action = await this.promptHandleChanges();

      switch (action) {
        case 'commit':
          await this.quickCommit();
          break;
        case 'stash':
          await this.stashChanges();
          break;
        case 'discard':
          if (!await this.confirmDiscard()) {
            return;
          }
          await this.discardChanges();
          break;
        case 'cancel':
          return;
      }
    }

    // 播放傳送動畫
    await this.playTeleportAnimation();

    // 切換工作目錄
    process.chdir(worktree.path);

    // 更新最後活動時間
    worktree.lastActivity = new Date().toISOString();
    this.saveWorktreeMetadata(worktree);

    // 通知編輯器
    await this.notifyEditor(worktree.path);

    return worktree;
  }

  /**
   * 合併時間線
   */
  async mergeWorktree(sourceId, targetBranch = 'main', options = {}) {
    const source = this.activeWorktrees.get(sourceId);
    if (!source) {
      throw new Error('源時間線不存在');
    }

    // 檢查是否有未提交變更
    if (source.flags.hasUncommitted) {
      throw new Error('請先提交所有變更');
    }

    // 切換到目標分支
    const originalPath = process.cwd();
    process.chdir(this.projectPath);

    try {
      // 檢查衝突
      const conflicts = await this.checkMergeConflicts(
        source.branch,
        targetBranch
      );

      if (conflicts.length > 0 && !options.autoResolve) {
        // 顯示衝突，讓用戶選擇處理方式
        const resolution = await this.showConflictResolution(conflicts);

        if (resolution === 'cancel') {
          return { success: false, cancelled: true };
        } else if (resolution === 'manual') {
          // 用戶選擇手動解決
          return {
            success: false,
            needsManualResolve: true,
            conflicts
          };
        }
      }

      // 執行合併
      await this.exec(`git checkout ${targetBranch}`);
      await this.exec(`git merge ${source.branch} --no-ff`);

      // 播放合併動畫
      await this.playMergeAnimation();

      // 計算獎勵
      const reward = this.calculateMergeReward(source);
      user.exp += reward.exp;
      user.gold += reward.gold;

      // 更新元數據
      source.progress.status = 'completed';
      source.progress.completion = 1.0;
      this.saveWorktreeMetadata(source);

      // 提示清理
      if (options.autoCleanup !== false) {
        const shouldCleanup = await this.promptCleanup(source);
        if (shouldCleanup) {
          await this.removeWorktree(sourceId);
        }
      }

      return {
        success: true,
        reward,
        conflicts: conflicts.length
      };

    } finally {
      process.chdir(originalPath);
    }
  }

  /**
   * 刪除時間線
   */
  async removeWorktree(worktreeId, options = {}) {
    const worktree = this.activeWorktrees.get(worktreeId);
    if (!worktree) {
      throw new Error('時間線不存在');
    }

    const force = options.force || false;

    // 檢查未提交變更
    if (!force && worktree.flags.hasUncommitted) {
      const confirm = await this.confirmDeleteWithChanges();
      if (!confirm) {
        return { success: false, cancelled: true };
      }
    }

    // 刪除 worktree
    await this.exec(
      `git worktree remove "${worktree.path}" ${force ? '--force' : ''}`
    );

    // 詢問是否刪除分支
    const deleteBranch = options.deleteBranch !== false
      ? await this.promptDeleteBranch()
      : false;

    if (deleteBranch) {
      await this.exec(`git branch -D ${worktree.branch}`);
    }

    // 清理元數據
    this.activeWorktrees.delete(worktreeId);
    this.deleteWorktreeMetadata(worktreeId);

    return { success: true, branchDeleted: deleteBranch };
  }

  /**
   * Stash 管理
   */
  async stashChanges(message) {
    const stashName = message || `WIP-${Date.now()}`;
    await this.exec(`git stash push -m "${stashName}" --include-untracked`);

    return {
      name: stashName,
      timestamp: Date.now()
    };
  }

  async listStashes() {
    const output = await this.exec('git stash list');
    return this.parseStashList(output);
  }

  async applyStash(stashId) {
    await this.exec(`git stash pop stash@{${stashId}}`);
  }

  async dropStash(stashId) {
    await this.exec(`git stash drop stash@{${stashId}}`);
  }

  /**
   * 工具方法
   */
  async exec(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.projectPath }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  parseWorktreeList(output) {
    // 解析 git worktree list --porcelain 輸出
    const lines = output.split('\n');
    const worktrees = [];
    let current = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        current.path = line.substring(9);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace('refs/heads/', '');
      } else if (line === '') {
        if (current.path) {
          worktrees.push(current);
          current = {};
        }
      }
    }

    return worktrees;
  }

  async checkUncommittedChanges(path = this.projectPath) {
    const status = await this.exec('git status --porcelain');
    return status.trim().length > 0;
  }

  checkUncommitted(worktreePath) {
    // 同步檢查（用於快速狀態更新）
    try {
      const result = execSync('git status --porcelain', {
        cwd: worktreePath,
        encoding: 'utf8'
      });
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 元數據管理
   */
  loadMetadata() {
    if (fs.existsSync(this.metadataPath)) {
      const data = fs.readFileSync(this.metadataPath, 'utf8');
      const allMetadata = JSON.parse(data);

      for (const [id, metadata] of Object.entries(allMetadata)) {
        this.activeWorktrees.set(id, metadata);
      }
    }
  }

  saveWorktreeMetadata(metadata) {
    const allMetadata = this.loadAllMetadata();
    allMetadata[metadata.id] = metadata;
    fs.writeFileSync(
      this.metadataPath,
      JSON.stringify(allMetadata, null, 2)
    );
  }

  loadWorktreeMetadata(branch) {
    const allMetadata = this.loadAllMetadata();
    return Object.values(allMetadata).find(m => m.branch === branch) || {};
  }

  deleteWorktreeMetadata(worktreeId) {
    const allMetadata = this.loadAllMetadata();
    delete allMetadata[worktreeId];
    fs.writeFileSync(
      this.metadataPath,
      JSON.stringify(allMetadata, null, 2)
    );
  }

  loadAllMetadata() {
    if (fs.existsSync(this.metadataPath)) {
      const data = fs.readFileSync(this.metadataPath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  }

  ensureWorktreesDir() {
    if (!fs.existsSync(this.worktreesPath)) {
      fs.mkdirSync(this.worktreesPath, { recursive: true });
    }
  }
}
```

---

## 開發路線圖

### MVP 階段（Week 1-8）

```
✅ 基礎 Worktree 管理
   - 創建/刪除 worktree
   - 列表顯示
   - 基本元數據

✅ 簡單切換
   - 切換工作目錄
   - 基本狀態檢查
   - 簡單動畫

❌ 暫不實作:
   - 複雜動畫
   - 協作功能
   - 自動清理
   - 時間線圖
```

### 第二階段（Week 9-12）

```
✅ UI 美化
   - 完整的介面設計
   - 動畫效果
   - 音效

✅ 狀態監控
   - 即時狀態更新
   - 資源使用監控
   - 活動追蹤

✅ Stash 功能
   - 暫存管理
   - 快速暫存/恢復
```

### 第三階段（Week 13+）

```
✅ 合併系統
   - 衝突檢測
   - AI 輔助解決
   - 合併動畫

✅ 進階功能
   - 自動清理
   - 時間線比較
   - 看板視圖
   - 時間線圖

✅ 協作功能
   - 團隊視圖
   - 衝突警告
   - 協調機制
```

---

## RPG 元素整合

### 成就系統

```javascript
const worktreeAchievements = [
  {
    id: 'first_worktree',
    name: '🌍 時空探索者',
    description: '創建第一個平行時間線',
    reward: { exp: 50, gold: 20 }
  },
  {
    id: 'multi_worktree',
    name: '⚡ 多重任務大師',
    description: '同時維護3個以上的時間線',
    reward: { exp: 100, gold: 50, skill: 'parallel_thinking' }
  },
  {
    id: 'first_merge',
    name: '🔀 時空融合',
    description: '成功合併第一個時間線',
    reward: { exp: 80, gold: 30 }
  },
  {
    id: 'conflict_resolver',
    name: '🛡️ 衝突調停者',
    description: '解決10次合併衝突',
    reward: { exp: 200, gold: 100, title: '調停大師' }
  },
  {
    id: 'clean_master',
    name: '🧹 整潔大師',
    description: '清理20個已完成的時間線',
    reward: { exp: 150, gold: 75 }
  },
  {
    id: 'time_traveler',
    name: '⏰ 時空旅行者',
    description: '在不同時間線間切換100次',
    reward: { exp: 300, gold: 150 }
  },
  {
    id: 'parallel_master',
    name: '🌀 平行世界大師',
    description: '同時維護10個時間線',
    reward: { exp: 500, gold: 250, title: '時空領主' }
  }
]
```

### 被動技能

```javascript
const worktreePassiveSkills = {
  quick_switch: {
    id: 'quick_switch',
    name: '快速切換',
    description: '時間線切換速度提升50%',
    unlockLevel: 10
  },

  auto_stash: {
    id: 'auto_stash',
    name: '自動暫存',
    description: '切換時自動處理未提交變更',
    unlockLevel: 15
  },

  merge_master: {
    id: 'merge_master',
    name: '合併大師',
    description: 'AI 輔助解決衝突，成功率+30%',
    unlockLevel: 20
  },

  parallel_mind: {
    id: 'parallel_mind',
    name: '平行思維',
    description: '可同時維護的時間線數量 +2',
    unlockLevel: 25
  },

  time_optimizer: {
    id: 'time_optimizer',
    name: '時空優化',
    description: '自動清理過期時間線，磁碟使用 -30%',
    unlockLevel: 30
  }
}
```

---

**文檔版本**:
- v1.0 (2026-02-05): 初始版本，完整 Git Worktree 平行世界系統設計
