# 互動事件系統 (Interactive Events System)

**創建日期**: 2026-02-06
**更新日期**: 2026-02-07
**版本**: v1.1
**來源**: `/docs/design/interactive-events/requirements.md`

💡 **快速參考**:
- 使用 `/project-overview` skill 了解工具→RPG 映射的整體概念
- 使用 `/battle-management` skill 了解互動事件如何融入戰鬥流程

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

互動事件系統負責將 Claude Code CLI 的原生互動事件（Plan Mode、AskUserQuestion、錯誤、權限請求）和工具執行轉化為 RPG 戰鬥中的遊戲化元素。

**設計目標**：
1. ✅ 保持原有功能正常運作
2. ✅ 用 RPG 元素包裝互動事件
3. ✅ 不破壞沉浸感
4. ✅ 提供清晰的視覺反饋

**核心挑戰**：
```
原始 CLI 行為                 RPG 化處理
├─ Plan Mode 等待批准    →  戰術規劃（魔法師思考）
├─ AskUserQuestion       →  敵人發問攻擊
├─ 錯誤/警告             →  技能反噬
├─ 權限請求              →  力量借用
└─ 工具執行（Bash等）    →  魔法施放
```

### 兩大事件類別

#### A. 互動事件（需要用戶決策）

| 事件類型 | 觸發時機 | RPG 化呈現 | 優先級 |
|---------|---------|-----------|--------|
| Plan Mode (戰鬥前) | 任務複雜度高 | 📋 戰前準備 | P1 |
| Plan Mode (戰鬥中) | Claude 進入計劃模式 | 🧙 戰術規劃 | P2 |
| AskUserQuestion | Claude 需要用戶決策 | ❓ 敵人發問攻擊 | P1 |
| 錯誤/警告 | 工具執行失敗 | ⚠️ 技能反噬 | P1 |
| 權限請求 | 需要額外權限 | 🔐 力量借用 | P2 |

#### B. 工具執行事件（自動執行）

| 工具類型 | 遊戲化呈現 | MP 消耗 | 優先級 |
|---------|-----------|---------|--------|
| Bash 命令 | 指令魔法 | 2-15 | P1 |
| 文件操作 (Read/Write/Edit) | 檔案魔法 | 3-8 | P1 |
| 搜索工具 (Grep/Glob) | 探索魔法 | 4-5 | P2 |
| 子 Agent (Task) | 召喚夥伴 | 20 | P1 |
| 網絡操作 (Web) | 遠程通訊術 | 10-12 | P3 |

---

## 依賴關係

### 上游依賴

```
互動事件系統依賴：
├─ 戰鬥系統（L2）- 提供戰鬥環境和回合機制
├─ Bridge Layer（L1）- 監聽 Claude CLI 事件
├─ 技能系統（L2）- 工具映射為技能
└─ MP 系統（L1）- 資源消耗管理
```

### 下游依賴

```
影響的系統：
├─ 戰鬥 UI（L3）- 顯示互動事件和工具效果
├─ 戰鬥日誌（L3）- 記錄事件和工具執行
└─ 成就系統（L3）- 互動相關成就
```

### 系統架構位置

```
L4: 展示層
    └─ 互動事件 Modal + 工具動畫
L3: 業務層 ⭐
    └─ 互動事件系統（本系統）
L2: 核心層
    └─ 戰鬥系統
L1: 基礎層
    └─ Bridge Layer（監聽 CLI）
L0: 數據層
    └─ 事件數據結構
```

---

## 核心規則

### 規則 1：互動事件 RPG 化方案

#### 1.1 Plan Mode → 戰術規劃

**方案 A：戰鬥前準備（優先）**

當系統預測任務可能觸發 Plan Mode 時：

```
用戶發起任務: "重構認證系統"
    ↓
系統判斷: 複雜度 12（高）
    ↓
┌─────────────────────────────────────┐
│ 📋 戰前準備                          │
│                                     │
│ 此任務較為複雜，建議先制定戰術...    │
│                                     │
│ [顯示預估計劃內容]                   │
│                                     │
│ [✅ 開始戰鬥] [❌ 取消]             │
└─────────────────────────────────────┘
    ↓
用戶批准 → ⚔️ 戰鬥開始（不會被 Plan Mode 中斷）
```

**方案 B：戰鬥中戰術規劃**

當戰鬥中 Claude 突然進入 Plan Mode：

```
戰鬥進行中（敵人 Lv.8）
    ↓
Claude 進入 Plan Mode
    ↓
┌─────────────────────────────────────┐
│ 🧙 魔法師進入思考狀態...             │
│                                     │
│ 敵人太過強大，需要制定戰術！         │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ 📋 戰術規劃                  │     │
│ │                             │     │
│ │ 建議的戰術:                  │     │
│ │ 1. 分析敵人弱點 (Grep)       │     │
│ │ 2. 準備強力技能 (重構術)     │     │
│ │ 3. 召喚夥伴協助 (Task)       │     │
│ │                             │     │
│ │ [✅ 批准戰術] [❌ 重新規劃]  │     │
│ └─────────────────────────────┘     │
└─────────────────────────────────────┘
```

**視覺效果**：
- 🧙 魔法師周圍浮現符文動畫
- 敵人進入「警戒」狀態（HP 條變黃色）
- 背景音效：思考音效、翻書音效

**遊戲化獎勵**：
- 批准後獲得戰術 Buff：+10% 傷害（持續 3 回合）

#### 1.2 AskUserQuestion → 敵人發問攻擊

**觸發**：Claude 調用 AskUserQuestion tool

**遊戲化包裝**：
```
戰鬥進行中
    ↓
敵人使用特殊技能："困惑之問"
    ↓
┌─────────────────────────────────────┐
│ ❓ 敵人的發問攻擊！                  │
│                                     │
│ 敵人發動「困惑之問」，你必須正確     │
│ 回答才能繼續戰鬥！                   │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ 問題:                        │     │
│ │ "應該使用哪種資料庫？"       │     │
│ │                             │     │
│ │ [A] MySQL                   │     │
│ │ [B] PostgreSQL              │     │
│ │ [C] MongoDB                 │     │
│ │ [D] SQLite                  │     │
│ │ [E] 其他（自定義輸入）       │     │
│ └─────────────────────────────┘     │
│                                     │
│ ⚠️ 警告: 選擇會影響戰術！           │
└─────────────────────────────────────┘
```

**視覺效果**：
- ❓ 問號浮現動畫
- 敵人蓄力狀態（發光效果）
- 音效：發問音效、選擇音效

**選擇後果**：
- ✅ 精準回答：發現敵人弱點，+20% 傷害（2 回合）
- ❌ 回答欠佳：敵人反擊，-15 HP

#### 1.3 錯誤/警告 → 技能反噬

**觸發**：工具執行失敗（語法錯誤、權限錯誤、網絡錯誤等）

**遊戲化包裝**：
```
施放技能: "代碼重構術"
    ↓
執行失敗（語法錯誤）
    ↓
┌─────────────────────────────────────┐
│ ⚠️ 技能反噬！                       │
│                                     │
│ 施法失敗，魔法反彈！                 │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ 錯誤原因:                    │     │
│ │ Syntax Error at line 42     │     │
│ │                             │     │
│ │ 你受到了 15 點反噬傷害！      │     │
│ │ HP: 80 → 65                 │     │
│ │                             │     │
│ │ MP: 已扣除（無法返還）       │     │
│ └─────────────────────────────┘     │
│                                     │
│ [🔄 重試] [🛡️ 防禦] [❌ 取消]    │
└─────────────────────────────────────┘
```

**反噬傷害計算**：
```
backlashDamage = errorSeverity * 5

errorSeverity = {
  warning: 1,      // 警告：5 傷害
  error: 3,        // 錯誤：15 傷害
  critical: 5      // 嚴重：25 傷害
}

// 連續錯誤倍率
consecutiveMultiplier = 1 + (consecutiveErrors * 0.5)
// 第 1 次：1.0x，第 2 次：1.5x，第 3 次：2.0x
```

**視覺效果**：
- ⚠️ 閃電、爆炸動畫
- HP 條閃爍紅色、震動效果
- 音效：爆炸音效、傷害音效

**選項**：
- 🔄 重試：再次消耗 MP，嘗試執行（可能再次失敗）
- 🛡️ 防禦：不重試，減少一半反噬傷害
- ❌ 取消：不重試，接受全部反噬傷害

#### 1.4 權限請求 → 力量借用

**觸發**：執行需要額外權限的操作（rm -rf, sudo 等）

**遊戲化包裝**：
```
需要執行危險操作
    ↓
請求額外權限
    ↓
┌─────────────────────────────────────┐
│ 🔐 力量借用請求                      │
│                                     │
│ 魔法師需要借用額外的力量來施放       │
│ 這個強大的魔法！                     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ 請求的力量:                  │     │
│ │ • 修改系統文件               │     │
│ │ • 執行管理員命令             │     │
│ │                             │     │
│ │ 風險等級: ⚠️⚠️⚠️ 高        │     │
│ │                             │     │
│ │ ⚠️ 警告：授予後無法撤銷      │     │
│ └─────────────────────────────┘     │
│                                     │
│ [✅ 授予力量] [❌ 拒絕]             │
└─────────────────────────────────────┘
```

**視覺效果**：
- 🔐 鎖、鑰匙動畫
- 金色光環、權限標誌
- 音效：解鎖音效、神聖音效

**風險等級指示**：
```
riskLevel = {
  low: '⚠️ 低',
  medium: '⚠️⚠️ 中',
  high: '⚠️⚠️⚠️ 高'
}

// 基於操作類型
getRiskLevel = (operation) => {
  if (operation.includes('rm -rf') || operation.includes('sudo')) {
    return 'high';
  } else if (operation.includes('chmod') || operation.includes('chown')) {
    return 'medium';
  } else {
    return 'low';
  }
}
```

---

### 規則 2：工具執行事件 RPG 化

#### 2.1 Bash 命令 → 指令魔法

**Git 魔法系列**：

| 命令 | 魔法名稱 | 圖標 | MP | 施法時間 | 效果 |
|-----|---------|------|----|---------|----|
| `git commit` | 版本封印術 | 📦 | 5 | 快速 | 保存當前狀態 |
| `git push` | 遠程傳送術 | 🚀 | 10 | 中等 | 同步到遠程倉庫 |
| `git pull` | 同步魔法 | 🔄 | 8 | 中等 | 獲取最新版本 |
| `git merge` | 融合術 | 🔀 | 12 | 中等 | 合併分支 |
| `git checkout` | 時空跳躍 | ⏰ | 4 | 快速 | 切換分支/版本 |

**npm 魔法系列**：

| 命令 | 魔法名稱 | 圖標 | MP | 施法時間 | 效果 |
|-----|---------|------|----|---------|----|
| `npm install` | 依賴召喚術 | 📚 | 15 | 慢 | 安裝套件 |
| `npm test` | 試煉之法 | 🧪 | 8 | 中等 | 執行測試 |
| `npm build` | 構築魔法 | 🏗️ | 12 | 慢 | 構建項目 |
| `npm run dev` | 開發召喚 | 🔥 | 10 | 中等 | 啟動開發服務器 |

**系統魔法系列**：

| 命令 | 魔法名稱 | 圖標 | MP | 施法時間 | 效果 |
|-----|---------|------|----|---------|----|
| `ls` / `pwd` | 偵察術 | 👁️ | 2 | 即時 | 查看文件/目錄 |
| `mkdir` | 創造空間術 | 📁 | 3 | 快速 | 創建目錄 |
| `rm` / `rm -rf` | 抹除術 | 🗑️ | 5 | 快速 | 刪除文件/目錄 |
| `cp` / `mv` | 轉移術 | 🚚 | 4 | 快速 | 複製/移動文件 |

**施法動畫**：
```
1. 魔法陣浮現（0.2s）
2. 詠唱效果（粒子特效）（0.3s）
3. 執行動畫（基於命令類型）（0.5s）
4. 結果顯示（0.2s）

總時長：~1.2 秒
```

#### 2.2 文件操作 → 檔案魔法

**Read 工具 → 讀心術**：
```
tool: 'Read',
spellName: '讀心術',
icon: '📖',
mpCost: 3,
animation: '書本翻開 → 文字浮現',
effect: '讀取文件內容',
battleEffect: '獲得敵人資訊（+10% 命中率）'
```

**Write 工具 → 創造術**：
```
tool: 'Write',
spellName: '創造術',
icon: '✍️',
mpCost: 8,
animation: '羽毛筆書寫 → 文件生成',
effect: '創建或覆蓋文件',
battleEffect: '創造新代碼（造成 80 傷害）'
```

**Edit 工具 → 改寫術**：
```
tool: 'Edit',
spellName: '改寫術',
icon: '✏️',
mpCost: 6,
animation: '文字變形 → 替換完成',
effect: '編輯文件內容',
battleEffect: '修改敵人屬性（-15% 防禦）'
```

**戰鬥日誌示例**：
```
🧙 玩家施放「讀心術」(Read tool)
📖 讀取文件：src/auth.ts
✨ 發現敵人弱點！命中率 +10%（2 回合）
⚡ MP: 60 → 57 (-3)
```

#### 2.3 搜索工具 → 探索魔法

**Grep 工具 → 搜索之眼**：
```
tool: 'Grep',
spellName: '搜索之眼',
icon: '👁️',
mpCost: 5,
animation: '眼睛掃描 → 高亮結果',
effect: '在代碼中搜索字符串',
battleEffect: '找出敵人弱點（+20% 暴擊率）'
```

**Glob 工具 → 定位術**：
```
tool: 'Glob',
spellName: '定位術',
icon: '🔍',
mpCost: 4,
animation: '雷達掃描 → 標記位置',
effect: '搜索文件模式',
battleEffect: '定位敵人位置（無法閃避）'
```

#### 2.4 並行操作 → 多重施法

**觸發**：Claude 同時執行 2-5+ 個工具

**遊戲化呈現**：
```
檢測到並行操作：Read + Edit + Grep
    ↓
┌─────────────────────────────────────┐
│ 🔮 多重施法！                       │
│                                     │
│ 魔法師同時施放 3 個魔法：            │
│ 📖 讀心術                           │
│ ✏️ 改寫術                           │
│ 👁️ 搜索之眼                         │
│                                     │
│ 連擊加成：+50% 傷害！                │
│ 額外消耗：+5 MP                     │
└─────────────────────────────────────┘
```

**連擊加成**：
```
comboBonus = {
  2: 1.2,  // +20% 傷害
  3: 1.5,  // +50% 傷害
  4: 2.0,  // +100% 傷害
  5: 3.0   // +200% 傷害
}

extraMpCost = (toolCount - 1) * 5
// 2 個工具：+5 MP
// 3 個工具：+10 MP
// 5 個工具：+20 MP
```

#### 2.5 子 Agent → 召喚夥伴

**Task 工具 → 召喚魔法**：
```
tool: 'Task',
spellName: '召喚夥伴',
icon: '🌟',
mpCost: 20,
animation: '召喚陣 → 夥伴出現',
effect: '創建子 Agent（Subagent）',
battleEffect: '召喚 Battle Companion 協助戰鬥'
```

**整合**：
- Task 工具調用 = 召喚夥伴系統
- Subagent → Battle Companion 映射
- 詳見 Companion System 文檔

---

### 規則 3：事件優先級與處理策略

#### 3.1 決策規則

**Plan Mode**：
```
if (canPredict && complexity >= 8) {
  // 戰前處理
  return showPlanModeBeforeBattle();
} else if (inBattle && planModeTriggered) {
  // 戰鬥中 RPG 化
  return showTacticalPlanning();
}
```

**AskUserQuestion**：
```
// 始終使用 RPG 化（敵人發問攻擊）
return showEnemyQuestionAttack(question, options);
```

**錯誤/警告**：
```
// 始終使用 RPG 化（技能反噬）
return showSkillBacklash(error, severity);
```

**權限請求**：
```
if (firstTime && beforeBattle) {
  // 戰前處理
  return showPermissionRequestBefore();
} else if (inBattle) {
  // 戰鬥中 RPG 化
  return showPowerBorrowRequest();
}
```

#### 3.2 處理優先級

```
eventPriority = {
  critical: ['error', 'permission_dangerous'],  // 最高優先級
  high: ['ask_user_question', 'plan_mode'],     // 高優先級
  normal: ['tool_execution', 'warning'],        // 正常優先級
  low: ['info', 'background_task']              // 低優先級
}

// 處理隊列
eventQueue = new PriorityQueue();

// 事件到達時
onEvent(event) {
  eventQueue.enqueue(event, eventPriority[event.type]);
  processNextEvent();
}
```

---

### 規則 4：MP 消耗與資源管理

#### 4.1 工具 MP 消耗表

```
toolMpCosts = {
  // 文件操作
  Read: 3,
  Write: 8,
  Edit: 6,

  // 搜索
  Grep: 5,
  Glob: 4,

  // Git 操作
  'git commit': 5,
  'git push': 10,
  'git pull': 8,
  'git merge': 12,
  'git checkout': 4,

  // npm 操作
  'npm install': 15,
  'npm test': 8,
  'npm build': 12,
  'npm run': 10,

  // 系統命令
  'ls/pwd': 2,
  'mkdir': 3,
  'rm': 5,
  'cp/mv': 4,

  // 特殊
  Task: 20,         // 召喚夥伴
  WebFetch: 10,     // 網絡請求
  WebSearch: 12     // 網絡搜索
}
```

#### 4.2 MP 不足處理

```
function checkMp(tool, requiredMp) {
  if (player.mp < requiredMp) {
    return {
      allowed: false,
      error: `⚡ MP 不足！需要 ${requiredMp} MP，當前 ${player.mp} MP。`,
      suggestions: [
        '等待 MP 自動恢復（1 MP/10秒）',
        '使用 MP 藥水',
        '切換到探索模式恢復'
      ]
    };
  }

  return { allowed: true };
}
```

#### 4.3 批量操作折扣

```
// 連續使用相同工具有折扣
toolUsageDiscount = {
  2: 0.95,  // -5%
  3: 0.90,  // -10%
  5: 0.85   // -15%
}

// 例如：連續 3 次 Read（3 MP each）
// 第 1 次：3 MP
// 第 2 次：3 * 0.95 = 2.85 MP
// 第 3 次：3 * 0.90 = 2.7 MP
```

---

### 規則 5：失敗處理與重試機制

#### 5.1 失敗類型

```
failureTypes = {
  syntax_error: {
    name: '語法錯誤',
    damage: 15,
    retryable: true,
    mpRefund: 0  // 不退還 MP
  },
  permission_error: {
    name: '權限錯誤',
    damage: 10,
    retryable: true,
    mpRefund: 0.5  // 退還 50% MP
  },
  network_error: {
    name: '網絡錯誤',
    damage: 5,
    retryable: true,
    mpRefund: 0.8  // 退還 80% MP（不是玩家的錯）
  },
  timeout: {
    name: '執行超時',
    damage: 8,
    retryable: true,
    mpRefund: 0.5
  }
}
```

#### 5.2 重試機制

```
retrySystem = {
  maxRetries: 3,
  retryCost: 'same',  // 消耗相同 MP
  retryDelay: 2000,   // 2 秒延遲

  onRetry: (attempt) => {
    battleLog.add(`🔄 第 ${attempt} 次重試...`);

    if (attempt >= 3) {
      battleLog.add('⚠️ 已達最大重試次數，建議放棄或使用其他策略');
    }
  }
}

// 重試 UI
showRetryOptions = (error) => {
  return {
    options: [
      { label: '🔄 重試', cost: tool.mpCost, action: 'retry' },
      { label: '🛡️ 防禦', cost: 0, action: 'defend', effect: '減少 50% 反噬傷害' },
      { label: '❌ 取消', cost: 0, action: 'cancel', effect: '接受反噬傷害' }
    ]
  };
}
```

---

### 規則 6：配置與個性化

#### 6.1 RPG 模式設置

```
settings = {
  rpgMode: {
    enabled: true,  // 啟用 RPG 化

    interactiveEvents: 'rpg',  // 'pause' | 'rpg' | 'mixed'
    // - pause: 暫停戰鬥，顯示原始訊息
    // - rpg: 完全 RPG 化
    // - mixed: 混合（部分 RPG 化）

    toolEvents: 'rpg',  // 'simple' | 'rpg'
    // - simple: 簡單日誌
    // - rpg: 完整動畫和效果

    animations: true,   // 啟用動畫
    soundEffects: true, // 啟用音效
    soundVolume: 0.7    // 音效音量（0-1）
  }
}
```

#### 6.2 自定義工具映射

```
// 允許用戶自定義工具 → 魔法映射
customToolMappings = {
  'my_custom_command': {
    name: '我的自定義魔法',
    icon: '⚡',
    mpCost: 10,
    animation: 'lightning',
    description: '執行自定義命令'
  }
}

// 註冊自定義映射
registerToolMapping(pattern, mapping) {
  toolMappings[pattern] = mapping;
}
```

---

### 規則 7：性能與優化

#### 7.1 性能要求

```
performanceTargets = {
  eventResponse: 100,    // 事件響應 < 100ms
  animationFps: 60,      // 動畫 60 FPS
  uiLoading: 200,        // UI 加載 < 200ms
  noBlocking: true       // 不阻塞戰鬥主流程
}
```

#### 7.2 優化策略

```
optimizations = {
  // 1. 動畫預加載
  preloadAnimations: ['magic_circle', 'particle_effects'],

  // 2. 事件防抖
  debounceEvents: {
    threshold: 100,  // 100ms 內的重複事件合併
  },

  // 3. 非阻塞渲染
  asyncRendering: true,

  // 4. 虛擬滾動（戰鬥日誌）
  virtualScroll: {
    enabled: true,
    bufferSize: 10  // 只渲染可見 + 10 條
  }
}
```

---

## 內部地圖

### 互動事件類型圖

```
互動事件系統
├─ A. 互動事件（需要用戶決策）
│  ├─ Plan Mode（戰鬥前）→ 📋 戰前準備
│  ├─ Plan Mode（戰鬥中）→ 🧙 戰術規劃
│  ├─ AskUserQuestion → ❓ 敵人發問攻擊
│  ├─ 錯誤/警告 → ⚠️ 技能反噬
│  └─ 權限請求 → 🔐 力量借用
│
└─ B. 工具執行事件（自動執行）
   ├─ Bash 命令 → 指令魔法
   │  ├─ Git 魔法（commit, push, pull, merge）
   │  ├─ npm 魔法（install, test, build）
   │  └─ 系統魔法（ls, mkdir, rm, cp）
   │
   ├─ 文件操作 → 檔案魔法
   │  ├─ Read → 📖 讀心術
   │  ├─ Write → ✍️ 創造術
   │  └─ Edit → ✏️ 改寫術
   │
   ├─ 搜索工具 → 探索魔法
   │  ├─ Grep → 👁️ 搜索之眼
   │  └─ Glob → 🔍 定位術
   │
   ├─ 並行操作 → 🔮 多重施法
   ├─ 子 Agent → 🌟 召喚夥伴
   └─ 網絡操作 → 🌐 遠程通訊術
```

### 戰術規劃 UI

```
┌─────────────────────────────────────────────────────────┐
│  🧙 戰術規劃                                            │
├─────────────────────────────────────────────────────────┤
│  敵人：架構挑戰 Lv.8                                    │
│  狀態：⚠️ 警戒（等待玩家批准計劃）                     │
├─────────────────────────────────────────────────────────┤
│  建議的戰術：                                            │
│                                                         │
│  階段 1：偵察                                            │
│  ├─ 使用「讀心術」(Read) 分析敵人結構                   │
│  └─ 使用「搜索之眼」(Grep) 找出弱點                     │
│                                                         │
│  階段 2：準備                                            │
│  ├─ 施放「代碼生成術」創建解決方案                      │
│  └─ 召喚夥伴「測試精靈」協助驗證                        │
│                                                         │
│  階段 3：進攻                                            │
│  ├─ 使用「重構術」重構敵人核心                          │
│  └─ 施放「完美調試術」消除所有漏洞                      │
│                                                         │
│  預估：                                                  │
│  ├─ 成功率：85%                                         │
│  ├─ MP 消耗：45                                         │
│  └─ 回合數：8-10                                        │
│                                                         │
│  [✅ 批准戰術] [🔄 重新規劃] [❌ 放棄]                 │
└─────────────────────────────────────────────────────────┘
```

### 敵人發問攻擊 UI

```
┌─────────────────────────────────────────────────────────┐
│  ❓ 敵人的發問攻擊！                                    │
├─────────────────────────────────────────────────────────┤
│  💀 Bug 魔王使用了「困惑之問」！                        │
│  你必須正確回答才能繼續攻擊！                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  問題：「這個認證系統應該使用哪種策略？」                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [A] JWT（JSON Web Token）                       │   │
│  │     • 無狀態，易擴展                             │   │
│  │     • 適合微服務架構                             │   │
│  │                                                  │   │
│  │ [B] Session-based                               │   │
│  │     • 服務器端控制                               │   │
│  │     • 更容易撤銷                                 │   │
│  │                                                  │   │
│  │ [C] OAuth 2.0                                   │   │
│  │     • 第三方授權                                 │   │
│  │     • 適合社交登錄                               │   │
│  │                                                  │   │
│  │ [D] 其他（自定義輸入）                           │   │
│  │     [________________]                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  提示：根據專案需求，無狀態可擴展的方案可能更合適...     │
│                                                         │
│  [確認選擇]                                              │
└─────────────────────────────────────────────────────────┘
```

### 技能反噬 UI

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ 技能反噬！                                          │
├─────────────────────────────────────────────────────────┤
│  施放「代碼重構術」失敗！                                │
│  魔法反彈，造成反噬傷害！                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  錯誤類型：語法錯誤                                      │
│  錯誤位置：src/auth.ts:42                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Syntax Error: Unexpected token '{'             │   │
│  │                                                  │   │
│  │  41 | function authenticate(user) {             │   │
│  │  42 |   if (user.role === 'admin' {  ❌         │   │
│  │  43 |     return true;                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  反噬傷害：15 HP                                         │
│  ❤️ HP: 80 → 65 (-15)                                  │
│  ⚡ MP: 已扣除（25 MP 無法返還）                         │
│                                                         │
│  這是你第 1 次連續失敗。                                 │
│  下次失敗傷害將提升至 22 HP（1.5x）                      │
│                                                         │
│  選擇行動：                                              │
│  [🔄 重試] 再次嘗試（消耗 25 MP）                       │
│  [🛡️ 防禦] 減少反噬傷害（-7 HP 而非 -15）               │
│  [❌ 取消] 放棄操作（接受反噬傷害）                      │
└─────────────────────────────────────────────────────────┘
```

### 工具施法動畫序列

```
施法動畫時間軸：

0.0s  開始
      ┌────────────┐
      │ 玩家舉手   │
      │    ✋      │
      └────────────┘

0.2s  魔法陣浮現
      ┌────────────┐
      │  ◯ ◯ ◯    │
      │ ◯ 📖 ◯    │
      │  ◯ ◯ ◯    │
      │ 魔法陣旋轉 │
      └────────────┘

0.5s  工具執行
      ┌────────────┐
      │   ✨ 💫    │
      │  📖 → 📄   │
      │ 讀取文件中 │
      └────────────┘

0.8s  完成效果
      ┌────────────┐
      │   ✅ 成功   │
      │ +10% 命中  │
      │ -3 MP      │
      └────────────┘

1.0s  結束
      ┌────────────┐
      │ 戰鬥繼續   │
      └────────────┘

總時長：1.0 秒
音效：魔法陣 → 詠唱 → 工具音效 → 完成音
```

---

## 系統整合

### 與戰鬥系統整合

**事件觸發時機**：

```
// 戰鬥回合中監聽 CLI 事件
function onBattleTurn() {
  // 1. 監聽互動事件
  bridgeLayer.on('plan_mode', handlePlanMode);
  bridgeLayer.on('ask_question', handleAskQuestion);
  bridgeLayer.on('error', handleError);
  bridgeLayer.on('permission', handlePermission);

  // 2. 監聽工具執行
  bridgeLayer.on('tool_execute', handleToolExecution);

  // 3. 玩家回合
  playerTurn();
}

// Plan Mode 處理
function handlePlanMode(planData) {
  if (inBattle) {
    pauseBattle();
    showTacticalPlanningModal(planData);
  } else {
    showPlanModeBeforeBattle(planData);
  }
}

// 工具執行處理
function handleToolExecution(tool) {
  const toolMapping = getToolMapping(tool.name);

  // 檢查 MP
  if (!checkMp(tool, toolMapping.mpCost)) {
    showInsufficientMpError();
    return;
  }

  // 扣除 MP
  player.mp -= toolMapping.mpCost;

  // 播放動畫
  playToolAnimation(toolMapping);

  // 記錄日誌
  battleLog.add(`🧙 ${toolMapping.name}（${tool.name}）`);
  battleLog.add(`⚡ MP: ${player.mp + toolMapping.mpCost} → ${player.mp} (-${toolMapping.mpCost})`);

  // 應用戰鬥效果
  applyBattleEffect(toolMapping.battleEffect);
}
```

### 與 Bridge Layer 整合

**事件監聽與轉發**：

```
// Bridge Layer 監聽 Claude CLI 輸出
class BridgeLayer {
  constructor() {
    this.claudeProcess = spawnClaudeCLI();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 監聽標準輸出
    this.claudeProcess.stdout.on('data', (data) => {
      const output = data.toString();

      // 解析輸出，識別事件類型
      const event = parseClaudeOutput(output);

      // 轉發給互動事件系統
      this.emit(event.type, event.data);
    });

    // 監聽工具執行
    this.claudeProcess.on('tool_use', (tool) => {
      this.emit('tool_execute', tool);
    });
  }

  // 解析 Claude 輸出
  parseClaudeOutput(output) {
    if (output.includes('[PLAN_MODE]')) {
      return { type: 'plan_mode', data: extractPlanData(output) };
    } else if (output.includes('[ASK_USER]')) {
      return { type: 'ask_question', data: extractQuestion(output) };
    } else if (output.includes('[ERROR]')) {
      return { type: 'error', data: extractError(output) };
    } else if (output.includes('[PERMISSION]')) {
      return { type: 'permission', data: extractPermission(output) };
    }

    return { type: 'output', data: output };
  }
}
```

### 與技能系統整合

**工具映射為技能**：

```
// 工具 → 技能數據結構
function mapToolToSkill(tool) {
  const mapping = toolMappings[tool.name];

  return {
    id: `tool_${tool.name}`,
    name: mapping.spellName,
    icon: mapping.icon,
    type: 'tool_skill',
    mpCost: mapping.mpCost,
    effect: mapping.effect,
    battleEffect: mapping.battleEffect,
    animation: mapping.animation,

    // 技能執行
    execute: async () => {
      // 檢查 MP
      if (!checkMp(player, mapping.mpCost)) {
        return { error: 'MP 不足' };
      }

      // 扣除 MP
      player.mp -= mapping.mpCost;

      // 執行工具
      const result = await executeClaudeTool(tool.name, tool.params);

      // 應用戰鬥效果
      if (result.success) {
        applyBattleEffect(mapping.battleEffect);
        return { success: true };
      } else {
        // 失敗 → 技能反噬
        handleSkillBacklash(result.error);
        return { error: result.error };
      }
    }
  };
}
```

### 與 UI 系統整合

**Modal 組件**：

```typescript
// 統一的互動事件 Modal
interface InteractiveEventModal {
  type: 'plan_mode' | 'ask_question' | 'error' | 'permission';
  title: string;
  icon: string;
  content: React.ReactNode;
  actions: Action[];
  onClose?: () => void;
}

// 使用示例
function showTacticalPlanning(planData) {
  const modal: InteractiveEventModal = {
    type: 'plan_mode',
    title: '戰術規劃',
    icon: '🧙',
    content: <PlanModeContent data={planData} />,
    actions: [
      { label: '✅ 批准戰術', onClick: approvePlan },
      { label: '🔄 重新規劃', onClick: replan },
      { label: '❌ 放棄', onClick: cancel }
    ]
  };

  showModal(modal);
}
```

### 與成就系統整合

**互動事件相關成就**：

```
interactiveAchievements = [
  {
    id: 'first_plan_mode',
    name: '戰術家',
    description: '首次批准戰術規劃',
    reward: { gold: 200, title: '戰術家' }
  },
  {
    id: 'question_master',
    name: '答題高手',
    description: '正確回答 10 次敵人發問',
    reward: { gold: 500, special: '發問回答 +20% 獎勵' }
  },
  {
    id: 'error_survivor',
    name: '錯誤生還者',
    description: '承受 50 次技能反噬仍然存活',
    reward: { gold: 1000, special: '反噬傷害 -20%' }
  },
  {
    id: 'tool_master',
    name: '工具大師',
    description: '使用 100 次不同的工具魔法',
    reward: { gold: 1500, special: '所有工具 MP 消耗 -10%' }
  }
];
```

---

## 設計決策

### 決策 1：為什麼要 RPG 化互動事件？

**背景**：
Claude Code CLI 的原生互動事件（Plan Mode、AskUserQuestion 等）會打斷用戶體驗。

**考慮方案**：
1. **保持原樣**：直接顯示 CLI 訊息
   - ✅ 忠實原始功能
   - ❌ 破壞 RPG 沉浸感
   - ❌ 用戶困惑

2. **完全隱藏**：自動處理，不顯示
   - ✅ 流暢體驗
   - ❌ 失去用戶控制
   - ❌ 違背 Claude 設計

3. **RPG 化包裝** ⭐
   - ✅ 保留功能
   - ✅ 增強沉浸感
   - ✅ 遊戲化元素
   - ⚠️ 需要設計映射

**最終決定**：RPG 化包裝

**理由**：
- Plan Mode → 戰術規劃（符合戰鬥情境）
- AskUserQuestion → 敵人發問攻擊（增加趣味性）
- 錯誤 → 技能反噬（合理化失敗）
- 權限請求 → 力量借用（RPG 化解釋）

### 決策 2：為什麼工具執行需要消耗 MP？

**背景**：
Claude CLI 的工具執行（Bash、Read、Write 等）需要遊戲化。

**考慮方案**：
1. **免費執行**：不消耗任何資源
   - ✅ 簡單
   - ❌ 無資源管理
   - ❌ 無策略性

2. **消耗時間**：每個工具有冷卻時間
   - ✅ 有限制
   - ❌ 打斷節奏
   - ❌ 不符合 RPG

3. **消耗 MP** ⭐
   - ✅ 符合 RPG 魔法系統
   - ✅ 資源管理深度
   - ✅ 鼓勵策略選擇
   - ⚠️ 需要平衡 MP 消耗

**最終決定**：消耗 MP

**理由**：
- 工具 = 魔法技能
- MP = 魔力資源
- 強力工具消耗更多 MP（Task = 20 MP）
- 簡單工具消耗少（ls = 2 MP）
- 鼓勵玩家思考何時使用哪個工具

### 決策 3：為什麼需要技能反噬機制？

**背景**：
工具執行失敗時如何處理？

**考慮方案**：
1. **只顯示錯誤**：不懲罰玩家
   - ✅ 友好
   - ❌ 無後果
   - ❌ 失去緊張感

2. **直接失敗**：戰鬥失敗
   - ✅ 有後果
   - ❌ 太嚴厲
   - ❌ 打擊積極性

3. **反噬傷害** ⭐
   - ✅ 有懲罰但不致命
   - ✅ 增加緊張感
   - ✅ 鼓勵謹慎操作
   - ✅ 提供重試選項

**最終決定**：反噬傷害機制

**特點**：
- 錯誤嚴重度決定傷害
- 連續錯誤增加倍率
- 提供重試/防禦/取消選項
- MP 不退還（鼓勵謹慎）

### 決策 4：為什麼需要混合處理方案？

**背景**：
Plan Mode 應該何時處理？

**考慮方案**：
1. **總是戰前**：所有 Plan Mode 戰前處理
   - ✅ 不打斷戰鬥
   - ❌ 無法處理突發情況
   - ❌ Claude 可能戰鬥中觸發

2. **總是戰鬥中**：所有 Plan Mode RPG 化
   - ✅ 統一處理
   - ❌ 可預測的也打斷
   - ❌ 用戶體驗差

3. **混合方案** ⭐
   - ✅ 戰前可預測 → 戰前處理
   - ✅ 戰鬥中突發 → RPG 化
   - ✅ 靈活應對
   - ⚠️ 需要預測邏輯

**最終決定**：混合方案

**策略**：
- 複雜度 >= 8 且戰前 → 戰前準備
- 戰鬥中觸發 → 戰術規劃（RPG 化）
- AskUserQuestion 總是 RPG 化（敵人發問）
- 錯誤總是 RPG 化（技能反噬）

### 決策 5：為什麼需要並行操作加成？

**背景**：
Claude 同時執行多個工具時如何處理？

**考慮方案**：
1. **獨立計算**：每個工具分別處理
   - ✅ 簡單
   - ❌ 無協同感
   - ❌ 錯過遊戲化機會

2. **組合技系統** ⭐
   - ✅ 遊戲化「多重施法」
   - ✅ 連擊加成（+20% 到 +200%）
   - ✅ 視覺震撼
   - ✅ 鼓勵複雜操作
   - ⚠️ 需要額外 MP 成本

**最終決定**：組合技系統

**特點**：
- 2 個工具：+20% 傷害，+5 MP
- 5+ 個工具：+200% 傷害，+20 MP
- 特殊動畫：多重魔法陣
- 戰鬥日誌高亮：「🔮 多重施法！」

---

**文檔完成日期**: 2026-02-06
**總字數**: ~7,200
**章節**: 6
**來源文件**: `/docs/design/interactive-events/requirements.md` (674 lines)
