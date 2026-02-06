# 商店系統 (Shop System)

**創建日期**: 2026-02-06
**版本**: v1.0
**來源**: `/docs/design/shop-system/requirements.md`

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

商店系統是 Code Quest 的經濟和成長核心，玩家在城鎮的 7 個商店中消費金幣和資源，獲得技能、道具、夥伴和服務。

**七大商店架構**：

```
城鎮廣場（Town Square）
├─ 技能商店（Skills Shop）- 購買預設技能
├─ 技能鍛造（Skill Forge）- 自定義創建技能
├─ 知識圖書館（Knowledge Library）- MCP 工具
├─ 傭兵公會（Mercenary Guild）- 夥伴管理
├─ 寶庫（Treasury）- 道具和裝備
├─ 訓練場（Training Ground）- 升級和訓練
└─ 金庫（Bank）- 存款和投資
```

**設計理念**：
- 每個商店有明確的功能定位
- 購買和服務分離（買技能 vs 鍛造技能）
- 短期消費 + 長期投資並存
- 動態定價和折扣系統

---

## 依賴關係

### 上游依賴

```
商店系統依賴：
├─ 經濟系統（L1）- 金幣和資源管理
├─ 玩家系統（L1）- 等級和屬性
├─ 技能系統（L2）- 技能數據和升級
├─ 夥伴系統（L2）- 夥伴管理
└─ 道具系統（L2）- 道具庫存
```

### 下游依賴

```
影響的系統：
├─ 戰鬥系統（L2）- 購買的技能和道具用於戰鬥
├─ UI 系統（L3）- 商店 UI 展示
└─ 成就系統（L3）- 購物相關成就
```

### 系統架構位置

```
L4: 展示層
    └─ 商店 UI 組件
L3: 業務層 ⭐
    └─ 商店系統（本系統）
L2: 核心層
    ├─ 技能系統
    ├─ 夥伴系統
    └─ 道具系統
L1: 基礎層
    └─ 經濟系統
L0: 數據層
    └─ 商店數據結構
```

---

## 核心規則

### 規則 1：七大商店功能定義

#### 1.1 技能商店（Skills Shop）

**功能**：購買預設技能

**商品類別**：
```javascript
categories = {
  基礎技能: {
    description: '適合新手的基礎技能',
    priceRange: '50-200 金幣',
    requiredLevel: 1
  },
  進階技能: {
    description: '強力的進階技能',
    priceRange: '300-800 金幣',
    requiredLevel: 5
  },
  專家技能: {
    description: '頂級專家技能',
    priceRange: '1000-3000 金幣',
    requiredLevel: 10
  },
  特殊技能: {
    description: '限定和稀有技能',
    priceRange: '5000+ 金幣',
    requiredLevel: 15
  }
}
```

**定價公式**：
```javascript
skillPrice = basePrice * (1 + rarityMultiplier) * (1 + complexityMultiplier)

rarityMultiplier = {
  Common: 0,
  Rare: 0.5,
  Epic: 1.5,
  Legendary: 3.0
}

complexityMultiplier = mpCost / 10
// 例如：10 MP 技能 = 1.0 倍，20 MP = 2.0 倍
```

**示例商品**：
```
基礎代碼生成術
├─ 價格：100 金幣
├─ MP 消耗：10
├─ 效果：生成簡單代碼
└─ 需求：Lv.1

高級重構術
├─ 價格：800 金幣
├─ MP 消耗：25
├─ 效果：重構複雜系統
└─ 需求：Lv.8
```

#### 1.2 技能鍛造（Skill Forge）

**功能**：自定義創建技能

**六步創建流程**：
```
1. 選擇技能類型（攻擊/支援/特殊）
   └─ 決定基礎效果

2. 定義技能參數
   └─ 傷害/範圍/持續時間/冷卻

3. 選擇技能特效
   └─ Buff/Debuff/額外效果

4. 設定 MP 消耗
   └─ 自動計算或手動調整

5. 命名和描述
   └─ 自定義名稱和說明

6. 支付鍛造費用
   └─ 費用基於技能複雜度
```

**鍛造成本公式**：
```javascript
forgeCost = baseCost + (mpCost * 20) + (effectCount * 100) + rarityBonus

baseCost = 500  // 基礎鍛造費
rarityBonus = {
  Common: 0,
  Rare: 300,
  Epic: 1000,
  Legendary: 3000
}

// 例如：
// MP 15 + 2個效果 + 稀有度 Rare
// = 500 + (15 * 20) + (2 * 100) + 300
// = 500 + 300 + 200 + 300 = 1,300 金幣
```

**鍛造限制**：
```javascript
limits = {
  perDay: 3,              // 每天最多鍛造 3 次
  maxCustomSkills: 10,    // 最多擁有 10 個自定義技能
  minLevel: 5,            // Lv.5 解鎖鍛造功能
  maxMpCost: 50           // 單個技能 MP 上限 50
}
```

**示例鍛造**：
```
自定義技能：「終極調試術」
├─ 類型：支援
├─ MP 消耗：20
├─ 效果：
│  ├─ 找出所有 Bug（100% 成功率）
│  ├─ 自動修復（80% 成功率）
│  └─ +50% 代碼質量（持續 3 回合）
├─ 冷卻：5 回合
├─ 鍛造成本：1,500 金幣
└─ 需求：Lv.8
```

#### 1.3 知識圖書館（Knowledge Library）

**功能**：購買 MCP 工具

**工具分類**：
```javascript
toolCategories = {
  文件操作: {
    tools: ['Read', 'Write', 'Edit', 'Glob'],
    priceRange: '200-500',
    description: '文件和目錄操作工具'
  },
  搜索工具: {
    tools: ['Grep', 'Find', 'Locate'],
    priceRange: '300-600',
    description: '代碼搜索和定位工具'
  },
  版本控制: {
    tools: ['Git', 'SVN', 'Mercurial'],
    priceRange: '500-1000',
    description: 'Git 和版本控制工具'
  },
  網絡工具: {
    tools: ['HTTP Client', 'WebSocket', 'GraphQL'],
    priceRange: '800-1500',
    description: '網絡請求和 API 工具'
  },
  數據處理: {
    tools: ['JSON Parser', 'CSV Tool', 'XML Tool'],
    priceRange: '400-800',
    description: '數據格式處理工具'
  }
}
```

**工具效果**：
- 購買後解鎖對應的 MCP 工具
- 可在戰鬥中使用（消耗 MP）
- 部分工具可轉化為工具召喚獸

**工具升級**：
```javascript
toolUpgrade = {
  Level1: { speed: 1.0, successRate: 80, mpCost: 1.0 },
  Level2: { speed: 1.3, successRate: 90, mpCost: 0.9 },  // -10% MP
  Level3: { speed: 1.6, successRate: 95, mpCost: 0.8 },  // -20% MP

  upgradeCost: (level) => 300 * Math.pow(1.5, level - 1)
  // Lv.1→2: 300, Lv.2→3: 450, Lv.3→4: 675
}
```

**示例商品**：
```
Grep 搜索工具
├─ 價格：400 金幣
├─ 效果：在代碼中搜索字符串
├─ MP 消耗：5
├─ 可升級：是
└─ 解鎖召喚獸：搜索蜘蛛

Git 工具集
├─ 價格：800 金幣
├─ 效果：版本控制操作（commit, push, pull）
├─ MP 消耗：8-15（依操作）
├─ 可升級：是
└─ 解鎖召喚獸：Git 章魚
```

#### 1.4 傭兵公會（Mercenary Guild）

**功能**：招募和管理夥伴

**服務項目**：
```javascript
services = {
  招募夥伴: {
    cost: (companion) => companion.rarity * 1000,
    description: '招募新的戰鬥夥伴',
    limit: '最多 3 個夥伴'
  },
  夥伴訓練: {
    cost: (level) => 200 * level,
    description: '訓練夥伴提升等級',
    effect: '經驗 +100'
  },
  技能學習: {
    cost: 500,
    description: '讓夥伴學習新技能',
    limit: '每個夥伴最多 4 個技能'
  },
  屬性重置: {
    cost: 1000,
    description: '重置夥伴技能點分配',
    cooldown: '7 天'
  }
}
```

**夥伴定價**：
```javascript
companionPrice = basePrice * rarityMultiplier * (1 + levelMultiplier)

rarityMultiplier = {
  Common: 1,
  Rare: 2,
  Epic: 4,
  Legendary: 8
}

levelMultiplier = initialLevel * 0.1
// 例如：Lv.5 夥伴比 Lv.1 貴 50%
```

**示例服務**：
```
招募：代碼戰士（稀有）
├─ 價格：2,000 金幣
├─ 初始等級：Lv.1
├─ 類型：Warrior
├─ 技能：重擊、防禦、嘲諷
└─ 成長潛力：A

訓練：代碼戰士 Lv.5 → Lv.6
├─ 費用：1,000 金幣
├─ 獲得：+100 EXP
└─ 時間：即時
```

#### 1.5 寶庫（Treasury）

**功能**：購買道具和裝備

**道具分類**：
```javascript
itemCategories = {
  消耗品: {
    items: ['HP 藥水', 'MP 藥水', '經驗卷軸'],
    priceRange: '50-200',
    effect: '即時恢復或增益'
  },
  召喚道具: {
    items: ['調試燈籠', '性能分析器', '安全掃描器'],
    priceRange: '500-2000',
    effect: '召喚特殊召喚獸'
  },
  永久道具: {
    items: ['經驗護符', 'MP 恢復戒指', '暴擊手套'],
    priceRange: '3000-10000',
    effect: '永久屬性增益'
  },
  特殊道具: {
    items: ['時間沙漏', '重生羽毛', '幸運硬幣'],
    priceRange: '5000-20000',
    effect: '特殊能力'
  }
}
```

**道具效果示例**：
```
HP 藥水（中）
├─ 價格：100 金幣
├─ 效果：恢復 50 HP
├─ 冷卻：3 回合
└─ 堆疊：最多 99 個

調試燈籠（稀有）
├─ 價格：1,200 金幣
├─ 效果：召喚調試精靈（3 回合）
├─ 使用次數：1 次
└─ 堆疊：最多 5 個

經驗護符（永久）
├─ 價格：5,000 金幣
├─ 效果：所有經驗獲得 +15%
├─ 類型：被動裝備
└─ 堆疊：不可堆疊
```

**批量購買折扣**：
```javascript
bulkDiscount = {
  5: 0.95,   // 5 個 -5%
  10: 0.90,  // 10 個 -10%
  20: 0.85,  // 20 個 -15%
  50: 0.80   // 50 個 -20%
}
```

#### 1.6 訓練場（Training Ground）

**功能**：升級技能和屬性訓練

**服務項目**：
```javascript
trainingServices = {
  技能升級: {
    cost: (skill) => {
      const basePrice = skill.basePrice || 200;
      return Math.floor(basePrice * Math.pow(1.5, skill.currentLevel - 1));
    },
    effect: '技能升級 +1 級',
    maxLevel: 10
  },

  屬性訓練: {
    cost: (attribute, currentValue) => {
      return 100 * currentValue;  // 屬性越高越貴
    },
    effect: '提升指定屬性 +1',
    cooldown: '每個屬性每天最多訓練 3 次'
  },

  戰鬥訓練: {
    cost: 500,
    effect: '與 NPC 訓練，獲得經驗',
    reward: '經驗 +200，可能掉落道具'
  },

  特訓: {
    cost: 2000,
    effect: '密集訓練，大幅提升',
    reward: '經驗 +1000，屬性點 +3',
    cooldown: '每週 1 次'
  }
}
```

**技能升級成本公式**：
```javascript
upgradeCost = basePrice * Math.pow(1.5, currentLevel - 1)

// 例如：代碼生成術（基礎價 200）
// Lv.1 → Lv.2: 200 * 1.5^0 = 200
// Lv.2 → Lv.3: 200 * 1.5^1 = 300
// Lv.3 → Lv.4: 200 * 1.5^2 = 450
// Lv.4 → Lv.5: 200 * 1.5^3 = 675
```

**屬性訓練示例**：
```
攻擊力訓練
├─ 當前：50 → 51
├─ 費用：5,000 金幣（100 * 50）
├─ 時間：即時
└─ 限制：今日剩餘 2/3 次

速度訓練
├─ 當前：30 → 31
├─ 費用：3,000 金幣（100 * 30）
├─ 時間：即時
└─ 限制：今日剩餘 3/3 次
```

#### 1.7 金庫（Bank）

**功能**：存款、貸款和投資

**服務項目**：
```javascript
bankServices = {
  存款: {
    interest: 0.05,  // 5% 日利率
    description: '安全存儲金幣，每天獲得利息',
    minDeposit: 1000,
    effect: '每天 +5% 利息'
  },

  定期存款: {
    options: [
      { days: 7, rate: 0.10 },   // 7天 10% 總利息
      { days: 30, rate: 0.50 },  // 30天 50% 總利息
      { days: 90, rate: 2.0 }    // 90天 200% 總利息
    ],
    description: '鎖定期間不可提取，到期獲得本金+利息',
    penalty: '提前解約損失 50% 利息'
  },

  貸款: {
    maxLoan: (playerLevel) => playerLevel * 1000,
    interest: 0.10,  // 10% 利息
    description: '借款應急，需在 7 天內歸還',
    penalty: '逾期每天額外 +5% 利息'
  },

  投資基金: {
    types: {
      穩健型: { return: 0.08, risk: 'low' },
      成長型: { return: 0.15, risk: 'medium' },
      激進型: { return: 0.30, risk: 'high' }
    },
    description: '投資有風險，收益不固定',
    minInvestment: 5000
  }
}
```

**存款計算**：
```javascript
// 活期存款
dailyInterest = depositAmount * 0.05
// 例如：存 10,000 金幣，每天獲得 500 金幣

// 定期存款
totalReturn = depositAmount * (1 + rate)
// 例如：10,000 金幣存 30 天（50% 利率）
// 到期獲得：10,000 * 1.5 = 15,000 金幣
```

**貸款示例**：
```
申請貸款
├─ 玩家等級：Lv.10
├─ 可貸金額：最多 10,000 金幣
├─ 利息：10%（總計需還 11,000）
├─ 期限：7 天
└─ 逾期罰息：每天 +5%

貸款 5,000 金幣
├─ 立即獲得：5,000 金幣
├─ 需還金額：5,500 金幣
├─ 還款期限：7 天後
└─ 逾期第 1 天：5,500 * 1.05 = 5,775
   逾期第 2 天：5,775 * 1.05 = 6,064
```

---

### 規則 2：動態定價系統

#### 2.1 基礎定價公式

```javascript
finalPrice = basePrice * rarityMultiplier * demandMultiplier * discountMultiplier

basePrice = {
  skill: 100-5000,
  tool: 200-2000,
  item: 50-10000,
  companion: 1000-10000
}

rarityMultiplier = {
  Common: 1.0,
  Rare: 2.0,
  Epic: 4.0,
  Legendary: 8.0
}
```

#### 2.2 需求動態定價

**熱門商品加價**：
```javascript
demandMultiplier = 1 + (purchaseCount / 100) * 0.5
// 每 100 次購買，價格 +50%
// 上限：2.0x（價格最多翻倍）

// 例如：
// 基礎價 1000，購買 50 次
// demandMultiplier = 1 + (50/100) * 0.5 = 1.25
// 最終價格 = 1000 * 1.25 = 1,250
```

**冷門商品降價**：
```javascript
if (daysSinceLastPurchase > 7) {
  discountMultiplier = 0.8;  // -20%
}
if (daysSinceLastPurchase > 30) {
  discountMultiplier = 0.6;  // -40%
}
```

#### 2.3 玩家等級折扣

```javascript
levelDiscount = {
  Lv5: 0.95,   // -5%
  Lv10: 0.90,  // -10%
  Lv15: 0.85,  // -15%
  Lv20: 0.80   // -20%
}

// 應用折扣
if (playerLevel >= 20) {
  finalPrice *= 0.80;
} else if (playerLevel >= 15) {
  finalPrice *= 0.85;
}
// ...以此類推
```

#### 2.4 會員折扣

```javascript
membershipTiers = {
  Bronze: {
    cost: 1000,
    discount: 0.95,  // -5%
    duration: 30     // 30 天
  },
  Silver: {
    cost: 5000,
    discount: 0.90,  // -10%
    duration: 90
  },
  Gold: {
    cost: 15000,
    discount: 0.85,  // -15%
    duration: 365
  },
  Platinum: {
    cost: 50000,
    discount: 0.75,  // -25%
    duration: 365,
    special: '獨家商品訪問權限'
  }
}
```

---

### 規則 3：限時活動與特價

#### 3.1 每日特價

```javascript
dailySpecial = {
  count: 3,  // 每天 3 個特價商品
  discount: 0.7,  // -30%
  refresh: '每天 00:00 刷新',

  selection: () => {
    // 隨機選擇 3 個商品
    return randomPick(allItems, 3);
  }
}
```

**示例**：
```
今日特價（剩餘 8 小時）
├─ 高級重構術：800 → 560 金幣（-30%）
├─ Grep 工具：400 → 280 金幣（-30%）
└─ HP 藥水 x10：1000 → 700 金幣（-30%）
```

#### 3.2 限時促銷

```javascript
promotionTypes = {
  週末促銷: {
    discount: 0.85,  // -15%
    trigger: 'Saturday & Sunday',
    category: 'all'
  },

  節日促銷: {
    discount: 0.75,  // -25%
    trigger: 'special events',
    category: 'selected'
  },

  清倉大甩賣: {
    discount: 0.50,  // -50%
    trigger: 'end of season',
    category: 'old items'
  }
}
```

#### 3.3 捆綁優惠

```javascript
bundles = [
  {
    name: '新手禮包',
    items: ['代碼生成術', 'HP藥水x5', 'MP藥水x5'],
    originalPrice: 500,
    bundlePrice: 300,  // -40%
    requiredLevel: 1
  },
  {
    name: '進階套裝',
    items: ['重構術', '單元測試術', '調試燈籠'],
    originalPrice: 2500,
    bundlePrice: 1800,  // -28%
    requiredLevel: 5
  },
  {
    name: '大師之路',
    items: ['所有專家技能', '稀有夥伴', '10000 經驗'],
    originalPrice: 15000,
    bundlePrice: 10000,  // -33%
    requiredLevel: 15
  }
]
```

---

### 規則 4：購買限制與冷卻

#### 4.1 數量限制

```javascript
purchaseLimits = {
  perTransaction: {
    skill: 5,     // 一次最多買 5 個技能
    tool: 3,
    item: 99,
    companion: 1
  },

  perDay: {
    skill: 10,
    tool: 5,
    item: 無限制,
    companion: 3
  },

  lifetime: {
    skill: 50,    // 終身最多 50 個技能
    tool: 30,
    item: 無限制,
    companion: 10
  }
}
```

#### 4.2 等級需求

```javascript
levelRequirements = {
  基礎商品: 1,
  進階商品: 5,
  專家商品: 10,
  大師商品: 15,
  傳說商品: 20,

  特殊服務: {
    技能鍛造: 5,
    夥伴訓練: 3,
    投資基金: 10
  }
}
```

#### 4.3 購買冷卻

```javascript
cooldowns = {
  稀有商品: 86400,    // 24 小時
  史詩商品: 259200,   // 3 天
  傳說商品: 604800,   // 7 天

  特殊服務: {
    屬性重置: 604800,  // 7 天
    特訓: 604800        // 7 天
  }
}
```

---

### 規則 5：退款與售後

#### 5.1 退款政策

```javascript
refundPolicy = {
  技能: {
    allowed: true,
    condition: '購買後 24 小時內，未使用',
    refundRate: 0.8,  // 退還 80%
    cooldown: 0
  },

  道具: {
    allowed: true,
    condition: '未使用的消耗品',
    refundRate: 0.9,  // 退還 90%
    cooldown: 0
  },

  夥伴: {
    allowed: false,
    reason: '已招募的夥伴無法退款'
  },

  服務: {
    allowed: false,
    reason: '已完成的服務無法退款'
  }
}
```

#### 5.2 商品回購

```javascript
buybackSystem = {
  enabled: true,
  rate: 0.5,  // 按原價 50% 回購

  acceptedItems: [
    'unused_skills',
    'unused_items',
    'equipment'
  ],

  rejectedItems: [
    'companions',
    'consumed_items',
    'services'
  ]
}
```

**示例**：
```
出售：高級重構術
├─ 原購價格：800 金幣
├─ 回購價格：400 金幣（50%）
├─ 條件：未使用
└─ 確認出售？[是] [否]
```

---

### 規則 6：成就與獎勵

#### 6.1 購物成就

```javascript
shoppingAchievements = [
  {
    id: 'first_purchase',
    name: '首次購物',
    condition: '購買任意商品',
    reward: { gold: 100, exp: 50 }
  },
  {
    id: 'big_spender',
    name: '揮金如土',
    condition: '累計消費 10,000 金幣',
    reward: { title: '土豪', discount: 0.95 }  // 永久 -5%
  },
  {
    id: 'collector',
    name: '收藏家',
    condition: '擁有 50 個不同技能',
    reward: { gold: 5000, special: '解鎖隱藏商品' }
  },
  {
    id: 'forge_master',
    name: '鍛造大師',
    condition: '鍛造 20 個自定義技能',
    reward: { title: '鍛造大師', forgeCostReduction: 0.8 }
  }
]
```

#### 6.2 會員獎勵

```javascript
membershipRewards = {
  每日登錄: {
    Bronze: 50,   // +50 金幣
    Silver: 100,
    Gold: 200,
    Platinum: 500
  },

  每週獎勵: {
    Bronze: { gold: 200, item: 'HP藥水x3' },
    Silver: { gold: 500, item: '隨機道具' },
    Gold: { gold: 1000, item: '稀有道具' },
    Platinum: { gold: 3000, item: '史詩道具' }
  },

  生日特典: {
    discount: 0.5,  // 生日當天 -50%
    gift: '隨機傳說道具'
  }
}
```

---

### 規則 7：商店升級系統

#### 7.1 商店等級

```javascript
shopLevels = {
  Lv1: {
    items: 20,          // 20 種商品
    discount: 0,
    special: false
  },
  Lv2: {
    items: 40,
    discount: 0.05,     // 全局 -5%
    special: false,
    upgradeCost: 5000
  },
  Lv3: {
    items: 60,
    discount: 0.10,     // 全局 -10%
    special: true,      // 解鎖特殊商品
    upgradeCost: 15000
  },
  Lv4: {
    items: 80,
    discount: 0.15,
    special: true,
    upgradeCost: 30000
  },
  Lv5: {
    items: 100,         // 所有商品
    discount: 0.20,     // 全局 -20%
    special: true,
    exclusive: true,    // 獨家商品
    upgradeCost: 50000
  }
}
```

#### 7.2 商店聲望

```javascript
shopReputation = {
  levels: [
    { name: '陌生人', threshold: 0, benefit: '無' },
    { name: '熟客', threshold: 5000, benefit: '-5% 折扣' },
    { name: '常客', threshold: 15000, benefit: '-10% 折扣 + 優先訪問' },
    { name: 'VIP', threshold: 50000, benefit: '-15% 折扣 + 獨家商品' },
    { name: '傳說顧客', threshold: 150000, benefit: '-25% 折扣 + 所有特權' }
  ],

  gainMethods: {
    購買: (amount) => amount * 0.1,  // 消費 10 金幣 = 1 聲望
    完成任務: 100,
    推薦好友: 500
  }
}
```

---

## 內部地圖

### 城鎮商店分布圖

```
                    城鎮廣場
                    (Town Square)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   [技能商店]      [技能鍛造]      [知識圖書館]
   Skills Shop    Skill Forge   Knowledge Library
   購買預設技能    自定義技能      MCP 工具
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   [傭兵公會]       [寶庫]          [訓練場]
Mercenary Guild   Treasury    Training Ground
   夥伴管理        道具裝備        升級訓練
        │               │               │
        └───────────────┼───────────────┘
                        │
                    [金庫]
                     Bank
                  存款投資貸款
```

### 技能商店 UI

```
┌─────────────────────────────────────────────────────────┐
│  ⚔️ 技能商店 (Skills Shop)                  💰 3,450   │
├─────────────────────────────────────────────────────────┤
│  分類：[全部] [基礎] [進階] [專家] [特殊]               │
│  排序：[價格▲] [稀有度] [MP消耗] [推薦]                │
│  篩選：等級 Lv.1+ | 價格 0-5000                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │ 💚 代碼生成術       │  │ 🔵 高級重構術       │     │
│  │ 價格：100 金幣      │  │ 價格：800 → 560 📉  │     │
│  │ MP：10             │  │ MP：25              │     │
│  │ 稀有度：⚪ Common   │  │ 稀有度：🔵 Rare     │     │
│  │ 需求：Lv.1         │  │ 需求：Lv.8          │     │
│  │                    │  │ 今日特價！剩餘 5h   │     │
│  │ [購買] [詳情]      │  │ [購買] [詳情]       │     │
│  └─────────────────────┘  └─────────────────────┘     │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │ 🟣 完美調試術       │  │ 🟠 傳說重構龍       │     │
│  │ 價格：1,500 金幣    │  │ 價格：5,000 金幣    │     │
│  │ MP：30             │  │ MP：50              │     │
│  │ 稀有度：🟣 Epic     │  │ 稀有度：🟠 Legendary│     │
│  │ 需求：Lv.12        │  │ 需求：Lv.20 🔒     │     │
│  │                    │  │ 等級不足            │     │
│  │ [購買] [詳情]      │  │ [詳情]              │     │
│  └─────────────────────┘  └─────────────────────┘     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  購物車（2）：代碼生成術 + 高級重構術 = 660 金幣       │
│  [清空] [結帳]                                          │
└─────────────────────────────────────────────────────────┘
```

### 技能鍛造 UI

```
┌─────────────────────────────────────────────────────────┐
│  🔨 技能鍛造 (Skill Forge)                 💰 3,450    │
│  「創造屬於你自己的獨特技能」                            │
├─────────────────────────────────────────────────────────┤
│  步驟：[1.類型] → [2.參數] → [3.特效] → [4.MP] → [5.命名] → [6.支付] │
├─────────────────────────────────────────────────────────┤
│  當前進度：步驟 3/6                                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  已選擇：                                        │   │
│  │  類型：攻擊型                                    │   │
│  │  基礎傷害：150                                   │   │
│  │  範圍：單體                                      │   │
│  │  冷卻：3 回合                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  步驟 3：選擇技能特效（最多 3 個）                       │
│                                                         │
│  ☑️ 代碼質量 +20%（+100 金幣）                          │
│  ☐ 額外傷害 +30（+150 金幣）                           │
│  ☐ 降低敵人防禦 -20%（+200 金幣）                       │
│  ☐ 自動修復 Bug（+300 金幣）                           │
│                                                         │
│  預估成本：                                              │
│  ├─ 基礎鍛造費：500                                     │
│  ├─ MP 成本（20 MP）：400                              │
│  ├─ 特效費用：100                                       │
│  └─ 總計：1,000 金幣                                   │
│                                                         │
│  [上一步] [下一步] [取消]                               │
└─────────────────────────────────────────────────────────┘
```

### 金庫 UI

```
┌─────────────────────────────────────────────────────────┐
│  🏦 金庫 (Bank)                         💰 8,450       │
├─────────────────────────────────────────────────────────┤
│  [存款] [貸款] [投資] [歷史記錄]                        │
├─────────────────────────────────────────────────────────┤
│  活期存款                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  當前存款：5,000 金幣                            │   │
│  │  日利率：5%                                      │   │
│  │  今日利息：+250 金幣                             │   │
│  │  累計利息：1,230 金幣                            │   │
│  │                                                  │   │
│  │  [追加存款] [提取]                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  定期存款                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⏰ 7 天定存（10% 總利息）                       │   │
│  │     最低 1,000 金幣                              │   │
│  │     [立即開戶]                                   │   │
│  │                                                  │   │
│  │  ⏰ 30 天定存（50% 總利息）⭐ 推薦               │   │
│  │     最低 5,000 金幣                              │   │
│  │     [立即開戶]                                   │   │
│  │                                                  │   │
│  │  ⏰ 90 天定存（200% 總利息）🔥 超值              │   │
│  │     最低 10,000 金幣                             │   │
│  │     [立即開戶]                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  貸款                                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  可貸金額：最多 10,000 金幣（Lv.10）            │   │
│  │  利率：10%                                       │   │
│  │  還款期限：7 天                                  │   │
│  │  逾期罰息：每天 +5%                              │   │
│  │                                                  │   │
│  │  申請金額：[_____] 金幣                          │   │
│  │  需還總額：_____ 金幣                            │   │
│  │                                                  │   │
│  │  [申請貸款]                                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 系統整合

### 與經濟系統整合

**金幣流動**：
```javascript
// 收入來源
goldSources = {
  戰鬥勝利: (enemy) => enemy.level * 50,
  完成任務: (quest) => quest.reward,
  出售道具: (item) => item.value * 0.5,
  銀行利息: (deposit) => deposit * 0.05
}

// 支出用途
goldExpenses = {
  購買技能: (skill) => skill.price,
  購買道具: (item) => item.price,
  升級服務: (service) => service.cost,
  銀行貸款還款: (loan) => loan.amount * 1.1
}

// 金幣餘額檢查
function canAfford(price) {
  return player.gold >= price;
}

// 交易處理
function processPurchase(item, price) {
  if (!canAfford(price)) {
    return { success: false, error: '金幣不足' };
  }

  player.gold -= price;
  player.inventory.add(item);
  updateShopReputation(price);

  return { success: true };
}
```

### 與技能系統整合

**技能購買與解鎖**：
```javascript
// 購買技能
function buySkill(skillId) {
  const skill = skillShop.getSkill(skillId);

  // 檢查條件
  if (player.level < skill.requiredLevel) {
    return { error: '等級不足' };
  }

  if (!canAfford(skill.price)) {
    return { error: '金幣不足' };
  }

  if (player.skills.length >= 50) {
    return { error: '技能欄已滿' };
  }

  // 購買成功
  player.gold -= skill.price;
  player.skills.add(skill);

  // 記錄成就
  checkShoppingAchievements();

  return { success: true };
}

// 技能升級
function upgradeSkill(skillId) {
  const skill = player.skills.find(s => s.id === skillId);
  const cost = calculateUpgradeCost(skill);

  if (!canAfford(cost)) {
    return { error: '金幣不足' };
  }

  player.gold -= cost;
  skill.level++;
  skill.updateStats();

  // 檢查是否解鎖召喚獸
  if (skill.level === 3) {
    unlockSkillSummon(skill);
  }

  return { success: true };
}
```

### 與夥伴系統整合

**夥伴招募與訓練**：
```javascript
// 招募夥伴
function recruitCompanion(companionId) {
  const companion = mercenaryGuild.getCompanion(companionId);
  const price = calculateCompanionPrice(companion);

  if (player.companions.length >= 3) {
    return { error: '夥伴數量已達上限' };
  }

  if (!canAfford(price)) {
    return { error: '金幣不足' };
  }

  player.gold -= price;
  player.companions.add(companion);

  return { success: true };
}

// 訓練夥伴
function trainCompanion(companionId) {
  const companion = player.companions.find(c => c.id === companionId);
  const cost = 200 * companion.level;

  if (!canAfford(cost)) {
    return { error: '金幣不足' };
  }

  player.gold -= cost;
  companion.exp += 100;
  companion.checkLevelUp();

  return { success: true };
}
```

### 與道具系統整合

**道具購買與使用**：
```javascript
// 購買道具
function buyItem(itemId, quantity = 1) {
  const item = treasury.getItem(itemId);
  const totalPrice = item.price * quantity;

  // 批量折扣
  const discount = getBulkDiscount(quantity);
  const finalPrice = Math.floor(totalPrice * discount);

  if (!canAfford(finalPrice)) {
    return { error: '金幣不足' };
  }

  player.gold -= finalPrice;
  player.inventory.addItem(item, quantity);

  return { success: true, saved: totalPrice - finalPrice };
}

// 道具回購
function sellItem(itemId, quantity = 1) {
  const item = player.inventory.getItem(itemId);

  if (!item || item.quantity < quantity) {
    return { error: '道具不足' };
  }

  const sellPrice = Math.floor(item.price * 0.5 * quantity);

  player.gold += sellPrice;
  player.inventory.removeItem(itemId, quantity);

  return { success: true, earned: sellPrice };
}
```

### 與成就系統整合

**購物成就檢查**：
```javascript
function checkShoppingAchievements() {
  const stats = player.stats;

  // 首次購物
  if (stats.totalPurchases === 1) {
    unlockAchievement('first_purchase');
  }

  // 累計消費
  if (stats.totalSpent >= 10000) {
    unlockAchievement('big_spender');
  }

  // 技能收藏
  if (player.skills.length >= 50) {
    unlockAchievement('collector');
  }

  // 鍛造大師
  if (stats.customSkillsForged >= 20) {
    unlockAchievement('forge_master');
  }
}

// 會員等級檢查
function checkMembershipTier() {
  const totalSpent = player.stats.totalSpent;

  if (totalSpent >= 150000) {
    upgradeMembership('Legendary');
  } else if (totalSpent >= 50000) {
    upgradeMembership('VIP');
  } else if (totalSpent >= 15000) {
    upgradeMembership('Regular');
  } else if (totalSpent >= 5000) {
    upgradeMembership('Familiar');
  }
}
```

---

## 設計決策

### 決策 1：為什麼需要 7 個商店？

**背景**：
商店系統可以是單一商店或多個專門商店。

**考慮方案**：
1. **單一萬能商店**：所有商品在一個地方
   - ✅ 簡單方便
   - ❌ 商品太雜亂
   - ❌ 缺乏沉浸感

2. **3-4 個基礎商店**：技能、道具、服務
   - ✅ 有基本分類
   - ❌ 功能仍不夠明確
   - ❌ 缺乏特色

3. **7 個專門商店** ⭐
   - ✅ 每個商店功能明確
   - ✅ 角色扮演沉浸感強
   - ✅ 給玩家探索樂趣
   - ⚠️ 需要更多 UI 和資源

**最終決定**：7 個專門商店

**理由**：
1. 技能商店 vs 技能鍛造：購買 vs 創造分離
2. 知識圖書館：MCP 工具有獨立價值
3. 傭兵公會：夥伴系統需要專門管理
4. 寶庫：道具和裝備數量龐大
5. 訓練場：升級服務需要獨立空間
6. 金庫：經濟系統的核心（存款/貸款/投資）
7. 每個商店都有獨特的 NPC 和故事

### 決策 2：為什麼允許自定義鍛造技能？

**背景**：
玩家是否應該能創建自己的技能？

**考慮方案**：
1. **只能購買預設技能**
   - ✅ 平衡性好控制
   - ❌ 缺乏個性化
   - ❌ 創造力受限

2. **完全自由創建**
   - ✅ 高度自由
   - ❌ 平衡性難以控制
   - ❌ 可能出現 Bug

3. **受限的自定義系統** ⭐
   - ✅ 有創造空間
   - ✅ 平衡性可控（參數上限）
   - ✅ 增加遊戲深度
   - ⚠️ 需要完善的驗證系統

**最終決定**：受限的自定義系統

**理由**：
1. 給玩家創造的樂趣
2. 參數有上限保證平衡
3. 鍛造有成本（金幣 + 冷卻）
4. 鼓勵玩家實驗和優化
5. 增加遊戲可玩性和重玩價值

### 決策 3：為什麼需要動態定價？

**背景**：
商品價格應該固定還是動態？

**考慮方案**：
1. **完全固定價格**
   - ✅ 簡單直接
   - ❌ 缺乏經濟深度
   - ❌ 無市場感

2. **玩家驅動市場**（供需決定）
   - ✅ 真實經濟
   - ❌ 複雜度過高
   - ❌ 難以平衡

3. **有限動態定價** ⭐
   - ✅ 有經濟變化感
   - ✅ 複雜度適中
   - ✅ 獎勵等級/會員/聲望
   - ⚠️ 需要平衡算法

**最終決定**：有限動態定價

**包含因素**：
1. 稀有度倍數（固定）
2. 玩家等級折扣（鼓勵成長）
3. 會員等級折扣（鼓勵付費）
4. 商店聲望折扣（鼓勵購物）
5. 限時促銷（製造緊迫感）
6. 需求調整（熱門商品漲價）

### 決策 4：為什麼需要銀行系統？

**背景**：
是否需要存款/貸款/投資功能？

**考慮方案**：
1. **無銀行系統**：金幣只能花掉
   - ✅ 簡單
   - ❌ 缺乏理財深度
   - ❌ 金幣只能通脹

2. **簡單存款**：僅允許存錢獲利息
   - ✅ 有基礎理財
   - ❌ 功能單一
   - ❌ 缺乏策略性

3. **完整銀行系統** ⭐
   - ✅ 存款：被動收入
   - ✅ 貸款：應急資金
   - ✅ 投資：風險與收益
   - ✅ 定期：長期規劃
   - ⚠️ 需要平衡利率

**最終決定**：完整銀行系統

**理由**：
1. 給金幣更多用途（不只是消費）
2. 被動收入鼓勵長期遊玩
3. 貸款提供短期資金靈活性
4. 投資增加風險管理深度
5. 模擬真實經濟體驗

### 決策 5：為什麼允許退款？

**背景**：
購買的商品是否可以退款？

**考慮方案**：
1. **不允許退款**
   - ✅ 防止濫用
   - ❌ 用戶體驗差
   - ❌ 誤購無法補救

2. **完全退款**
   - ✅ 用戶體驗好
   - ❌ 可能被濫用
   - ❌ 失去購買決策意義

3. **有限退款政策** ⭐
   - ✅ 保護誤購用戶
   - ✅ 防止濫用（24h + 未使用）
   - ✅ 有退款成本（退 80%）
   - ✅ 部分商品不可退（夥伴）

**最終決定**：有限退款政策

**條件**：
1. 技能/道具：24h 內 + 未使用 → 退 80%
2. 夥伴/服務：不可退款
3. 商品回購：按 50% 價格
4. 特殊商品：視情況而定

---

**文檔完成日期**: 2026-02-06
**總字數**: ~6,500
**章節**: 6
**來源文件**: `/docs/design/shop-system/requirements.md` (624 lines)
