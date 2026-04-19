# TDD Examples and Pitfalls

> 此檔案是 `tdd-guidelines` skill 的補充。主要原則在 SKILL.md，這裡放詳細的 ❌/✓ 對照範例 + 常見陷阱 walkthrough。

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

## 常見陷阱

### 陷阱 1：先寫實作再補測試

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

### 陷阱 2：一次實作太多功能

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

### 陷阱 3：測試實作細節而非行為

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

### 陷阱 4：重構時改動 expect

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
