---
name: tdd-guidelines
description: >
  cc-office TDD workflow — Red-Green-Refactor cycle, expect-immutability rule during refactor, test pyramid, naming (AAA), and refactor discipline. Use when writing new code, refactoring, designing test structure, fixing failing tests in a principled way, or onboarding to this project's TDD conventions. Pairs with generic `tdd` skill and `test-doubles` theory.
---

# TDD Guidelines - 測試驅動開發準則

## 核心原則

Code Quest 採用 **嚴格的 TDD (Test-Driven Development)** 開發流程：

> **先寫測試，逼出程式用法，再產生程式。絕不憑空想象。**

---

## TDD 開發循環

```
┌─────────────────────────────────────────┐
│  RED → GREEN → REFACTOR                 │
├─────────────────────────────────────────┤
│                                         │
│  1. 🔴 RED: 寫一個會失敗的測試          │
│     - 描述期望的行為                    │
│     - 測試應該失敗 (因為功能還不存在)    │
│                                         │
│  2. 🟢 GREEN: 寫最少的程式碼讓測試通過   │
│     - 只寫必要的程式碼                  │
│     - 不要過度設計                      │
│     - 讓測試變綠就停止                  │
│                                         │
│  3. 🔵 REFACTOR: 重構改善程式碼品質     │
│     - ⚠️ 不可變更 expect               │
│     - expect 是我們最重要的結果         │
│     - 只重構實作，不改變行為            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 測試金字塔 (優先順序)

```
        ┌─────────────┐
        │  Feature    │  最優先
        │  Test       │  (End-to-End)
        ├─────────────┤
        │ Integration │  次優先
        │    Test     │  (Component)
        ├─────────────┤
        │    Unit     │  最後
        │    Test     │  (Function)
        └─────────────┘
```

### 1. Feature Test (最優先)

**目的**: 從使用者角度測試完整功能

**範例**: 測試完整的戰鬥流程

```typescript
// tests/features/battle.feature.test.ts
import { test, expect } from 'vitest';
import { render, screen, userEvent } from '@testing-library/react';
import { App } from '@/App';

test('玩家可以啟動戰鬥並看到 AI 施放技能', async () => {
  // Given: 玩家在城鎮
  render(<App />);

  // When: 玩家點擊「前往野外」
  await userEvent.click(screen.getByRole('button', { name: /前往野外/i }));

  // Then: 觸發戰鬥
  expect(screen.getByText(/遭遇敵人/i)).toBeInTheDocument();

  // When: AI 施放技能
  await screen.findByText(/閱讀卷軸/i, {}, { timeout: 5000 });

  // Then: 顯示 MP 消耗
  expect(screen.getByText(/MP: 95\/100/i)).toBeInTheDocument();
});
```

### 2. Integration Test (次優先)

**目的**: 測試多個元件的協作

**範例**: 測試 BattleServer 與 BattleBridge 的整合

```typescript
// tests/integration/battle-server.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { BattleServer } from '@/server/BattleServer';
import { BattleBridge } from '@/server/BattleBridge';

describe('BattleServer Integration', () => {
  let server: BattleServer;

  beforeEach(() => {
    server = new BattleServer();
  });

  it('應該啟動戰鬥並接收 PTY 輸出', async () => {
    // Given: 戰鬥配置
    const config = {
      aiModel: 'haiku',
      prompt: '列出檔案',
      workingDir: process.cwd()
    };

    // When: 啟動戰鬥
    const battleId = server.startBattle(config);

    // Then: 應該建立戰鬥 Session
    expect(server.battles.has(battleId)).toBe(true);

    // When: 等待 PTY 輸出
    const output = await new Promise((resolve) => {
      server.on('output', (id, data) => {
        if (id === battleId) resolve(data);
      });
    });

    // Then: 應該收到輸出
    expect(output).toBeTruthy();
  });
});
```

### 3. Unit Test (最後)

**目的**: 測試單一函數或類別的邏輯

**範例**: 測試 OutputParser

```typescript
// tests/unit/output-parser.test.ts
import { describe, it, expect } from 'vitest';
import { OutputParser } from '@/server/OutputParser';

describe('OutputParser', () => {
  const parser = new OutputParser();

  it('應該解析 tool_use 事件為 skill_cast', () => {
    // Given: Claude 輸出 (NDJSON)
    const input = JSON.stringify({
      type: 'tool_use',
      name: 'Read',
      input: { file_path: 'src/main.ts' }
    });

    // When: 解析
    const events = parser.parse(input);

    // Then: 應該產生 skill_cast 事件
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'skill_cast',
      skillName: '閱讀卷軸',
      target: 'src/main.ts',
      mpCost: 5
    });
  });

  it('應該解析非 JSON 行為 dialogue 事件', () => {
    // Given: 純文字輸出
    const input = 'System initialized';

    // When: 解析
    const events = parser.parse(input);

    // Then: 應該產生 dialogue 事件
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'dialogue',
      speaker: 'system',
      message: 'System initialized'
    });
  });
});
```

---

## Test Double 選擇

本 skill 聚焦 TDD 流程。Test double 選擇依情境見專屬 skill：

- **經典五型定義**（Dummy / Stub / Fake / Spy / Mock）→ `test-doubles` skill
- **Client 測試**（React / socket / Zustand）→ `frontend-testing` skill
- **Server 測試**（Node / socket.io / DB / CLI）→ `vitest-testing` skill

核心原則：**優先真實實作；需要隔離再選 double，層級越低越好**。重構時 expect 不變的黃金法則跟 test double 型別無關。

---

## 前端測試策略

> **React component / hook / store 的細節 patterns** 參考 `frontend-testing` 與 `testing-best-practices` skill。
> 本節只涵蓋 TDD 流程裡的 MSW 設定範例。
>
> **ky-based API client 測試** 用 `msw-fetch-mock` 套件（protocol-level intercept），詳見 `msw-fetch-mock` skill。

### MSW (Mock Service Worker) 設定

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // WebSocket 連接
  http.get('/ws', () => {
    return HttpResponse.json({ status: 'connected' });
  }),

  // 啟動戰鬥
  http.post('/api/battles', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      battleId: 'test-battle-id',
      status: 'started'
    });
  }),

  // 取得戰鬥狀態
  http.get('/api/battles/:battleId', ({ params }) => {
    return HttpResponse.json({
      id: params.battleId,
      hp: 100,
      mp: 80,
      status: 'active'
    });
  })
];

// tests/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### MSW Fetch Mock 範例

```typescript
// tests/components/BattleView.test.tsx
import { render, screen } from '@testing-library/react';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';

it('應該顯示戰鬥狀態', async () => {
  // Given: Mock API 回應
  server.use(
    http.get('/api/battles/test-id', () => {
      return HttpResponse.json({
        id: 'test-id',
        hp: 75,
        mp: 60,
        status: 'active'
      });
    })
  );

  // When: 渲染元件
  render(<BattleView battleId="test-id" />);

  // Then: 應該顯示正確的狀態
  await screen.findByText(/HP: 75/i);
  expect(screen.getByText(/MP: 60/i)).toBeInTheDocument();
});
```

---

## 重構規則

### ⚠️ 黃金法則：不可變更 expect

```typescript
// ❌ 錯誤：重構時改變了 expect
it('應該計算總 MP 消耗', () => {
  const result = calculateTotalMP([10, 20, 30]);

  // 重構前
  expect(result).toBe(60);

  // 重構後 (錯誤！)
  expect(result).toBeGreaterThan(50); // ❌ 改變了期望
});

// ✅ 正確：只重構實作，不改變 expect
it('應該計算總 MP 消耗', () => {
  const result = calculateTotalMP([10, 20, 30]);

  // 重構前後 expect 不變
  expect(result).toBe(60); // ✅ 期望不變

  // 可以重構 calculateTotalMP 的實作
  // 但結果必須一樣
});
```

### 重構檢查清單

```typescript
// 重構前
function calculateMP(skills: Skill[]): number {
  let total = 0;
  for (let i = 0; i < skills.length; i++) {
    total += skills[i].mpCost;
  }
  return total;
}

// 重構後
function calculateMP(skills: Skill[]): number {
  return skills.reduce((sum, skill) => sum + skill.mpCost, 0);
}

// ✅ 檢查清單
// 1. expect 不變？ → ✓
// 2. 所有測試還通過？ → ✓
// 3. 行為完全一致？ → ✓
// 4. 程式碼更簡潔？ → ✓
```

---

## 詳細範例與常見陷阱

完整 TDD 範例 walkthrough、錯誤/正確對照、常見陷阱與修正在 `references/examples-and-pitfalls.md`。此處只列主要陷阱類別：

- 先寫完整實作再補測試（應先寫會失敗的測試）
- 一次 Green 太大步（拆成最小可通過實作）
- 測試內部實作細節（應測可觀察行為）
- 重構時改了 expect（expect 變動 = 行為變更，走另一個 RED → GREEN 循環）

詳見 references 的 ❌/✓ 對照範例。


開始實作前，確認：

- [ ] **測試先行** - 是否先寫了失敗的測試？
- [ ] **最小實作** - 是否只寫了讓測試通過的最少程式碼？
- [ ] **測試金字塔** - 是否優先寫 Feature Test？
- [ ] **Test Double** - 是否優先使用 Fake？
- [ ] **expect 不變** - 重構時是否保持 expect 不變？
- [ ] **避免過度設計** - 是否只實作當前測試需要的功能？

開始實作後，持續檢查：

- [ ] **所有測試通過** - 綠燈？
- [ ] **程式碼簡潔** - 可以重構嗎？
- [ ] **行為一致** - 重構後行為相同嗎？
- [ ] **expect 不變** - 重構時 expect 沒變？

---

## 快速參考

### TDD 循環

```bash
# 1. RED
$ npm test
❌ Test failed

# 2. GREEN
$ npm test
✓ Test passed

# 3. REFACTOR
$ npm test
✓ Test still passed (expect 不變)
```

### 測試優先順序

```
Feature Test (最優先) → Integration Test → Unit Test
```

### Test Double 優先順序

```
Fake (最優先) → Spy → Stub → Mock (最後)
```

### 重構黃金法則

```typescript
// ⚠️ 重構時 expect 絕對不可變更
expect(result).toBe(expectedValue); // 永遠不變
```

---

## 相關 skill

**TDD 與 test double 理論**：
- `tdd` — 通用 TDD（Red-Green-Refactor、命名、金字塔）
- `test-doubles` — 五型（Mock / Stub / Fake / Spy / Dummy）理論與選擇順序

**Test harness（具體工具）**：
- `fake-summoner-server` — server 端 socket / pipeline / ProcessRunner harness
- `fake-summoner-client` — client 端 `renderWithChannel` / `renderWithWorkspace`
- `fixture-driven-tdd` — parser / protocol 用真實 CLI JSON fixture 驅動

**各層測試慣例**：
- `vitest-testing` — server vitest 專案慣例（5-tier test double）
- `frontend-testing` — client RTL 慣例（7-tier test double、query 優先序）
- `testing-best-practices` — 共用 Vitest + RTL + MSW 慣例
- `cc-office-review` — cc-office 專案特定測試檢查

**專案脈絡**：
- `project-overview` — 當前架構（roadmap 參考 `rpg-roadmap`）

**測試框架文檔**:
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/
- MSW: https://mswjs.io/

---

記住：**測試是設計工具，不是驗證工具。先寫測試，讓測試驅動你的設計！**
