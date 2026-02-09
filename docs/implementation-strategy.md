# Code Quest 實作策略 - 最終方案

## 核心結論

經過重新思考，Code Quest 需要的是：

**簡化的 Worktree 管理 + vultuk 的 PTY 架構**

不需要：
- ❌ agent-worktree CLI（Rust）
- ❌ 複雜的 Snap Mode
- ❌ 完整的狀態管理系統

只需要：
- ✅ 基本的 git worktree 操作（~100 行）
- ✅ PTY 進程管理（vultuk 已提供）
- ✅ 簡單的狀態追蹤（JSON 文件）

---

## 為什麼需要 Worktree？

### 真實場景

玩家：「我想同時做三件事」
```
1. Haiku: 修復 CSS bug (修改 src/styles.css)
2. Sonnet: 實作登入功能 (修改 src/auth.ts)
3. Opus: 重構資料庫 (修改 src/db.ts + 執行測試)
```

### 如果不用 Worktree

```
專案目錄/
├── src/
│   ├── styles.css    ← Haiku 正在改
│   ├── auth.ts       ← Sonnet 正在改
│   └── db.ts         ← Opus 正在改
└── tests/            ← Opus 跑測試
    └── 測試會看到 Haiku/Sonnet 未完成的修改 ❌
```

**問題：**
- 如果 Haiku 和 Sonnet 都要改 src/auth.ts？→ 衝突
- Opus 跑測試時，看到其他人未完成的修改？→ 測試不穩定
- 如何知道誰改了什麼？→ Git 狀態混亂

### 用 Worktree

```
專案/
├── main/                         # 主目錄
└── .worktrees/
    ├── battle-haiku/             # Haiku 的副本
    │   └── src/styles.css        # 獨立修改 ✅
    ├── battle-sonnet/            # Sonnet 的副本
    │   └── src/auth.ts           # 獨立修改 ✅
    └── battle-opus/              # Opus 的副本
        ├── src/db.ts             # 獨立修改 ✅
        └── tests/                # 獨立測試 ✅
```

**好處：**
- ✅ 完全隔離
- ✅ 節省空間（共享 .git）
- ✅ Git 原生支援

---

## 實作方案

### 最小可行實作（MVP）

```typescript
// src/server/WorktreeManager.ts
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

export class WorktreeManager {
  private repoPath: string;
  private worktreeBase: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.worktreeBase = path.join(repoPath, '../.worktrees');
  }

  // 建立戰鬥環境
  async createBattle(battleId: string): Promise<string> {
    const branch = `battle-${battleId}`;
    const worktreePath = path.join(this.worktreeBase, battleId);

    // 1. 建立 worktree
    await this.git(['worktree', 'add', worktreePath, '-b', branch]);

    // 2. 建立狀態文件
    await fs.writeFile(
      path.join(worktreePath, '.battle-state.json'),
      JSON.stringify({ battleId, createdAt: new Date().toISOString() })
    );

    return worktreePath;
  }

  // 清理戰鬥環境
  async cleanupBattle(battleId: string, shouldMerge: boolean): Promise<void> {
    const branch = `battle-${battleId}`;
    const worktreePath = path.join(this.worktreeBase, battleId);

    if (shouldMerge) {
      // 合併結果
      await this.git(['checkout', 'main'], this.repoPath);
      await this.git(['merge', '--squash', branch], this.repoPath);
      await this.git(['commit', '-m', `feat: ${battleId}`], this.repoPath);
    }

    // 移除 worktree
    await this.git(['worktree', 'remove', worktreePath, '--force']);
    await this.git(['branch', '-D', branch]);
  }

  private async git(args: string[], cwd = this.repoPath): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('git', args, { cwd });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Git failed: ${args.join(' ')}`));
      });
    });
  }
}
```

**就這麼簡單！只需要 ~60 行**

### 整合到戰鬥系統

```typescript
// src/server/BattleOrchestrator.ts
import { WorktreeManager } from './WorktreeManager';
import { BattleBridge } from './BattleBridge';

export class BattleOrchestrator {
  private worktreeManager: WorktreeManager;
  private battleBridge: BattleBridge;

  constructor(repoPath: string) {
    this.worktreeManager = new WorktreeManager(repoPath);
    this.battleBridge = new BattleBridge();
  }

  async startBattle(config: BattleConfig): Promise<string> {
    const battleId = this.generateBattleId();

    // 1. 建立隔離環境
    const worktreePath = await this.worktreeManager.createBattle(battleId);

    // 2. 在隔離環境中啟動 PTY
    this.battleBridge.startBattle(battleId, {
      aiModel: config.aiModel,
      prompt: config.prompt,
      workingDir: worktreePath  // ← 關鍵：在 worktree 中執行
    });

    return battleId;
  }

  async endBattle(battleId: string, shouldMerge: boolean): Promise<void> {
    // 1. 停止 PTY
    this.battleBridge.stopBattle(battleId);

    // 2. 清理環境
    await this.worktreeManager.cleanupBattle(battleId, shouldMerge);
  }

  async startParallelBattles(configs: BattleConfig[]): Promise<string[]> {
    return Promise.all(configs.map(c => this.startBattle(c)));
  }
}
```

---

## 從 agent-worktree 借鑑什麼？

### 借鑑：設計思想

1. **隔離思想** - 每個任務獨立環境
2. **狀態追蹤** - 記錄戰鬥進度
3. **清理機制** - 自動清理過期環境

### 不借鑑：實作細節

1. ❌ Snap Mode（太複雜）
2. ❌ Hooks 系統（暫時不需要）
3. ❌ 複雜的配置（TOML）
4. ❌ Shell 整合（不需要）

---

## 實作檢查清單

### Phase 1: 基礎 Worktree 管理（1 週）

- [ ] 實作 WorktreeManager
  - [ ] createBattle()
  - [ ] cleanupBattle()
  - [ ] git 命令包裝

- [ ] 測試
  - [ ] Feature Test: 並行三個戰鬥
  - [ ] Integration Test: Worktree 隔離
  - [ ] Unit Test: Git 操作

### Phase 2: 整合到戰鬥系統（1 週）

- [ ] BattleOrchestrator 整合
- [ ] PTY 在 worktree 中執行
- [ ] 狀態文件追蹤

### Phase 3: UI 整合（1 週）

- [ ] Tab 鍵切換選單
- [ ] 顯示 worktree 戰鬥（🟣 紫色標示）
- [ ] 合併/捨棄選擇

---

## 為什麼不用 agent-worktree CLI？

### 技術原因

1. **語言不匹配** - Rust vs Node.js
2. **額外依賴** - 需要安裝 Rust toolchain
3. **整合複雜** - CLI 調用 vs 直接 API
4. **功能過剩** - 我們只需要 20% 功能

### 實用原因

1. **用戶體驗** - 不想要求用戶安裝 Rust
2. **維護成本** - 額外的依賴要維護
3. **調試困難** - CLI 錯誤難以追蹤
4. **客製化限制** - 無法深度整合

### 成本對比

```
agent-worktree CLI:
- 安裝成本: 高（Rust + cargo install）
- 整合成本: 中（spawn CLI）
- 維護成本: 中（追蹤更新）
- 客製化: 低（只能透過 CLI 參數）

自己實作:
- 實作成本: 低（~200 行）
- 整合成本: 低（直接 API）
- 維護成本: 低（標準 Git 操作）
- 客製化: 高（完全控制）
```

---

## 測試策略

### Feature Test

```typescript
test('應該並行啟動三個戰鬥並完全隔離', async () => {
  const orchestrator = new BattleOrchestrator(process.cwd());

  // When: 並行啟動三個戰鬥
  const battles = await orchestrator.startParallelBattles([
    { aiModel: 'haiku', prompt: 'Fix CSS' },
    { aiModel: 'sonnet', prompt: 'Add auth' },
    { aiModel: 'opus', prompt: 'Refactor DB' }
  ]);

  // Then: 應該建立三個獨立的 worktree
  const worktrees = await listGitWorktrees();
  expect(worktrees).toHaveLength(3);

  // And: 每個 worktree 有獨立的檔案
  const paths = battles.map(b => b.worktreePath);
  expect(new Set(paths).size).toBe(3);

  // And: 可以同時修改同一檔案而不衝突
  // （這個會在實際執行 PTY 時驗證）
});
```

### Integration Test

```typescript
test('WorktreeManager 應該建立和清理 worktree', async () => {
  const manager = new WorktreeManager(process.cwd());

  // When: 建立 worktree
  const worktreePath = await manager.createBattle('test-battle');

  // Then: worktree 目錄存在
  expect(await fs.pathExists(worktreePath)).toBe(true);

  // And: 有獨立的 git 狀態
  expect(await fs.pathExists(path.join(worktreePath, '.git'))).toBe(true);

  // When: 清理
  await manager.cleanupBattle('test-battle', false);

  // Then: worktree 已移除
  expect(await fs.pathExists(worktreePath)).toBe(false);
});
```

---

## 總結

### 最終方案

**自己實作簡化的 Worktree 管理**

原因：
1. ✅ 需求簡單（只需要基本隔離）
2. ✅ 實作簡單（~200 行）
3. ✅ 整合容易（直接 API）
4. ✅ 無外部依賴（只需要 git）
5. ✅ 完全控制（可深度客製化）

### agent-worktree 的價值

雖然不用它的實作，但它提供了：
- ✅ 設計驗證（證明這個方案可行）
- ✅ 最佳實踐（如何處理邊界情況）
- ✅ 設計參考（狀態追蹤、清理機制）

### 下一步

1. 使用 TDD 實作 WorktreeManager
2. 整合到 BattleOrchestrator
3. 測試並行三個戰鬥
4. UI 整合

---

> 記住：Code Quest 是**真實的開發工具**，需要**真實的隔離**
> Worktree 是最優雅的解決方案，而我們只需要它的核心功能
