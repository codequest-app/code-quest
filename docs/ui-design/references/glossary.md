# 術語表 (Glossary)

**創建日期**: 2026-02-06
**版本**: v1.0

---

## A

### Affinity（親和性）
元素屬性之間的相生相剋關係。例如：Fire → Water（火克水 1.5x 傷害）。

### AI Processing（AI 處理中）
UI 狀態指示器，顯示 Claude 正在分析和生成響應。

### Async Battle（異步戰鬥）
複雜度 >= 8 的任務，在獨立戰鬥實例中異步執行，支持最多 3 個並發。

### Achievement（成就）
完成特定條件時解鎖的獎勵，如「首次購物」、「時空探索者」等。

---

## B

### Battle Companion（戰鬥夥伴）
從 Subagent 轉化而來的戰鬥單位，擁有獨立的 HP/MP/技能系統。

### Battle Instance（戰鬥實例）
一個獨立的戰鬥會話，可以並發執行（最多 3 個）。

### Battle Mode（戰鬥模式）
場景系統的兩種模式之一，當用戶執行複雜任務時自動進入。

### Battle Track（戰鬥軌道）
異步戰鬥系統的執行路徑之一，處理複雜任務。

### Bridge Layer（橋接層）
Node.js 中間層，負責管理 Claude CLI 進程和遊戲系統的通信。

---

## C

### Complexity Score（複雜度分數）
SmartRouter 根據提示詞計算的分數（0-15），用於決定執行路徑。

### Companion（夥伴）
協助玩家戰鬥的 AI 單位，來源於 Subagent。

### Cooldown（冷卻時間）
技能或操作再次使用前必須等待的時間。

### Cost Tracker（成本追蹤器）
記錄 AI 模型 token 使用和成本的系統組件。

---

## D

### Dialog Mode（對話模式）
複雜度 < 3 的簡單問答，主線程立即響應，無戰鬥界面。

### Dialog Track（對話軌道）
異步戰鬥系統的執行路徑之一，處理簡單對話。

---

## E

### Enemy（敵人）
基於提示詞複雜度自動生成的戰鬥對手，有 7 種類型。

### Exploration Mode（探索模式）
場景系統的兩種模式之一，用戶在城鎮中自由活動和管理資源。

### EXP（經驗值）
擊敗敵人或完成任務獲得，累積到一定量後升級。

---

## F

### Feature World（冒險世界）
Worktree 類型之一，用於開發新功能，MP 消耗 10。

---

## G

### Gold（金幣）
遊戲內貨幣，用於購買技能、道具、升級等。

### Gemini Pro（Gemini 2.0 Pro）
Google 的 AI 模型，多模態能力強，成本比 Claude 便宜 60%。

---

## H

### HP（生命值）
玩家或夥伴的健康值，歸零時戰鬥失敗。

### Hotfix World（緊急世界）
Worktree 類型之一，用於緊急修復生產問題，MP 消耗 20，有 5 分鐘冷卻。

---

## I

### Interactive Event（互動事件）
需要用戶決策的事件，包括 Plan Mode、AskUserQuestion、錯誤、權限請求。

---

## L

### Level（等級）
玩家或夥伴的當前等級，影響屬性和解鎖內容。

---

## M

### Main Sync（主線程同步）
複雜度 3-7 的簡單任務，主線程同步執行，顯示戰鬥 UI，在主工作目錄執行。

### Map System（地圖系統）
管理世界地圖、區域、場所和導航的系統。

### Model Adapter（模型適配器）
統一不同 AI 模型（Claude, Gemini）接口的抽象層。

### MP（魔力值）
施放技能和使用工具消耗的資源，探索模式 1 MP/秒恢復，戰鬥模式 0.1 MP/秒恢復。

### Multi-Model Router（多模型路由器）
根據任務特性和用戶偏好自動選擇最適合的 AI 模型。

---

## P

### Parallel World（平行世界）
RPG 化的 Git Worktree 概念，每個 worktree 是一個獨立的開發時間線。

### Plan Mode（計劃模式）
Claude Code 功能，當任務複雜時進入，RPG 化為「戰術規劃」。

### Prompt（提示詞）
用戶輸入給 AI 的指令或問題。

---

## R

### Region（區域）
世界地圖中的大區域，如「起始之地」、「開發者大陸」等。

### RPG Layer（RPG 層）
React UI 層，提供遊戲化的用戶界面。

---

## S

### Scene System（場景系統）
管理探索模式和戰鬥模式切換的系統。

### Shop（商店）
城鎮中的 7 個商店：技能商店、技能鍛造、知識圖書館、傭兵公會、寶庫、訓練場、金庫。

### Skill（技能）
消耗 MP 施放的能力，可以是預設技能或自定義技能。

### SmartRouter（智能路由器）
分析提示詞複雜度並決定執行路徑（Dialog/Main Sync/Battle Async）的組件。

### Subagent
Claude Code 的子 Agent 功能，在 Code Quest 中映射為 Battle Companion。

### Summon Beast（召喚獸）
可召喚的戰鬥助力，有 4 種類型：技能召喚、組合召喚、工具召喚、道具召喚。

---

## T

### Task Tool（Task 工具）
Claude Code 創建 Subagent 的工具，RPG 化為「召喚夥伴」魔法。

### Tool Mapping（工具映射）
Claude CLI 工具到 RPG 魔法的映射，如 Read → 讀心術。

### Turn（回合）
戰鬥中的行動單位，每個參與者按速度順序行動。

---

## W

### Worktree（工作樹）
Git Worktree 功能，允許在不同目錄中檢出不同分支。

### Worktree Manual System（手動 Worktree 系統）
用戶在探索模式中主動創建和管理的 worktree，用於長期開發。

### Worktree Auto System（自動 Worktree 系統）
Battle Async 自動創建的 worktree，用於並發戰鬥的代碼隔離。

---

## 其他

### 三層架構
- **L1: RPG Layer**（React UI）
- **L2: Bridge Layer**（Node.js 中間層）
- **L3: CLI Layer**（Claude Code CLI）

### 三種執行路徑
1. **Dialog Track**：複雜度 0-2，即時響應
2. **Main Sync**：複雜度 3-7，同步執行，顯示進度
3. **Battle Async**：複雜度 8+，異步執行，支持並發

### 五種 Worktree 類型
1. **Main**（主世界）：生產環境，受保護
2. **Feature**（冒險世界）：開發新功能，10 MP
3. **Fix**（修復世界）：Bug 修復，15 MP
4. **Experiment**（實驗世界）：技術實驗，5 MP，7 天過期
5. **Hotfix**（緊急世界）：緊急修復，20 MP，5 分鐘冷卻

### 七大商店
1. **Skills Shop**（技能商店）：購買預設技能
2. **Skill Forge**（技能鍛造）：自定義創建技能
3. **Knowledge Library**（知識圖書館）：購買 MCP 工具
4. **Mercenary Guild**（傭兵公會）：招募和訓練夥伴
5. **Treasury**（寶庫）：購買道具和裝備
6. **Training Ground**（訓練場）：升級技能和屬性
7. **Bank**（金庫）：存款、貸款和投資

### 四種召喚獸行為
1. **Immediate**（即時型）：召喚後立即執行效果
2. **Automatic**（自動型）：每回合自動執行動作
3. **Passive**（被動型）：提供持續 Buff
4. **Interactive**（互動型）：需要玩家指令

### 敵人類型
根據複雜度自動生成：
- Lv.1-3：Small Bug（小 Bug）
- Lv.4-6：Medium Bug（中型 Bug）
- Lv.7-9：Architecture Challenge（架構挑戰）
- Lv.10-12：System Refactor（系統重構）
- Lv.13-15：Boss Enemy（魔王級）

### 資源恢復速率
**探索模式**：
- HP: 2 HP/秒
- MP: 1 MP/秒

**戰鬥模式**：
- HP: 0 HP/秒
- MP: 0.1 MP/秒

**戰鬥結束**：
- HP: 維持當前
- MP: 夥伴立即全滿

### 經驗公式
**玩家**：
```javascript
expToNextLevel = 100 * Math.pow(1.5, level - 1)
```

**夥伴**：
```javascript
expToNextLevel = 100 * Math.pow(1.3, level - 1)
```

### 升級獎勵
**玩家**：
- maxHp: +30
- maxMp: +20
- attack: +8
- defense: +6
- speed: +3
- wisdom: +8
- gold: +100

**夥伴**：
- maxHp: +20
- maxMp: +15
- attack: +5
- defense: +5
- speed: +2
- wisdom: +5

### 傷害計算公式
```javascript
baseDamage = 100 + (skill.cost.mp * 3) + (player.level * 10)

totalDamage = Math.floor(
  baseDamage *
  affinityMultiplier *
  weakMultiplier *
  resistMultiplier
)
```

### 親和性倍數
- 相生（克制）：1.5x
- 相剋（被克）：0.67x
- 中性：1.0x

---

**文檔完成日期**: 2026-02-06
**總術語數量**: 60+
**覆蓋範圍**: 所有核心系統和概念
