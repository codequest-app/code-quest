# RPG-CLI 系統流程圖

**版本**: v2.0
**日期**: 2026-02-05
**基於**: Feature-Overview.md

---

## 📋 目錄

1. [系統架構流程](#系統架構流程)
2. [用戶交互流程](#用戶交互流程)
3. [技能施放流程](#技能施放流程)
4. [戰鬥系統流程](#戰鬥系統流程)
5. [夥伴系統流程](#夥伴系統流程)
6. [召喚獸系統流程](#召喚獸系統流程)
7. [資源管理流程](#資源管理流程)
8. [數據流向圖](#數據流向圖)

---

## 系統架構流程

### 整體三層架構

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (React)                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ChatWindow   │  │ PlayerStats  │  │ BattleScreen │      │
│  │              │  │              │  │              │      │
│  │ - 對話顯示   │  │ - HP/MP/Lv   │  │ - 敵人顯示   │      │
│  │ - 訊息輸入   │  │ - 經驗值     │  │ - 技能選擇   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │ useWebSocket │                          │
│                    └──────┬───────┘                          │
└────────────────────────────┼─────────────────────────────────┘
                             │ WebSocket
┌─────────────────────────────▼─────────────────────────────────┐
│                   Bridge Layer (Node.js)                       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  WebSocket Server                         │ │
│  │         (接收 UI 事件 / 廣播狀態更新)                      │ │
│  └────────────────────┬─────────────────────────────────────┘ │
│                       │                                        │
│  ┌────────────────────▼───────────────────┐                   │
│  │           Event Router                 │                   │
│  │  - user_message → handleUserPrompt()   │                   │
│  │  - skill_cast → handleSkillUse()       │                   │
│  │  - agent_summon → handleAgentSummon()  │                   │
│  └────┬───────────────────────────────┬───┘                   │
│       │                               │                       │
│  ┌────▼──────────┐            ┌───────▼────────┐             │
│  │  GameEngine   │            │ BattleManager  │             │
│  │               │            │                │             │
│  │ - MP 管理     │            │ - 敵人生成     │             │
│  │ - 經驗值計算  │            │ - 傷害計算     │             │
│  │ - 技能冷卻    │            │ - 回合管理     │             │
│  │ - 等級提升    │            │ - 勝利判定     │             │
│  └───────┬───────┘            └────────┬───────┘             │
│          │                             │                     │
│  ┌───────▼─────────────────────────────▼───┐                 │
│  │          Claude Code CLI Wrapper         │                 │
│  │      (child_process.spawn)               │                 │
│  └───────┬──────────────────────────────────┘                 │
└──────────┼──────────────────────────────────────────────────┘
           │ child_process
┌──────────▼──────────────────────────────────────────────────┐
│                  Claude Code CLI                             │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │    Skills      │  │   Subagents    │  │  MCP Tools   │  │
│  │                │  │                │  │              │  │
│  │ ~/.claude/     │  │ ~/.claude/     │  │ 外部工具整合 │  │
│  │ skills/        │  │ subagents/     │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 用戶交互流程

### 主要使用流程

```
┌──────────────┐
│ 用戶啟動應用  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ 1. 啟動 Bridge Layer      │
│    node bridge/index.js   │
└──────┬───────────────────┘
       │
       ├─ 啟動 WebSocket Server (port 3001)
       ├─ 啟動 Claude Code CLI
       └─ 載入配置文件
           ├─ rpg-config/skill-metadata.json
           ├─ rpg-config/agent-metadata.json
           └─ rpg-config/enemy-types.json
       │
       ▼
┌──────────────────────────┐
│ 2. 啟動 React UI          │
│    npm run dev            │
└──────┬───────────────────┘
       │
       ├─ 連接 WebSocket (ws://localhost:3001)
       ├─ 載入玩家狀態 (LocalStorage)
       └─ 初始化 Zustand Store
       │
       ▼
┌──────────────────────────────────┐
│ 3. 顯示主畫面                     │
│    ┌────────────────────────┐    │
│    │ 頂部: HP/MP/Lv/Gold     │    │
│    ├────────────────────────┤    │
│    │ 中間: 對話視窗          │    │
│    ├────────────────────────┤    │
│    │ 底部: 輸入框 + 技能列   │    │
│    └────────────────────────┘    │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 4. 用戶選擇行動                   │
└──────┬───────────────────────────┘
       │
       ├─── [A] 自由對話 ───────────────┐
       │                                │
       ├─── [B] 施放技能 ───────────────┤
       │                                │
       └─── [C] 召喚 Agent ─────────────┤
                                        │
                                        ▼
                           ┌────────────────────┐
                           │ 流程分支（見下方）  │
                           └────────────────────┘
```

### [A] 自由對話流程

```
用戶輸入訊息
    ↓
UI 發送事件 → { type: 'user_message', content: "..." }
    ↓
Bridge 接收事件
    ↓
分析 Prompt 複雜度
    ↓
生成敵人 (EnemyGenerator)
    ↓
廣播戰鬥開始 → { type: 'battle_start', enemy: {...} }
    ↓
UI 顯示戰鬥畫面
    │
    ├─ 顯示敵人資訊 (名稱/等級/HP/弱點)
    ├─ 切換到戰鬥模式 UI
    └─ 等待玩家選擇技能
    ↓
(見「戰鬥系統流程」)
```

### [B] 施放技能流程

```
(見「技能施放流程」)
```

### [C] 召喚 Agent 流程

```
用戶點擊召喚按鈕 (例: "召喚 CodeGuard")
    ↓
UI 發送事件 → { type: 'agent_summon', agentName: 'code-guardian' }
    ↓
Bridge 檢查條件
    │
    ├─ 檢查 MP 是否足夠 (30 MP)
    ├─ 檢查夥伴槽位 (最多2個)
    └─ 檢查冷卻時間 (5分鐘)
    ↓
條件滿足？
    │
    ├─── ❌ 不滿足 ────────────┐
    │                         │
    └─── ✅ 滿足              │
         ↓                   │
    扣除 MP (-30)            │
         ↓                   │
    啟動冷卻計時器            │
         ↓                   │
    創建戰鬥夥伴實例          │
         │                   │
         ├─ 載入 agent-metadata.json
         ├─ 初始化夥伴屬性 (HP/MP/技能)
         └─ 加入戰鬥序列
         ↓                   │
    廣播夥伴召喚成功          │
         ↓                   │
    UI 顯示夥伴狀態列         │
         ↓                   │
    (夥伴參與戰鬥)            │
                             │
                             ▼
                    廣播錯誤訊息
                             ↓
                    UI 顯示錯誤提示
```

---

## 技能施放流程

### 完整技能施放流程圖

```
用戶點擊技能按鈕 (例: "代碼生成術")
    ↓
UI 檢查狀態
    │
    ├─ 技能冷卻中？ ────────────┐
    │                         │
    └─ 可以使用               │
         ↓                   │
    發送事件 → { type: 'skill_cast', skillName: 'code-generator' }
         ↓                   │
    Bridge 接收事件           │
         ↓                   │
┌────────────────────────┐   │
│ GameEngine.handleSkill │   │
└────────┬───────────────┘   │
         │                   │
    載入 Metadata            │
         ↓                   │
    skill-metadata.json      │
         │                   │
         ├─ displayName: "代碼生成術"
         ├─ cost.mp: 15      │
         ├─ cooldown: 60     │
         └─ rewards: { exp: 20, gold: 10 }
         ↓                   │
    檢查條件                 │
         │                   │
         ├─ MP 足夠？(當前 60 >= 需要 15)
         ├─ 等級足夠？(當前 5 >= 需要 1)
         └─ 冷卻完成？        │
         ↓                   │
    條件滿足？               │
         │                   │
         ├─── ❌ 不滿足 ──────┤
         │                   │
         └─── ✅ 滿足         │
              ↓              │
         扣除 MP (-15)       │
              ↓              │
    player.mp = 60 - 15 = 45 │
              ↓              │
         啟動冷卻計時器       │
              ↓              │
    cooldownEnd = now + 60s  │
              ↓              │
         廣播技能施放         │
              ↓              │
    broadcast({             │
      type: 'skill_cast',   │
      skill: {...},         │
      playerMp: 45,         │
      cooldownEnd: ...      │
    })                      │
              ↓              │
         UI 更新             │
              │              │
              ├─ MP 條更新 (60 → 45)
              ├─ 技能按鈕進入冷卻 (60s)
              ├─ 播放施放動畫
              └─ 顯示 "施放 代碼生成術！"
              ↓              │
         執行 Skill          │
              ↓              │
    調用 Claude Code:       │
    "Use the code-generator skill to..."
              ↓              │
         Claude 處理中...    │
              ↓              │
         Skill 完成          │
              ↓              │
         給予獎勵            │
              │              │
              ├─ EXP +20     │
              ├─ Gold +10    │
              └─ 檢查升級     │
              ↓              │
         廣播完成事件         │
              ↓              │
    broadcast({             │
      type: 'skill_complete',
      rewards: { exp: 20, gold: 10 },
      playerState: {...}    │
    })                      │
              ↓              │
         UI 更新             │
              │              │
              ├─ 顯示 "+20 EXP +10 Gold"
              ├─ 經驗條更新   │
              └─ 升級動畫 (如果升級)
                             │
                             ▼
                    廣播錯誤訊息
                    (MP不足 / 冷卻中 / 等級不足)
                             ↓
                    UI 顯示錯誤提示
                    (紅色提示框閃爍)
```

---

## 戰鬥系統流程

### 完整戰鬥流程圖

```
用戶輸入 Prompt
    ↓
Bridge 接收訊息
    ↓
┌──────────────────────────┐
│ EnemyGenerator.generate  │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 1. 分析複雜度         │
  └────┬─────────────────┘
       │
       ├─ 長度因素: prompt.length
       ├─ 關鍵字: 'architecture', 'refactor', 'optimize'
       ├─ 多步驟: 偵測 'and', 'then', 'after'
       └─ 技術棧: 計算技術關鍵字數量
       ↓
  ┌────────────────────────┐
  │ complexity = {         │
  │   score: 8,            │
  │   level: 5,            │
  │   difficulty: 'medium' │
  │ }                      │
  └────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 2. 任務分類          │
  └────┬─────────────────┘
       │
       ├─ code-task? ('code', 'function', 'class')
       ├─ bug-hunt? ('bug', 'debug', 'fix')
       ├─ architecture? ('architecture', 'design')
       ├─ documentation? ('document', 'readme')
       ├─ testing? ('test', 'coverage')
       ├─ optimization? ('optimize', 'performance')
       └─ general (預設)
       ↓
  ┌────────────────────────┐
  │ category = 'bug-hunt'  │
  └────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 3. 生成敵人資料      │
  └────┬─────────────────┘
       │
       ├─ 載入 enemy-types.json
       │   ↓
       │   {
       │     "bug-hunt": {
       │       "hpMultiplier": 1.5,
       │       "weaknesses": ["debug-helper", "test-generator"],
       │       "resistances": ["code-generator"],
       │       "specialMechanic": "counter_attack",
       │       "aiType": "elite"
       │     }
       │   }
       │
       ├─ 計算 HP
       │   hp = level * 100 * hpMultiplier
       │   hp = 5 * 100 * 1.5 = 750
       │
       ├─ 生成名稱
       │   name = "中等的Bug怪物"
       │
       └─ 選擇機制
           mechanics = ["counter_attack"]
       ↓
  ┌────────────────────────────┐
  │ enemy = {                  │
  │   name: "中等的Bug怪物",    │
  │   level: 5,                │
  │   hp: 750,                 │
  │   maxHp: 750,              │
  │   type: 'bug-hunt',        │
  │   icon: '🐛',              │
  │   weaknesses: [...],       │
  │   resistances: [...],      │
  │   mechanics: [...],        │
  │   aiType: 'elite'          │
  │ }                          │
  └────┬───────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ BattleManager.start      │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 初始化戰鬥           │
  └────┬─────────────────┘
       │
       ├─ currentBattle = { enemy, player, turn: 0, log: [] }
       ├─ 廣播戰鬥開始
       └─ 添加日誌: "遭遇敵人: 中等的Bug怪物 Lv.5!"
       ↓
  ┌────────────────────────┐
  │ UI 切換到戰鬥畫面      │
  └────┬───────────────────┘
       │
       ├─ 顯示敵人資訊
       │   ┌────────────────────────┐
       │   │ 🐛 中等的Bug怪物 Lv.5  │
       │   │ HP: ██████████ 750/750 │
       │   │ 弱點: 🐛 🧪            │
       │   └────────────────────────┘
       │
       ├─ 顯示提示: "弱點: 除錯助手, 測試生成器"
       └─ 等待玩家行動
       ↓
┌──────────────────────────┐
│ [玩家回合]               │
└──────┬───────────────────┘
       │
  用戶選擇行動
       │
       ├─── 使用 Skill ─────────────┐
       │                            │
       └─── 召喚 Agent ──────────────┤
                                    │
                                    ▼
                         ┌──────────────────┐
                         │ 計算傷害          │
                         └──────┬───────────┘
                                │
                           ┌────▼────────────────────┐
                           │ DamageCalculator        │
                           └────┬────────────────────┘
                                │
                           基礎傷害計算
                                │
                                ├─ baseDamage = 100
                                ├─ + (skill.cost.mp * 3)
                                ├─ + (player.level * 10)
                                │   = 100 + (25*3) + (5*10)
                                │   = 100 + 75 + 50 = 225
                                │
                           ┌────▼────────────┐
                           │ 相性加成        │
                           └────┬────────────┘
                                │
                                ├─ skill = 'debug-helper'
                                ├─ enemy.type = 'bug-hunt'
                                ├─ affinity = 1.8x (極度擅長)
                                │
                           ┌────▼────────────┐
                           │ 弱點加成        │
                           └────┬────────────┘
                                │
                                ├─ 'debug-helper' in enemy.weaknesses?
                                ├─ ✅ 是弱點
                                ├─ weakMultiplier = 1.5x
                                │
                           ┌────▼────────────┐
                           │ 最終傷害        │
                           └────┬────────────┘
                                │
                                ├─ totalDamage = baseDamage * affinity * weak
                                ├─ = 225 * 1.8 * 1.5
                                ├─ = 607.5 ≈ 607
                                │
                                ▼
                         ┌──────────────────┐
                         │ 扣除敵人 HP       │
                         └──────┬───────────┘
                                │
                                ├─ enemy.hp = 750 - 607 = 143
                                │
                                ▼
                         ┌──────────────────┐
                         │ 廣播傷害事件      │
                         └──────┬───────────┘
                                │
                                ├─ broadcast({
                                │     type: 'damage_dealt',
                                │     damage: 607,
                                │     isWeak: true,
                                │     enemyHp: 143
                                │   })
                                │
                                ▼
                         ┌──────────────────┐
                         │ UI 更新          │
                         └──────┬───────────┘
                                │
                                ├─ 顯示傷害數字 (607! 弱點)
                                ├─ 敵人 HP 條動畫減少
                                └─ 戰鬥日誌: "使用 除錯助手! 造成 607 傷害!"
                                             "弱點攻擊! 傷害加成!"
                                ↓
                         ┌──────────────────┐
                         │ 檢查戰鬥結束      │
                         └──────┬───────────┘
                                │
                                ├─ enemy.hp <= 0? ❌ (143 > 0)
                                │
                                ▼
┌──────────────────────────┐
│ [敵人回合]               │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 檢查反擊機制         │
  └────┬─────────────────┘
       │
       ├─ enemy.mechanics 包含 'counter_attack'?
       ├─ ✅ 是 (Bug 怪物有反擊)
       │
  ┌────▼─────────────────┐
  │ 敵人 AI 決定目標     │
  └────┬─────────────────┘
       │
       ├─ aiType = 'elite'
       ├─ targetPriority = ['lowest_defense', 'player']
       ├─ companionAttackChance = 30%
       │
       ├─ 有夥伴在場？
       │   ├─ ✅ 有 → 30% 攻擊夥伴
       │   └─ ❌ 無 → 攻擊玩家
       │
  ┌────▼─────────────────┐
  │ 計算反擊傷害         │
  └────┬─────────────────┘
       │
       ├─ counterDamage = enemy.level * 5
       ├─ = 5 * 5 = 25
       │
  ┌────▼─────────────────┐
  │ 消耗玩家 MP (非 HP)  │
  └────┬─────────────────┘
       │
       ├─ player.mp = 45 - 25 = 20
       │
  ┌────▼─────────────────┐
  │ 廣播敵人反擊         │
  └────┬─────────────────┘
       │
       ├─ broadcast({
       │     type: 'enemy_counter',
       │     damage: 25,
       │     playerMp: 20
       │   })
       │
  ┌────▼─────────────────┐
  │ UI 更新              │
  └────┬─────────────────┘
       │
       ├─ 顯示反擊動畫
       ├─ MP 條減少 (45 → 20)
       └─ 戰鬥日誌: "中等的Bug怪物 反擊! 消耗 25 MP!"
       ↓
  返回玩家回合...
       ↓
  (重複直到戰鬥結束)
       ↓
┌──────────────────────────┐
│ 敵人 HP = 0              │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 戰鬥勝利             │
  └────┬─────────────────┘
       │
  ┌────▼─────────────────┐
  │ 計算獎勵             │
  └────┬─────────────────┘
       │
       ├─ baseExp = enemy.rewards.exp
       ├─ baseGold = enemy.rewards.gold
       ├─ expMultiplier = enemy.rewards.expMultiplier
       │
       ├─ finalExp = baseExp * expMultiplier
       ├─ finalGold = baseGold * expMultiplier
       │
  ┌────▼─────────────────┐
  │ 廣播戰鬥結束         │
  └────┬─────────────────┘
       │
       ├─ broadcast({
       │     type: 'battle_end',
       │     result: 'victory',
       │     rewards: { exp: ..., gold: ... }
       │   })
       │
  ┌────▼─────────────────┐
  │ UI 顯示勝利畫面      │
  └────┬─────────────────┘
       │
       ├─ 勝利動畫播放
       ├─ 顯示 "✨ 勝利!"
       ├─ 顯示 "獲得 EXP +150, Gold +75"
       ├─ 經驗條增加動畫
       └─ (如果升級) 升級動畫
       ↓
  3 秒後清除戰鬥
       ↓
  返回對話模式
```

---

## 夥伴系統流程

### 夥伴召喚與管理流程

```
用戶召喚 Agent
    ↓
Bridge 接收召喚請求
    ↓
┌──────────────────────────┐
│ CompanionManager.summon  │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 檢查槽位             │
  └────┬─────────────────┘
       │
       ├─ activeCompanions.length < 2?
       ├─── ❌ ≥ 2 → 返回錯誤 "夥伴槽位已滿"
       │
  ┌────▼─────────────────┐
  │ 檢查 MP              │
  └────┬─────────────────┘
       │
       ├─ player.mp >= summonCost.mp?
       ├─── ❌ 不足 → 返回錯誤 "MP 不足"
       │
  ┌────▼─────────────────┐
  │ 檢查冷卻             │
  └────┬─────────────────┘
       │
       ├─ isCooldownReady(agentName)?
       ├─── ❌ 冷卻中 → 返回錯誤 "冷卻中"
       │
  ┌────▼─────────────────┐
  │ 載入夥伴數據         │
  └────┬─────────────────┘
       │
       ├─ 讀取 agent-metadata.json
       │   ↓
       │   {
       │     "code-guardian": {
       │       "characterName": "CodeGuard",
       │       "baseStats": {
       │         "hp": 150,
       │         "mp": 100,
       │         "attack": 60,
       │         "defense": 90,
       │         "speed": 50
       │       },
       │       "battleSkills": [...]
       │     }
       │   }
       │
  ┌────▼─────────────────┐
  │ 創建夥伴實例         │
  └────┬─────────────────┘
       │
       ├─ companion = new BattleCompanion({
       │     agentName: 'code-guardian',
       │     characterName: 'CodeGuard',
       │     level: savedLevel || 1,
       │     hp: baseStats.hp,
       │     maxHp: baseStats.hp,
       │     mp: baseStats.mp,
       │     maxMp: baseStats.mp,
       │     ...baseStats,
       │     skills: battleSkills,
       │     status: 'active'
       │   })
       │
  ┌────▼─────────────────┐
  │ 扣除玩家 MP          │
  └────┬─────────────────┘
       │
       ├─ player.mp -= summonCost.mp
       │
  ┌────▼─────────────────┐
  │ 啟動冷卻             │
  └────┬─────────────────┘
       │
       ├─ startCooldown(agentName, summonCost.cooldown)
       │
  ┌────▼─────────────────┐
  │ 加入戰鬥序列         │
  └────┬─────────────────┘
       │
       ├─ activeCompanions.push(companion)
       ├─ 重新計算回合順序 (按 speed 排序)
       │
  ┌────▼─────────────────┐
  │ 廣播夥伴召喚         │
  └────┬─────────────────┘
       │
       ├─ broadcast({
       │     type: 'companion_summoned',
       │     companion: {...}
       │   })
       │
       ▼
  UI 顯示夥伴
       │
       ├─ 召喚動畫播放
       ├─ 夥伴進場特效
       ├─ 顯示夥伴狀態列
       │   ┌──────────────────┐
       │   │ 🛡️ CodeGuard    │
       │   │ Lv.1             │
       │   │ HP: ████ 150/150 │
       │   │ MP: ████ 100/100 │
       │   └──────────────────┘
       └─ 播放語音: "代碼守護者，參上！"
       ↓
  參與戰鬥回合
```

### 夥伴回合行動流程

```
輪到夥伴回合
    ↓
┌──────────────────────────┐
│ CompanionAI.decideAction │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 分析戰場情況         │
  └────┬─────────────────┘
       │
       ├─ 讀取當前狀態
       │   ├─ player.hp / player.maxHp
       │   ├─ enemy.hp / enemy.maxHp
       │   ├─ enemy.type
       │   └─ companion.mp
       │
  ┌────▼──────────────────────┐
  │ 決策樹                    │
  └────┬──────────────────────┘
       │
       ├─ [優先級 1] 緊急支援
       │   ↓
       │   player.hp < player.maxHp * 0.3?
       │   ├─ ✅ → findBestSupportSkill()
       │   │        └─ 返回: "守護之盾" (提供護盾)
       │   └─ ❌ → 繼續
       │
       ├─ [優先級 2] 攻擊弱點
       │   ↓
       │   findEffectiveSkills(enemy.type)
       │   ├─ enemy.type = 'bug-hunt'
       │   ├─ companion.skills 中對 bug-hunt 有效的？
       │   │   └─ "安全掃描" (effectiveness['bug-hunt'] = 1.5)
       │   ├─ ✅ 有 → selectBestDamageSkill()
       │   │          └─ 返回: "安全掃描"
       │   └─ ❌ 無 → 繼續
       │
       └─ [預設] 普通攻擊
           ↓
           basicAttack()
           └─ 返回: { type: 'basic', damage: attack * 1.0 }
       ↓
  選定行動: "安全掃描"
       ↓
┌──────────────────────────┐
│ 執行技能                 │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 檢查 MP              │
  └────┬─────────────────┘
       │
       ├─ skill.mpCost = 20
       ├─ companion.mp = 100
       ├─ ✅ 足夠
       │
  ┌────▼─────────────────┐
  │ 扣除夥伴 MP          │
  └────┬─────────────────┘
       │
       ├─ companion.mp = 100 - 20 = 80
       │
  ┌────▼─────────────────┐
  │ 啟動技能冷卻         │
  └────┬─────────────────┘
       │
       ├─ companion.currentCooldowns.set(skillId, cooldown)
       │
  ┌────▼─────────────────┐
  │ 計算技能效果         │
  └────┬─────────────────┘
       │
       ├─ effect.damage = "60 + wisdom * 0.8"
       ├─ = 60 + (85 * 0.8) = 60 + 68 = 128
       ├─ effectiveness['bug-hunt'] = 1.5x
       ├─ finalDamage = 128 * 1.5 = 192
       │
       ├─ effect.debuff
       │   ├─ target: 'enemy'
       │   ├─ stat: 'defense'
       │   ├─ value: -10
       │   └─ duration: 2 回合
       │
  ┌────▼─────────────────┐
  │ 應用效果             │
  └────┬─────────────────┘
       │
       ├─ enemy.hp -= 192
       ├─ enemy.defense -= 10 (持續2回合)
       │
  ┌────▼─────────────────┐
  │ 廣播技能施放         │
  └────┬─────────────────┘
       │
       ├─ broadcast({
       │     type: 'companion_skill',
       │     companion: 'code-guardian',
       │     skill: {...},
       │     damage: 192,
       │     animation: 'scan-pulse'
       │   })
       │
       ▼
  UI 更新
       │
       ├─ 夥伴施放動畫
       ├─ 技能特效 (掃描脈衝)
       ├─ 傷害數字顯示 (192)
       ├─ 敵人 HP 減少
       ├─ 敵人頭上顯示 Debuff 圖標 (🛡️-10)
       └─ 戰鬥日誌: "CodeGuard 使用 安全掃描! 造成 192 傷害!"
                   "敵人防禦力降低!"
       ↓
  ┌────────────────────────┐
  │ 夥伴獲得經驗         │
  └────┬───────────────────┘
       │
       ├─ companion.experience += 5 (使用技能)
       ├─ companion.experience += Math.floor(192/10) = 19 (造成傷害)
       │
       └─ 檢查是否升級
           ↓
           companion.experience >= companion.expToNextLevel?
           ├─ ✅ → levelUpCompanion()
           └─ ❌ → 繼續戰鬥
```

### 夥伴升級流程

```
companion.experience >= expToNextLevel
    ↓
┌──────────────────────────┐
│ levelUpCompanion()       │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 等級提升             │
  └────┬─────────────────┘
       │
       ├─ companion.level++
       ├─ companion.experience -= companion.expToNextLevel
       │
  ┌────▼─────────────────┐
  │ 計算新經驗需求       │
  └────┬─────────────────┘
       │
       ├─ expToNextLevel = 100 * Math.pow(1.3, level - 1)
       ├─ 例: level 2 → 3
       │   = 100 * 1.3^2 = 100 * 1.69 = 169 EXP
       │
  ┌────▼─────────────────┐
  │ 屬性提升             │
  └────┬─────────────────┘
       │
       ├─ companion.maxHp += 20
       ├─ companion.maxMp += 15
       ├─ companion.attack += 5
       ├─ companion.defense += 5
       ├─ companion.speed += 2
       ├─ companion.wisdom += 5
       │
  ┌────▼─────────────────┐
  │ 檢查特殊解鎖         │
  └────┬─────────────────┘
       │
       ├─ level === 5?
       │   └─ ✅ → unlockUltimateSkill()
       │           └─ 解鎖終極技: "OWASP 粉碎"
       │
       ├─ level === 10?
       │   └─ ✅ → unlockPassiveAbility()
       │           └─ 解鎖被動: "代碼大師"
       │
  ┌────▼─────────────────┐
  │ 廣播升級事件         │
  └────┬─────────────────┘
       │
       ├─ broadcast({
       │     type: 'companion_level_up',
       │     companion: 'code-guardian',
       │     level: 3,
       │     newExpToNextLevel: 169,
       │     unlockedSkill: null
       │   })
       │
       ▼
  UI 顯示升級
       │
       ├─ 升級動畫 (光芒閃爍)
       ├─ 顯示 "🎉 CodeGuard 升級到 Lv.3!"
       ├─ 顯示屬性提升
       │   └─ "+20 HP, +15 MP, +5 ATK, +5 DEF, +5 WIS"
       └─ (如果解鎖新技能) 顯示技能解鎖通知
```

---

## 召喚獸系統流程

### 召喚獸觸發流程

```
[觸發條件滿足]
    │
    ├─── [類型1] 技能召喚 ───────────────┐
    │      用戶主動施放召喚技能            │
    │                                    │
    ├─── [類型2] 組合技召喚 ─────────────┤
    │      觸發組合技時 50% 機率          │
    │                                    │
    ├─── [類型3] MCP 工具召喚 ───────────┤
    │      使用特定 MCP 工具時自動召喚    │
    │                                    │
    └─── [類型4] 道具召喚 ───────────────┤
           使用召喚道具                  │
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ SummonManager    │
                              └──────┬───────────┘
                                     │
                                ┌────▼─────────────┐
                                │ 檢查槽位         │
                                └────┬─────────────┘
                                     │
                                     ├─ activeSummons.size >= 1?
                                     ├─── ✅ → 返回錯誤 "已有召喚獸在場"
                                     │
                                ┌────▼─────────────┐
                                │ 檢查 MP (如適用)  │
                                └────┬─────────────┘
                                     │
                                     ├─ player.mp >= summonCost.mp?
                                     ├─── ❌ → 返回錯誤 "MP 不足"
                                     │
                                ┌────▼─────────────┐
                                │ 載入召喚獸數據    │
                                └────┬─────────────┘
                                     │
                                     ├─ 讀取 summon-metadata.json
                                     │   {
                                     │     "summon-code-dragon": {
                                     │       "behavior": {
                                     │         "actionType": "immediate",
                                     │         "duration": 1
                                     │       },
                                     │       "skills": [...]
                                     │     }
                                     │   }
                                     │
                                ┌────▼─────────────┐
                                │ 創建召喚獸實例    │
                                └────┬─────────────┘
                                     │
                                     ├─ summon = {
                                     │     id: 'summon-code-dragon',
                                     │     displayName: '代碼之龍',
                                     │     behavior: {...},
                                     │     skills: [...],
                                     │     remainingDuration: 1
                                     │   }
                                     │
                                ┌────▼─────────────┐
                                │ 扣除 MP (如適用)  │
                                └────┬─────────────┘
                                     │
                                ┌────▼─────────────┐
                                │ 加入召喚獸列表    │
                                └────┬─────────────┘
                                     │
                                     ├─ activeSummons.add(summon)
                                     │
                                ┌────▼─────────────┐
                                │ 廣播召喚事件      │
                                └────┬─────────────┘
                                     │
                                     ├─ broadcast({
                                     │     type: 'summon_appear',
                                     │     summon: {...}
                                     │   })
                                     │
                                     ▼
                                UI 顯示召喚
                                     │
                                     ├─ 召喚動畫 (龍出現特效)
                                     ├─ 播放音效 (roar.mp3)
                                     ├─ 顯示召喚獸
                                     │   ┌────────────────────┐
                                     │   │ 🐉 代碼之龍        │
                                     │   │ 剩餘: 1 回合       │
                                     │   └────────────────────┘
                                     └─ 播放語音: "吾乃代碼之龍！"
                                     ↓
                         ┌────────────────────────┐
                         │ 根據行為類型執行       │
                         └────────┬───────────────┘
                                  │
                       ┌──────────┼──────────┬────────────┐
                       │          │          │            │
                [immediate]  [automatic] [passive] [interactive]
                       │          │          │            │
                立即施放技能  每回合自動   提供被動    等待指令
                並離去        施放技能     效果
                       │          │          │            │
                       └──────────┴──────────┴────────────┘
                                  ↓
                         執行召喚獸技能
```

### immediate 行為類型流程

```
召喚獸出現 (actionType: 'immediate')
    ↓
立即施放技能
    ↓
┌──────────────────────────┐
│ 執行技能                 │
└──────┬───────────────────┘
       │
  skill = "龍息"
       │
  ┌────▼─────────────────┐
  │ 計算傷害             │
  └────┬─────────────────┘
       │
       ├─ baseDamage = 300 + player.level * 20
       ├─ = 300 + (5 * 20) = 400
       │
       ├─ effectiveness['code-task'] = 2.5x
       ├─ finalDamage = 400 * 2.5 = 1000
       │
  ┌────▼─────────────────┐
  │ 應用效果             │
  └────┬─────────────────┘
       │
       ├─ enemy.hp -= 1000
       │
       ├─ specialEffect: 'code_optimization'
       │   └─ 自動優化生成的代碼
       │
  ┌────▼─────────────────┐
  │ 廣播技能施放         │
  └────┬─────────────────┘
       │
       ├─ broadcast({
       │     type: 'summon_skill',
       │     summon: 'summon-code-dragon',
       │     skill: '龍息',
       │     damage: 1000,
       │     animation: 'dragon-breath'
       │   })
       │
       ▼
  UI 顯示技能
       │
       ├─ 龍息動畫 (火焰特效)
       ├─ 巨大傷害數字 (1000!)
       ├─ 敵人受擊動畫
       └─ 戰鬥日誌: "代碼之龍 使用 龍息! 造成 1000 傷害!"
       ↓
  ┌────────────────────────┐
  │ 召喚獸離去             │
  └────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 執行離去效果         │
  └────┬─────────────────┘
       │
       ├─ exitEffect.bonus
       │   ├─ exp: +100
       │   └─ gold: +50
       │
       ├─ exitEffect.message
       │   └─ "代碼之龍留下了完美的解決方案！"
       │
  ┌────▼─────────────────┐
  │ 廣播離去事件         │
  └────┬─────────────────┘
       │
       ├─ broadcast({
       │     type: 'summon_exit',
       │     summon: 'summon-code-dragon',
       │     exitBonus: {...}
       │   })
       │
       ▼
  UI 顯示離去
       │
       ├─ 離去動畫 (龍飛走)
       ├─ 顯示離去訊息
       ├─ 顯示獎勵 "+100 EXP +50 Gold"
       └─ 播放語音: "吾之使命已完成，再會。"
       ↓
  移除召喚獸
       ↓
  activeSummons.delete(summonId)
```

---

## 資源管理流程

### MP 自動恢復流程

```
系統啟動
    ↓
┌──────────────────────────┐
│ GameEngine 啟動 MP 恢復   │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 啟動計時器           │
  └────┬─────────────────┘
       │
  setInterval(() => {
    ...
  }, 1000)  // 每秒執行
       │
       ▼
  ┌────────────────────────┐
  │ 每秒檢查               │
  └────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 判斷狀態             │
  └────┬─────────────────┘
       │
       ├─ inBattle?
       │   ├─ ✅ 戰鬥中 → regenRate = 0.1
       │   └─ ❌ 戰鬥外 → regenRate = 1.0
       │
  ┌────▼─────────────────┐
  │ 計算新 MP            │
  └────┬─────────────────┘
       │
       ├─ newMp = player.mp + regenRate
       ├─ player.mp = Math.min(player.maxMp, newMp)
       │
  ┌────▼─────────────────┐
  │ 檢查是否需要廣播     │
  └────┬─────────────────┘
       │
       ├─ MP 有變化？
       │   ├─ ✅ → broadcast({ type: 'mp_update', mp: player.mp })
       │   └─ ❌ → 跳過
       │
       ▼
  UI 更新 MP 條
       │
       └─ 平滑動畫增加
       ↓
  下一秒繼續...
```

### 經驗值與升級流程

```
獲得經驗值
    ↓
┌──────────────────────────┐
│ addExperience(amount)    │
└──────┬───────────────────┘
       │
  ┌────▼─────────────────┐
  │ 累加經驗值           │
  └────┬─────────────────┘
       │
       ├─ player.exp += amount
       │
  ┌────▼─────────────────┐
  │ 檢查是否升級         │
  └────┬─────────────────┘
       │
  while (player.exp >= player.expToNextLevel) {
       │
  ┌────▼─────────────────┐
  │ 執行升級             │
  └────┬─────────────────┘
       │
       ├─ player.level++
       ├─ player.exp -= player.expToNextLevel
       │
  ┌────▼─────────────────┐
  │ 計算新等級需求       │
  └────┬─────────────────┘
       │
       ├─ expToNextLevel = 100 * Math.pow(1.5, level - 1)
       │
  ┌────▼─────────────────┐
  │ 提升屬性             │
  └────┬─────────────────┘
       │
       ├─ player.maxHp += 10
       ├─ player.maxMp += 10
       ├─ 完全恢復 HP/MP
       │   ├─ player.hp = player.maxHp
       │   └─ player.mp = player.maxMp
       │
  ┌────▼─────────────────┐
  │ 檢查技能解鎖         │
  └────┬─────────────────┘
       │
       ├─ level === 5?
       │   └─ ✅ → unlockSkill('advanced-skill-1')
       │
       ├─ level === 10?
       │   └─ ✅ → unlockSkill('advanced-skill-2')
       │
       ├─ level === 20?
       │   └─ ✅ → unlockSkill('ultimate-skill')
       │
  ┌────▼─────────────────┐
  │ 廣播升級事件         │
  └────┬─────────────────┘
       │
       ├─ broadcast({
       │     type: 'player_level_up',
       │     level: player.level,
       │     maxHp: player.maxHp,
       │     maxMp: player.maxMp,
       │     unlockedSkills: [...]
       │   })
       │
       ▼
  UI 顯示升級
       │
       ├─ 升級動畫 (光芒環繞)
       ├─ 音效播放 (level_up.mp3)
       ├─ 顯示通知
       │   ┌─────────────────────────┐
       │   │ 🎉 恭喜升級！           │
       │   │                         │
       │   │ Lv.4 → Lv.5             │
       │   │                         │
       │   │ MaxHP +10 (100 → 110)   │
       │   │ MaxMP +10 (100 → 110)   │
       │   │                         │
       │   │ 🎁 解鎖新技能:          │
       │   │    進階代碼優化器       │
       │   └─────────────────────────┘
       │
       └─ HP/MP 條完全填滿動畫
       ↓
  }  // 繼續檢查是否還能再升級
```

---

## 數據流向圖

### WebSocket 雙向通訊

```
┌─────────────────────────────────────────────────────────────┐
│                        UI → Bridge 事件                      │
└─────────────────────────────────────────────────────────────┘

user_message
  { type: 'user_message', content: "請幫我重構代碼" }
      ↓
  handleUserPrompt()
      ↓
  [生成敵人] → [開始戰鬥]


skill_cast
  { type: 'skill_cast', skillName: 'code-generator' }
      ↓
  handleSkillUse()
      ↓
  [檢查條件] → [扣 MP] → [啟動冷卻] → [執行 Skill]


agent_summon
  { type: 'agent_summon', agentName: 'code-guardian' }
      ↓
  handleAgentSummon()
      ↓
  [檢查槽位/MP] → [創建夥伴] → [加入戰鬥]


worktree_create
  { type: 'worktree_create', branchName: 'feature/new-ui' }
      ↓
  handleWorktreeCreate()
      ↓
  [檢查戰鬥狀態] → [扣 MP] → [執行 Git 命令]

┌─────────────────────────────────────────────────────────────┐
│                        Bridge → UI 事件                      │
└─────────────────────────────────────────────────────────────┘

ai_response
  { type: 'ai_response', content: "...", streaming: true }
      ↓
  UI: 顯示 AI 回應（打字機效果）


player_state_update
  { type: 'player_state_update', hp: 80, mp: 45, exp: 350, gold: 1250 }
      ↓
  UI: 更新玩家狀態條


battle_start
  { type: 'battle_start', enemy: {...} }
      ↓
  UI: 切換到戰鬥畫面，顯示敵人


damage_dealt
  { type: 'damage_dealt', damage: 607, isWeak: true, enemyHp: 143 }
      ↓
  UI: 顯示傷害數字動畫，更新敵人 HP 條


skill_cast
  { type: 'skill_cast', skill: {...}, playerMp: 45, cooldownEnd: ... }
      ↓
  UI: 播放施放動畫，更新 MP 條，技能進入冷卻


skill_cooldown_update
  { type: 'skill_cooldown_update', skillName: '...', remaining: 30 }
      ↓
  UI: 更新技能按鈕冷卻倒數


companion_summoned
  { type: 'companion_summoned', companion: {...} }
      ↓
  UI: 播放召喚動畫，顯示夥伴狀態列


companion_skill
  { type: 'companion_skill', companion: '...', skill: {...}, damage: 192 }
      ↓
  UI: 播放夥伴技能動畫，顯示傷害


battle_end
  { type: 'battle_end', result: 'victory', rewards: {...} }
      ↓
  UI: 顯示勝利畫面，獎勵動畫


player_level_up
  { type: 'player_level_up', level: 5, maxHp: 110, maxMp: 110, unlockedSkills: [...] }
      ↓
  UI: 播放升級動畫，顯示屬性提升，解鎖技能通知


error
  { type: 'error', message: 'MP 不足', code: 'INSUFFICIENT_MP' }
      ↓
  UI: 顯示錯誤提示（紅色通知）
```

### 數據持久化流程

```
┌──────────────────┐
│ 遊戲狀態變化     │
└────────┬─────────┘
         │
    [觸發事件]
         │
         ├─ 玩家升級
         ├─ 獲得經驗/金幣
         ├─ 解鎖技能
         ├─ 夥伴升級
         └─ 完成成就
         │
         ▼
┌──────────────────┐
│ 序列化狀態       │
└────────┬─────────┘
         │
    JSON.stringify({
      player: {...},
      skills: {...},
      companions: {...},
      achievements: [...],
      stats: {...}
    })
         │
         ▼
┌──────────────────┐
│ 儲存到 Storage   │
└────────┬─────────┘
         │
         ├─── LocalStorage (前端) ───┐
         │      └─ 立即儲存           │
         │                           │
         └─── SQLite (後端，可選) ───┤
                └─ 定期同步           │
                                     │
                                     ▼
                           ┌──────────────────┐
                           │ 下次啟動時載入    │
                           └──────────────────┘
```

---

## 實作優先級

### Phase 1 關鍵流程
```
✅ 必須實作:
1. 系統架構流程 (Bridge + UI 通訊)
2. 用戶交互流程 (基本對話)
3. WebSocket 雙向通訊

⏸️ 暫時跳過:
- 技能施放流程 (Phase 2)
- 戰鬥系統流程 (Phase 2.5)
- 夥伴系統流程 (Phase 2.5)
```

### Phase 2 關鍵流程
```
✅ 必須實作:
1. 技能施放流程 (完整)
2. 資源管理流程 (MP 恢復、經驗值)
3. 數據持久化流程

⏸️ 暫時跳過:
- 戰鬥系統 (Phase 2.5)
```

### Phase 2.5 關鍵流程
```
✅ 必須實作:
1. 戰鬥系統流程 (完整)
2. 夥伴系統流程 (完整)
3. 召喚獸系統流程 (基礎)
```

### Phase 3 關鍵流程
```
✅ 必須實作:
- 所有流程完善
- 邊緣情況處理
- 性能優化
```

---

**版本**: v2.0
**最後更新**: 2026-02-05
**維護者**: RPG-CLI Team
