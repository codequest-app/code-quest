# Battle System - Requirements

## 核心概念

### 戰鬥系統映射

將 AI 對話過程轉化為 RPG 戰鬥體驗：

| AI 交互元素 | 戰鬥系統元素 | 說明 |
|-----------|------------|------|
| 用戶 Prompt | 遭遇敵人 | 每個任務/問題生成對應敵人 |
| 任務複雜度 | 敵人等級/HP | 複雜任務 = 強力敵人 |
| 使用 Skill | 攻擊技能 | Skills 造成傷害 |
| 召喚 Agent | 召喚隊友 | Agents 協同戰鬥 |
| AI 處理過程 | 戰鬥回合 | Streaming 輸出 = 回合進行 |
| Token 消耗 | MP 消耗 | 資源管理 |
| 任務完成 | 戰鬥勝利 | 獲得獎勵 |
| 任務失敗/錯誤 | 受到傷害 | HP 減少 |

### 設計哲學

**✅ 保持簡潔**:
- 戰鬥是視覺化包裝，不改變 AI 核心功能
- 自動化戰鬥流程，不增加用戶負擔
- 保留直接對話模式（可選關閉戰鬥模式）

**✅ 增強體驗**:
- 任務難度視覺化
- 進度反饋更直觀
- 增加成就感和樂趣

**✅ 鼓勵策略**:
- 技能相性系統
- 組合技在戰鬥中更有價值
- 資源管理更重要

---

## 系統架構

### 戰鬥流程圖

```
用戶輸入 Prompt
    ↓
[敵人生成器] 分析 Prompt
    ├─ 複雜度計算
    ├─ 任務分類
    └─ 生成敵人數據
    ↓
[戰鬥初始化]
    ├─ 顯示敵人資訊
    ├─ 分析弱點/抵抗
    └─ 進入戰鬥界面
    ↓
[玩家回合] 選擇行動
    ├─ 施放 Skill → 計算傷害 → 扣除敵人 HP
    ├─ 召喚 Agent → 協同攻擊
    └─ 使用道具 (未來擴展)
    ↓
[AI 處理] Claude Code 執行
    ├─ Streaming 輸出 → 視覺化為攻擊動畫
    └─ 更新戰鬥日誌
    ↓
[敵人回合] (可選)
    ├─ 複雜任務 → 敵人反擊 (消耗 MP/HP)
    ├─ 簡單任務 → 無反擊
    └─ 更新戰鬥日誌
    ↓
[檢查戰鬥結束]
    ├─ 敵人 HP = 0 → 勝利 → 獎勵
    ├─ 玩家 HP = 0 → 失敗 → 重試/跳過
    └─ 繼續戰鬥 → 下一回合
```

### 組件架構

```
bridge/
├── battle/
│   ├── EnemyGenerator.js       # 敵人生成器
│   ├── BattleManager.js         # 戰鬥管理器
│   ├── DamageCalculator.js      # 傷害計算
│   └── AffinitySystem.js        # 相性系統

ui/src/components/Battle/
├── BattleScreen.tsx             # 戰鬥主畫面
├── EnemyDisplay.tsx             # 敵人展示
├── BattleLog.tsx                # 戰鬥日誌
├── ActionMenu.tsx               # 行動選單
├── DamageNumber.tsx             # 傷害數字動畫
└── VictoryScreen.tsx            # 勝利畫面

rpg-config/
├── battle-system.json           # 戰鬥系統配置
├── enemy-types.json             # 敵人類型定義
└── affinities.json              # 相性表
```

---

## 敵人生成系統

### 複雜度分析算法

**目標**: 根據 Prompt 特徵計算任務複雜度，生成對應等級的敵人

#### 複雜度評分因素

**1. 長度因素** (0-3 分):
- 超過 200 字符：+3 分
- 100-200 字符：+2 分
- 小於 100 字符：+1 分

**2. 關鍵字複雜度**:

重量級關鍵字 (+2 分):
- architecture, 架構
- refactor, 重構
- optimize, 優化
- design pattern, 設計模式

中量級關鍵字 (+1 分):
- implement, 實作
- create, 創建
- review, 審查
- test, 測試

**3. 多步驟任務** (+2 分):
- 檢測：包含 "and", "then", "after", "before", "以及", "然後"

**4. 技術棧複雜度** (+1 分/個):
- 檢測技術關鍵字：React, Vue, Node, Python, Java, TypeScript

**5. 等級計算**:
```
level = min(15, max(1, floor(score / 2) + 1))
```

#### 難度等級

| 等級 | 分數範圍 | 難度 | 說明 |
|-----|---------|------|------|
| 1-3 | 0-6 | simple | 簡單任務，無反擊 |
| 4-7 | 7-14 | medium | 一般任務 |
| 8-12 | 15-24 | hard | 複雜任務，有反擊 |
| 13-15 | 25+ | boss | Boss 級任務，多階段 |

---

## 任務分類系統

### 任務類型與敵人對應

| 任務類型 | 敵人名稱 | 圖標 | 元素 | 弱點技能 | 抗性技能 |
|---------|---------|------|------|---------|---------|
| code-task | 代碼挑戰 | 💻 | logic | code-generator, code-reviewer | doc-writer |
| bug-hunt | Bug 怪物 | 🐛 | chaos | debug-helper, test-generator, code-reviewer | code-generator |
| architecture | 架構挑戰 | 🏰 | wisdom | code-reviewer | test-generator |
| documentation | 文檔任務 | 📜 | knowledge | doc-writer | debug-helper |
| testing | 測試挑戰 | 🧪 | precision | test-generator | doc-writer |
| optimization | 優化挑戰 | ⚡ | power | code-reviewer, debug-helper | doc-writer |
| general | 通用任務 | ❓ | neutral | 無 | 無 |

### 分類規則

通過 Prompt 關鍵字匹配任務類型：

**代碼任務** (code-task):
- 關鍵字：code, 程式, function, 函數, class, implement

**Bug 修復** (bug-hunt):
- 關鍵字：bug, debug, 錯誤, fix, 修復, error

**架構設計** (architecture):
- 關鍵字：architecture, 架構, design, 設計, pattern, refactor

**文檔撰寫** (documentation):
- 關鍵字：document, 文檔, readme, comment, 註解, explain

**測試** (testing):
- 關鍵字：test, 測試, unit test, integration, coverage

**優化** (optimization):
- 關鍵字：optimize, 優化, performance, 性能, speed, efficiency

---

## 敵人屬性系統

### 敵人數據結構

```javascript
{
  id: string,              // 唯一 ID
  name: string,            // 敵人名稱
  type: string,            // 任務類型
  icon: string,            // 圖標
  element: string,         // 元素屬性

  level: number,           // 等級 (1-15)
  hp: number,              // 當前 HP
  maxHp: number,           // 最大 HP

  weaknesses: string[],    // 弱點技能列表
  resistances: string[],   // 抗性技能列表

  mechanics: string[],     // 特殊機制

  rewards: {
    exp: number,           // 經驗獎勵
    gold: number,          // 金幣獎勵
    multiplier: number     // 獎勵倍率
  }
}
```

### 敵人名稱生成

**前綴**（根據等級）:
- Lv.1-3：微弱的、小型、初級
- Lv.4-6：中等的、狡猾的、進階
- Lv.7-9：強大的、精英、高級
- Lv.10+：傳說的、終極、史詩

**基礎名稱**（根據類型）:
- code-task：代碼挑戰、Logic Beast、程式魔物
- bug-hunt：Bug 怪物、Error Demon、錯誤惡魔
- architecture：架構巨龍、Design Titan、設計泰坦
- documentation：知識守護者、Doc Golem、文檔魔像
- testing：測試審判者、QA Sentinel、品質哨兵
- optimization：性能惡魔、Speed Wraith、效能幽靈
- general：未知挑戰、Mystery Beast、神秘生物

**生成示例**:
- Lv.2 bug-hunt → "微弱的 Bug 怪物"
- Lv.8 architecture → "強大的架構巨龍"
- Lv.14 optimization → "傳說的性能惡魔"

---

## 戰鬥機制

### HP 計算公式

```javascript
maxHp = level * 100 * hpMultiplier
```

**HP 倍率**（根據敵人類型）:
- code-task: 1.0
- bug-hunt: 1.5（Bug 更難打）
- architecture: 2.0（架構任務血厚）
- documentation: 0.8（文檔較簡單）
- testing: 1.2
- optimization: 1.8
- general: 1.0

### 特殊機制

**1. 反擊 (counter_attack)**:
- 觸發條件：mechanics 包含 'counter_attack'
- 效果：敵人在玩家攻擊後反擊，消耗玩家 MP
- 傷害：`level * 5` MP
- 適用敵人：bug-hunt (Lv.5+)

**2. 多階段 (multi_phase)**:
- 觸發條件：mechanics 包含 'multi_phase'
- 效果：HP 降到 50% 時進入第二階段，傷害倍率提升
- 階段 1 (HP 100%-50%)：傷害 ×1.0
- 階段 2 (HP 50%-0%)：傷害 ×1.5
- 適用敵人：architecture (Lv.10+)

**3. 加速 (speed_boost)**:
- 觸發條件：mechanics 包含 'speed_boost'
- 效果：30% 機率連續攻擊兩次
- 適用敵人：optimization (Lv.5+)

**4. 特殊攻擊 (special_attack)**:
- 觸發條件：mechanics 包含 'special_attack'
- 效果：每 3 回合使用一次強力攻擊
- 傷害：`level * 20` MP
- 適用敵人：Boss (Lv.13+)

---

## 傷害計算系統

### 基礎傷害公式

```javascript
baseDamage = 100 + (skill.cost.mp * 3) + (player.level * 10)
```

### 傷害修正

**1. 相性倍率** (affinityMultiplier):
- 根據技能類型和敵人類型查表
- 範圍：0.5 - 1.8

**2. 弱點倍率** (weakMultiplier):
- 技能在敵人弱點列表中：×1.5
- 否則：×1.0

**3. 抗性倍率** (resistMultiplier):
- 技能在敵人抗性列表中：×0.5
- 否則：×1.0

### 最終傷害計算

```javascript
totalDamage = floor(
  baseDamage * affinityMultiplier * weakMultiplier * resistMultiplier
)
```

### Agent 傷害計算

```javascript
agentDamage = floor(
  150 + agent.stats.attack + agent.stats.wisdom + (player.level * 5)
)
```

### 組合技傷害計算

```javascript
comboDamage = floor(
  (300 + (skillsUsed.length * 50) + (player.level * 20)) * combo.rewards.expMultiplier
)
```

---

## 相性系統

### 相性表

| 技能 | 擅長敵人 | 倍率 | 不擅長敵人 | 倍率 |
|-----|---------|------|-----------|------|
| code-generator | code-task | 1.2 | bug-hunt | 0.8 |
| code-generator | documentation | 1.1 | testing | 0.9 |
| code-reviewer | bug-hunt | 1.5 | architecture | 0.9 |
| code-reviewer | code-task | 1.2 | - | - |
| code-reviewer | optimization | 1.1 | - | - |
| debug-helper | bug-hunt | 1.8 | - | - |
| debug-helper | optimization | 1.2 | - | - |
| test-generator | bug-hunt | 1.3 | - | - |
| test-generator | code-task | 1.1 | - | - |
| test-generator | testing | 1.5 | - | - |
| doc-writer | documentation | 1.5 | code-task | 0.9 |
| doc-writer | architecture | 1.2 | - | - |

### 效果標籤

| 倍率 | 標籤 | 顯示 |
|-----|------|------|
| ≥1.5 | extremely_effective | 極度有效！ |
| ≥1.3 | very_effective | 非常有效！ |
| ≥1.1 | effective | 有效 |
| 1.0 | normal | - |
| <1.0 | not_effective | 效果不佳 |

---

## 敵人 AI 系統

### AI 類型

**simple（簡單 AI）**:
- 只攻擊玩家
- 忽略夥伴
- 無特殊策略
- 適用敵人：code-task, documentation, testing, general (Lv.1-4)

**elite（精英 AI）**:
- 優先攻擊低防禦目標
- 30% 機率攻擊夥伴
- 使用反擊機制
- 適用敵人：bug-hunt, optimization (Lv.5-12)

**boss（Boss AI）**:
- 智能選擇目標（低 HP > 高威脅 > 玩家）
- 50% 機率攻擊夥伴
- 20% 機率使用範圍攻擊（AOE）
- 使用特殊攻擊和多階段機制
- 適用敵人：architecture (Lv.13+)

---

## 獎勵系統

### 獎勵計算

```javascript
finalExp = floor(baseExp * typeMultiplier * difficultyMultiplier)
finalGold = floor(baseGold * typeMultiplier * difficultyMultiplier)
```

**基礎獎勵**:
```javascript
baseExp = level * 30
baseGold = level * 15
```

**類型倍率** (typeMultiplier):
- code-task: EXP ×1.2, Gold ×1.0
- bug-hunt: EXP ×1.5, Gold ×1.3
- architecture: EXP ×2.0, Gold ×1.8
- documentation: EXP ×1.0, Gold ×0.8
- testing: EXP ×1.3, Gold ×1.1
- optimization: EXP ×1.8, Gold ×1.5
- general: EXP ×1.0, Gold ×1.0

**難度倍率** (difficultyMultiplier):
- simple (Lv.1-3): ×1.0
- medium (Lv.4-7): ×1.3
- hard (Lv.8-12): ×1.6
- boss (Lv.13-15): ×2.0

### 額外獎勵

**首次擊敗獎勵**:
- 首次擊敗該類型敵人：EXP +50%

**完美勝利**:
- 不消耗 HP：EXP +30%, Gold +20%

**快速擊殺**:
- 3 回合內結束：EXP +20%

**組合技擊殺**:
- 使用組合技終結：EXP +40%

---

## 戰鬥狀態管理

### 戰鬥實例數據結構

```javascript
{
  id: string,                  // 戰鬥 ID
  enemy: Enemy,                // 敵人數據
  player: Player,              // 玩家數據
  turn: number,                // 當前回合
  log: BattleLogEntry[],       // 戰鬥日誌
  startTime: number,           // 開始時間
  endTime?: number,            // 結束時間
  status: 'ongoing' | 'victory' | 'defeat',  // 戰鬥狀態
  toolsUsed: number,           // 已使用工具數
  goldSpent: number,           // 已消耗金幣
  actions: BattleAction[]      // 行動記錄
}
```

### 戰鬥日誌類型

```javascript
{
  turn: number,                // 回合數
  timestamp: number,           // 時間戳
  message: string,             // 日誌內容
  type: string                 // 日誌類型
}
```

**日誌類型**:
- `encounter`: 遭遇敵人
- `player_attack`: 玩家攻擊
- `agent_attack`: Agent 攻擊
- `enemy_attack`: 敵人反擊
- `critical`: 弱點攻擊
- `victory`: 戰鬥勝利
- `defeat`: 戰鬥失敗
- `info`: 提示信息
- `reward`: 獎勵信息

---

## 配置系統

### 戰鬥系統配置

```json
{
  "settings": {
    "enableBattleMode": true,        // 啟用戰鬥模式
    "autoStartBattle": true,         // 自動開始戰鬥
    "showDamageNumbers": true,       // 顯示傷害數字
    "enableEnemyCounter": true,      // 啟用敵人反擊
    "battleAnimationSpeed": "normal" // 動畫速度
  }
}
```

### 難度配置

```json
{
  "simple": {
    "levelRange": [1, 3],
    "hpMultiplier": 1.0,
    "expMultiplier": 1.0,
    "enemyCounterChance": 0.0
  },
  "medium": {
    "levelRange": [4, 7],
    "hpMultiplier": 1.5,
    "expMultiplier": 1.3,
    "enemyCounterChance": 0.3
  },
  "hard": {
    "levelRange": [8, 12],
    "hpMultiplier": 2.0,
    "expMultiplier": 1.6,
    "enemyCounterChance": 0.5
  },
  "boss": {
    "levelRange": [13, 15],
    "hpMultiplier": 3.0,
    "expMultiplier": 2.0,
    "enemyCounterChance": 0.8
  }
}
```

---

## 實作優先級

### Phase 2.5: 戰鬥系統 (Week 4-5)

**Week 4**:
- [ ] 實作 EnemyGenerator
  - [ ] 複雜度分析算法
  - [ ] 任務分類
  - [ ] 敵人名稱生成
- [ ] 實作 BattleManager
  - [ ] 戰鬥流程
  - [ ] 回合管理
  - [ ] 勝利/失敗判定
- [ ] 配置文件
  - [ ] enemy-types.json
  - [ ] battle-system.json

**Week 5**:
- [ ] 實作 DamageCalculator
  - [ ] 傷害公式
  - [ ] 相性計算
- [ ] 實作 AffinitySystem
  - [ ] 相性表
  - [ ] 推薦系統
- [ ] UI 組件
  - [ ] BattleScreen
  - [ ] EnemyDisplay
  - [ ] BattleLog
  - [ ] DamageNumber
  - [ ] VictoryScreen
- [ ] 整合測試

---

## 驗收標準

### 基礎功能

**1. 敵人生成**:
```bash
輸入簡單 prompt → 生成 Lv.1-3 敵人 ✅
輸入複雜 prompt → 生成 Lv.8+ 敵人 ✅
```

**2. 戰鬥流程**:
```bash
開始對話 → 顯示敵人資訊 ✅
使用 Skill → 敵人扣血 ✅
敵人 HP = 0 → 顯示勝利 ✅
```

**3. 傷害計算**:
```bash
使用弱點技能 → 傷害 ×1.5 ✅
使用抗性技能 → 傷害 ×0.5 ✅
```

**4. UI 動畫**:
```bash
傷害數字飄出 ✅
HP 條平滑減少 ✅
勝利動畫播放 ✅
```

### 進階功能

**5. 敵人機制**:
```bash
Bug 怪物 → 反擊消耗 MP ✅
Boss 級敵人 → 多階段戰鬥 ✅
```

**6. 組合技整合**:
```bash
觸發組合技 → 造成更高傷害 ✅
組合技在戰鬥中有特效 ✅
```

**7. 統計記錄**:
```bash
查看戰鬥歷史 ✅
勝率統計 ✅
```

---

## 未來擴展

### 可能的增強功能

**1. 裝備系統**:
- Prompt 模板作為"武器"
- MCP 工具作為"裝備"
- 提供屬性加成

**2. 地城系統**:
- 連續任務視為地城
- 每層一個敵人
- 最終層為 Boss

**3. 多人協作戰鬥**:
- 多個玩家協同
- 共享戰鬥進度
- 組隊獎勵

**4. 每日 Boss**:
- 每日特殊挑戰
- 高獎勵
- 排行榜

**5. 戰鬥回放**:
- 記錄戰鬥過程
- 分享精彩時刻
- 學習優秀策略

---

## 總結

戰鬥系統通過以下方式增強 RPG-CLI 體驗：

**✅ 視覺化進度**:
- 任務難度 → 敵人等級
- 處理過程 → 戰鬥回合
- 完成度 → HP 減少

**✅ 增強互動性**:
- 技能選擇更有策略性
- 弱點系統鼓勵嘗試
- 戰鬥日誌提供反饋

**✅ 提升成就感**:
- 擊敗強敵的滿足感
- 勝利獎勵更豐富
- 戰績記錄可追蹤

**✅ 保持靈活性**:
- 可選開關戰鬥模式
- 不影響核心 AI 功能
- 漸進式功能增強
