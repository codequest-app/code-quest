# 設計文檔衝突解決方案

**創建日期**: 2026-02-05
**狀態**: 待實施
**優先級**: HIGH

本文檔記錄所有設計文檔中發現的衝突，以及對應的解決方案。

---

## HIGH 優先級衝突

### 1. Phase 時間規劃重疊 ⚠️

**問題**:
- Phase 2 結束於 Week 4
- Phase 2.5 開始於 Week 4
- 造成 Week 4 時間重疊

**解決方案**:
```
修正前:
Phase 1: Week 1-2 (核心基礎)
Phase 2: Week 3-4 (遊戲化)
Phase 2.5: Week 4-5 (戰鬥系統) ← 與 Phase 2 重疊
Phase 3: Week 5-8 (進階功能)

修正後:
Phase 1: Week 1-2 (核心基礎)
  - Bridge Layer 基礎
  - React UI 基礎
  - 3-5 個標準 Skills

Phase 2: Week 3-4 (遊戲化核心)
  - Metadata 系統
  - MP/HP/經驗值
  - Skill 冷卻與獎勵
  - Agent 召喚基礎

Phase 2.5: Week 5-6 (戰鬥系統擴展)
  - 敵人生成系統
  - 戰鬥管理器
  - 夥伴系統
  - 召喚獸基礎

Phase 3: Week 7-10 (進階功能)
  - 組合技完善
  - 成就系統
  - Worktree 整合
  - 召喚獸完善
  - 持久化
```

**影響文檔**:
- RPG-CLI-Architecture-v2.md
- Feature-Planning-v2.md
- Battle-System-Design.md
- Agent-Battle-Companion-Design.md
- Summon-Beast-System-Design.md

**狀態**: ✅ 已在此文檔定義，待更新各文檔

---

### 2. Skills Frontmatter 規範 ⚠️

**問題**:
- 必須嚴格遵守官方格式
- RPG 相關的 metadata 不能放在 SKILL.md 的 frontmatter 中

**解決方案**:

**✅ 正確做法**:

`~/.claude/skills/code-generator/SKILL.md`:
```yaml
---
name: code-generator
description: 根據需求快速生成高品質程式碼
allowed-tools: Bash, Read, Write
---

# 代碼生成器
...
```

`rpg-config/skill-metadata.json`:
```json
{
  "code-generator": {
    "displayName": "代碼生成術",
    "icon": "⚔️",
    "mpCost": 15,
    "cooldown": 60,
    "rewards": { "exp": 20, "gold": 10 }
  }
}
```

**❌ 錯誤做法**:
```yaml
---
name: code-generator
mpCost: 15          # ❌ 不存在的欄位
cooldown: 60        # ❌ 不存在的欄位
icon: "⚔️"         # ❌ 不存在的欄位
---
```

**影響文檔**:
- Feature-Planning-v2.md (需確認所有範例正確)

**狀態**: ✅ 已在 Feature-Planning-v2.md 中正確實作，無需修改

---

## MEDIUM 優先級衝突

### 3. MP 系統統一規範 ⚠️

**問題**:
- MP 恢復速率不一致
- 夥伴 MP 管理不明確

**解決方案**:

#### 玩家 MP 系統
```javascript
// 戰鬥外 MP 恢復
mpRegenRate: {
  outOfBattle: 1,      // 每秒 +1 MP
  inBattle: 0.1        // 戰鬥中每秒 +0.1 MP (每10秒 +1)
}

// MP 上限
maxMp: 100 + (level * 10)

// MP 消耗
- Skill 使用: 依 skill-metadata.json
- Agent 召喚: 依 agent-metadata.json
- 召喚獸: 依 summon-metadata.json
- 敵人反擊: 5 * enemy.level
```

#### 夥伴 MP 系統
```javascript
// 夥伴 MP 管理
companionMp: {
  regen: 0,                    // 戰鬥中不自動恢復
  resetOnBattleEnd: true,      // 戰鬥結束完全恢復
  consumption: {
    skill: "依技能定義"
  }
}
```

**影響文檔**:
- Feature-Planning-v2.md (line 392)
- Battle-System-Design.md
- Agent-Battle-Companion-Design.md

**狀態**: ✅ 已定義，待更新各文檔

---

### 4. 等級系統統一規範 ⚠️

**問題**:
- 升級公式不明確
- 夥伴經驗值來源不清楚

**解決方案**:

#### 玩家升級系統
```javascript
// 初始值
player: {
  level: 1,
  exp: 0,
  expToNextLevel: 100
}

// 升級公式
onLevelUp() {
  this.level++;
  this.exp -= this.expToNextLevel;
  this.expToNextLevel = Math.floor(100 * Math.pow(1.5, this.level - 1));

  // 屬性提升
  this.maxHp += 10;
  this.maxMp += 10;
}

// 各等級所需經驗值
Level 1→2: 100 EXP
Level 2→3: 150 EXP
Level 3→4: 225 EXP
Level 4→5: 338 EXP
Level 5→6: 507 EXP
...
```

#### 夥伴升級系統
```javascript
// 夥伴經驗值來源（獨立計算）
companionExpGains: {
  battleVictory: 50,           // 戰鬥勝利
  skillUsed: 5,                // 使用技能
  damageDealt: (dmg) => Math.floor(dmg / 10),  // 造成傷害
  weaknessHit: 20              // 命中弱點
}

// 夥伴升級公式（比玩家快）
companion.expToNextLevel = 100 * Math.pow(1.3, companion.level - 1);
```

**影響文檔**:
- Feature-Planning-v2.md (line 460-463)
- Agent-Battle-Companion-Design.md (line 593-609)

**狀態**: ✅ 已定義，待更新各文檔

---

### 5. 戰鬥系統互動規範 ⚠️

**問題**:
- 敵人攻擊目標不明確
- 敵人缺少速度屬性

**解決方案**:

#### 敵人攻擊目標選擇
```javascript
enemyAI: {
  // 簡單敵人（Lv 1-5）
  simple: {
    targetPriority: ['player'],  // 只攻擊玩家
    ignoreCompanions: true
  },

  // 精英敵人（Lv 6-10）
  elite: {
    targetPriority: ['lowest_defense', 'player'],
    companionAttackChance: 0.3   // 30% 機率攻擊夥伴
  },

  // Boss（Lv 11+）
  boss: {
    targetPriority: ['lowest_hp', 'highest_threat', 'player'],
    companionAttackChance: 0.5,  // 50% 機率攻擊夥伴
    aoeAttacks: true             // 可能範圍攻擊
  }
}
```

#### 敵人屬性補充
```json
// rpg-config/enemy-types.json 補充
{
  "code-task": {
    "baseSpeed": 40,
    "speedVariance": 10
  },
  "bug-hunt": {
    "baseSpeed": 35,
    "speedVariance": 5
  }
}
```

#### 回合順序計算
```javascript
// 所有單位（玩家、夥伴、敵人）統一排序
turnOrder = [
  { type: 'companion', id: 'speedy', speed: 95 },
  { type: 'player', speed: 100 },                    // 玩家固定 100
  { type: 'companion', id: 'codeguard', speed: 50 },
  { type: 'enemy', speed: 40 }
].sort((a, b) => b.speed - a.speed);
```

**影響文檔**:
- Battle-System-Design.md
- Agent-Battle-Companion-Design.md

**狀態**: ✅ 已定義，待更新各文檔

---

### 6. 召喚獸與夥伴槽位規範 ⚠️

**問題**:
- 召喚獸是否占槽位不明確
- 可能導致場上單位過多

**解決方案**:

#### 統一槽位規則
```javascript
battleSlots: {
  companions: {
    max: 2,                     // 最多 2 個夥伴
    type: 'permanent',          // 整場戰鬥
    source: 'Subagent'
  },

  summons: {
    max: 1,                     // 最多 1 個召喚獸
    type: 'temporary',          // 限時存在
    source: 'Skill/Item/MCP',
    independent: true           // 與夥伴槽位獨立
  }
}

// 最大同時在場單位
maxUnits = player + companions(2) + summon(1) = 4
```

#### 召喚限制檢查
```javascript
canSummonBeast() {
  // 已有召喚獸在場
  if (this.activeSummons.size >= 1) {
    return { error: '已有召喚獸在場' };
  }

  // MP 不足
  if (player.mp < summonCost) {
    return { error: 'MP 不足' };
  }

  return { success: true };
}
```

**影響文檔**:
- Agent-Battle-Companion-Design.md (line 880-883)
- Summon-Beast-System-Design.md (line 18)

**狀態**: ✅ 已定義，待更新各文檔

---

### 7. Metadata 格式統一規範 ⚠️

**問題**:
- 命名規範不一致
- 獎勵結構不一致

**解決方案**:

#### 統一命名規範
```json
{
  "id": "code-generator",           // 內部 ID（kebab-case）
  "name": "Code Generator",          // 英文名稱
  "displayName": "代碼生成術",       // 中文顯示名稱
  "displayNameEn": "Code Generator"  // 英文顯示名稱（可選）
}
```

#### 統一獎勵結構
```json
{
  "rewards": {
    "exp": 100,              // 固定經驗值
    "gold": 50,              // 固定金幣
    "expMultiplier": 1.0,    // 經驗值倍率（可選，預設 1.0）
    "goldMultiplier": 1.0    // 金幣倍率（可選，預設 1.0）
  }
}

// 計算最終獎勵
finalExp = rewards.exp * (rewards.expMultiplier || 1.0);
finalGold = rewards.gold * (rewards.goldMultiplier || 1.0);
```

#### 標準 Metadata 模板

**skill-metadata.json**:
```json
{
  "skill-id": {
    "name": "Skill Name",
    "displayName": "技能名稱",
    "icon": "⚔️",
    "type": "attack|support|special",
    "category": "basic|advanced|ultimate",
    "element": "logic|chaos|wisdom",

    "cost": {
      "mp": 15
    },

    "cooldown": 60,

    "rewards": {
      "exp": 20,
      "gold": 10,
      "expMultiplier": 1.0,
      "goldMultiplier": 1.0
    },

    "requirements": {
      "level": 1
    },

    "ui": {
      "color": "#ff6b6b",
      "animation": "slash",
      "sound": "skill_cast.mp3"
    },

    "description": "簡短描述",
    "flavorText": "風味文字"
  }
}
```

**agent-metadata.json**:
```json
{
  "agent-id": {
    "name": "Agent Name",
    "displayName": "角色名稱",
    "characterName": "CodeGuard",     // 夥伴專用
    "title": "代碼守護者",
    "avatar": "🛡️",
    "element": "guardian",
    "rarity": "common|uncommon|rare|epic|legendary",
    "role": "tank|attacker|support",

    "summonCost": {
      "mp": 30,
      "cooldown": 300
    },

    "baseStats": {
      "hp": 150,
      "mp": 100,
      "attack": 60,
      "defense": 90,
      "speed": 50,
      "wisdom": 85
    },

    "battleSkills": [...],
    "passiveAbilities": [...],

    "personality": {
      "aiStyle": "defensive|aggressive|balanced",
      "preferredTargets": ["bug-hunt"],
      "skillPriority": [...]
    },

    "quotes": {
      "summon": [...],
      "working": [...],
      "complete": [...]
    }
  }
}
```

**summon-metadata.json**:
```json
{
  "summon-id": {
    "name": "Summon Name",
    "displayName": "召喚獸名稱",
    "icon": "🐉",
    "element": "arcane|fire|ice",
    "rarity": "common|uncommon|rare|epic|legendary",
    "type": "offensive|defensive|support|utility",

    "summonCost": {
      "mp": 80,
      "cooldown": 600
    },

    "appearance": {
      "avatar": "🐉",
      "color": "#ff6b00",
      "animation": "dragon-emerge",
      "sound": "roar.mp3"
    },

    "behavior": {
      "actionType": "immediate|automatic|passive|interactive",
      "duration": 1,
      "canAct": true
    },

    "skills": [...],
    "passiveEffect": {...},

    "exitEffect": {
      "bonus": {
        "exp": 100,
        "gold": 50
      },
      "message": "..."
    },

    "quotes": {
      "summon": [...],
      "attack": [...],
      "exit": [...]
    }
  }
}
```

**影響文檔**:
- RPG-CLI-Architecture-v2.md
- Feature-Planning-v2.md
- Agent-Battle-Companion-Design.md
- Summon-Beast-System-Design.md

**狀態**: ✅ 已定義，待更新各文檔

---

## LOW 優先級衝突

### 8. Worktree 與戰鬥系統整合 ⚠️

**問題**:
- Worktree 操作與戰鬥系統的 MP 消耗可能衝突

**解決方案**:

#### 分離規則
```javascript
// Worktree 操作獨立於戰鬥系統
worktreeOperations: {
  mpPool: 'global',           // 使用全局 MP（非戰鬥 MP）
  availableWhen: 'outOfBattle',  // 只能在戰鬥外操作

  costs: {
    create: 10,               // 創建 worktree: -10 全局 MP
    switch: 5,                // 切換 worktree: -5 全局 MP
    merge: 20                 // 合併 worktree: -20 全局 MP
  }
}

// 戰鬥中禁用 Worktree 操作
if (inBattle) {
  return { error: '戰鬥中無法操作平行世界' };
}
```

**影響文檔**:
- Worktree-System-Design.md
- Battle-System-Design.md

**狀態**: ✅ 已定義，待更新文檔

---

### 9. UI 數值顯示統一規範 ⚠️

**問題**:
- HP/MP 顯示格式不一致

**解決方案**:

#### 標準顯示格式
```
玩家狀態列:
┌─────────────────────────────────┐
│ Lv.5 冒險者                      │
│ ❤️ HP: 80/100  ████████░░       │
│ ⚡ MP: 60/100  ██████░░░░       │
│ ⭐ EXP: 300/500 ███░░░░░░░      │
└─────────────────────────────────┘

夥伴狀態:
┌──────────────────┐
│ 🛡️ CodeGuard    │
│ Lv.3             │
│ HP: ███░ 75/100  │
│ MP: ██░░ 50/100  │
└──────────────────┘

敵人狀態:
┌─────────────────────────┐
│ 🐛 強大的Bug怪物 Lv.8   │
│ HP: ████████░░ 800/1000 │
│ 弱點: 🔍 🧪             │
└─────────────────────────┘
```

**影響文檔**:
- UI-Interaction-Guide.md
- Feature-Planning-v2.md

**狀態**: ✅ 已定義，待更新文檔

---

### 10. 技術選型統一 ⚠️

**問題**:
- PixiJS/Phaser vs Framer Motion 的選擇不明確

**解決方案**:

#### 最終技術選型
```
前端技術棧:
├── React 18 (UI 框架)
├── TypeScript (類型安全)
├── Vite (構建工具)
├── Tailwind CSS (樣式系統)
│   └── 支援 Pixel Art 風格的自訂配置
├── Framer Motion (動畫系統)
│   ├── 組件動畫
│   ├── 過渡效果
│   └── 手勢互動
└── Zustand (狀態管理)

❌ 不使用:
- PixiJS (過重，不需要 Canvas 渲染)
- Phaser (完整遊戲引擎，功能過多)
```

**理由**:
- Framer Motion 已足夠處理所有 UI 動畫
- Tailwind CSS + 自訂配置可實現 Pixel Art 風格
- 保持技術棧簡潔，降低學習成本

**影響文檔**:
- RPG-CLI-Concept.md (line 31)
- RPG-CLI-Architecture-v2.md

**狀態**: ✅ 已定義，待更新文檔

---

## 實施計劃

### 立即執行（本週）

1. **更新 Feature-Planning-v2.md**
   - 修正 Phase 時間規劃
   - 補充 MP 系統詳細規範
   - 補充升級系統詳細公式

2. **更新 Battle-System-Design.md**
   - 補充敵人速度屬性
   - 定義敵人攻擊目標邏輯
   - 整合回合順序計算

3. **更新 Agent-Battle-Companion-Design.md**
   - 明確夥伴 MP 管理機制
   - 補充夥伴經驗值來源
   - 統一 Metadata 格式

4. **更新 Summon-Beast-System-Design.md**
   - 明確召喚獸槽位限制
   - 統一 Metadata 格式

5. **更新 RPG-CLI-Architecture-v2.md**
   - 修正 Phase 時間規劃
   - 明確技術選型

### 後續追蹤（下週）

1. 創建 **Metadata 規範文檔**（獨立文檔）
2. 創建 **UI 規範文檔**（獨立文檔）
3. 驗證所有文檔一致性

---

## 檢查清單

- [ ] Phase 時間規劃已統一
- [ ] Skills frontmatter 嚴格遵守官方格式
- [ ] MP 系統規範已完整定義
- [ ] 升級系統公式已明確
- [ ] 敵人攻擊邏輯已定義
- [ ] 召喚獸槽位規則已明確
- [ ] Metadata 格式已統一
- [ ] Worktree 整合規則已定義
- [ ] UI 顯示格式已統一
- [ ] 技術選型已確定

---

**最後更新**: 2026-02-05
**維護者**: Claude Code Team
