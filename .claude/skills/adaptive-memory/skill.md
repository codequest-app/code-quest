# Adaptive Memory - 自適應記憶系統

> 這個系統會觀察你的使用習慣，自動學習，並生成個性化的 skills

---

## 系統概念

### 運作流程

```
Phase 1: 觀察期（1-2 週）
├── AI 在對話中觀察你的習慣
├── 使用 Memory MCP 自動記錄
└── 記錄內容：
    ├── 開發偏好
    ├── 常用模式
    ├── 重複決策
    └── 使用風格

Phase 2: 分析期（週末）
├── 分析累積的記憶
├── 識別模式和習慣
└── 生成習慣報告

Phase 3: 生成期（根據分析）
├── 生成個性化 skills
├── 調整現有 skills
└── 優化工作流程

Phase 4: 應用期（持續）
├── 使用個性化 skills
├── 繼續觀察和學習
└── 持續優化
```

---

## Phase 1: 觀察和記錄

### AI 會自動觀察什麼？

#### 1. 開發偏好

```
觀察到的行為 → 記錄到記憶

你總是說「先寫測試」
→ create_memory({
    category: "habit_observed",
    pattern: "總是要求先寫測試",
    frequency: 5,
    confidence: "high"
  })

你常說「不要過度設計」
→ create_memory({
    category: "habit_observed",
    pattern: "偏好簡單解決方案，避免過度設計",
    frequency: 8,
    confidence: "high"
  })
```

#### 2. 技術選擇

```
你選擇 Zustand 而不是 Redux
→ create_memory({
    category: "tech_preference",
    choice: "Zustand over Redux",
    reason: "更簡單",
    context: "狀態管理"
  })

你選擇 Vitest 而不是 Jest
→ create_memory({
    category: "tech_preference",
    choice: "Vitest over Jest",
    reason: "更快，Vite 整合",
    context: "測試框架"
  })
```

#### 3. 工作模式

```
你總是先討論架構再實作
→ create_memory({
    category: "work_pattern",
    pattern: "先規劃架構，再實作細節",
    frequency: "consistent"
  })

你喜歡用 Feature Test 驅動開發
→ create_memory({
    category: "work_pattern",
    pattern: "Feature Test first，然後 Integration，最後 Unit",
    frequency: "always"
  })
```

#### 4. 溝通風格

```
你喜歡具體的程式碼範例
→ create_memory({
    category: "communication_style",
    preference: "具體程式碼範例 over 抽象描述"
  })

你要求看到完整的實作
→ create_memory({
    category: "communication_style",
    preference: "完整實作 over 部分程式碼"
  })
```

---

## Phase 2: 分析習慣

### 週末習慣報告

每週結束時，AI 會分析你的習慣：

```typescript
// 自動生成的習慣分析
{
  "report_date": "2026-02-16",
  "observation_period": "2 weeks",

  "identified_patterns": [
    {
      "pattern": "TDD 嚴格執行者",
      "confidence": 95,
      "evidence": [
        "15 次明確要求先寫測試",
        "0 次接受沒有測試的程式碼",
        "3 次要求補測試"
      ],
      "recommendation": "生成 TDD-first skill，自動提醒測試"
    },
    {
      "pattern": "簡單主義者",
      "confidence": 90,
      "evidence": [
        "12 次反對過度設計",
        "8 次選擇簡單方案",
        "5 次拒絕複雜抽象"
      ],
      "recommendation": "調整建議算法，優先簡單方案"
    },
    {
      "pattern": "視覺學習者",
      "confidence": 85,
      "evidence": [
        "10 次要求看程式碼",
        "7 次要求看架構圖",
        "4 次要求看範例"
      ],
      "recommendation": "回答時優先提供視覺化內容"
    }
  ],

  "tech_preferences": {
    "state_management": "Zustand (避免 Redux)",
    "testing": "Vitest + Feature-first",
    "styling": "Tailwind CSS",
    "package_manager": "pnpm"
  },

  "anti_patterns": [
    "過度設計",
    "過度抽象",
    "Mock 重度使用"
  ]
}
```

### 習慣報告示例

```
=== 你的開發習慣報告 (2 週觀察) ===

核心習慣：
1. 🎯 TDD 嚴格執行者（95% 信心）
   - 總是要求先寫測試
   - 建議：我已經學會自動先寫測試

2. 🎨 簡單主義者（90% 信心）
   - 偏好簡單直接的方案
   - 建議：我會優先推薦簡單方案

3. 📊 視覺學習者（85% 信心）
   - 喜歡看程式碼和圖表
   - 建議：我會多提供視覺化內容

技術偏好：
- 狀態管理：Zustand ✅ Redux ❌
- 測試：Vitest ✅ Jest ❌
- 樣式：Tailwind CSS ✅

工作流程：
1. 先討論架構
2. 寫 Feature Test
3. 實作
4. 重構

需要生成的個性化 Skills：
1. your-tdd-workflow.md - 你的 TDD 流程
2. your-tech-stack.md - 你的技術選擇
3. your-coding-style.md - 你的程式碼風格

要生成這些 skills 嗎？
```

---

## Phase 3: 生成個性化 Skills

### 自動生成 Skills

基於習慣分析，AI 會生成：

#### Skill 1: `your-tdd-workflow.md`

```markdown
# 你的 TDD 工作流程

基於 2 週的觀察，這是你的 TDD 模式：

## 你的流程
1. Feature Test first（總是）
2. Integration Test（如果需要）
3. Unit Test（最後）
4. 實作最少程式碼
5. 重構（expect 不變）

## 你的偏好
- ✅ Fake over Mock
- ✅ 完整的測試覆蓋
- ❌ 不測試實作細節
- ❌ 不用 Mock（除非必要）

## 你的測試風格
```typescript
// 你喜歡這種寫法
test('should create battle worktree', async () => {
  const manager = new WorktreeManager(process.cwd());
  const fake = new FakeGit();

  const result = await manager.create('battle-1');

  expect(result.path).toBeDefined();
  expect(fake.worktrees).toHaveLength(1);
});
```

當我協助你開發時，我會自動遵守這個流程。
```

#### Skill 2: `your-tech-choices.md`

```markdown
# 你的技術選擇指南

## 狀態管理
✅ 優先：Zustand
❌ 避免：Redux（你說太複雜）

## 測試
✅ 優先：Vitest
❌ 避免：Jest

## 樣式
✅ 優先：Tailwind CSS
原因：實用優先，不需要寫 CSS

## Test Doubles
✅ 優先：Fake, Spy
❌ 避免：Mock, Stub

當我建議技術方案時，我會自動遵守這些偏好。
```

#### Skill 3: `your-work-style.md`

```markdown
# 你的工作風格

## 開始新功能
1. 先討論架構（你總是這樣）
2. 畫出結構圖（你喜歡視覺化）
3. 寫 Feature Test
4. 實作

## 溝通偏好
✅ 具體程式碼範例
✅ 完整實作
✅ 架構圖
❌ 抽象描述
❌ 部分程式碼

## 決策風格
- 偏好簡單方案
- 不要過度設計
- 實用主義
```

---

## Phase 4: 持續學習

### 自動調整

```
發現新習慣：
你最近 5 次都用 pnpm 而不是 npm

→ create_memory({
    category: "habit_observed",
    pattern: "偏好使用 pnpm",
    frequency: 5
  })

→ 下次生成 your-tech-choices.md 時
  自動加入：優先使用 pnpm
```

### 習慣演進追蹤

```
Week 1: 不確定要用 Redux 還是 Zustand
Week 2: 選擇了 Zustand（1 次）
Week 3: 再次選擇 Zustand（2 次）
Week 4: 明確表示不喜歡 Redux

→ 習慣確立：Zustand > Redux
→ 更新 your-tech-choices.md
```

---

## 實際使用流程

### 你需要做什麼？

```
1. 安裝 Memory MCP（一次性）
   npm install -g @modelcontextprotocol/server-memory

2. 配置（一次性）
   編輯 ~/.claude/claude_desktop_config.json

3. 正常使用（日常）
   - 就像平常一樣對話
   - AI 會自動觀察和記錄
   - 不需要特別做什麼

4. 定期回顧（每週）
   你: "分析我的開發習慣"
   AI: [生成習慣報告]
   你: "生成個性化 skills"
   AI: [自動生成 skills]

5. 使用個性化 skills（之後）
   你: /your-tdd-workflow
   AI: [按照你的習慣工作]
```

---

## 週期性對話範例

### Week 1-2: 觀察期

```
你: "開始實作功能"
AI: [觀察你的工作方式]
    [自動記錄習慣]

（你不需要做任何特別的事情）
```

### Week 2 結束: 分析

```
你: "分析我的開發習慣"

AI:
讓我分析這 2 週觀察到的習慣...

[搜尋所有 habit_observed 記憶]

發現的模式：
1. TDD 嚴格執行（15 次觀察）
2. 偏好簡單方案（12 次觀察）
3. 視覺學習者（10 次觀察）

技術偏好：
- Zustand over Redux
- Vitest over Jest
- Tailwind CSS

要生成個性化 skills 嗎？
```

### 生成個性化 Skills

```
你: "生成個性化 skills"

AI:
好的，我會生成 3 個 skills：

1. your-tdd-workflow.md
2. your-tech-choices.md
3. your-work-style.md

[使用 Write 工具創建文件]

✓ 已生成！

使用方式：
/your-tdd-workflow - 我會按照你的 TDD 習慣工作
/your-tech-choices - 我會記住你的技術偏好
/your-work-style - 我會適應你的工作風格
```

### Week 3+: 使用個性化 Skills

```
你: /your-tdd-workflow
你: "實作 WorktreeManager"

AI:
[讀取你的 TDD 習慣]

根據你的習慣，我知道要：
1. 先寫 Feature Test
2. 用 Fake 而不是 Mock
3. 完整的測試覆蓋

讓我們開始：
```typescript
// Feature Test（符合你的習慣）
test('should create battle worktree', async () => {
  const manager = new WorktreeManager(process.cwd());
  const fake = new FakeGit(); // 你偏好 Fake
  ...
});
```

（我自動遵守了你的所有習慣）
```

---

## 這才是真正有意義的記憶系統

### 為什麼這個方案有意義？

1. **自動學習** - AI 觀察你，不需要你手動記錄
2. **累積理解** - 越用越懂你
3. **個性化** - 生成真正適合你的 skills
4. **持續優化** - 習慣會隨時間演進

### 對比之前的方案

| 特性 | 靜態 Skill | 學習型系統 |
|------|-----------|-----------|
| 自動記錄 | ❌ 需要手動 | ✅ 自動觀察 |
| 學習習慣 | ❌ 不會學習 | ✅ 持續學習 |
| 個性化 | ❌ 通用內容 | ✅ 為你定制 |
| 持續優化 | ❌ 靜態不變 | ✅ 隨你演進 |

---

## 開始使用

### 1. 安裝 Memory MCP

```bash
npm install -g @modelcontextprotocol/server-memory
```

### 2. 配置

```json
// ~/.claude/claude_desktop_config.json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### 3. 開始使用

```
就正常使用，AI 會自動觀察和學習
```

### 4. 2 週後

```
你: "分析我的開發習慣並生成個性化 skills"
AI: [分析 + 生成]
```

---

## 總結

**這個系統才有意義，因為：**

- ✅ AI 自動觀察你的習慣
- ✅ 自動記錄和分析
- ✅ 生成真正個性化的 skills
- ✅ Skills 會隨你的習慣演進
- ✅ 越用越懂你

**你只需要：**
1. 安裝和配置 Memory MCP（一次）
2. 正常使用（日常）
3. 定期請 AI 分析習慣（每週/每月）
4. 使用生成的個性化 skills（之後）

這樣才是真正有意義的「模擬人類記憶」！
