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

## Test Double 優先順序

```
Fake > Spy > Stub > Mock
```

### 1. Fake (最優先)

**定義**: 真正可運作的實作，但使用簡化版本 (例如：記憶體資料庫)

**範例**: Fake BattleStore

```typescript
// tests/fakes/FakeBattleStore.ts
export class FakeBattleStore {
  private battles = new Map();

  async saveBattles(battles: Map<string, Battle>) {
    // 實際儲存到記憶體 (而非檔案)
    battles.forEach((battle, id) => {
      this.battles.set(id, { ...battle });
    });
  }

  async loadBattles(): Promise<Map<string, Battle>> {
    // 實際從記憶體載入
    return new Map(this.battles);
  }

  // 測試輔助方法
  clear() {
    this.battles.clear();
  }
}

// 使用 Fake
it('應該持久化戰鬥狀態', async () => {
  // Given: 使用 Fake Store
  const store = new FakeBattleStore();
  const server = new BattleServer({ store });

  // When: 啟動戰鬥
  const battleId = server.startBattle(config);
  await server.saveBattles();

  // Then: 應該儲存戰鬥
  const loaded = await store.loadBattles();
  expect(loaded.has(battleId)).toBe(true);
});
```

### 2. Spy (次優先)

**定義**: 記錄被呼叫的資訊，但執行真正的實作

**範例**: Spy on PTY events

```typescript
// tests/integration/battle-bridge.test.ts
import { vi } from 'vitest';

it('應該在 PTY 輸出時呼叫 onOutput', async () => {
  // Given: Spy on onOutput
  const onOutputSpy = vi.fn();
  const bridge = new BattleBridge();
  bridge.onOutput = onOutputSpy;

  // When: 啟動戰鬥
  const battleId = bridge.startBattle(battleId, config);

  // 等待 PTY 輸出
  await vi.waitFor(() => {
    expect(onOutputSpy).toHaveBeenCalled();
  });

  // Then: 應該呼叫 onOutput
  expect(onOutputSpy).toHaveBeenCalledWith(
    battleId,
    expect.any(String)
  );
});
```

### 3. Stub (第三優先)

**定義**: 回傳預設的回應，不執行真正的邏輯

**範例**: Stub WebSocket

```typescript
// tests/stubs/StubWebSocket.ts
export class StubWebSocket {
  readyState = WebSocket.OPEN;
  sentMessages: string[] = [];

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
  }

  // 測試輔助方法
  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }
}

// 使用 Stub
it('應該廣播事件給所有連接', () => {
  // Given: Stub WebSocket
  const ws1 = new StubWebSocket();
  const ws2 = new StubWebSocket();
  server.addConnection(battleId, ws1);
  server.addConnection(battleId, ws2);

  // When: 廣播事件
  server.broadcastToBattle(battleId, { type: 'test' });

  // Then: 兩個 WebSocket 都應該收到
  expect(ws1.sentMessages).toHaveLength(1);
  expect(ws2.sentMessages).toHaveLength(1);
});
```

### 4. Mock (最後手段)

**定義**: 預先設定期望的呼叫，驗證是否符合

**範例**: Mock external service

```typescript
// 只在必須驗證呼叫順序或次數時使用
it('應該按順序呼叫生命週期方法', () => {
  // Given: Mock lifecycle
  const lifecycle = {
    onStart: vi.fn(),
    onOutput: vi.fn(),
    onEnd: vi.fn()
  };

  // When: 執行戰鬥
  battle.run(lifecycle);

  // Then: 驗證呼叫順序
  expect(lifecycle.onStart).toHaveBeenCalledBefore(lifecycle.onOutput);
  expect(lifecycle.onOutput).toHaveBeenCalledBefore(lifecycle.onEnd);
});
```

**為何避免過度使用 Mock？**
- ❌ 綁定實作細節 (例如：呼叫次數、參數)
- ❌ 重構時測試容易壞掉
- ❌ 測試變得脆弱

---

## 前端測試策略

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

## TDD 實作範例

### 範例：實作 BattleBridge

**步驟 1: 寫失敗的測試 (RED)**

```typescript
// tests/integration/battle-bridge.test.ts
import { describe, it, expect } from 'vitest';
import { BattleBridge } from '@/server/BattleBridge';

describe('BattleBridge', () => {
  it('應該啟動戰鬥並建立 PTY Session', () => {
    // Given
    const bridge = new BattleBridge();
    const config = {
      aiModel: 'haiku',
      prompt: 'test prompt',
      workingDir: process.cwd()
    };

    // When
    const battleId = 'test-battle';
    const battle = bridge.startBattle(battleId, config);

    // Then
    expect(battle).toBeDefined();
    expect(battle.id).toBe(battleId);
    expect(battle.pty).toBeDefined();
    expect(bridge.sessions.has(battleId)).toBe(true);
  });
});
```

**執行測試 → 失敗 (因為 BattleBridge 還不存在)**

```bash
$ npm test
❌ Cannot find module '@/server/BattleBridge'
```

**步驟 2: 寫最少的程式碼 (GREEN)**

```typescript
// src/server/BattleBridge.ts
import { spawn } from 'node-pty';

export class BattleBridge {
  sessions = new Map();

  startBattle(battleId: string, config: any) {
    // 尋找 Claude CLI
    const claudeCommand = 'claude'; // 簡化版本

    // 生成 PTY
    const pty = spawn(claudeCommand, ['--print', config.prompt], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: config.workingDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1'
      }
    });

    // 建立 Session
    const battle = {
      id: battleId,
      pty: pty,
      outputBuffer: '',
      battleData: {}
    };

    this.sessions.set(battleId, battle);
    return battle;
  }
}
```

**執行測試 → 通過**

```bash
$ npm test
✓ 應該啟動戰鬥並建立 PTY Session
```

**步驟 3: 重構 (REFACTOR)**

```typescript
// src/server/BattleBridge.ts
import { spawn, IPty } from 'node-pty';

interface BattleConfig {
  aiModel: string;
  prompt: string;
  workingDir: string;
}

interface Battle {
  id: string;
  pty: IPty;
  outputBuffer: string;
  battleData: any;
}

export class BattleBridge {
  sessions = new Map<string, Battle>();

  startBattle(battleId: string, config: BattleConfig): Battle {
    const claudeCommand = this.findClaudeCommand();
    const pty = this.spawnPTY(claudeCommand, config);
    const battle = this.createBattleSession(battleId, pty);

    this.sessions.set(battleId, battle);
    return battle;
  }

  private findClaudeCommand(): string {
    // 實作指令搜尋邏輯
    return 'claude';
  }

  private spawnPTY(command: string, config: BattleConfig): IPty {
    return spawn(command, ['--print', config.prompt], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: config.workingDir,
      env: this.getPTYEnv()
    });
  }

  private getPTYEnv() {
    return {
      ...process.env,
      TERM: 'xterm-256color',
      FORCE_COLOR: '1',
      COLORTERM: 'truecolor'
    };
  }

  private createBattleSession(battleId: string, pty: IPty): Battle {
    return {
      id: battleId,
      pty: pty,
      outputBuffer: '',
      battleData: {}
    };
  }
}
```

**執行測試 → 仍然通過 (expect 不變)**

```bash
$ npm test
✓ 應該啟動戰鬥並建立 PTY Session
```

---

## 常見反模式

### ❌ 反模式 1：先寫實作再寫測試

```typescript
// ❌ 錯誤：先寫了完整的實作
export class BattleServer {
  // ... 100 行程式碼
}

// 然後才寫測試
it('should work', () => {
  // 測試只是確認現有行為
  // 而非驅動設計
});
```

### ❌ 反模式 2：過度設計

```typescript
// ❌ 錯誤：一次實作太多功能
export class BattleServer {
  startBattle() { /* ... */ }
  pauseBattle() { /* ... */ }
  resumeBattle() { /* ... */ }
  stopBattle() { /* ... */ }
  saveBattle() { /* ... */ }
  loadBattle() { /* ... */ }
  // 但測試只要求 startBattle！
}
```

### ❌ 反模式 3：測試實作細節

```typescript
// ❌ 錯誤：測試內部實作
it('should call setupPtyHandlers', () => {
  const spy = vi.spyOn(bridge, 'setupPtyHandlers');
  bridge.startBattle(id, config);
  expect(spy).toHaveBeenCalled();
});

// ✅ 正確：測試行為
it('should emit output when PTY produces data', async () => {
  const onOutput = vi.fn();
  bridge.onOutput = onOutput;
  bridge.startBattle(id, config);

  await vi.waitFor(() => {
    expect(onOutput).toHaveBeenCalledWith(id, expect.any(String));
  });
});
```

### ❌ 反模式 4：重構時改變 expect

```typescript
// ❌ 錯誤
it('應該計算總 MP', () => {
  // 重構前
  expect(calculateMP([10, 20])).toBe(30);

  // 重構後 (錯誤！)
  expect(calculateMP([10, 20])).toBeGreaterThan(25);
});

// ✅ 正確
it('應該計算總 MP', () => {
  // 重構前後都一樣
  expect(calculateMP([10, 20])).toBe(30);
});
```

---

## TDD 實作檢查清單

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

## 相關文檔

- **PTY 架構**: `/pty-architecture`
- **戰鬥管理**: `/battle-management`
- **專案總覽**: `/project-overview`

**測試框架文檔**:
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/
- MSW: https://mswjs.io/

---

記住：**測試是設計工具，不是驗證工具。先寫測試，讓測試驅動你的設計！**
