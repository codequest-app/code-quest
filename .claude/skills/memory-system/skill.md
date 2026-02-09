# Memory System - 模擬人類記憶

## 概念

Code Quest 的記憶系統模擬人類的記憶機制，幫助 AI 記住：
- 專案的設計決策
- 用戶的開發偏好
- 重複出現的問題
- 團隊的開發規範

---

## 記憶類型

### 1. 短期記憶（Session Memory）

**存活時間**：當前對話 session

**用途**：
- 當前任務的上下文
- 正在討論的問題
- 臨時的決策

**範例**：
```
"我們正在實作 WorktreeManager"
"用戶偏好用 TypeScript"
"測試策略是 TDD"
```

### 2. 工作記憶（Working Memory）

**存活時間**：當前任務完成前

**用途**：
- 多步驟任務的狀態
- 待辦事項列表
- 中間結果

**範例**：
```
"已完成 WorktreeManager 的測試"
"下一步要整合到 BattleOrchestrator"
"還需要實作清理機制"
```

### 3. 長期記憶（Long-term Memory）

**存活時間**：永久（跨 session）

**用途**：
- 專案架構決策
- 開發規範和風格
- 用戶偏好
- 已知問題和解決方案

**範例**：
```
"Code Quest 使用三層架構：UI/Bridge/CLI"
"重構時 expect 絕對不可變更"
"用戶不喜歡過度設計"
"Worktree 用於隔離並行戰鬥"
```

---

## 使用 Memory MCP Server

### 安裝

```bash
# 方式 1: 使用 npx（推薦）
npx -y @modelcontextprotocol/server-memory

# 方式 2: 全局安裝
npm install -g @modelcontextprotocol/server-memory
```

### 配置

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

### API

Memory MCP 提供三個工具：

#### 1. create_memory - 創建記憶

```typescript
// 記住設計決策
create_memory({
  content: "Code Quest 使用 Worktree 隔離並行戰鬥，原因是避免檔案衝突"
})

// 記住用戶偏好
create_memory({
  content: "用戶偏好 TDD 開發流程：Feature Test > Integration Test > Unit Test"
})

// 記住問題和解決方案
create_memory({
  content: "PTY 權限問題：chmod +x spawn-helper 可以解決"
})
```

#### 2. search_memories - 搜尋記憶

```typescript
// 搜尋相關記憶
search_memories({
  query: "Worktree"
})
// 返回: "Code Quest 使用 Worktree 隔離並行戰鬥..."

search_memories({
  query: "測試策略"
})
// 返回: "用戶偏好 TDD 開發流程：Feature Test > Integration Test > Unit Test"
```

#### 3. list_memories - 列出所有記憶

```typescript
list_memories()
// 返回所有已存儲的記憶
```

---

## Code Quest 專用記憶分類

### 架構記憶

```typescript
create_memory({
  category: "architecture",
  content: "三層架構：RPG UI (React) → Bridge (Node.js) → Claude CLI"
})

create_memory({
  category: "architecture",
  content: "vultuk 提供 PTY 管理，agent-worktree 提供隔離思想"
})
```

### 設計決策記憶

```typescript
create_memory({
  category: "design_decision",
  content: "選擇 node-pty 而非 spawn()，原因是需要完整的 TTY 支援和色彩輸出",
  rationale: "spawn() 無法提供 ANSI 色彩和可靠的暫停/恢復"
})

create_memory({
  category: "design_decision",
  content: "自己實作 Worktree 管理而非使用 agent-worktree CLI",
  rationale: "只需要基本功能，避免 Rust 依賴，更好的整合"
})
```

### 開發規範記憶

```typescript
create_memory({
  category: "development_rule",
  content: "TDD 循環：RED → GREEN → REFACTOR"
})

create_memory({
  category: "development_rule",
  content: "測試金字塔：Feature Test > Integration Test > Unit Test"
})

create_memory({
  category: "development_rule",
  content: "Test Double 優先順序：Fake > Spy > Stub > Mock"
})

create_memory({
  category: "development_rule",
  content: "重構黃金法則：expect 絕對不可變更"
})
```

### 用戶偏好記憶

```typescript
create_memory({
  category: "user_preference",
  content: "用戶不喜歡過度設計，偏好簡單直接的解決方案"
})

create_memory({
  category: "user_preference",
  content: "用戶強調先寫測試，不可憑空想象程式"
})
```

### 已知問題記憶

```typescript
create_memory({
  category: "known_issue",
  content: "PTY spawn-helper 權限問題",
  solution: "chmod +x node_modules/node-pty/build/Release/spawn-helper"
})

create_memory({
  category: "known_issue",
  content: "React Strict Mode 導致 WebSocket 重連循環",
  solution: "useEffect 依賴陣列使用空陣列 []"
})
```

---

## 記憶驅動的工作流程

### 場景 1：開始新任務

```typescript
// 1. 搜尋相關記憶
const memories = await search_memories({
  query: "Worktree 實作"
});

// 2. 回顧之前的決策
// "自己實作 Worktree 管理，約 100 行"
// "使用原生 git 命令"

// 3. 基於記憶開始工作
// 不需要重新討論，直接按照記憶的決策實作
```

### 場景 2：遇到問題

```typescript
// 1. 搜尋已知問題
const solutions = await search_memories({
  query: "PTY 權限"
});

// 2. 找到解決方案
// "chmod +x spawn-helper"

// 3. 應用解決方案
// 不需要重新 debug，直接套用
```

### 場景 3：重構程式碼

```typescript
// 1. 回顧開發規範
const rules = await search_memories({
  query: "重構規則"
});

// 2. 確認規則
// "expect 絕對不可變更"

// 3. 遵守規則重構
// 確保 expect 不變
```

---

## 記憶的生命週期

### 創建記憶

**時機**：
- 做出重要決策時
- 發現問題和解決方案時
- 用戶表達偏好時
- 完成重要里程碑時

**範例**：
```typescript
// 決策點
create_memory({
  content: "決定使用 Worktree 隔離戰鬥環境"
});

// 問題解決
create_memory({
  content: "WebSocket 重連問題：useEffect 空依賴陣列"
});

// 用戶偏好
create_memory({
  content: "用戶強調 TDD，不可憑空想象"
});
```

### 搜尋記憶

**時機**：
- 開始新任務前
- 遇到熟悉的問題時
- 需要回顧決策時
- 不確定如何做時

**範例**：
```typescript
// 開始任務前
search_memories({ query: "Worktree" });
search_memories({ query: "TDD" });

// 遇到問題
search_memories({ query: "PTY 錯誤" });

// 回顧決策
search_memories({ query: "為什麼用 node-pty" });
```

### 更新記憶

**時機**：
- 決策改變時
- 發現更好的解決方案時
- 規範更新時

**方式**：創建新記憶，說明更新原因

```typescript
create_memory({
  content: "更新：改用混合方案（有 agent-worktree 就用，沒有用原生 git）",
  supersedes: "之前決定完全自己實作"
});
```

### 清理記憶

**時機**：
- 過時的資訊
- 已解決的臨時問題
- 錯誤的決策

**方式**：（目前 Memory MCP 沒有刪除 API，需要手動管理）

---

## 進階：分層記憶系統

### 實作概念

```typescript
interface Memory {
  id: string;
  content: string;
  category: 'architecture' | 'decision' | 'rule' | 'preference' | 'issue';
  importance: 'critical' | 'high' | 'medium' | 'low';
  createdAt: Date;
  expiresAt?: Date;  // 短期記憶有過期時間
  tags: string[];
  relatedMemories: string[];  // 關聯的記憶
}

class MemorySystem {
  // 短期記憶（自動過期）
  async createShortTermMemory(content: string, ttl: number) {
    await create_memory({
      content,
      expiresAt: Date.now() + ttl
    });
  }

  // 長期記憶（永久）
  async createLongTermMemory(content: string, category: string) {
    await create_memory({
      content,
      category,
      importance: 'high'
    });
  }

  // 搜尋相關記憶
  async searchRelated(query: string, category?: string) {
    const memories = await search_memories({ query });
    if (category) {
      return memories.filter(m => m.category === category);
    }
    return memories;
  }
}
```

---

## 與 Code Quest 整合

### 戰鬥記憶

```typescript
// 戰鬥開始前：搜尋相關記憶
async function startBattle(prompt: string) {
  // 搜尋類似的戰鬥經驗
  const similarBattles = await search_memories({
    query: prompt
  });

  if (similarBattles.length > 0) {
    console.log("💡 找到相關記憶：");
    similarBattles.forEach(m => console.log(`  - ${m.content}`));
  }

  // 繼續啟動戰鬥...
}

// 戰鬥結束後：記錄經驗
async function endBattle(battleId: string, result: BattleResult) {
  await create_memory({
    category: "battle_experience",
    content: `戰鬥 ${battleId}：${result.success ? '成功' : '失敗'}`,
    details: {
      aiModel: result.aiModel,
      prompt: result.prompt,
      duration: result.duration,
      filesChanged: result.filesChanged,
      lessonsLearned: result.lessonsLearned
    }
  });
}
```

### 玩家記憶

```typescript
// 記住玩家的戰鬥風格
await create_memory({
  category: "player_style",
  content: "玩家偏好使用 Haiku 處理簡單任務，Opus 處理複雜重構"
});

// 記住玩家的技能使用習慣
await create_memory({
  category: "player_preference",
  content: "玩家很少使用 Bash 技能，偏好用 Read/Write/Edit 組合"
});
```

---

## 實用範例

### 範例 1：記住專案決策

```typescript
// Session 1
create_memory({
  content: "Code Quest 使用 Worktree 隔離戰鬥，原因是需要完全獨立的檔案系統"
});

// Session 2（幾天後）
const decision = await search_memories({
  query: "為什麼用 Worktree"
});
// 返回: "Code Quest 使用 Worktree 隔離戰鬥，原因是需要完全獨立的檔案系統"
// 不需要重新討論，直接基於這個決策繼續
```

### 範例 2：記住用戶偏好

```typescript
// 用戶說：「不要過度設計」
create_memory({
  category: "user_preference",
  content: "用戶強調不要過度設計，只實作當前需要的功能"
});

// 之後的開發中
const preferences = await search_memories({
  query: "設計原則"
});
// 記住：保持簡單，不過度設計
```

### 範例 3：記住已知問題

```typescript
// 遇到問題並解決
create_memory({
  category: "known_issue",
  content: "PTY spawn-helper 權限錯誤：chmod +x spawn-helper",
  solution: "chmod +x node_modules/node-pty/build/Release/spawn-helper"
});

// 下次遇到相同問題
const solutions = await search_memories({
  query: "spawn-helper"
});
// 立即找到解決方案，不需要重新 debug
```

---

## 最佳實踐

### 1. 記憶的顆粒度

**太粗**：
```typescript
❌ "專案很複雜"
```

**太細**：
```typescript
❌ "第 42 行的變數名是 battleId"
```

**剛好**：
```typescript
✅ "WorktreeManager 使用 git worktree add 命令建立隔離環境"
✅ "測試策略：Feature > Integration > Unit"
```

### 2. 記憶的時效性

**標註時間敏感的記憶**：
```typescript
create_memory({
  content: "目前使用 node-pty 版本 1.0.0（可能在未來版本改變）",
  createdAt: "2026-02-09",
  timesensitive: true
});
```

### 3. 記憶的關聯

**建立記憶之間的連結**：
```typescript
create_memory({
  content: "Worktree 隔離戰鬥環境",
  relatedTo: ["PTY 管理", "並行戰鬥", "檔案衝突"]
});
```

### 4. 記憶的驗證

**定期回顧和更新**：
```typescript
// 每個 milestone 檢查記憶是否還有效
const outdatedMemories = await search_memories({
  query: "決策",
  createdBefore: "2026-01-01"
});

// 更新或標記為過時
```

---

## 與其他 Skills 整合

### TDD Guidelines

```typescript
// 記住 TDD 規則
create_memory({
  category: "development_rule",
  content: "TDD 循環：RED → GREEN → REFACTOR，expect 不可變更"
});

// 開發時自動回顧
const tddRules = await search_memories({
  query: "TDD"
});
```

### PTY Architecture

```typescript
// 記住架構決策
create_memory({
  category: "architecture",
  content: "使用 node-pty 而非 spawn()，原因是需要完整 TTY 支援"
});
```

### Battle Management

```typescript
// 記住戰鬥管理策略
create_memory({
  category: "design",
  content: "DQ 風格選單：單一焦點，Tab 鍵彈出選單切換"
});
```

---

## 總結

### 記憶系統的價值

1. **連續性** - 跨 session 保持上下文
2. **一致性** - 遵守之前的決策
3. **效率** - 不重複討論已解決的問題
4. **學習** - 累積經驗和知識

### 實作方式

- **簡單方式**: 使用 Memory MCP Server（推薦）
- **進階方式**: 建立分層記憶系統
- **整合方式**: 與現有 skills 結合

### 使用建議

1. **主動記錄** - 重要決策立即記憶
2. **主動搜尋** - 開始任務前先搜尋
3. **定期回顧** - 確保記憶的準確性
4. **分類管理** - 使用 category 組織記憶

---

## 快速開始

```bash
# 1. 安裝 Memory MCP
npx -y @modelcontextprotocol/server-memory

# 2. 配置 Claude
# 編輯 ~/.claude/claude_desktop_config.json

# 3. 開始使用
create_memory({ content: "Code Quest 記憶系統已啟用" })
```

---

**記住：好的記憶系統就像好的筆記本，關鍵在於記錄重要的事情，而不是記錄所有事情。**
