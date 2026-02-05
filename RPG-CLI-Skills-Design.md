# RPG-CLI Skills 設計文件

**版本**: v2.0 (基於真實 Claude Skills 機制重新設計)
**日期**: 2026-02-05

---

## 概述

本文件基於 Anthropic Claude Skills 的真實機制，設計 RPG-CLI 的技能系統。每個技能都是一個獨立的 Skill，使用 YAML frontmatter + 指令的標準格式。

---

## 核心設計原則

### 1. 遵循真實 Skills 格式

每個技能都是一個 `.md` 文件，包含：
- **Frontmatter**: skill_id, version, description, 遊戲屬性（MP消耗、冷卻時間等）
- **Instructions**: 詳細的執行指令
- **Resources**: 可選的範例、模板

### 2. 遊戲化元數據整合

在 YAML frontmatter 中加入 RPG 專屬屬性：

```yaml
---
skill_id: code-generator
version: 1.0
description: 根據需求生成高品質程式碼
# RPG 屬性
rpg_meta:
  name: "代碼生成術"
  icon: "⚔️"
  type: "basic"
  mp_cost: 15
  cooldown: 60
  level_required: 1
  exp_reward: 20
  combo_tags: ["code", "attack"]
---
```

### 3. 技能分類系統

基於真實使用場景分類：

- **基礎技能** (Basic): 快速、低消耗、高頻使用
- **進階技能** (Advanced): 複雜任務、高消耗、深度處理
- **組合技能** (Combo): 多技能連鎖、特殊獎勵
- **被動技能** (Passive): 自動觸發、持續效果

---

## 技能目錄結構

**重要**: Skills 應該放在 Claude 配置目錄，而非專案目錄

```
~/.claude/skills/                   # Claude 全局 skills 目錄
├── basic/
│   ├── code-generator/
│   │   └── SKILL.md               # ⚔️ 代碼生成術
│   ├── doc-writer/
│   │   └── SKILL.md               # 📜 文案撰寫術
│   └── code-reviewer/
│       └── SKILL.md               # 🔍 代碼審查術
├── advanced/
│   ├── refactoring-master/
│   │   └── SKILL.md               # 🔧 重構大師
│   ├── security-scanner/
│   │   └── SKILL.md               # 🛡️ 安全掃描術
│   ├── performance-optimizer/
│   │   └── SKILL.md               # ⚡ 性能優化術
│   └── architecture-design/
│       └── SKILL.md               # 🏛️ 架構設計術
├── combo/
│   ├── code-review-combo/
│   │   └── SKILL.md               # 🌟 代碼審查連擊
│   └── full-stack-combo/
│       └── SKILL.md               # 💫 全棧連擊
├── passive/
│   ├── auto-format/
│   │   └── SKILL.md               # 🔄 自動格式化
│   └── syntax-highlight/
│       └── SKILL.md               # ✨ 語法高亮
└── meta/
    └── SKILL.md                   # 🎓 Claude 機制專家 (已創建)
```

**說明**:
- 每個 skill 是一個目錄，包含 `SKILL.md` 主文件
- 可選：包含 resources（模板、腳本等）
- Skills 對所有專案全局可用
- Claude Code 會自動掃描此目錄

---

## 技能定義範例

### 基礎技能: 代碼生成術

**檔案**: `skills/basic/code-generator.md`

```yaml
---
skill_id: code-generator
version: 1.0
description: 根據使用者需求快速生成高品質、可運行的程式碼

# Claude Skills 標準屬性
tools:
  - code_execution

# RPG 遊戲屬性
rpg_meta:
  name: "代碼生成術"
  name_en: "Code Generator"
  icon: "⚔️"
  type: "basic"
  category: "attack"

  # 消耗與冷卻
  mp_cost: 15
  cooldown: 60  # 秒

  # 等級需求
  level_required: 1

  # 獎勵
  exp_reward: 20
  gold_reward: 10

  # 組合系統
  combo_tags: ["code", "attack", "create"]
  combo_multiplier: 1.2  # 連擊時經驗加成

  # 描述
  flavor_text: "將思緒化為代碼，創造數位世界的利刃"
  usage_hint: "適合快速原型開發、生成函數、建立模板"
---

# 代碼生成術 - 執行指令

## 角色定位

你是一位精通多種程式語言的代碼生成專家。你的任務是根據使用者描述，快速生成乾淨、高效、可維護的程式碼。

## 核心原則

1. **簡潔優先**: 生成最簡單可行的解決方案，避免過度工程
2. **可讀性**: 使用清晰的命名、適當的註解
3. **最佳實踐**: 遵循語言特定的慣例和設計模式
4. **安全第一**: 避免常見漏洞（SQL injection, XSS, etc.）

## 執行流程

### 1. 需求分析
- 識別程式語言
- 理解功能需求
- 確認輸入/輸出格式
- 評估複雜度

### 2. 代碼生成
- 選擇適當的設計模式
- 生成核心邏輯
- 添加錯誤處理
- 包含基本註解

### 3. 輸出格式

```javascript
// 使用 markdown code block
// 語言標記要正確
// 包含簡短說明

function example() {
  // 實作代碼
}
```

### 4. 後續說明
- 簡述代碼功能
- 列出關鍵決策點
- 提供使用範例（如需要）

## 輸出範本

當技能成功施放時，回應格式：

```
⚔️ 代碼生成術 發動！

[生成的代碼]

✨ 施放成功！
- 消耗 MP: 15
- 獲得經驗: 20 EXP
- 獲得金幣: 10 Gold
```

## 範例互動

**使用者輸入**:
> "建立一個 JavaScript 函數來驗證 email 格式"

**輸出**:
```javascript
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 使用範例:
// validateEmail('user@example.com') // true
// validateEmail('invalid-email')    // false
```

簡述：使用正則表達式驗證基本 email 格式。這是常見的 email 驗證模式，可處理大多數標準格式。

## 限制與升級路徑

**當前版本限制** (v1.0):
- 單一檔案生成
- 基本錯誤處理
- 標準模式

**升級至 v2.0 解鎖**:
- 多檔案專案生成
- 完整單元測試
- 進階設計模式
- 性能優化建議
```

---

### 進階技能: 架構設計術

**檔案**: `skills/advanced/architecture-design.md`

```yaml
---
skill_id: architecture-design
version: 1.0
description: 設計系統架構，提供技術選型、模組劃分、擴展策略

tools:
  - code_execution
  - web_search  # 查詢最新技術棧

rpg_meta:
  name: "架構設計術"
  name_en: "Architecture Design"
  icon: "🏛️"
  type: "advanced"
  category: "support"

  mp_cost: 40
  cooldown: 300

  level_required: 10

  exp_reward: 100
  gold_reward: 50

  combo_tags: ["architecture", "design", "support"]
  combo_multiplier: 1.5

  prerequisites:
    - skill_ids: ["code-generator", "refactoring-master"]
    - total_exp: 500

  flavor_text: "以全局視野構建系統藍圖，奠定專案基石"
  usage_hint: "適合新專案啟動、重大重構、技術選型"
---

# 架構設計術 - 執行指令

## 角色定位

你是一位資深軟體架構師，精通系統設計、技術選型、模組劃分。你能夠：
- 理解業務需求並轉化為技術架構
- 平衡性能、可維護性、擴展性
- 提供具體的技術選型建議
- 預見潛在風險並提供解決方案

## 核心原則

1. **業務驅動**: 架構服務於業務需求
2. **適度設計**: 避免過度設計和過度簡化
3. **可演進性**: 支持未來擴展和修改
4. **團隊契合**: 考慮團隊技術棧和學習曲線

## 執行流程

### 1. 需求分析
- 確認業務目標
- 識別關鍵需求（性能、安全、擴展性等）
- 評估團隊技術能力
- 了解時間和資源限制

### 2. 架構設計
- 選擇整體架構模式（單體/微服務/Serverless等）
- 劃分系統模組和邊界
- 設計數據流和通訊方式
- 選擇技術棧

### 3. 輸出交付物

以 Markdown 格式提供：

#### 架構概覽
- 系統架構圖（ASCII 或 Mermaid）
- 核心模組說明
- 技術棧清單

#### 模組設計
- 各模組職責
- 模組間通訊方式
- 數據流向

#### 技術選型
- 前端框架/庫
- 後端框架
- 資料庫選擇
- 基礎設施

#### 風險與建議
- 潛在技術風險
- 擴展性考量
- 安全性建議

### 4. 範例輸出

```
🏛️ 架構設計術 發動！

# 電商平台系統架構設計

## 架構概覽

採用 **前後端分離 + 微服務** 架構：

```
┌─────────────┐
│   用戶端    │ (React + TypeScript)
└──────┬──────┘
       │ HTTPS/REST
┌──────▼──────┐
│  API Gateway │ (Nginx + Rate Limit)
└──────┬──────┘
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
┌──▼──┐  ┌─▼──┐  ┌─▼──┐  ┌─▼──┐
│用戶 │  │商品│  │訂單│  │支付│ (Node.js微服務)
└──┬──┘  └─┬──┘  └─┬──┘  └─┬──┘
   │       │       │       │
   └───┬───┴───┬───┴───┬───┘
       │       │       │
    ┌──▼───────▼───────▼──┐
    │   PostgreSQL + Redis │
    └──────────────────────┘
```

## 核心模組

1. **用戶服務**: 註冊、登入、權限管理
2. **商品服務**: 商品CRUD、庫存管理
3. **訂單服務**: 訂單創建、狀態追蹤
4. **支付服務**: 第三方支付整合

## 技術棧

- **前端**: React 18 + TypeScript + Vite
- **後端**: Node.js + Express
- **資料庫**: PostgreSQL (主), Redis (緩存)
- **部署**: Docker + Kubernetes

## 風險與建議

⚠️ **分散式事務**: 建議使用 Saga 模式
⚠️ **服務通訊**: 初期用 REST，後期考慮 gRPC
✅ **可擴展性**: 支持水平擴展

✨ 施放成功！
- 消耗 MP: 40
- 獲得經驗: 100 EXP
- 獲得金幣: 50 Gold
```

## 升級路徑

**v2.0 解鎖**:
- 自動生成架構圖（Mermaid/PlantUML）
- 技術選型對比矩陣
- 成本估算
- CI/CD 流程設計
```

---

### 組合技能: 代碼審查連擊

**檔案**: `skills/combo/code-review-combo.md`

```yaml
---
skill_id: code-review-combo
version: 1.0
description: 組合多個審查技能，提供全方位代碼品質報告

tools:
  - read
  - grep
  - code_execution

rpg_meta:
  name: "代碼審查連擊"
  name_en: "Code Review Combo"
  icon: "🌟"
  type: "combo"
  category: "special"

  mp_cost: 50
  cooldown: 180

  level_required: 5

  exp_reward: 80
  gold_reward: 40

  combo_tags: ["review", "combo", "special"]
  combo_multiplier: 2.0  # 組合技獎勵加倍

  prerequisites:
    - skill_ids: ["code-reviewer", "security-scanner"]

  # 組合技獨有屬性
  combo_chain:
    - step: 1
      skill: "code-reviewer"
      description: "基礎代碼審查"
    - step: 2
      skill: "security-scanner"
      description: "安全性掃描"
    - step: 3
      skill: "performance-optimizer"
      description: "性能分析"

  flavor_text: "三重審查，滴水不漏！"
  usage_hint: "適合重要功能發布前的全面審查"
---

# 代碼審查連擊 - 執行指令

## 角色定位

你是一位全方位的代碼審查專家，能夠同時從多個維度審查代碼：
- 代碼品質和可讀性
- 安全漏洞
- 性能瓶頸

## 執行流程

### 1️⃣ 基礎代碼審查
檢查：
- 命名規範
- 代碼結構
- 註解品質
- 設計模式使用

### 2️⃣ 安全性掃描
檢查：
- OWASP Top 10 漏洞
- 輸入驗證
- 敏感資料處理
- 依賴安全性

### 3️⃣ 性能分析
檢查：
- 演算法複雜度
- 資料庫查詢效率
- 記憶體使用
- 網路請求優化

## 輸出格式

```
🌟 代碼審查連擊 發動！

═══════════════════════════════════════
第 1 擊：基礎代碼審查 ⚔️
═══════════════════════════════════════

[基礎審查結果...]

═══════════════════════════════════════
第 2 擊：安全性掃描 🛡️
═══════════════════════════════════════

[安全掃描結果...]

═══════════════════════════════════════
第 3 擊：性能分析 ⚡
═══════════════════════════════════════

[性能分析結果...]

═══════════════════════════════════════
💫 連擊完成！綜合評分
═══════════════════════════════════════

整體評級: A-
- 代碼品質: 85/100
- 安全性: 90/100
- 性能: 80/100

🎁 組合技獎勵加倍！
- 消耗 MP: 50
- 獲得經驗: 160 EXP (基礎 80 × 2.0)
- 獲得金幣: 80 Gold (基礎 40 × 2.0)
```
```

---

## 技能升級系統

### 版本演進機制

每個技能可以升級版本，解鎖新能力：

```yaml
# 代碼生成術 v1.0 → v2.0
version: 2.0
rpg_meta:
  level_required: 5
  new_features:
    - "多檔案專案生成"
    - "自動單元測試生成"
    - "設計模式建議"
  mp_cost: 20  # 升級後消耗增加
  exp_reward: 35  # 獎勵也增加
```

### 技能樹設計

```
代碼生成術 (Lv.1)
    ↓
    ├─→ 重構大師 (Lv.5)
    │       ↓
    │       └─→ 架構設計術 (Lv.10)
    │
    └─→ 性能優化術 (Lv.5)
            ↓
            └─→ 全棧連擊 (Lv.15)
```

---

## 技能整合到 RPG-CLI

### 1. 技能載入機制

```javascript
// 掃描 ~/.claude/skills/ 目錄，載入所有 SKILL.md 文件
class SkillLoader {
  async loadSkills() {
    const skillsPath = path.join(os.homedir(), '.claude', 'skills');
    const skillFiles = await glob(path.join(skillsPath, '**/SKILL.md'));
    const skills = [];

    for (const file of skillFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const { data, content: instructions } = matter(content);

      skills.push({
        ...data,
        instructions,
        filePath: file,
        skillName: path.basename(path.dirname(file))  // 從目錄名取得 skill 名稱
      });
    }

    return skills;
  }
}
```

### 2. 技能觸發

```javascript
// 當使用者點擊快捷技能按鈕
async function castSkill(skillId, userInput) {
  const skill = await skillLoader.getSkill(skillId);

  // 檢查條件
  if (player.level < skill.rpg_meta.level_required) {
    return { error: '等級不足' };
  }

  if (player.mp < skill.rpg_meta.mp_cost) {
    return { error: 'MP 不足' };
  }

  // 檢查冷卻
  if (isOnCooldown(skillId)) {
    return { error: '技能冷卻中' };
  }

  // 呼叫 Claude API with Skill
  const result = await claudeAPI.chat({
    model: 'claude-3-7-sonnet-20250219',
    tools: [{
      type: 'code_execution_2024',
      container: {
        skills: [{
          type: 'custom',
          skill_id: skillId,
          version: skill.version
        }]
      }
    }],
    messages: [
      { role: 'user', content: userInput }
    ]
  });

  // 扣除消耗、給予獎勵
  player.mp -= skill.rpg_meta.mp_cost;
  player.exp += skill.rpg_meta.exp_reward;
  player.gold += skill.rpg_meta.gold_reward;

  // 啟動冷卻
  setCooldown(skillId, skill.rpg_meta.cooldown);

  return result;
}
```

### 3. 組合技檢測

```javascript
class ComboDetector {
  constructor() {
    this.recentSkills = [];  // 最近使用的技能
    this.comboWindow = 30000; // 30秒內的技能視為連擊
  }

  checkCombo(skillId) {
    const now = Date.now();

    // 清除過期的技能記錄
    this.recentSkills = this.recentSkills.filter(
      s => now - s.timestamp < this.comboWindow
    );

    // 加入當前技能
    this.recentSkills.push({ skillId, timestamp: now });

    // 檢查是否觸發組合技
    const comboSkills = skills.filter(s => s.rpg_meta.type === 'combo');

    for (const combo of comboSkills) {
      const chain = combo.rpg_meta.combo_chain;
      const usedIds = this.recentSkills.map(s => s.skillId);
      const requiredIds = chain.map(step => step.skill);

      if (requiredIds.every(id => usedIds.includes(id))) {
        return combo;  // 觸發組合技！
      }
    }

    return null;
  }
}
```

---

## 下一步規劃

1. **創建初始技能庫**
   - 10個基礎技能
   - 5個進階技能
   - 2個組合技能

2. **技能編輯器**
   - UI 界面建立新技能
   - 即時預覽技能效果

3. **社群技能市場**
   - 分享自定義技能
   - 下載他人技能

4. **成就系統整合**
   - "首次施放技能"
   - "施放 100 次技能"
   - "解鎖所有技能"

---

**版本歷史**:
- v2.0 (2026-02-05): 基於真實 Claude Skills 機制重新設計
- v1.0 (2026-02-05): 初始概念設計（已廢棄）
