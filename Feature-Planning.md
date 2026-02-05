# RPG-CLI 功能規劃文檔

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**狀態**: 功能規劃階段

---

## 目錄

1. [功能優先級分層](#功能優先級分層)
2. [實作時程規劃](#實作時程規劃)
3. [功能設計調整建議](#功能設計調整建議)
4. [關鍵設計原則](#關鍵設計原則)

---

## 功能優先級分層

### 第一階段：核心MVP（必要功能）

#### 1. 基礎對話系統 ⭐⭐⭐⭐⭐

**優先級**: 最高
**為什麼優先**: 這是整個系統的核心價值

**功能清單**:
- [ ] CLI整合層（調用 claude-cli/gemini-cli）
- [ ] WebSocket實時通訊
- [ ] 訊息串流顯示（打字機效果）
- [ ] 對話歷史記錄（session管理）
- [ ] 基本錯誤處理
- [ ] 連線狀態顯示

**技術要點**:
```javascript
// 後端調用CLI範例
const { spawn } = require('child_process');

function callClaudeCLI(prompt, stream = true) {
  const claude = spawn('claude', ['-p', prompt, '--stream']);

  claude.stdout.on('data', (data) => {
    wsConnection.send({
      type: 'ai_response_chunk',
      data: data.toString()
    });
  });

  return claude;
}
```

---

#### 2. 簡化版角色系統 ⭐⭐⭐⭐

**優先級**: 高
**為什麼優先**: 提供基本的遊戲化感受

**功能清單**:
- [ ] 單一通用角色（不做複雜職業選擇）
- [ ] 基礎屬性顯示面板
- [ ] HP顯示（API配額剩餘）
- [ ] MP顯示（當前session token使用量）
- [ ] Level顯示（基於對話次數簡單計算）
- [ ] 角色名稱自定義

**屬性設計**:
```javascript
{
  player: {
    name: "勇者",           // 用戶自定義
    level: 1,              // 初始固定為1，後續基於對話次數計算
    class: "通用",         // MVP階段固定
    hp: {
      current: 80,         // 對應API配額剩餘
      max: 100
    },
    mp: {
      current: 60,         // 當前session token使用
      max: 100
    }
  }
}
```

**UI設計**:
```
┌─────────────────┐
│ 勇者  Lv.1      │
│ ❤❤❤❤❤ HP: 100  │  ← 像素化心型HP
│ ⚡⚡⚡⚡⚡ MP: 100  │  ← 閃電型MP
└─────────────────┘
```

---

#### 3. 快捷技能系統（Prompt模板） ⭐⭐⭐⭐

**優先級**: 高
**為什麼優先**: 大幅提升使用效率

**預設技能列表**:

| 技能名稱 | 圖標 | Prompt模板 | 參數 |
|---------|------|-----------|------|
| 代碼生成 | ⚔️ | 請幫我用{語言}實現{功能} | 語言、功能 |
| 代碼審查 | 🔍 | 請審查以下代碼並提供改進建議：\n{代碼} | 代碼內容 |
| Bug診斷 | 🐛 | 請幫我找出這段代碼的問題：\n{代碼} | 代碼內容 |
| 文案撰寫 | 📜 | 請幫我撰寫{類型}的文案，主題是{主題} | 類型、主題 |
| 翻譯潤色 | ✨ | 請將以下內容{操作}：\n{內容} | 操作、內容 |

**功能清單**:
- [ ] 預設5個常用技能
- [ ] 一鍵使用技能
- [ ] 支持參數輸入（彈窗或內聯輸入）
- [ ] 技能施放動畫效果
- [ ] MP消耗顯示

**資料結構**:
```javascript
{
  skills: [
    {
      id: 'code_gen',
      name: '代碼生成',
      icon: '⚔️',
      mpCost: 10,
      template: '請幫我用{lang}實現{feature}',
      params: [
        { name: 'lang', label: '程式語言', type: 'text', placeholder: 'JavaScript' },
        { name: 'feature', label: '功能描述', type: 'textarea', placeholder: '一個計數器' }
      ],
      unlocked: true,
      usageCount: 0
    }
  ]
}
```

---

#### 4. 基礎像素風UI ⭐⭐⭐⭐

**優先級**: 高
**為什麼優先**: 建立視覺識別度

**功能清單**:
- [ ] 對話框像素邊框樣式
- [ ] HP/MP像素風進度條
- [ ] 像素字體應用（Press Start 2P）
- [ ] 基本音效系統（可選開關）
  - [ ] 打字音效
  - [ ] 技能施放音效
  - [ ] 升級音效
- [ ] 像素化按鈕與互動元素

**核心CSS**:
```css
/* 像素字體 */
.pixel-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  image-rendering: pixelated;
}

/* 對話框 */
.dialog-box {
  background: #2C2C3E;
  border: 4px solid #8B8B8B;
  box-shadow:
    inset -2px -2px 0 #1A1A24,
    inset 2px 2px 0 #F0F0F0;
  padding: 16px;
}

/* 進度條 */
.hp-bar {
  width: 200px;
  height: 16px;
  background: #1A1A24;
  border: 2px solid #8B8B8B;
}

.hp-fill {
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    #FF4444 0px,
    #FF4444 4px,
    #CC3333 4px,
    #CC3333 8px
  );
  transition: width 0.3s steps(10);
}
```

**主界面佈局**:
```
┌────────────────────────────────────────────────┐
│  [💰金幣: 1250]  [❤️ HP: 80/100]  [⭐MP: 60/100] │
│  Lv.1 勇者                        [⚙️設定] [📖] │
├────────────────────────────────────────────────┤
│                                                │
│   ╔════════════════════════════════════╗      │
│   ║  🧙 魔法師 Claude                   ║      │
│   ║  ┌──────────────────────────────┐  ║      │
│   ║  │ 勇者，你需要什麼幫助？        │  ║      │
│   ║  │                              │  ║      │
│   ║  │ [對話內容逐字顯示...]         │  ║      │
│   ║  └──────────────────────────────┘  ║      │
│   ╚════════════════════════════════════╝      │
│                                                │
│   ┌─────────────────────────────────────┐     │
│   │  [輸入框: 告訴魔法師你的需求...]    │     │
│   └─────────────────────────────────────┘     │
│                                                │
│   快捷技能:                                    │
│   [⚔️代碼生成] [📜文案] [🔍審查] [💡靈感]       │
│                                                │
└────────────────────────────────────────────────┘
```

---

### MVP階段不做的功能

**明確排除（避免過度設計）**:
- ❌ 複雜的職業系統（先用單一通用角色）
- ❌ 經驗值升級系統（先固定等級或簡單計算）
- ❌ 任務系統（太複雜，非核心價值）
- ❌ 成就系統（非核心價值）
- ❌ 背包系統（可用簡單的「收藏夾」替代）
- ❌ 地圖系統（純裝飾，沒有實際功能價值）
- ❌ 多人/社交功能（技術成本高）

---

## 第二階段：遊戲化增強（1-2個月後）

### 5. 進階技能系統 ⭐⭐⭐

**功能清單**:
- [ ] 技能分類與分頁（開發/寫作/設計）
- [ ] 自定義技能/Prompt模板
- [ ] 技能收藏與快捷鍵綁定
- [ ] 技能使用次數統計
- [ ] 技能推薦（基於使用習慣）
- [ ] 技能匯入/匯出（JSON格式）

**自定義技能介面**:
```
┌─────────────────────────────┐
│  新增自定義技能              │
├─────────────────────────────┤
│  技能名稱: [____________]   │
│  圖標: [🎯]  [選擇圖標▼]    │
│  MP消耗: [10]              │
│                             │
│  Prompt模板:                │
│  ┌─────────────────────┐   │
│  │請幫我...            │   │
│  │{參數1}              │   │
│  └─────────────────────┘   │
│                             │
│  參數設定:                  │
│  + 新增參數                 │
│                             │
│  [取消]  [儲存技能]         │
└─────────────────────────────┘
```

---

### 6. 等級與成長系統 ⭐⭐⭐

**經驗值計算方式**:
```javascript
function calculateEXP(conversation) {
  let exp = 0;

  // 基礎經驗：每次對話
  exp += 10;

  // Token使用量經驗
  exp += Math.floor(conversation.tokens / 100);

  // 對話品質評分（用戶可手動給星）
  if (conversation.userRating) {
    exp += conversation.userRating * 5;
  }

  // 連續使用獎勵
  if (user.consecutiveDays >= 7) {
    exp *= 1.5;
  }

  return exp;
}
```

**等級計算**:
```javascript
function calculateLevel(totalEXP) {
  // 簡單的等級公式
  return Math.floor(Math.sqrt(totalEXP / 100)) + 1;
}

function getEXPForNextLevel(currentLevel) {
  return (currentLevel * currentLevel) * 100;
}
```

**升級效果**:
- [ ] 解鎖新技能（每5級解鎖一個進階技能）
- [ ] 增加每日配額（HP上限提升）
- [ ] 視覺特效升級（更華麗的動畫）
- [ ] 稱號系統（Lv.10: 見習冒險者 → Lv.50: 傳奇大師）

**等級里程碑**:
```
Lv.1  - 新手冒險者
Lv.5  - 解鎖「代碼重構」技能
Lv.10 - 見習冒險者 + HP上限+20
Lv.20 - 熟練冒險者 + 解鎖「架構設計」技能
Lv.30 - 精英冒險者 + HP上限+50
Lv.50 - 傳奇大師 + 解鎖「AI結對編程」技能
```

---

### 7. 對話管理強化 ⭐⭐⭐⭐

**功能清單**:
- [ ] 對話歷史搜尋（全文搜尋）
- [ ] 對話標籤分類
- [ ] 重要對話釘選/收藏
- [ ] 對話匯出（Markdown/JSON/TXT）
- [ ] 對話分享（生成唯讀分享連結）
- [ ] 對話統計儀表板

**歷史介面設計**:
```
┌────────────────────────────────────┐
│  對話歷史  [🔍搜尋...]  [📋全部▼]  │
├────────────────────────────────────┤
│  📌 今天                            │
│  ┌──────────────────────────────┐ │
│  │ 🔖 React Hook優化建議         │ │
│  │ 30分鐘前 · 150 tokens         │ │
│  │ [📋複製] [⭐收藏] [🗑️刪除]     │ │
│  └──────────────────────────────┘ │
│                                    │
│  📅 昨天                            │
│  ┌──────────────────────────────┐ │
│  │ 💻 API設計討論                │ │
│  │ 1天前 · 320 tokens            │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

**對話統計**:
- 總對話次數
- 總Token使用量
- 最常使用的技能
- 對話時間分佈圖
- 平均對話長度

---

### 8. 多模型支持 ⭐⭐⭐

**功能清單**:
- [ ] Claude / Gemini 切換
- [ ] 不同模型用不同NPC呈現
- [ ] 模型比較模式（同時問兩個AI）
- [ ] 模型特性說明
- [ ] 自動模型推薦（基於任務類型）

**NPC設計**:
```javascript
const npcs = {
  claude: {
    name: '智慧魔法師 Claude',
    avatar: '🧙‍♂️',
    description: '擅長深度思考和代碼推理',
    specialty: ['代碼生成', '邏輯推理', '長文寫作']
  },
  gemini: {
    name: '知識賢者 Gemini',
    avatar: '🧙‍♀️',
    description: '擅長多模態理解和快速回應',
    specialty: ['圖片理解', '即時問答', '多語言']
  }
}
```

**模型切換UI**:
```
┌─────────────────────────┐
│  選擇AI助手              │
├─────────────────────────┤
│  ⚫ 🧙‍♂️ Claude          │
│     擅長：代碼、推理     │
│                         │
│  ⚪ 🧙‍♀️ Gemini         │
│     擅長：圖片、快速     │
│                         │
│  [確認切換]             │
└─────────────────────────┘
```

---

## 第三階段：社交與擴展（3個月後）

### 9. 任務與成就系統 ⭐⭐

**簡化版任務系統**:

**每日任務（3個簡單目標）**:
```javascript
const dailyQuests = [
  {
    id: 'daily_chat_3',
    title: '📖 每日修行',
    description: '完成3次對話',
    progress: 0,
    goal: 3,
    reward: { exp: 50, gold: 10 }
  },
  {
    id: 'daily_skill',
    title: '⚔️ 技能訓練',
    description: '使用任意技能5次',
    progress: 0,
    goal: 5,
    reward: { exp: 30, item: 'skill_scroll' }
  },
  {
    id: 'daily_streak',
    title: '🔥 持續精進',
    description: '連續使用3天',
    progress: 2,
    goal: 3,
    reward: { exp: 100, title: '堅持者' }
  }
]
```

**主線任務（長期目標）**:
```javascript
const mainQuests = [
  {
    id: 'main_chat_100',
    title: '📚 百問通',
    description: '累計完成100次對話',
    progress: 45,
    goal: 100,
    reward: { exp: 500, skill: 'advanced_prompt', title: '博學者' }
  },
  {
    id: 'main_level_20',
    title: '🎖️ 晉升之路',
    description: '達到20級',
    progress: 8,
    goal: 20,
    reward: { job: 'specialist', hp_max_bonus: 50 }
  }
]
```

**成就系統**:
```javascript
const achievements = [
  {
    id: 'first_chat',
    name: '🌟 初次相遇',
    description: '完成首次對話',
    unlocked: true,
    unlockedAt: '2026-02-05'
  },
  {
    id: 'week_streak',
    name: '🔥 七日修行',
    description: '連續使用7天',
    unlocked: false,
    progress: 3,
    goal: 7
  },
  {
    id: 'token_master',
    name: '💎 Token大師',
    description: '單次對話使用超過1000 tokens',
    unlocked: false
  },
  {
    id: 'night_owl',
    name: '🦉 夜貓子',
    description: '深夜12點後使用',
    unlocked: false,
    hidden: true
  }
]
```

---

### 10. 職業系統 ⭐⭐

**為什麼延後**: 實際上差異不大，容易變成噱頭

**3個職業設計**:

#### 開發者 (Developer)
```javascript
{
  id: 'developer',
  name: '開發者',
  icon: '⚔️',
  description: '擅長代碼生成、Debug、架構設計',
  theme: {
    primaryColor: '#4A90E2',
    accentColor: '#50C878'
  },
  startingSkills: [
    'code_gen',
    'bug_fix',
    'code_review',
    'refactor',
    'test_gen'
  ],
  skillTree: {
    basic: ['代碼生成', 'Bug診斷'],
    advanced: ['代碼重構', '性能優化'],
    ultimate: ['架構設計', 'AI結對編程']
  }
}
```

#### 寫作者 (Writer)
```javascript
{
  id: 'writer',
  name: '寫作者',
  icon: '📜',
  description: '擅長文案創作、內容生成、翻譯潤色',
  theme: {
    primaryColor: '#E27D60',
    accentColor: '#C38D9E'
  },
  startingSkills: [
    'content_write',
    'translate',
    'polish',
    'brainstorm',
    'seo_optimize'
  ],
  skillTree: {
    basic: ['文案撰寫', '翻譯'],
    advanced: ['內容潤色', 'SEO優化'],
    ultimate: ['創意湧現', '品牌文案']
  }
}
```

#### 設計師 (Designer)
```javascript
{
  id: 'designer',
  name: '設計師',
  icon: '🎨',
  description: '擅長UI/UX建議、設計諮詢、用戶體驗分析',
  theme: {
    primaryColor: '#9B59B6',
    accentColor: '#F39C12'
  },
  startingSkills: [
    'ui_advice',
    'ux_analysis',
    'color_suggest',
    'layout_design',
    'accessibility'
  ],
  skillTree: {
    basic: ['設計建議', 'UX分析'],
    advanced: ['配色方案', '無障礙設計'],
    ultimate: ['美學洞察', '品牌設計']
  }
}
```

**職業功能**:
- [ ] 初始選擇職業
- [ ] 職業轉換功能（需消耗金幣或達到特定等級）
- [ ] 職業專屬UI主題
- [ ] 職業專屬技能樹
- [ ] 職業成就系統

---

### 11. 背包與收藏系統 ⭐⭐

**簡化為「收藏庫」而非背包格子**:

**功能清單**:
- [ ] Prompt模板收藏庫
- [ ] 常用回應收藏夾
- [ ] 程式碼片段收藏
- [ ] 分類與標籤管理
- [ ] 搜尋與過濾
- [ ] 匯入/匯出（JSON格式）

**資料結構**:
```javascript
{
  collections: {
    prompts: [
      {
        id: 'prompt_001',
        name: 'React組件生成器',
        category: 'code',
        tags: ['react', 'component', 'javascript'],
        content: '請幫我生成一個React組件...',
        usageCount: 15,
        createdAt: '2026-02-01',
        favorite: true
      }
    ],
    responses: [
      {
        id: 'response_001',
        name: 'useState Hook解釋',
        category: 'knowledge',
        tags: ['react', 'hooks'],
        content: '# useState Hook\n\nuseState是...',
        conversationId: 'conv_123',
        createdAt: '2026-02-03'
      }
    ],
    snippets: [
      {
        id: 'snippet_001',
        name: '快速排序算法',
        language: 'javascript',
        tags: ['algorithm', 'sort'],
        code: 'function quickSort(arr) { ... }',
        createdAt: '2026-02-04'
      }
    ]
  }
}
```

**UI設計**:
```
┌────────────────────────────────────┐
│  📚 我的收藏  [🔍搜尋] [+新增]      │
├────────────────────────────────────┤
│  📋 分類:  [全部▼]  [標籤▼]        │
├────────────────────────────────────┤
│  📌 Prompt模板 (12)                │
│  ┌──────────────────────────────┐ │
│  │ ⭐ React組件生成器            │ │
│  │ 🏷️ react, component          │ │
│  │ 使用15次 · 2天前              │ │
│  └──────────────────────────────┘ │
│                                    │
│  💾 程式碼片段 (8)                 │
│  ┌──────────────────────────────┐ │
│  │ 快速排序算法 (JavaScript)     │ │
│  │ 🏷️ algorithm, sort           │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

---

### 12. 社交功能 ⭐

**為什麼優先級最低**: 需要後端支持，技術成本高，且價值有限

**可選功能**:
- [ ] Prompt模板社群分享
- [ ] 公開技能庫（瀏覽他人分享的技能）
- [ ] 使用統計排行榜（可選匿名）
- [ ] 社群投稿功能
- [ ] 每週精選模板

**社群模板範例**:
```javascript
{
  communityTemplates: [
    {
      id: 'template_001',
      name: '完美的Git Commit訊息生成器',
      author: 'CodeMaster',
      authorAvatar: '⚔️',
      likes: 245,
      downloads: 1032,
      rating: 4.8,
      category: 'development',
      tags: ['git', 'commit', 'best-practice'],
      template: '請根據以下代碼變更生成符合Conventional Commits規範的commit訊息...',
      createdAt: '2026-01-15'
    }
  ]
}
```

---

## 實作時程規劃

### Week 1-2: 最小可用原型
- [ ] Node.js + Express 後端搭建
- [ ] CLI整合基礎（能調用並顯示結果）
- [ ] WebSocket實時通訊設定
- [ ] 簡單的React前端框架
- [ ] 基礎對話介面（無RPG元素）
- [ ] 環境設定與部署流程

**里程碑**: 能成功調用CLI並在網頁顯示回應

---

### Week 3-4: RPG視覺包裝
- [ ] 像素風UI實作
- [ ] HP/MP顯示系統（對應API配額）
- [ ] 打字機效果實現
- [ ] 基本音效系統
- [ ] 簡單動畫效果
- [ ] 角色屬性面板

**里程碑**: 具備完整的RPG視覺風格

---

### Week 5-6: 技能系統
- [ ] Prompt模板管理功能
- [ ] 5個預設快捷技能
- [ ] 技能施放動畫
- [ ] 參數輸入介面
- [ ] MP消耗計算
- [ ] 技能使用統計

**里程碑**: 用戶可以使用快捷技能提升效率

---

### Week 7-8: 數據持久化
- [ ] LocalStorage存儲實作
- [ ] 對話歷史記錄功能
- [ ] 使用統計追蹤
- [ ] 簡單的等級計算
- [ ] 數據匯出功能
- [ ] 設定與偏好儲存

**里程碑**: MVP完成，可以開始用戶測試

---

### Week 9-12: 遊戲化增強
- [ ] 經驗值與升級系統
- [ ] 自定義技能功能
- [ ] 對話歷史搜尋
- [ ] 對話標籤與收藏
- [ ] 使用統計儀表板
- [ ] 多模型支持（Claude + Gemini）

**里程碑**: 完整的第二階段功能

---

### Week 13+: 擴展功能（視情況）
- [ ] 任務系統
- [ ] 成就系統
- [ ] 職業系統
- [ ] 收藏庫系統
- [ ] 社群功能（可選）

**里程碑**: 產品功能完善

---

## 功能設計調整建議

### 從原始文檔調整的部分

#### 1. 地圖系統 → 模式切換

**原設計（過於複雜）**:
```
        🏔️ 代碼山脈
              │
    🏛️────────┼────────🌲
              │
         🎨 創作森林
```

**調整後（簡單實用）**:
```
┌─────────────────────────────┐
│ [💻代碼] [📝寫作] [🎨設計]  │  ← 頂部Tab切換
└─────────────────────────────┘

- 代碼模式：預設顯示開發相關技能
- 寫作模式：預設顯示寫作相關技能
- 設計模式：預設顯示設計相關技能
```

---

#### 2. 職業系統 → 預設配置

**原設計**: 不同職業有實際能力差異
**調整後**: 職業只是UI主題 + 預設技能集

**理由**:
- 避免強制限制（所有技能都可解鎖）
- 職業只是初始配置的快速選擇
- 降低設計複雜度
- 用戶可隨時切換職業主題

---

#### 3. 背包系統 → 收藏列表

**原設計（模擬遊戲背包）**:
```
┌─────┬─────┬─────┬─────┐
│ 📋  │ 🔖  │ 💾  │ 🎁  │
│模板A│模板B│存檔1│神秘箱│
├─────┼─────┼─────┼─────┤
│ 📌  │ ⚡  │ 🌟  │     │
│書籤 │加速卡│經驗書│     │
└─────┴─────┴─────┴─────┘
```

**調整後（簡單列表）**:
```
📚 我的收藏
  📁 Prompt模板
    - React組件生成器
    - API設計助手
  📁 程式碼片段
    - 快速排序算法
    - Redux範例
  📁 常用回應
    - Hook使用說明
```

**理由**:
- 列表比格子更適合Web介面
- 支援搜尋與過濾
- 易於擴展與管理
- 開發成本低

---

#### 4. 任務系統 → 每日目標

**原設計**: 複雜的主線/支線任務鏈
**調整後**: 簡單的每日3目標

**範例**:
```
📋 今日目標
  ✅ 完成3次對話 (3/3)
  ⏳ 使用技能5次 (2/5)
  ⏳ 連續使用3天 (2/3)
```

**理由**:
- 簡單明確
- 容易實作
- 提供成就感
- 不會造成壓力

---

## 關鍵設計原則

### 1. 聚焦核心價值

**核心價值**: 讓AI對話更高效 + 更有趣

**優先做**:
✅ 提升效率的功能（快捷技能、歷史搜尋）
✅ 提供即時回饋的功能（進度條、音效）
✅ 降低使用門檻的功能（預設模板）

**延後做**:
❌ 純裝飾性功能（地圖系統）
❌ 複雜但效益低的功能（多人模式）
❌ 需要大量內容製作的功能（劇情模式）

---

### 2. 技術債務控制

**避免過度設計**:
- ❌ 不要一開始就做完整的職業系統
- ❌ 不要做太複雜的數值平衡
- ❌ 不要做需要大量素材的功能

**保持彈性**:
- ✅ 模組化設計，功能可插拔
- ✅ API抽象層，方便切換CLI工具
- ✅ UI組件化，方便主題切換
- ✅ 數據結構設計考慮擴展性

**範例 - 抽象CLI調用**:
```javascript
// 抽象層設計
class AIProvider {
  constructor(type) {
    this.type = type; // 'claude' or 'gemini'
  }

  async chat(prompt, options) {
    // 統一介面，內部根據type調用不同CLI
  }
}

// 使用時
const ai = new AIProvider('claude');
await ai.chat('Hello');

// 切換模型只需改一行
const ai = new AIProvider('gemini');
```

---

### 3. 數據驅動迭代

**MVP上線後追蹤指標**:
- 📊 哪些技能最常被使用？
- 📊 用戶平均對話長度？
- 📊 哪些功能從未使用？
- 📊 用戶留存率如何？
- 📊 用戶回訪頻率？
- 📊 平均session時長？

**根據數據決定**:
- 🎯 哪些功能值得深化
- 🎯 哪些功能可以移除
- 🎯 新功能的優先級
- 🎯 UI/UX改進方向

**數據收集設計**:
```javascript
{
  analytics: {
    skillUsage: {
      'code_gen': 156,
      'bug_fix': 89,
      'translate': 23,
      'custom_001': 2
    },
    avgConversationLength: 3.5,  // 平均3.5輪對話
    avgTokensPerChat: 450,
    dailyActiveUsers: 1,
    retentionRate: {
      day1: 1.0,
      day7: 0.6,
      day30: 0.3
    },
    featureUsage: {
      'history_search': 12,
      'export': 3,
      'custom_skill': 5
    }
  }
}
```

---

### 4. 漸進式增強

**採用漸進式開發策略**:

**階段1**: 基本功能（必須有）
```
能用 > 好用 > 有趣
```

**階段2**: 優化體驗（讓它更好）
```
基礎 > 進階 > 專業
```

**階段3**: 趣味增強（錦上添花）
```
實用 > 有趣 > 驚艷
```

---

## 功能完整度建議

### MVP階段（80%精力投入）
- ✅ **對話功能**: 100%完整
  - CLI整合穩定
  - 串流顯示流暢
  - 錯誤處理完善

- ✅ **技能系統**: 60%完整
  - 5個預設模板
  - 基本參數輸入
  - 簡單統計

- ✅ **視覺呈現**: 70%完整
  - 核心UI元素完成
  - 基礎動畫效果
  - 音效可選開關

- ✅ **數據存儲**: 50%完整
  - 基本歷史記錄
  - 本地設定儲存
  - 簡單統計數據

---

### 第二階段（15%精力）
- ⚡ **等級系統**: 簡單實作
  - 基礎經驗值計算
  - 等級顯示
  - 簡單升級效果

- ⚡ **多模型支持**: 基礎切換
  - Claude/Gemini切換
  - 不同NPC顯示

- ⚡ **對話管理**: 進階功能
  - 搜尋與過濾
  - 標籤分類
  - 匯出功能

---

### 第三階段（5%精力，視情況）
- 📦 **任務成就**: 可選功能
  - 簡單每日目標
  - 基礎成就系統

- 🎨 **視覺裝飾**: 錦上添花
  - 更多動畫效果
  - 主題切換

- 👥 **社交功能**: 長期規劃
  - 模板分享
  - 社群庫

---

## 技術實作建議

### 技術堆疊

**前端**:
```
├── React 18 (UI框架)
├── Vite (建置工具)
├── Tailwind CSS (樣式，配合像素風自定義)
├── Zustand (狀態管理)
├── Socket.io-client (WebSocket)
└── Howler.js (音效)
```

**後端**:
```
├── Node.js 18+
├── Express (API服務器)
├── Socket.io (WebSocket Server)
├── child_process (CLI調用)
└── dotenv (環境變數)
```

**存儲**:
```
├── LocalStorage (用戶設定、技能、角色資料)
└── IndexedDB (對話歷史、大量數據)
```

---

### 架構設計

```
[瀏覽器]
    │
    ├─ React App
    │   ├─ UI Components
    │   ├─ State Management (Zustand)
    │   └─ WebSocket Client
    │
    ↓ (WebSocket)
    │
[Node.js Server]
    │
    ├─ Express API
    │   ├─ /api/chat
    │   ├─ /api/skills
    │   └─ /api/history
    │
    ├─ WebSocket Server
    │   └─ Real-time messaging
    │
    └─ CLI Wrapper
        ├─ claude-cli
        └─ gemini-cli
```

---

### 數據結構設計

**用戶資料**:
```javascript
{
  user: {
    id: 'user_001',
    name: '勇者',
    level: 5,
    exp: {
      current: 300,
      nextLevel: 500
    },
    class: 'developer',
    stats: {
      hp: { current: 80, max: 100 },
      mp: { current: 60, max: 100 }
    },
    settings: {
      soundEnabled: true,
      theme: 'pixel',
      defaultModel: 'claude'
    }
  }
}
```

**技能資料**:
```javascript
{
  skills: [
    {
      id: 'code_gen',
      name: '代碼生成',
      icon: '⚔️',
      category: 'development',
      mpCost: 10,
      template: '請幫我用{lang}實現{feature}',
      params: [...],
      unlocked: true,
      level: 3,
      usageCount: 45,
      lastUsed: '2026-02-05T10:30:00Z'
    }
  ]
}
```

**對話歷史**:
```javascript
{
  conversations: [
    {
      id: 'conv_001',
      timestamp: '2026-02-05T10:30:00Z',
      model: 'claude',
      messages: [
        {
          role: 'user',
          content: 'Hello',
          timestamp: '2026-02-05T10:30:00Z'
        },
        {
          role: 'assistant',
          content: 'Hi there!',
          timestamp: '2026-02-05T10:30:05Z',
          tokens: 150
        }
      ],
      totalTokens: 150,
      skillUsed: 'code_gen',
      tags: ['react', 'component'],
      pinned: false,
      userRating: 5
    }
  ]
}
```

---

## 開發檢查清單

### Phase 1: MVP (Week 1-8)

**Week 1-2: 基礎建設**
- [ ] 初始化專案結構
- [ ] 設定開發環境
- [ ] 建立 Express 後端
- [ ] 實作 CLI 調用基礎
- [ ] WebSocket 連線測試
- [ ] 簡單的 React 前端

**Week 3-4: 視覺設計**
- [ ] 像素風 CSS 框架
- [ ] UI 組件開發（對話框、按鈕、進度條）
- [ ] 打字機效果
- [ ] 音效系統
- [ ] 角色屬性面板
- [ ] 響應式布局

**Week 5-6: 核心功能**
- [ ] 技能系統實作
- [ ] 5個預設技能
- [ ] 參數輸入介面
- [ ] 技能動畫效果
- [ ] MP 消耗計算
- [ ] 錯誤處理

**Week 7-8: 數據與測試**
- [ ] LocalStorage 存儲
- [ ] 對話歷史記錄
- [ ] 使用統計追蹤
- [ ] 等級計算邏輯
- [ ] 單元測試
- [ ] 整合測試
- [ ] 用戶測試

---

### Phase 2: 增強 (Week 9-12)
- [ ] 經驗值與升級系統
- [ ] 自定義技能
- [ ] 對話搜尋與過濾
- [ ] 對話標籤系統
- [ ] 統計儀表板
- [ ] 多模型支持
- [ ] 效能優化

---

### Phase 3: 擴展 (Week 13+)
- [ ] 任務系統
- [ ] 成就系統
- [ ] 職業系統
- [ ] 收藏庫
- [ ] 社群功能（可選）
- [ ] 進階動畫
- [ ] 主題切換

---

## 風險評估與應對

### 技術風險

**風險1: CLI調用的環境依賴**
- **影響**: 用戶需要預先安裝 claude-cli/gemini-cli
- **應對**:
  - 提供詳細安裝指南
  - 檢測CLI是否安裝
  - 提供測試連線功能

**風險2: WebSocket連線不穩定**
- **影響**: 串流輸出中斷
- **應對**:
  - 實作重連機制
  - 錯誤恢復策略
  - 降級為HTTP輪詢

**風險3: LocalStorage容量限制**
- **影響**: 對話歷史無法無限儲存
- **應對**:
  - 設定歷史記錄上限
  - 提供手動清理功能
  - 考慮IndexedDB擴展

---

### 產品風險

**風險1: 遊戲化元素過度複雜**
- **影響**: 反而降低使用效率
- **應對**:
  - 保持MVP簡單
  - 數據驅動迭代
  - 提供「專業模式」（簡化UI）

**風險2: 用戶習慣與CLI差異大**
- **影響**: 學習曲線陡峭
- **應對**:
  - 新手引導教學
  - 快速開始模板
  - 保持核心功能直覺

**風險3: 維護成本高**
- **影響**: CLI更新需要同步調整
- **應對**:
  - 抽象API介面
  - 版本兼容性檢測
  - 自動化測試

---

## 成功指標

### MVP階段
- ✅ 能成功調用CLI並顯示結果
- ✅ 打字機效果流暢（無卡頓）
- ✅ 至少3個有用的快捷技能
- ✅ 用戶能完成完整對話流程
- ✅ 對話歷史正確保存

### 第二階段
- ✅ 自定義技能使用率 > 20%
- ✅ 對話搜尋功能被使用
- ✅ 平均停留時間 > 10分鐘
- ✅ 多模型切換功能正常

### 第三階段
- ✅ 每日任務完成率 > 40%
- ✅ 成就解鎖率 > 30%
- ✅ 用戶留存率（7天）> 50%
- ✅ 社群模板使用量

---

## 附錄

### 參考資源

**遊戲化設計**:
- [Gamification by Design](https://www.oreilly.com/library/view/gamification-by-design/9781449397678/)
- [Habitica](https://habitica.com/) - 待辦事項遊戲化案例

**像素風設計**:
- [Press Start 2P Font](https://fonts.google.com/specimen/Press+Start+2P)
- [Pixel Art UI Assets](https://itch.io/game-assets/tag-pixel-art)

**技術參考**:
- [Socket.io Documentation](https://socket.io/docs/)
- [React Best Practices](https://react.dev/)

---

**文檔版本歷史**:
- v1.0 (2026-02-05): 初始版本，完整功能規劃
