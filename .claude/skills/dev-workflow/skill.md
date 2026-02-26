# Development Workflow - 開發工作流程

## 開發流程總覽

Code Quest 的開發遵循 **TDD + Feature-First + Incremental** 的工作流程。

```
┌─────────────────────────────────────────┐
│  1. Feature Planning (功能規劃)          │
│     - 定義使用者故事                     │
│     - 拆解成小任務                       │
├─────────────────────────────────────────┤
│  2. Feature Test (功能測試)             │
│     - 寫 E2E 測試描述完整功能            │
│     - 從使用者角度驗證                   │
├─────────────────────────────────────────┤
│  3. Integration Test (整合測試)         │
│     - 測試元件協作                       │
│     - 使用 Fake/Spy                     │
├─────────────────────────────────────────┤
│  4. Unit Test (單元測試)                │
│     - 測試個別函數邏輯                   │
│     - 快速回饋                          │
├─────────────────────────────────────────┤
│  5. Implementation (實作)               │
│     - 最少程式碼讓測試通過               │
│     - 不過度設計                        │
├─────────────────────────────────────────┤
│  6. Refactor (重構)                     │
│     - expect 不可變更                   │
│     - 改善程式碼品質                     │
├─────────────────────────────────────────┤
│  7. Review & Commit (審查與提交)         │
│     - 所有測試通過                       │
│     - 提交小而頻繁的 commit              │
└─────────────────────────────────────────┘
```

---

## 步驟 1: Feature Planning

### 使用者故事格式

```
作為 [角色]
我想要 [功能]
以便於 [價值]

驗收標準:
- [ ] 標準 1
- [ ] 標準 2
- [ ] 標準 3
```

### 範例：多戰鬥並行功能

```
作為玩家
我想要同時派遣三個 AI (Haiku, Sonnet, Opus) 執行不同任務
以便於提高開發效率，並行處理多個問題

驗收標準:
- [ ] 可以啟動多個戰鬥 (最多 3 個)
- [ ] 每個戰鬥完全隔離 (獨立的 PTY 進程)
- [ ] 可以透過 Tab 鍵切換查看不同戰鬥
- [ ] 每個戰鬥顯示獨立的 HP/MP/經驗值
- [ ] Worktree 戰鬥有紫色標示
```

### 任務拆解

```
多戰鬥並行功能
├── Task 1: BattleBridge - 單個戰鬥的 PTY 管理
│   ├── 1.1 啟動 PTY 進程
│   ├── 1.2 處理 PTY 輸出
│   └── 1.3 停止 PTY 進程
├── Task 2: BattleServer - 多戰鬥管理
│   ├── 2.1 建立多個 Battle Session
│   ├── 2.2 廣播事件給觀戰者
│   └── 2.3 處理戰鬥結束
├── Task 3: OutputParser - 輸出解析
│   ├── 3.1 解析 tool_use → skill_cast
│   ├── 3.2 解析 text → dialogue
│   └── 3.3 解析 result → battle_end
└── Task 4: UI - 戰鬥切換選單
    ├── 4.1 Tab 鍵彈出選單
    ├── 4.2 顯示所有活躍戰鬥
    └── 4.3 切換到選擇的戰鬥
```

---

## 步驟 2: Feature Test (E2E)

### 先寫 Feature Test

```typescript
// tests/features/parallel-battles.feature.test.ts
import { test, expect } from 'vitest';
import { render, screen, userEvent } from '@testing-library/react';
import { App } from '@/App';

test('玩家可以並行啟動三個戰鬥並切換查看', async () => {
  // Given: 玩家在公會大廳
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /公會大廳/i }));

  // When: 派遣 Haiku 戰鬥
  await userEvent.click(screen.getByRole('button', { name: /派遣任務/i }));
  await userEvent.selectOptions(screen.getByLabelText(/AI 模型/i), 'haiku');
  await userEvent.type(screen.getByLabelText(/任務/i), '更新 README');
  await userEvent.click(screen.getByRole('button', { name: /確認派遣/i }));

  // Then: 應該顯示戰鬥已啟動
  expect(await screen.findByText(/Haiku 戰鬥已啟動/i)).toBeInTheDocument();

  // When: 派遣 Sonnet 戰鬥
  await userEvent.click(screen.getByRole('button', { name: /派遣任務/i }));
  await userEvent.selectOptions(screen.getByLabelText(/AI 模型/i), 'sonnet');
  await userEvent.type(screen.getByLabelText(/任務/i), '實作登入功能');
  await userEvent.click(screen.getByRole('button', { name: /確認派遣/i }));

  // When: 按 Tab 鍵開啟戰鬥選單
  await userEvent.keyboard('{Tab}');

  // Then: 應該顯示兩個活躍戰鬥
  expect(screen.getByText(/🔵.*Haiku.*更新 README/i)).toBeInTheDocument();
  expect(screen.getByText(/🔵.*Sonnet.*實作登入功能/i)).toBeInTheDocument();

  // When: 選擇 Sonnet 戰鬥
  await userEvent.click(screen.getByText(/Sonnet.*實作登入功能/i));

  // Then: 應該切換到 Sonnet 戰鬥畫面
  expect(screen.getByRole('heading', { name: /Sonnet 戰鬥/i })).toBeInTheDocument();
  expect(screen.getByText(/實作登入功能/i)).toBeInTheDocument();
});
```

**執行測試 → 失敗 (這是預期的！)**

```bash
$ npm test
❌ Cannot find '派遣任務' button
```

---

## 步驟 3: Integration Test

### 測試 BattleServer 與 BattleBridge 整合

```typescript
// tests/integration/battle-server.integration.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BattleServer } from '@/server/BattleServer';
import { FakeBattleStore } from '../fakes/FakeBattleStore';

describe('BattleServer Integration', () => {
  let server: BattleServer;
  let store: FakeBattleStore;

  beforeEach(() => {
    store = new FakeBattleStore();
    server = new BattleServer({ store });
  });

  it('應該並行啟動多個戰鬥並隔離', async () => {
    // Given: 三個戰鬥配置
    const configs = [
      { aiModel: 'haiku', prompt: 'Task 1' },
      { aiModel: 'sonnet', prompt: 'Task 2' },
      { aiModel: 'opus', prompt: 'Task 3' }
    ];

    // When: 並行啟動
    const battleIds = server.startParallelBattles(configs);

    // Then: 應該建立三個獨立的戰鬥
    expect(battleIds).toHaveLength(3);
    expect(server.battles.size).toBe(3);

    // And: 每個戰鬥都有獨立的 PTY
    const battles = Array.from(server.battles.values());
    const ptyIds = battles.map(b => b.pty.pid);
    const uniquePtyIds = new Set(ptyIds);
    expect(uniquePtyIds.size).toBe(3); // 完全隔離
  });

  it('應該將 PTY 輸出轉換為 RPG 事件', async () => {
    // Given: Spy on broadcast
    const broadcastSpy = vi.fn();
    server.on('broadcast', broadcastSpy);

    // When: 啟動戰鬥
    const battleId = server.startBattle({
      aiModel: 'haiku',
      prompt: 'test'
    });

    // When: PTY 產生輸出 (模擬 tool_use)
    const mockOutput = JSON.stringify({
      type: 'tool_use',
      name: 'Read',
      input: { file_path: 'test.ts' }
    });

    // 觸發輸出 (透過 internal API)
    server.battleBridge.simulateOutput(battleId, mockOutput);

    // Then: 應該廣播 skill_cast 事件
    await vi.waitFor(() => {
      expect(broadcastSpy).toHaveBeenCalledWith(
        battleId,
        expect.objectContaining({
          type: 'rpg_event',
          event: expect.objectContaining({
            type: 'skill_cast',
            skillName: '閱讀卷軸',
            target: 'test.ts'
          })
        })
      );
    });
  });
});
```

---

## 步驟 4: Unit Test

### 測試 OutputParser 邏輯

```typescript
// tests/unit/output-parser.test.ts
import { describe, it, expect } from 'vitest';
import { OutputParser } from '@/server/OutputParser';

describe('OutputParser', () => {
  const parser = new OutputParser();

  describe('tool_use 解析', () => {
    it('應該將 Read 工具轉換為閱讀卷軸技能', () => {
      // Given
      const input = JSON.stringify({
        type: 'tool_use',
        name: 'Read',
        input: { file_path: 'src/main.ts' }
      });

      // When
      const events = parser.parse(input);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'skill_cast',
        skillName: '閱讀卷軸',
        target: 'src/main.ts',
        mpCost: 5,
        animation: 'scroll_unfurl',
        timestamp: expect.any(Number)
      });
    });

    it('應該將 Write 工具轉換為書寫魔法技能', () => {
      // Given
      const input = JSON.stringify({
        type: 'tool_use',
        name: 'Write',
        input: { file_path: 'src/new.ts' }
      });

      // When
      const events = parser.parse(input);

      // Then
      expect(events[0]).toMatchObject({
        type: 'skill_cast',
        skillName: '書寫魔法',
        mpCost: 10,
        animation: 'quill_writing'
      });
    });
  });

  describe('非 JSON 輸出', () => {
    it('應該將純文字轉換為 dialogue 事件', () => {
      // Given
      const input = 'System initialized successfully';

      // When
      const events = parser.parse(input);

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'dialogue',
        speaker: 'system',
        message: 'System initialized successfully',
        timestamp: expect.any(Number)
      });
    });
  });

  describe('多行輸出', () => {
    it('應該解析多個事件', () => {
      // Given
      const input = [
        JSON.stringify({ type: 'tool_use', name: 'Read', input: {} }),
        'Some text',
        JSON.stringify({ type: 'text', text: 'Response' })
      ].join('\n');

      // When
      const events = parser.parse(input);

      // Then
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('skill_cast');
      expect(events[1].type).toBe('dialogue');
      expect(events[2].type).toBe('dialogue');
    });
  });
});
```

---

## 步驟 5: Implementation

### 最少程式碼讓測試通過

```typescript
// src/server/OutputParser.ts
export class OutputParser {
  parse(data: string): RPGEvent[] {
    const events: RPGEvent[] = [];
    const lines = data.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const json = JSON.parse(line);

        if (json.type === 'tool_use') {
          events.push(this.createSkillCastEvent(json));
        } else if (json.type === 'text') {
          events.push(this.createDialogueEvent(json));
        }
      } catch {
        // 非 JSON - 當作 dialogue
        events.push({
          type: 'dialogue',
          speaker: 'system',
          message: line,
          timestamp: Date.now()
        });
      }
    }

    return events;
  }

  private createSkillCastEvent(json: any): SkillCastEvent {
    const skillMapping = {
      'Read': { name: '閱讀卷軸', mp: 5, animation: 'scroll_unfurl' },
      'Write': { name: '書寫魔法', mp: 10, animation: 'quill_writing' },
      'Edit': { name: '編輯之術', mp: 8, animation: 'pencil_edit' }
    };

    const skill = skillMapping[json.name] || {
      name: json.name,
      mp: 10,
      animation: 'default'
    };

    return {
      type: 'skill_cast',
      skillName: skill.name,
      target: json.input?.file_path || json.input?.pattern,
      mpCost: skill.mp,
      animation: skill.animation,
      timestamp: Date.now()
    };
  }

  private createDialogueEvent(json: any): DialogueEvent {
    return {
      type: 'dialogue',
      speaker: 'claude',
      message: json.text,
      timestamp: Date.now()
    };
  }
}
```

**執行測試 → 通過**

```bash
$ npm test
✓ OutputParser > tool_use 解析 > 應該將 Read 工具轉換為閱讀卷軸技能
✓ OutputParser > tool_use 解析 > 應該將 Write 工具轉換為書寫魔法技能
✓ OutputParser > 非 JSON 輸出 > 應該將純文字轉換為 dialogue 事件
✓ OutputParser > 多行輸出 > 應該解析多個事件
```

---

## 步驟 6: Refactor

### 重構改善程式碼品質 (expect 不變)

```typescript
// src/server/OutputParser.ts (重構後)

// 提取 skill mapping 為常數
const SKILL_MAPPINGS = {
  'Read': { name: '閱讀卷軸', mp: 5, animation: 'scroll_unfurl' },
  'Write': { name: '書寫魔法', mp: 10, animation: 'quill_writing' },
  'Edit': { name: '編輯之術', mp: 8, animation: 'pencil_edit' },
  'Grep': { name: '搜尋之眼', mp: 7, animation: 'magnifying_glass' },
  'Bash': { name: '終端召喚', mp: 15, animation: 'terminal_flash' }
} as const;

const DEFAULT_SKILL = {
  name: '',
  mp: 10,
  animation: 'default'
} as const;

export class OutputParser {
  parse(data: string): RPGEvent[] {
    return data
      .split('\n')
      .filter(line => line.trim())
      .map(line => this.parseLine(line));
  }

  private parseLine(line: string): RPGEvent {
    try {
      const json = JSON.parse(line);
      return this.parseJSON(json);
    } catch {
      return this.createSystemDialogue(line);
    }
  }

  private parseJSON(json: any): RPGEvent {
    switch (json.type) {
      case 'tool_use':
        return this.createSkillCastEvent(json);
      case 'text':
        return this.createDialogueEvent(json);
      default:
        return this.createSystemDialogue(JSON.stringify(json));
    }
  }

  private createSkillCastEvent(json: any): SkillCastEvent {
    const skill = SKILL_MAPPINGS[json.name] || {
      ...DEFAULT_SKILL,
      name: json.name
    };

    return {
      type: 'skill_cast',
      skillName: skill.name,
      target: this.extractTarget(json.input),
      mpCost: skill.mp,
      animation: skill.animation,
      timestamp: Date.now()
    };
  }

  private extractTarget(input: any): string | undefined {
    return input?.file_path || input?.pattern;
  }

  private createDialogueEvent(json: any): DialogueEvent {
    return {
      type: 'dialogue',
      speaker: 'claude',
      message: json.text,
      timestamp: Date.now()
    };
  }

  private createSystemDialogue(message: string): DialogueEvent {
    return {
      type: 'dialogue',
      speaker: 'system',
      message,
      timestamp: Date.now()
    };
  }
}
```

**執行測試 → 仍然通過 (expect 完全不變)**

```bash
$ npm test
✓ OutputParser > tool_use 解析 > 應該將 Read 工具轉換為閱讀卷軸技能
✓ OutputParser > tool_use 解析 > 應該將 Write 工具轉換為書寫魔法技能
✓ OutputParser > 非 JSON 輸出 > 應該將純文字轉換為 dialogue 事件
✓ OutputParser > 多行輸出 > 應該解析多個事件
```

---

## 步驟 7: Review & Commit

### Git Commit 規範

```bash
# 小而頻繁的 commit
git add tests/unit/output-parser.test.ts
git commit -m "test: add OutputParser unit tests"

git add src/server/OutputParser.ts
git commit -m "feat: implement OutputParser for PTY output parsing"

git add tests/integration/battle-server.integration.test.ts
git commit -m "test: add BattleServer integration tests"

git add src/server/BattleServer.ts
git commit -m "feat: implement BattleServer for multi-battle management"
```

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 類型**:
- `feat`: 新功能
- `fix`: 修復 Bug
- `test`: 新增或修改測試
- `refactor`: 重構 (expect 不變)
- `docs`: 文檔更新
- `style`: 程式碼格式 (不影響邏輯)
- `chore`: 建構工具或輔助工具的變動

**範例**:

```bash
git commit -m "feat(battle): implement parallel battle system

- Add BattleBridge for PTY process management
- Add BattleServer for multi-battle coordination
- Add OutputParser for RPG event conversion

Closes #123"
```

---

## 開發檢查清單

### 開始新功能前

- [ ] 定義使用者故事
- [ ] 拆解成小任務 (< 4 小時)
- [ ] 寫 Feature Test (E2E)
- [ ] 確保測試失敗 (RED)

### 實作過程中

- [ ] 寫 Integration Test
- [ ] 寫 Unit Test
- [ ] 寫最少程式碼讓測試通過 (GREEN)
- [ ] 重構但 expect 不變 (REFACTOR)
- [ ] 所有測試通過
- [ ] 小而頻繁的 commit

### 完成功能後

- [ ] Feature Test 通過
- [ ] Integration Test 通過
- [ ] Unit Test 通過
- [ ] 程式碼已重構
- [ ] 沒有待辦事項 (TODO)
- [ ] 提交 Pull Request

---

## 常見場景

### 場景 1: 新增功能

```bash
# 1. 建立分支
git checkout -b feat/parallel-battles

# 2. 寫 Feature Test
touch tests/features/parallel-battles.feature.test.ts
# 寫測試...
npm test # ❌ 失敗

# 3. 寫 Integration Test
touch tests/integration/battle-server.integration.test.ts
# 寫測試...
npm test # ❌ 失敗

# 4. 寫 Unit Test
touch tests/unit/output-parser.test.ts
# 寫測試...
npm test # ❌ 失敗

# 5. 實作
touch src/server/OutputParser.ts
# 寫最少程式碼...
npm test # ✓ 通過

# 6. 重構
# 改善程式碼...
npm test # ✓ 仍然通過

# 7. Commit
git add .
git commit -m "feat(battle): implement parallel battle system"
```

### 場景 2: 修復 Bug

```bash
# 1. 寫重現 Bug 的測試
touch tests/unit/output-parser.bug.test.ts

it('should handle empty tool_use input', () => {
  const input = JSON.stringify({
    type: 'tool_use',
    name: 'Read',
    input: null // Bug: null input
  });

  const events = parser.parse(input);

  expect(events[0].target).toBeUndefined();
  // 目前會拋錯！
});

npm test # ❌ 失敗 (重現 Bug)

# 2. 修復
# 修改 OutputParser.ts...
npm test # ✓ 通過

# 3. Commit
git commit -m "fix(parser): handle null tool_use input"
```

### 場景 3: 重構

```bash
# 1. 確保所有測試通過
npm test # ✓ All pass

# 2. 重構
# 改善程式碼結構...

# 3. 驗證 (expect 不變)
npm test # ✓ All pass (same expectations)

# 4. Commit
git commit -m "refactor(parser): extract skill mappings to constants"
```

---

## 測試執行策略

### 開發時

```bash
# 監聽模式 (自動重跑)
npm test -- --watch

# 只跑特定檔案
npm test output-parser

# 只跑特定測試
npm test -- -t "should parse tool_use"
```

### CI/CD

```bash
# 跑所有測試
npm test

# 產生覆蓋率報告
npm test -- --coverage

# 檢查覆蓋率門檻
npm test -- --coverage --coverageThreshold='{"global":{"lines":80}}'
```

---

## 相關 Skills

當你需要：
- **TDD 詳細指南** → `/tdd-guidelines`
- **PTY 架構實作** → `/pty-architecture`
- **戰鬥管理設計** → `/battle-management`
- **專案總覽** → `/project-overview`

---

## 快速參考

### TDD 循環

```
RED → GREEN → REFACTOR
```

### 測試優先順序

```
Feature → Integration → Unit
```

### Test Double

```
Fake > Spy > Stub > Mock
```

### Commit 頻率

```
每個 GREEN → Commit
每個 REFACTOR → Commit
```

---

記住：**小步前進，持續整合，測試驅動！**
