# Agent-Worktree 整合方案 - Code Quest 多戰鬥隔離系統

> **參考專案**: [nekocode/agent-worktree](https://github.com/nekocode/agent-worktree)
> **目的**: 為 Code Quest 的多 AI 並行戰鬥提供完全隔離的執行環境

---

## 核心價值

Agent-worktree 解決了 Code Quest 最關鍵的架構問題：**如何讓多個 AI 代理同時戰鬥而不互相干擾**。

### 問題

```
主目錄 (main branch)
├── Haiku 戰鬥正在修改 src/auth.ts
├── Sonnet 戰鬥也想修改 src/auth.ts  ❌ 衝突！
└── Opus 戰鬥正在運行測試          ❌ 被其他戰鬥影響！
```

### 解決方案：Worktree 隔離

```
主目錄 (main branch)
├── worktree/battle-haiku/
│   └── src/auth.ts (Haiku 獨立修改) ✅
├── worktree/battle-sonnet/
│   └── src/auth.ts (Sonnet 獨立修改) ✅
└── worktree/battle-opus/
    └── tests/ (Opus 獨立測試)      ✅
```

---

## Agent-Worktree 核心概念

### 1. Snap Mode (快照模式)

**傳統方式** (繁瑣的 8 步驟)：
```bash
# 1. 建立分支
git checkout -b feature-x

# 2. 建立 worktree
git worktree add ../feature-x feature-x

# 3. 進入 worktree
cd ../feature-x

# 4. 啟動 AI
claude --print "Implement feature X"

# 5. 等待完成...

# 6. 檢查結果
git status

# 7. 合併
git checkout main
git merge feature-x

# 8. 清理
git worktree remove ../feature-x
```

**Snap Mode** (一鍵完成)：
```bash
# 一行搞定所有步驟！
wt new -s claude "Implement feature X"

# 自動完成：
# ✓ 建立隨機分支名
# ✓ 建立 worktree
# ✓ 啟動 claude
# ✓ 等待完成
# ✓ 提示合併/捨棄/繼續編輯
# ✓ 自動清理
```

### 2. 自動狀態追蹤

每個 worktree 都有獨立的狀態文件：

```toml
# ~/.agent-worktree/workspaces/code-quest/battle-haiku.status.toml

[worktree]
name = "battle-haiku"
branch = "battle-haiku-swift-fox"
created_at = "2026-02-09T10:30:00Z"
agent = "claude-haiku"
status = "active"

[changes]
files_modified = 3
lines_added = 85
lines_removed = 12
has_uncommitted = false

[battle_data]  # Code Quest 自定義
player_id = "player-123"
enemy_id = "bug-monster-45"
current_round = 8
hp = 75
mp = 60
```

### 3. Hooks 系統

在戰鬥的不同階段執行自定義邏輯：

```toml
# .agent-worktree.toml (專案根目錄)

[hooks]
# 戰鬥開始前
post_create = [
    "pnpm install",               # 安裝依賴
    "pnpm build",                 # 建構專案
    "game init-battle-env"        # 初始化戰鬥環境
]

# 戰鬥結束前 (合併前)
pre_merge = [
    "pnpm test",                  # 跑測試
    "pnpm lint",                  # 檢查程式碼
    "game validate-battle-log"    # 驗證戰鬥日誌
]

# 戰鬥結束後 (合併後)
post_merge = [
    "game process-battle-results", # 處理戰鬥結果
    "game update-player-stats",    # 更新玩家統計
    "game archive-battle-log"      # 封存戰鬥日誌
]
```

### 4. 配置文件自動同步

```toml
[general]
copy_files = [
    "*.secret.*",      # 機密文件
    ".env.local",      # 環境變數
    "data/*.json",     # 遊戲資料
]
```

這些被 `.gitignore` 的檔案會自動複製到每個 worktree，確保戰鬥環境完整。

---

## Code Quest 整合架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────────┐
│  Code Quest UI (React)                                  │
│  - 戰鬥切換選單 (Tab 鍵)                                 │
│  - 多戰鬥狀態顯示                                         │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket
┌──────────────────────▼──────────────────────────────────┐
│  Battle Server (Node.js)                                │
│  - BattleOrchestrator: 管理多場戰鬥                      │
│  - WorktreeManager: 建立/清理 worktree                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Git Worktree 層                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Battle 1     │  │ Battle 2     │  │ Battle 3     │  │
│  │ (Haiku)      │  │ (Sonnet)     │  │ (Opus)       │  │
│  │ worktree/    │  │ worktree/    │  │ worktree/    │  │
│  │ battle-1/    │  │ battle-2/    │  │ battle-3/    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │ PTY             │ PTY             │ PTY        │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐  │
│  │ Claude CLI   │  │ Claude CLI   │  │ Claude CLI   │  │
│  │ --model haiku│  │ --model sonnet│  │ --model opus │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 關鍵元件實作

#### 1. WorktreeManager

```typescript
// src/server/WorktreeManager.ts
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface WorktreeConfig {
  battleId: string;
  aiModel: 'haiku' | 'sonnet' | 'opus';
  prompt: string;
  playerId: string;
  enemyId: string;
}

export interface WorktreeHandle {
  battleId: string;
  worktreePath: string;
  branch: string;
  statusFile: string;
  cleanup: () => Promise<void>;
}

export class WorktreeManager {
  private repoPath: string;
  private worktreeBase: string;
  private activeWorktrees = new Map<string, WorktreeHandle>();

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.worktreeBase = path.join(repoPath, '../worktrees');
  }

  async createBattleWorktree(config: WorktreeConfig): Promise<WorktreeHandle> {
    // 1. 產生唯一分支名
    const branch = this.generateBranchName(config);
    const worktreePath = path.join(this.worktreeBase, config.battleId);

    // 2. 建立 worktree
    await this.execGit([
      'worktree', 'add',
      worktreePath,
      '-b', branch
    ]);

    // 3. 執行 post_create hooks
    await this.runHooks('post_create', worktreePath);

    // 4. 複製配置文件
    await this.copyConfigFiles(worktreePath);

    // 5. 建立狀態文件
    const statusFile = path.join(
      this.worktreeBase,
      `${config.battleId}.status.toml`
    );
    await this.createStatusFile(statusFile, config);

    // 6. 註冊 handle
    const handle: WorktreeHandle = {
      battleId: config.battleId,
      worktreePath,
      branch,
      statusFile,
      cleanup: () => this.cleanupWorktree(config.battleId)
    };

    this.activeWorktrees.set(config.battleId, handle);
    return handle;
  }

  async cleanupWorktree(battleId: string): Promise<void> {
    const handle = this.activeWorktrees.get(battleId);
    if (!handle) return;

    try {
      // 1. 執行 post_merge hooks
      await this.runHooks('post_merge', handle.worktreePath);

      // 2. 移除 worktree
      await this.execGit([
        'worktree', 'remove',
        handle.worktreePath,
        '--force'
      ]);

      // 3. 刪除分支
      await this.execGit([
        'branch', '-D',
        handle.branch
      ]);

      // 4. 刪除狀態文件
      await fs.unlink(handle.statusFile);

      // 5. 移除註冊
      this.activeWorktrees.delete(battleId);
    } catch (error) {
      console.error(`Failed to cleanup worktree ${battleId}:`, error);
      throw error;
    }
  }

  async mergeBattleResults(battleId: string): Promise<void> {
    const handle = this.activeWorktrees.get(battleId);
    if (!handle) throw new Error(`Worktree ${battleId} not found`);

    // 1. 執行 pre_merge hooks
    await this.runHooks('pre_merge', handle.worktreePath);

    // 2. 切換到主分支
    await this.execGit(['checkout', 'main'], this.repoPath);

    // 3. 合併 (使用 squash 保持歷史乾淨)
    await this.execGit([
      'merge', '--squash',
      handle.branch
    ], this.repoPath);

    // 4. Commit
    const commitMsg = await this.generateCommitMessage(battleId);
    await this.execGit([
      'commit', '-m', commitMsg
    ], this.repoPath);
  }

  private generateBranchName(config: WorktreeConfig): string {
    const adjectives = ['swift', 'clever', 'mighty', 'brave', 'wise'];
    const nouns = ['fox', 'tiger', 'dragon', 'eagle', 'wolf'];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `battle-${config.aiModel}-${adj}-${noun}`;
  }

  private async createStatusFile(
    statusFile: string,
    config: WorktreeConfig
  ): Promise<void> {
    const status = `
[worktree]
name = "${config.battleId}"
branch = "${this.generateBranchName(config)}"
created_at = "${new Date().toISOString()}"
agent = "claude-${config.aiModel}"
status = "active"

[battle_data]
player_id = "${config.playerId}"
enemy_id = "${config.enemyId}"
ai_model = "${config.aiModel}"
prompt = "${config.prompt}"
`;

    await fs.writeFile(statusFile, status.trim());
  }

  private async copyConfigFiles(worktreePath: string): Promise<void> {
    const filesToCopy = [
      'data/skills.json',
      'data/enemies.json',
      '.env.battle',
      'config/battle.toml'
    ];

    for (const file of filesToCopy) {
      const src = path.join(this.repoPath, file);
      const dst = path.join(worktreePath, file);

      try {
        await fs.copyFile(src, dst);
      } catch (error) {
        // 檔案不存在，跳過
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }

  private async runHooks(
    hookName: string,
    cwd: string
  ): Promise<void> {
    const config = await this.loadConfig();
    const hooks = config.hooks?.[hookName] || [];

    for (const cmd of hooks) {
      await this.execCommand(cmd, cwd);
    }
  }

  private async execGit(
    args: string[],
    cwd: string = this.repoPath
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('git', args, { cwd });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => stdout += data);
      proc.stderr.on('data', (data) => stderr += data);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Git command failed: ${stderr}`));
        }
      });
    });
  }

  private async execCommand(
    cmd: string,
    cwd: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('sh', ['-c', cmd], { cwd });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed: ${cmd}`));
        }
      });
    });
  }

  private async loadConfig(): Promise<any> {
    // 載入 .agent-worktree.toml
    // 簡化版本，實際應使用 TOML parser
    return {
      hooks: {
        post_create: ['pnpm install', 'pnpm build'],
        pre_merge: ['pnpm test', 'pnpm lint'],
        post_merge: ['game process-results']
      }
    };
  }

  private async generateCommitMessage(battleId: string): Promise<string> {
    const handle = this.activeWorktrees.get(battleId);
    if (!handle) return `feat(battle): complete ${battleId}`;

    // 從狀態文件讀取資訊
    return `feat(battle): ${battleId} completed

- AI Model: ${handle.branch.split('-')[1]}
- Battle ID: ${battleId}
- Auto-merged by Code Quest`;
  }

  // 列出所有活躍的 worktree
  async listActiveWorktrees(): Promise<WorktreeHandle[]> {
    return Array.from(this.activeWorktrees.values());
  }

  // 取得特定戰鬥的 worktree
  getWorktree(battleId: string): WorktreeHandle | undefined {
    return this.activeWorktrees.get(battleId);
  }
}
```

#### 2. BattleOrchestrator 整合

```typescript
// src/server/BattleOrchestrator.ts
import { WorktreeManager } from './WorktreeManager';
import { BattleBridge } from './BattleBridge';

export class BattleOrchestrator {
  private worktreeManager: WorktreeManager;
  private bridges = new Map<string, BattleBridge>();
  private battles = new Map<string, Battle>();

  constructor(repoPath: string) {
    this.worktreeManager = new WorktreeManager(repoPath);
  }

  async startBattle(config: BattleConfig): Promise<string> {
    const battleId = this.generateBattleId();

    // 1. 建立 worktree 隔離環境
    const worktree = await this.worktreeManager.createBattleWorktree({
      battleId,
      aiModel: config.aiModel,
      prompt: config.prompt,
      playerId: config.playerId,
      enemyId: config.enemyId
    });

    // 2. 在 worktree 中啟動 PTY 戰鬥
    const bridge = new BattleBridge();
    const battle = bridge.startBattle(battleId, {
      aiModel: config.aiModel,
      prompt: config.prompt,
      workingDir: worktree.worktreePath  // ← 關鍵：在 worktree 中執行
    });

    // 3. 註冊
    this.bridges.set(battleId, bridge);
    this.battles.set(battleId, {
      ...battle,
      worktree,
      config
    });

    return battleId;
  }

  async endBattle(battleId: string, shouldMerge: boolean): Promise<void> {
    const battle = this.battles.get(battleId);
    if (!battle) return;

    const bridge = this.bridges.get(battleId);
    if (bridge) {
      // 1. 停止 PTY 進程
      bridge.stopBattle(battleId);
    }

    // 2. 決定是否合併
    if (shouldMerge) {
      await this.worktreeManager.mergeBattleResults(battleId);
    }

    // 3. 清理 worktree
    await battle.worktree.cleanup();

    // 4. 移除註冊
    this.bridges.delete(battleId);
    this.battles.delete(battleId);
  }

  async startParallelBattles(configs: BattleConfig[]): Promise<string[]> {
    // 並行啟動多個戰鬥
    const promises = configs.map(config => this.startBattle(config));
    return Promise.all(promises);
  }

  private generateBattleId(): string {
    return `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 3. 配置文件範例

```toml
# .agent-worktree.toml (專案根目錄)

[general]
merge_strategy = "squash"    # 保持 main 歷史乾淨
trunk_branch = "main"
auto_prune = true
copy_files = [
    "data/*.json",           # 遊戲資料
    "config/*.toml",         # 配置文件
    ".env.battle",           # 戰鬥環境變數
    "*.secret.*"             # 機密文件
]

[hooks]
# 戰鬥開始前
post_create = [
    "pnpm install",
    "pnpm build",
    "game init-battle-env"
]

# 戰鬥結束前 (合併前驗證)
pre_merge = [
    "pnpm test",
    "pnpm lint",
    "game validate-battle-log"
]

# 戰鬥結束後
post_merge = [
    "game process-battle-results",
    "game update-player-stats",
    "game archive-battle-log",
    "git push origin main"
]

[worktree]
default_prefix = "battle-"
cleanup_timeout_minutes = 60
max_concurrent = 4           # 最多同時 4 場戰鬥
```

---

## 使用範例

### 範例 1：單個戰鬥

```typescript
// 啟動單個戰鬥
const orchestrator = new BattleOrchestrator(process.cwd());

const battleId = await orchestrator.startBattle({
  aiModel: 'haiku',
  prompt: '修復登入頁面的 CSS 問題',
  playerId: 'player-123',
  enemyId: 'bug-monster-45'
});

console.log(`Battle started: ${battleId}`);
// Battle started: battle-1707559200-abc123

// 監聽戰鬥事件
orchestrator.on('output', (id, data) => {
  console.log(`[${id}] ${data}`);
});

// 戰鬥結束
orchestrator.on('battle_end', async (id, result) => {
  if (result === 'victory') {
    // 合併結果到主分支
    await orchestrator.endBattle(id, true);
  } else {
    // 捨棄結果
    await orchestrator.endBattle(id, false);
  }
});
```

### 範例 2：並行三個戰鬥

```typescript
// 同時派遣三個 AI
const [battle1, battle2, battle3] = await orchestrator.startParallelBattles([
  {
    aiModel: 'haiku',
    prompt: '更新 README',
    playerId: 'player-123',
    enemyId: 'doc-monster-1'
  },
  {
    aiModel: 'sonnet',
    prompt: '實作使用者認證功能',
    playerId: 'player-456',
    enemyId: 'auth-boss-2'
  },
  {
    aiModel: 'opus',
    prompt: '重構資料庫架構',
    playerId: 'player-789',
    enemyId: 'legacy-dragon-3'
  }
]);

console.log('Three parallel battles started');

// 檔案系統結構：
// worktrees/
// ├── battle-1/  (Haiku 獨立環境)
// ├── battle-2/  (Sonnet 獨立環境)
// └── battle-3/  (Opus 獨立環境)
```

### 範例 3：觀察戰鬥狀態

```typescript
// 列出所有活躍戰鬥
const activeWorktrees = await orchestrator.worktreeManager.listActiveWorktrees();

activeWorktrees.forEach(wt => {
  console.log(`
戰鬥 ID: ${wt.battleId}
Worktree 路徑: ${wt.worktreePath}
分支: ${wt.branch}
狀態文件: ${wt.statusFile}
  `);
});

// 輸出：
// 戰鬥 ID: battle-1707559200-abc123
// Worktree 路徑: /path/to/worktrees/battle-1707559200-abc123
// 分支: battle-haiku-swift-fox
// 狀態文件: /path/to/worktrees/battle-1707559200-abc123.status.toml
```

---

## 與 DQ 風格選單整合

### Tab 鍵快速切換

```typescript
// 按 Tab 顯示戰鬥選單
app.on('keypress', async (key) => {
  if (key === 'Tab') {
    const worktrees = await orchestrator.worktreeManager.listActiveWorktrees();

    console.log(`
┌─────────────────────────────────┐
│ 🎯 活躍戰鬥列表                  │
├─────────────────────────────────┤
    `);

    worktrees.forEach((wt, index) => {
      const status = loadStatusFile(wt.statusFile);
      const icon = status.battle_data.is_worktree ? '🟣' : '🔵';

      console.log(`
│ ${index + 1}. ${icon} [${status.agent}] ${status.battle_data.prompt.slice(0, 20)}...
│    HP: ${'█'.repeat(status.battle_data.hp / 10)}${'░'.repeat(10 - status.battle_data.hp / 10)} ${status.battle_data.hp}%
│    MP: ${'█'.repeat(status.battle_data.mp / 10)}${'░'.repeat(10 - status.battle_data.mp / 10)} ${status.battle_data.mp}%
│    進度: Round ${status.battle_data.current_round}
│
      `);
    });

    console.log(`
│ [選擇戰鬥 1-${worktrees.length}] [ESC 關閉]
│
└─────────────────────────────────┘
    `);
  }
});
```

---

## 測試策略

### Feature Test

```typescript
// tests/features/parallel-battles.feature.test.ts
import { test, expect } from 'vitest';
import { BattleOrchestrator } from '@/server/BattleOrchestrator';

test('應該並行啟動三個戰鬥並完全隔離', async () => {
  // Given: 三個戰鬥配置
  const orchestrator = new BattleOrchestrator(process.cwd());
  const configs = [
    { aiModel: 'haiku', prompt: 'Task 1', playerId: 'p1', enemyId: 'e1' },
    { aiModel: 'sonnet', prompt: 'Task 2', playerId: 'p2', enemyId: 'e2' },
    { aiModel: 'opus', prompt: 'Task 3', playerId: 'p3', enemyId: 'e3' }
  ];

  // When: 並行啟動
  const battleIds = await orchestrator.startParallelBattles(configs);

  // Then: 應該建立三個獨立的 worktree
  expect(battleIds).toHaveLength(3);

  const worktrees = await orchestrator.worktreeManager.listActiveWorktrees();
  expect(worktrees).toHaveLength(3);

  // And: 每個 worktree 都是獨立的目錄
  const paths = worktrees.map(wt => wt.worktreePath);
  const uniquePaths = new Set(paths);
  expect(uniquePaths.size).toBe(3);

  // And: 每個 worktree 都有獨立的分支
  const branches = worktrees.map(wt => wt.branch);
  const uniqueBranches = new Set(branches);
  expect(uniqueBranches.size).toBe(3);
});
```

### Integration Test

```typescript
// tests/integration/worktree-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorktreeManager } from '@/server/WorktreeManager';

describe('WorktreeManager', () => {
  let manager: WorktreeManager;

  beforeEach(() => {
    manager = new WorktreeManager(process.cwd());
  });

  afterEach(async () => {
    // 清理所有 worktree
    const worktrees = await manager.listActiveWorktrees();
    await Promise.all(
      worktrees.map(wt => manager.cleanupWorktree(wt.battleId))
    );
  });

  it('應該建立 worktree 並複製配置文件', async () => {
    // Given
    const config = {
      battleId: 'test-battle',
      aiModel: 'haiku',
      prompt: 'test',
      playerId: 'p1',
      enemyId: 'e1'
    };

    // When
    const worktree = await manager.createBattleWorktree(config);

    // Then: worktree 目錄存在
    expect(await fs.pathExists(worktree.worktreePath)).toBe(true);

    // And: 狀態文件存在
    expect(await fs.pathExists(worktree.statusFile)).toBe(true);

    // And: 配置文件已複製
    const configFile = path.join(worktree.worktreePath, 'data/skills.json');
    expect(await fs.pathExists(configFile)).toBe(true);
  });

  it('應該執行 hooks', async () => {
    // Given: Mock hooks
    const hookExecuted = vi.fn();
    manager.runHooks = vi.fn().mockImplementation(async () => {
      hookExecuted();
    });

    // When
    await manager.createBattleWorktree({
      battleId: 'test',
      aiModel: 'haiku',
      prompt: 'test',
      playerId: 'p1',
      enemyId: 'e1'
    });

    // Then: post_create hook 執行
    expect(hookExecuted).toHaveBeenCalled();
  });
});
```

---

## 效能考量

### 1. Worktree 預熱

```typescript
// 戰鬥開始前預先建立 worktree pool
class WorktreePool {
  private pool: WorktreeHandle[] = [];
  private maxSize = 3;

  async warmUp() {
    // 預先建立 3 個 worktree
    for (let i = 0; i < this.maxSize; i++) {
      const wt = await this.manager.createBattleWorktree({
        battleId: `pool-${i}`,
        aiModel: 'haiku',
        prompt: '',
        playerId: '',
        enemyId: ''
      });
      this.pool.push(wt);
    }
  }

  async acquire(): Promise<WorktreeHandle> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;  // 立即可用
    }
    // Pool 用完，建立新的
    return await this.createNew();
  }

  async release(wt: WorktreeHandle) {
    // 重置 worktree 後放回 pool
    await this.resetWorktree(wt);
    this.pool.push(wt);
  }
}
```

### 2. 並行限制

```typescript
class BattleOrchestrator {
  private maxConcurrent = 4;  // 最多 4 場同時戰鬥

  async startBattle(config: BattleConfig): Promise<string> {
    // 檢查並行數量
    const active = await this.worktreeManager.listActiveWorktrees();
    if (active.length >= this.maxConcurrent) {
      throw new Error('Too many concurrent battles');
    }

    // 繼續啟動...
  }
}
```

### 3. 自動清理

```typescript
class WorktreeManager {
  constructor(repoPath: string) {
    // 定期清理過期 worktree
    setInterval(() => {
      this.pruneStaleWorktrees();
    }, 60 * 60 * 1000);  // 每小時
  }

  private async pruneStaleWorktrees() {
    const worktrees = await this.listActiveWorktrees();
    const now = Date.now();
    const timeout = 60 * 60 * 1000;  // 1 小時

    for (const wt of worktrees) {
      const status = await this.loadStatusFile(wt.statusFile);
      const createdAt = new Date(status.worktree.created_at).getTime();

      if (now - createdAt > timeout) {
        console.warn(`Pruning stale worktree: ${wt.battleId}`);
        await this.cleanupWorktree(wt.battleId);
      }
    }
  }
}
```

---

## 故障排除

### 問題 1: Worktree 建立失敗

**症狀**: `git worktree add` 錯誤

**解決方案**:
```typescript
// 檢查主目錄是否乾淨
async validateCleanRepo(): Promise<void> {
  const status = await this.execGit(['status', '--porcelain']);
  if (status.trim()) {
    throw new Error('主目錄有未提交的變更，請先提交或stash');
  }
}
```

### 問題 2: 狀態文件損壞

**症狀**: 無法讀取 `.status.toml`

**解決方案**:
```typescript
async loadStatusFile(statusFile: string): Promise<WorktreeStatus> {
  try {
    const content = await fs.readFile(statusFile, 'utf-8');
    return parseToml(content);
  } catch (error) {
    // 損壞的狀態文件 → 重建
    console.warn(`Corrupted status file: ${statusFile}`);
    return this.rebuildStatusFile(statusFile);
  }
}
```

### 問題 3: Worktree 殘留

**症狀**: 清理失敗導致 worktree 殘留

**解決方案**:
```bash
# 手動清理腳本
#!/bin/bash
# scripts/cleanup-worktrees.sh

# 列出所有 worktree
git worktree list

# 強制移除所有 worktree (保留主目錄)
git worktree list --porcelain | \
  grep '^worktree' | \
  grep -v "$(git rev-parse --show-toplevel)" | \
  cut -d' ' -f2 | \
  xargs -I {} git worktree remove {} --force

echo "All worktrees cleaned"
```

---

## 總結

### 核心優勢

1. **完全隔離** - 每個戰鬥在獨立 worktree，無狀態衝突
2. **並行執行** - 充分利用多核，同時處理多場戰鬥
3. **自動管理** - Snap Mode 一鍵工作流，自動清理
4. **狀態追蹤** - 完整的戰鬥日誌和決策記錄
5. **靈活擴展** - Hooks 系統支持自定義邏輯

### 實作建議

**Phase 1 (1-2 週)**:
- [x] 實作 WorktreeManager
- [x] 整合 BattleOrchestrator
- [x] 測試單個戰鬥隔離

**Phase 2 (2-3 週)**:
- [ ] 實作 Snap Mode 變體
- [ ] 並行三個戰鬥測試
- [ ] Hooks 系統整合

**Phase 3 (1-2 週)**:
- [ ] UI 整合 (Tab 切換選單)
- [ ] 效能優化 (Worktree Pool)
- [ ] 錯誤處理與自動恢復

---

## 參考資源

- **Agent-Worktree 專案**: https://github.com/nekocode/agent-worktree
- **Git Worktree 文檔**: https://git-scm.com/docs/git-worktree
- **Vultuk 架構**: `docs/ui-design/references/vultuk-architecture.md`
- **PTY 架構**: `/pty-architecture`
- **戰鬥管理**: `/battle-management`

---

> 本文檔展示了如何使用 agent-worktree 概念為 Code Quest 提供完全隔離的多 AI 並行戰鬥環境
> 最後更新: 2026-02-09
