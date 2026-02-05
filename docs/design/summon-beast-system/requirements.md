# Summon Beast System - Requirements

**Based on**: Agent-Battle-Companion-Design.md, Battle-System-Design.md
**Date**: 2026-02-05
**Status**: Design Phase

---

## Core Concept

### Summon Beast vs Battle Companion

召喚獸系統與戰鬥夥伴系統的核心差異：

| 特性 | 戰鬥夥伴 (Companion) | 召喚獸 (Summon Beast) |
|-----|---------------------|---------------------|
| 來源 | Subagent | 技能/道具/組合技/MCP工具 |
| 持續時間 | 戰鬥全程 | 限時（1-3回合）或單次行動 |
| 成長性 | 有經驗值、升級 | 無成長，固定能力 |
| 槽位 | 夥伴槽（最多2個） | 召喚獸槽（最多1個，獨立） |
| MP消耗 | 召喚時消耗 | 每次召喚都消耗 |
| 行動方式 | 參與回合順序 | 立即行動或特定觸發 |
| 用途 | 持續戰鬥支援 | 爆發傷害、緊急支援 |

### Design Philosophy

```
夥伴 = 長期戰友
├─ 陪伴整場戰鬥
├─ 穩定輸出/支援
└─ 能力隨時間成長

召喚獸 = 特殊支援
├─ 關鍵時刻使用
├─ 強力但短暫
└─ 戰術性選擇
```

**設計理念**:
- 召喚獸提供關鍵時刻的強力支援
- 不與夥伴系統衝突，而是互補
- 高 MP 消耗確保使用需要策略性判斷
- 短暫持續時間讓玩家需要把握時機

---

## Summon Classifications

### 1. Skill Summons（技能召喚獸）

通過特定 Skill 召喚，執行單一強力行動。

**特點**:
- 需要專門的召喚 Skill（如 `summon-code-dragon`）
- 高 MP 消耗（60-100 MP）
- 強力的即時效果
- 通常是立即行動型

**範例**: Code Dragon (代碼之龍)
```yaml
name: summon-code-dragon
description: 召喚代碼之龍，對所有代碼相關問題造成巨大傷害
allowed-tools: Read, Bash, Write
```

**Metadata Structure**:
```json
{
  "summon-code-dragon": {
    "name": "Code Dragon",
    "displayName": "代碼之龍",
    "icon": "🐉",
    "element": "arcane",
    "rarity": "legendary",
    "type": "offensive",

    "summonCost": {
      "mp": 80,
      "cooldown": 600
    },

    "behavior": {
      "actionType": "immediate",
      "duration": 1,
      "canAct": true
    },

    "skills": [{
      "id": "dragon_breath",
      "name": "龍息",
      "type": "special_attack",
      "effect": {
        "damage": "300 + player.level * 20",
        "aoe": true,
        "effectiveness": {
          "code-task": 2.5,
          "architecture": 2.0,
          "bug-hunt": 1.5
        }
      }
    }]
  }
}
```

### 2. Combo Summons（組合技召喚獸）

觸發組合技時自動召喚。

**特點**:
- 不需要手動召喚
- 組合技觸發時有機率出現
- 通常是支援型
- 持續數回合

**範例**: Phoenix (不死鳥)
```json
{
  "combo-summon-phoenix": {
    "name": "Phoenix",
    "displayName": "不死鳥",
    "icon": "🔥🦅",
    "element": "rebirth",
    "type": "support",

    "triggerCondition": {
      "comboId": "perfect-code-chain",
      "chance": 0.5
    },

    "behavior": {
      "actionType": "automatic",
      "duration": 2,
      "canAct": true
    },

    "skills": [{
      "id": "phoenix_rebirth",
      "name": "浴火重生",
      "type": "healing",
      "effect": {
        "heal": {
          "target": "player",
          "value": "player.maxHp * 0.5"
        },
        "revive": {
          "target": "all_companions",
          "hp_restore": 0.3
        },
        "buff": {
          "target": "all_allies",
          "stat": "attack",
          "value": 30,
          "duration": 3
        }
      }
    }]
  }
}
```

### 3. MCP Tool Summons（MCP 工具召喚獸）

將 MCP Server 的工具轉化為召喚獸。

**特點**:
- 綁定到特定 MCP Server 工具
- 技能效果與 MCP 工具相關
- 實用型功能
- 互動型行為

**範例**: Database Golem (資料庫魔像)
```json
{
  "mcp-database-golem": {
    "name": "Database Golem",
    "displayName": "資料庫魔像",
    "icon": "🗄️",
    "element": "data",
    "rarity": "rare",
    "type": "utility",

    "mcpBinding": {
      "server": "database-mcp",
      "tool": "query_database"
    },

    "summonCost": {
      "mp": 40,
      "cooldown": 300
    },

    "behavior": {
      "actionType": "interactive",
      "duration": 3,
      "canAct": true
    },

    "skills": [
      {
        "id": "data_shield",
        "name": "資料護盾",
        "type": "defense",
        "effect": {
          "shield": {
            "target": "player",
            "value": 100,
            "duration": 3
          },
          "special": {
            "type": "mcp_query",
            "description": "執行資料庫查詢並轉化為防禦"
          }
        }
      },
      {
        "id": "data_blast",
        "name": "資料爆破",
        "type": "attack",
        "effect": {
          "damage": "150 + query_complexity * 20",
          "special": {
            "type": "mcp_result",
            "description": "查詢結果越複雜，傷害越高"
          }
        }
      }
    ]
  }
}
```

### 4. Item Summons（道具召喚獸）

使用特殊道具召喚（未來擴展）。

**特點**:
- 需要消耗特定道具
- 通常是被動型
- 提供長期增益
- 實用性功能

**範例**: Helper Fairy (幫助精靈)
```json
{
  "item-summon-helper": {
    "name": "Helper Fairy",
    "displayName": "幫助精靈",
    "icon": "🧚",
    "element": "support",
    "rarity": "common",
    "type": "utility",

    "itemRequired": "summon_scroll_helper",

    "behavior": {
      "actionType": "passive",
      "duration": 5,
      "canAct": false
    },

    "passiveEffect": {
      "mpRegen": 5,
      "expBonus": 1.2,
      "goldBonus": 1.2
    }
  }
}
```

---

## Summon Behavior Types

### 1. Immediate Action（立即行動）

召喚後立即執行技能並離去。

**特性**:
- 召喚 → 技能施放 → 立即離去
- 單次高爆發傷害
- 適合緊急情況
- 戰鬥日誌完整記錄

**流程**:
```
1. 播放召喚動畫（0.5s）
2. 顯示召喚台詞（0.3s）
3. 執行技能（1.0s）
4. 傷害/效果結算（0.5s）
5. 顯示離去台詞（0.3s）
6. 應用離去獎勵
7. 播放離去動畫（0.5s）
```

**適合召喚獸**:
- 代碼之龍（Code Dragon）- 毀滅性攻擊
- 治癒天使（Healing Angel）- 緊急大量治療
- 時間魔導師（Time Wizard）- 特殊效果（重置冷卻）

**範例效果**:
```javascript
// 代碼之龍的龍息
{
  "damage": "300 + player.level * 20",
  "aoe": true,
  "effectiveness": {
    "code-task": 2.5,
    "architecture": 2.0
  }
}
```

### 2. Automatic Action（自動行動）

在場數回合，每回合自動行動。

**特性**:
- 持續 2-3 回合
- 每回合自動選擇最佳技能
- 簡單 AI 決策
- 參與回合順序

**流程**:
```
召喚時:
  1. 播放召喚動畫
  2. 顯示持續回合數
  3. 加入戰鬥單位

每回合開始:
  1. 檢查剩餘回合數
  2. 選擇最佳技能
  3. 執行技能
  4. 回合數 -1

離去時:
  1. 顯示離去台詞
  2. 應用離去獎勵
  3. 從戰鬥單位移除
```

**適合召喚獸**:
- 不死鳥（Phoenix）- 持續治療和 Buff
- 重構泰坦（Refactoring Titan）- 持續攻擊和降防

**AI 決策邏輯**:
```javascript
selectBestSkill(battle) {
  // 優先級：治療 > 控制 > 傷害
  if (battle.player.hp < battle.player.maxHp * 0.3) {
    return findHealingSkill();
  }

  if (hasDebuffSkill() && !enemy.hasDebuff()) {
    return findDebuffSkill();
  }

  return findHighestDamageSkill();
}
```

### 3. Passive Effect（被動效果）

在場期間提供被動加成，不主動攻擊。

**特性**:
- 持續 3-5 回合
- 不執行主動技能
- 提供持續性增益
- 視覺上較低調

**可用被動效果**:
```javascript
passiveEffect: {
  mpRegen: 5,          // 每回合額外恢復 5 MP
  expBonus: 1.2,       // 經驗值獲得 +20%
  goldBonus: 1.2,      // 金幣獲得 +20%
  damageReduction: 10, // 受到傷害 -10%
  critBonus: 0.15,     // 暴擊率 +15%
  healBonus: 1.3       // 治療效果 +30%
}
```

**適合召喚獸**:
- 幫助精靈（Helper Fairy）- 資源獲取加成
- 守護石像（Guardian Statue）- 傷害減免
- 幸運貓（Lucky Cat）- 暴擊率提升

### 4. Interactive Action（互動行動）

在場期間，玩家可手動指揮。

**特性**:
- 持續 2-3 回合
- 玩家手動選擇技能
- 戰術性使用
- 多技能選擇

**流程**:
```
召喚時:
  1. 播放召喚動畫
  2. 顯示可用技能列表
  3. 等待玩家指令

玩家回合:
  1. 玩家選擇召喚獸技能
  2. 執行選中的技能
  3. 回合數 -1

離去時:
  1. 顯示離去台詞
  2. 從戰鬥單位移除
```

**適合召喚獸**:
- 資料庫魔像（Database Golem）- 攻擊/防禦切換
- 戰術顧問（Tactical Advisor）- 多種 Buff 選擇

---

## Summon Library

### Offensive Summons（攻擊型）

**1. Code Dragon（代碼之龍）**
- **Rarity**: Legendary
- **Element**: Arcane
- **Behavior**: Immediate
- **Skill**: Dragon Breath - 300+ 巨大傷害，對代碼任務額外有效
- **Cost**: 80 MP, 600s cooldown

**2. Refactoring Titan（重構泰坦）**
- **Rarity**: Epic
- **Element**: Structure
- **Behavior**: Automatic (2 turns)
- **Skill**: Structural Smash - 200+ 傷害，降低敵人防禦
- **Cost**: 60 MP

### Support Summons（支援型）

**1. Phoenix（不死鳥）**
- **Rarity**: Epic
- **Element**: Rebirth
- **Behavior**: Automatic (2 turns)
- **Skill**: Rebirth - 治療玩家 50% HP，復活倒下的夥伴，全體攻擊 +30
- **Cost**: Triggered by combo

**2. Healing Fairy（治癒精靈）**
- **Rarity**: Uncommon
- **Element**: Life
- **Behavior**: Automatic (3 turns)
- **Skill**: Fairy Blessing - 恢復 15% HP + 20 MP
- **Cost**: 30 MP

### Utility Summons（實用型）

**1. Time Wizard（時間魔導師）**
- **Rarity**: Legendary
- **Element**: Temporal
- **Behavior**: Immediate
- **Skill**: Time Rewind - 重置所有技能冷卻，恢復 30% HP/MP
- **Cost**: 100 MP

**2. Database Golem（資料庫魔像）**
- **Rarity**: Rare
- **Element**: Data
- **Behavior**: Interactive (3 turns)
- **Skills**: Data Shield（100 護盾）, Data Blast（150+ 傷害）
- **Cost**: 40 MP, 300s cooldown

**3. Helper Fairy（幫助精靈）**
- **Rarity**: Common
- **Element**: Support
- **Behavior**: Passive (5 turns)
- **Effect**: +5 MP/turn, +20% EXP, +20% Gold
- **Cost**: Summon Scroll (item)

---

## Companion-Summon Synergy

夥伴與召喚獸同時在場時，可能觸發協同效果。

### Synergy Effects

**CodeGuard + Code Dragon = 代碼雙龍陣**
```json
{
  "name": "代碼雙龍陣",
  "condition": {
    "companion": "CodeGuard",
    "summon": "Code Dragon",
    "bothActive": true
  },
  "bonus": {
    "damage_multiplier": 1.5,
    "defense_boost": 30
  },
  "description": "CodeGuard 與代碼之龍同時在場，防禦和攻擊大幅提升"
}
```

**Speedy + Phoenix = 疾風烈火**
```json
{
  "name": "疾風烈火",
  "condition": {
    "companion": "Speedy",
    "summon": "Phoenix",
    "bothActive": true
  },
  "bonus": {
    "speed_boost": 50,
    "attack_boost": 40
  },
  "description": "速度與火焰的結合，攻擊力和速度暴增"
}
```

---

## Resource Management

### MP Cost Design

召喚獸 MP 消耗設計原則：

| Rarity | MP Range | Cooldown | Power Level |
|--------|----------|----------|-------------|
| Common | 20-30 | 120s | 中等 |
| Uncommon | 30-50 | 180s | 較強 |
| Rare | 50-70 | 300s | 強力 |
| Epic | 70-90 | 450s | 很強 |
| Legendary | 90-120 | 600s+ | 極強 |

**設計考量**:
- 高 MP 消耗確保不會頻繁使用
- 冷卻時間防止連續召喚同一召喚獸
- 稀有度越高，效果越強但成本也越高

### Slot System

```
戰鬥單位配置:
├─ 玩家 (1)
├─ 夥伴槽 (最多 2)
└─ 召喚獸槽 (最多 1)

總計: 最多 4 個單位同時在場
```

**規則**:
- 同時只能有 1 個召喚獸在場
- 召喚新召喚獸會解除現有召喚獸
- 夥伴與召喚獸槽位獨立
- 立即行動型召喚獸不占用槽位

---

## Summon Unlock System

### Unlock Methods

**1. Level Unlock（等級解鎖）**
```javascript
{
  "summon-code-dragon": {
    "unlockRequirement": {
      "type": "player_level",
      "level": 10
    }
  }
}
```

**2. Achievement Unlock（成就解鎖）**
```javascript
{
  "summon-phoenix": {
    "unlockRequirement": {
      "type": "achievement",
      "achievementId": "complete-10-battles"
    }
  }
}
```

**3. Quest Unlock（任務解鎖）**
```javascript
{
  "time-wizard": {
    "unlockRequirement": {
      "type": "quest",
      "questId": "master-of-time"
    }
  }
}
```

**4. Discover Unlock（發現解鎖）**
```javascript
{
  "mcp-database-golem": {
    "unlockRequirement": {
      "type": "mcp_server",
      "serverId": "database-mcp"
    }
  }
}
```

---

## Balancing Considerations

### Power Balance

召喚獸的強度必須平衡：

**不應該**:
- 比玩家主要技能強太多
- 讓夥伴系統變得無用
- 成為唯一獲勝方式

**應該**:
- 提供戰術選擇
- 補充現有戰鬥系統
- 關鍵時刻的救場手段

### Usage Frequency

**理想使用頻率**:
- 常見召喚獸: 每場戰鬥 2-3 次
- 稀有召喚獸: 每場戰鬥 1-2 次
- 傳說召喚獸: 每場戰鬥 0-1 次

---

## Implementation Priority

### Phase 2.5 Expansion (Week 5)

**基礎系統**:
- [ ] SummonManager class
- [ ] 4 種行為類型實作
- [ ] 召喚獸 metadata 系統
- [ ] 基礎 UI 組件

**初始召喚獸**:
- [ ] Code Dragon（攻擊型）
- [ ] Healing Fairy（支援型）
- [ ] Time Wizard（特殊型）

**整合**:
- [ ] 召喚獸 Skill 整合
- [ ] 戰鬥系統整合
- [ ] WebSocket 事件廣播

### Phase 3 Expansion (Week 6-8)

**進階功能**:
- [ ] MCP 工具召喚獸
- [ ] 組合技召喚獸
- [ ] 道具召喚獸系統
- [ ] 召喚獸圖鑑
- [ ] 夥伴-召喚獸協同效果

---

## Summary

召喚獸系統設計重點：

**✅ 戰術深度**:
- 4 種不同行為類型
- 多樣化的召喚來源
- 與夥伴系統互補

**✅ 資源管理**:
- 高 MP 消耗
- 冷卻時間限制
- 使用時機判斷

**✅ 收集樂趣**:
- 5 種稀有度
- 多種解鎖方式
- 圖鑑系統（未來）

**✅ 平衡性**:
- 強力但短暫
- 不取代其他系統
- 戰術性選擇而非必需

---

**Version**: v1.0
**Last Updated**: 2026-02-05
**Integrated With**: Agent-Battle-Companion-Design.md, Battle-System-Design.md
