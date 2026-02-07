# 系統 03 - 戰鬥系統 (Battle System)

本文件描述 Code Quest 的戰鬥系統設計，將 AI 對話過程轉化為 RPG 戰鬥體驗。

---

## 目錄

- [系統概述](#系統概述)
- [依賴關係](#依賴關係)
- [核心規則](#核心規則)
- [內部地圖](#內部地圖)
- [系統整合](#系統整合)
- [設計決策](#設計決策)

---

## 系統概述

### 核心概念

將 AI 對話過程視覺化為 RPG 戰鬥，用戶 Prompt 生成敵人，使用技能造成傷害，完成任務即戰勝敵人。

**戰鬥系統映射**：

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

---

### 設計哲學

**保持簡潔**:
- 戰鬥是視覺化包裝，不改變 AI 核心功能
- 自動化戰鬥流程，不增加用戶負擔
- 保留直接對話模式（可選關閉戰鬥模式）

**增強體驗**:
- 任務難度視覺化
- 進度反饋更直觀
- 增加成就感和樂趣

**鼓勵策略**:
- 技能相性系統
- 組合技在戰鬥中更有價值
- 資源管理更重要

---

## 依賴關係

### 系統依賴

```
戰鬥系統 (L1 - 戰鬥層)
├─ 依賴於：
│  ├─ 場景系統 (場景切換)
│  └─ 地圖系統 (遭遇戰觸發)
└─ 被依賴於：
   ├─ 夥伴系統
   ├─ 召喚獸系統
   └─ 互動事件系統
```

---

## 核心規則

### 規則 1：敵人生成系統

#### 複雜度分析算法

**評分因素**：

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
等級 = 最小值(15, 最大值(1, 向下取整(分數 / 2) + 1))
```

---

#### 難度等級表

| 等級 | 分數範圍 | 難度 | 說明 |
|-----|---------|------|------|
| 1-3 | 0-6 | simple | 簡單任務，無反擊 |
| 4-7 | 7-14 | medium | 一般任務 |
| 8-12 | 15-24 | hard | 複雜任務，有反擊 |
| 13-15 | 25+ | boss | Boss 級任務，多階段 |

---

### 規則 2：任務分類系統

#### 任務類型與敵人對應

| 任務類型 | 敵人名稱 | 圖標 | 元素 | 弱點技能 | 抗性技能 |
|---------|---------|------|------|---------|---------|
| code-task | 代碼挑戰 | 💻 | logic | code-generator, code-reviewer | doc-writer |
| bug-hunt | Bug 怪物 | 🐛 | chaos | debug-helper, test-generator | code-generator |
| architecture | 架構挑戰 | 🏰 | wisdom | code-reviewer | test-generator |
| documentation | 文檔任務 | 📜 | knowledge | doc-writer | debug-helper |
| testing | 測試挑戰 | 🧪 | precision | test-generator | doc-writer |
| optimization | 優化挑戰 | ⚡ | power | code-reviewer, debug-helper | doc-writer |
| general | 通用任務 | ❓ | neutral | 無 | 無 |

---

#### 分類規則

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

### 規則 3：敵人屬性系統

#### HP 計算公式

```
最大HP = 等級 × 基礎值 × HP倍率
```

**HP 倍率**（根據敵人類型）:
- code-task: 1.0
- bug-hunt: 1.5（Bug 更難打）
- architecture: 2.0（架構任務血厚）
- documentation: 0.8（文檔較簡單）
- testing: 1.2
- optimization: 1.8
- general: 1.0

**示例**：
```
Bug怪物 Lv.5:
maxHp = 5 * 100 * 1.5 = 750 HP

架構挑戰 Lv.10:
maxHp = 10 * 100 * 2.0 = 2000 HP
```

---

#### 特殊機制

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

### 規則 4：傷害計算系統

#### 基礎傷害公式

```
基礎傷害 = 固定值 + (技能MP消耗 × 倍數) + (玩家等級 × 倍數)
```

**傷害修正**：

**1. 相性倍率** (affinityMultiplier):
- 根據技能類型和敵人類型查表
- 範圍：0.5 - 1.8

**2. 弱點倍率** (weakMultiplier):
- 技能在敵人弱點列表中：×1.5
- 否則：×1.0

**3. 抗性倍率** (resistMultiplier):
- 技能在敵人抗性列表中：×0.5
- 否則：×1.0

---

#### 最終傷害計算

```
最終傷害 = 向下取整(
  基礎傷害 × 相性倍率 × 弱點倍率 × 抗性倍率
)
```

**示例計算**：
```
code-reviewer (MP 40) 攻擊 Bug怪物 Lv.5
玩家等級：10

基礎傷害 = 100 + (40 × 3) + (10 × 10) = 320
相性倍率 = 1.5 (code-reviewer 對 bug-hunt)
弱點倍率 = 1.5 (code-reviewer 在弱點列表中)
抗性倍率 = 1.0 (無抗性)

最終傷害 = 向下取整(320 × 1.5 × 1.5 × 1.0) = 720
```

---

#### Agent 傷害計算

```
Agent傷害 = 向下取整(
  基礎值 + Agent攻擊力 + Agent智慧 + (玩家等級 × 倍數)
)
```

---

#### 組合技傷害計算

```
組合技傷害 = 向下取整(
  (基礎值 + (技能數量 × 倍數) + (玩家等級 × 倍數)) ×
  經驗倍率
)
```

---

### 規則 5：相性系統

#### 相性表

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

---

#### 效果標籤

| 倍率 | 標籤 | 顯示 |
|-----|------|------|
| ≥1.5 | extremely_effective | 極度有效！ |
| ≥1.3 | very_effective | 非常有效！ |
| ≥1.1 | effective | 有效 |
| 1.0 | normal | - |
| <1.0 | not_effective | 效果不佳 |

---

### 規則 6：敵人 AI 系統

#### AI 類型

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

### 規則 7：獎勵系統

#### 獎勵計算

```
最終經驗值 = 向下取整(基礎經驗 × 類型倍率 × 難度倍率)
最終金幣 = 向下取整(基礎金幣 × 類型倍率 × 難度倍率)
```

**基礎獎勵**:
```
基礎經驗 = 等級 × 30
基礎金幣 = 等級 × 15
```

---

#### 類型倍率

| 類型 | EXP 倍率 | Gold 倍率 |
|------|----------|-----------|
| code-task | 1.2 | 1.0 |
| bug-hunt | 1.5 | 1.3 |
| architecture | 2.0 | 1.8 |
| documentation | 1.0 | 0.8 |
| testing | 1.3 | 1.1 |
| optimization | 1.8 | 1.5 |
| general | 1.0 | 1.0 |

---

#### 難度倍率

| 難度 | 等級範圍 | 倍率 |
|------|----------|------|
| simple | Lv.1-3 | ×1.0 |
| medium | Lv.4-7 | ×1.3 |
| hard | Lv.8-12 | ×1.6 |
| boss | Lv.13-15 | ×2.0 |

---

#### 額外獎勵

**首次擊敗獎勵**:
- 首次擊敗該類型敵人：EXP +50%

**完美勝利**:
- 不消耗 HP：EXP +30%, Gold +20%

**快速擊殺**:
- 3 回合內結束：EXP +20%

**組合技擊殺**:
- 使用組合技終結：EXP +40%

---

## 內部地圖

### 戰鬥流程圖

```
┌────────────────────────────────────────────────────┐
│                戰鬥完整流程                        │
└────────────────────────────────────────────────────┘

用戶輸入 Prompt
    ↓
[敵人生成器] 分析 Prompt
    ├─ 複雜度計算 (0-15)
    ├─ 任務分類 (7 種類型)
    └─ 生成敵人數據
    ↓
[戰鬥初始化]
    ├─ 顯示敵人資訊
    ├─ 分析弱點/抵抗
    └─ 進入戰鬥界面
    ↓
┌────────────────────────┐
│    回合制戰鬥循環      │
├────────────────────────┤
│                        │
│ [玩家回合]             │
│  ├─ 等待 Claude 行動   │
│  ├─ 手動施放技能       │
│  ├─ 召喚夥伴           │
│  └─ 使用道具           │
│      ↓                 │
│ [夥伴回合]（如有）     │
│  └─ AI 自動選擇技能    │
│      ↓                 │
│ [敵人回合]             │
│  ├─ 反擊攻擊           │
│  ├─ 特殊技能           │
│  └─ AskUserQuestion    │
│      ↓                 │
│ [檢查戰鬥結束]         │
│  ├─ 敵人 HP = 0 → 勝利 │
│  ├─ 玩家 HP = 0 → 失敗 │
│  └─ 繼續下一回合       │
│                        │
└────────────────────────┘
    ↓
[戰鬥結束]
    ├─ 勝利動畫
    ├─ 計算獎勵
    ├─ 發放 EXP/Gold
    ├─ 檢查升級
    └─ 返回探索模式
```

---

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

### 戰鬥畫面 UI

```
┌───────────────────────────────────────────────────────────┐
│                     戰鬥場景背景                            │
│                                                           │
│                       敵人區域                             │
│                   ┌──────────────┐                        │
│                   │   💻 Lv.5    │                        │
│                   │  Bug 怪物     │                        │
│                   │ ▓▓▓▓▓▓▓░░░   │ HP: 350/500          │
│                   └──────────────┘                        │
│                                                           │
│                                                           │
│   ┌─────────────────────────────────────────────┐        │
│   │ [回合 3]                                    │        │
│   │ 使用 code-reviewer! 造成 180 傷害!          │        │
│   │ 弱點攻擊! 傷害加成!                          │        │
│   │ Bug 怪物 反擊! 消耗 25 MP!                   │        │
│   └─────────────────────────────────────────────┘        │
│                                                           │
│   ┌────────────── 行動選單 ──────────────┐              │
│   │ [🎯 使用技能] [🤝 召喚夥伴] [💼 道具]  │              │
│   └──────────────────────────────────────┘              │
└───────────────────────────────────────────────────────────┘

玩家資訊 (右下角)
┌──────────────────┐
│ 玩家 Lv.10       │
│ HP: ████████ 100 │
│ MP: ████░░░░  75 │
└──────────────────┘
```

---

## 系統整合

### 與 Scene System 整合

```
戰鬥觸發：
SceneManager.checkPromptType() → 'task'
    ↓
SceneManager.analyzeComplexity() → 10
    ↓
SceneManager.switchToBattleMode()
    ↓
BattleManager.startBattle()
```

---

### 與 Companion System 整合

```
夥伴加入戰鬥：
BattleManager.addCompanion(companionId)
    ↓
戰鬥回合順序：
玩家 → 夥伴1 → 夥伴2 → 敵人
    ↓
敵人 AI 變化：
- simple AI: 只攻擊玩家
- elite AI: 30% 攻擊夥伴
- boss AI: 50% 攻擊夥伴
```

---

### 與 Summon Beast System 整合

```
召喚獸觸發：
用戶使用召喚技能
    ↓
BattleManager.summonBeast(beastId)
    ↓
召喚獸行動：
- immediate: 立即施放技能並離去
- automatic: 加入回合順序，持續 2-3 回合
- passive: 提供被動效果
- interactive: 玩家手動控制
```

---

### 與 Interactive Events 整合

```
事件觸發：
Plan Mode → 暫停戰鬥，顯示規劃界面
AskUserQuestion → 敵人發問攻擊
錯誤 → 敵人反噬傷害
權限請求 → 暫停戰鬥確認
```

---

## 設計決策

### 決策 1：為什麼要戰鬥系統？

**問題**：
- AI 對話過程抽象
- 進度難以視覺化
- 缺乏遊戲性

**解決方案**：
- 戰鬥視覺化任務進度
- HP 條表示任務完成度
- 增加策略性和樂趣

**好處**：
- ✅ 進度直觀可見
- ✅ 增加成就感
- ✅ 鼓勵策略思考

---

### 決策 2：複雜度評分算法

**為什麼需要**？
- 自動判斷任務難度
- 生成對應等級敵人
- 平衡遊戲體驗

**設計理由**：
- 多維度評分（長度、關鍵字、步驟、技術）
- 0-15 等級範圍適中
- 可調整權重

**示例**：
```
"修復按鈕" → 3 分 → Lv.2
"重構整個架構" → 15 分 → Lv.12
```

---

### 決策 3：相性系統設計

**為什麼需要**？
- 增加策略深度
- 鼓勵技能多樣性
- 符合 RPG 傳統

**實現方式**：
- 技能 vs 敵人類型
- 倍率：0.5 - 1.8
- 視覺提示（"極度有效！"）

**好處**：
- ✅ 策略選擇
- ✅ 技能價值
- ✅ RPG 樂趣

---

### 決策 4：敵人 AI 三級設計

**為什麼分級**？
- 難度梯度
- 挑戰性增加
- 策略多樣性

**三級 AI**：
- simple (Lv.1-4): 只攻擊玩家
- elite (Lv.5-12): 會攻擊夥伴
- boss (Lv.13+): 智能選擇目標

**好處**：
- ✅ 難度曲線
- ✅ 夥伴價值
- ✅ Boss 戰特殊

---

### 決策 5：獎勵倍率設計

**為什麼有倍率**？
- 鼓勵挑戰難任務
- 平衡不同類型任務
- 增加獎勵多樣性

**倍率設計**：
- 任務類型倍率（architecture ×2.0）
- 難度倍率（boss ×2.0）
- 額外獎勵（首殺 +50%）

**示例**：
```
架構 Boss Lv.15 首殺：
baseExp = 15 * 30 = 450
finalExp = 450 * 2.0 * 2.0 * 1.5 = 2700 EXP
```

---

## 總結

戰鬥系統通過以下方式增強 RPG-CLI 體驗：

**視覺化進度**:
- 任務難度 → 敵人等級
- 處理過程 → 戰鬥回合
- 完成度 → HP 減少

**增強互動性**:
- 技能選擇更有策略性
- 弱點系統鼓勵嘗試
- 戰鬥日誌提供反饋

**提升成就感**:
- 擊敗強敵的滿足感
- 勝利獎勵更豐富
- 戰績記錄可追蹤

**保持靈活性**:
- 可選開關戰鬥模式
- 不影響核心 AI 功能
- 漸進式功能增強

---

**相關文檔**：
- [02-scene-system.md](./02-scene-system.md) - 場景系統
- [04-companion-system.md](./04-companion-system.md) - 夥伴系統
- [05-summon-beast-system.md](./05-summon-beast-system.md) - 召喚獸系統
- [07-interactive-events.md](./07-interactive-events.md) - 互動事件系統
