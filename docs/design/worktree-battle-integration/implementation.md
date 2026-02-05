# Worktree-Battle 整合系統實作細節

**文檔創建日期**: 2026-02-05
**版本**: v1.0
**狀態**: 設計階段

---

## 目錄

1. [系統架構](#系統架構)
2. [核心組件](#核心組件)
3. [數據結構](#數據結構)
4. [API 設計](#api-設計)
5. [WebSocket 協議](#websocket-協議)
6. [實作優先級](#實作優先級)
7. [測試策略](#測試策略)
8. [性能優化](#性能優化)

---

## 系統架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                       UI Layer (React)                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ MapView      │  │ BattleList       │  │ GuildHall       │  │
│  │ (地圖視圖)    │  │ (戰鬥列表)        │  │ (公會大廳)       │  │
│  │              │  │                  │  │                 │  │
│  │ 觸發戰鬥      │  │ 顯示進度         │  │ Worktree 管理   │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬────────┘  │
│         │                   │                     │            │
│         └───────────────────┴─────────────────────┘            │
│                             │                                  │
└─────────────────────────────┼──────────────────────────────────┘
                              │ WebSocket
┌─────────────────────────────▼──────────────────────────────────┐
│                    Bridge Layer (Node.js)                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SmartRouter (智能路由器)                    │   │
│  │  • analyzePrompt(prompt): Analysis                      │   │
│  │  • route(prompt): Promise<Response>                     │   │
│  └────────────┬──────────────────────────────┬─────────────┘   │
│               │                              │                 │
│      complexity < 8                    complexity >= 8         │
│               │                              │                 │
│               ▼                              ▼                 │
│  ┌───────────────────────┐    ┌──────────────────────────┐    │
│  │ MainCLI               │    │ WorktreeBattleManager    │    │
│  │ (主 Claude CLI)       │    │ (Worktree-Battle 整合)   │    │
│  │                       │    │                          │    │
│  │ • 對話模式             │    │ • 戰鬥管理               │    │
│  │ • 簡單任務同步執行      │    │ • Worktree 管理          │    │
│  └───────────────────────┘    │ • CLI 實例管理           │    │
│                               │ • 生命週期控制           │    │
│                               └──────────┬───────────────┘    │
│                                          │                    │
│              ┌───────────────────────────┴───────────┐        │
│              │                                       │        │
│              ▼                                       ▼        │
│  ┌───────────────────────┐              ┌──────────────────┐ │
│  │ WorktreeManager       │              │ BattleManager    │ │
│  │ (Worktree 操作)       │              │ (戰鬥邏輯)        │ │
│  │                       │              │                  │ │
│  │ • createWorktree()    │              │ • startBattle()  │ │
│  │ • removeWorktree()    │              │ • trackProgress()│ │
│  │ • mergeWorktree()     │              │ • handleEnd()    │ │
│  │ • listWorktrees()     │              │ • queueManage()  │ │
│  └───────────┬───────────┘              └────────┬─────────┘ │
│              │                                   │           │
│              └──────────────┬────────────────────┘           │
│                             │                                │
│                             ▼                                │
│              ┌──────────────────────────────┐                │
│              │ Git Operations Layer         │                │
│              │ (execSync wrapper)           │                │
│              │                              │                │
│              │ • git worktree add           │                │
│              │ • git worktree remove        │                │
│              │ • git merge                  │                │
│              │ • git status                 │                │
│              └──────────────┬───────────────┘                │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
┌─────────────────────────────▼────────────────────────────────┐
│                   File System / Git Repository                │
│                                                               │
│  /Users/recca/project/           (主項目)                     │
│  /Users/recca/worktrees/         (Worktree 目錄)             │
│    ├─ feature-refactor-auth/    (Worktree #1 + CLI #1)       │
│    ├─ fix-payment-bug/          (Worktree #2 + CLI #2)       │
│    └─ feature-dark-mode/        (Worktree #3 + CLI #3)       │
└───────────────────────────────────────────────────────────────┘
```

---

## 核心組件

### 1. WorktreeBattleManager

**職責**: 統一管理戰鬥和 Worktree 的綁定關係

```typescript
// bridge/worktree-battle/WorktreeBattleManager.ts

import { EventEmitter } from 'events';
import { WorktreeManager } from './WorktreeManager';
import { BattleManager } from '../battle/BattleManager';
import { CLIInstanceManager } from './CLIInstanceManager';

interface BattleWorktreeBinding {
  id: string;
  battle: Battle;
  worktree: Worktree;
  cliInstance: CLIInstance;
  binding: {
    createdBy: 'battle' | 'manual';
    autoCreated: boolean;
    canDetach: boolean;
  };
  lifecycle: {
    phase: 'creating' | 'in_progress' | 'completed' | 'post_battle' | 'kept';
    canMerge: boolean;
    canKeep: boolean;
    canDiscard: boolean;
  };
  stats: {
    commits: number;
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
  };
}

class WorktreeBattleManager extends EventEmitter {
  private bindings: Map<string, BattleWorktreeBinding>;
  private worktreeManager: WorktreeManager;
  private battleManager: BattleManager;
  private cliInstanceManager: CLIInstanceManager;

  constructor() {
    super();
    this.bindings = new Map();
    this.worktreeManager = new WorktreeManager();
    this.battleManager = new BattleManager();
    this.cliInstanceManager = new CLIInstanceManager();
  }

  /**
   * 創建戰鬥並自動創建 Worktree
   */
  async createBattleWithWorktree(options: {
    prompt: string;
    complexity: number;
    zone: string;
    enemy: Enemy;
  }): Promise<BattleWorktreeBinding> {
    const { prompt, complexity, zone, enemy } = options;

    // 生成唯一 ID
    const bindingId = this.generateId('bw');

    try {
      // 1. 創建 Worktree
      const worktreeType = this.determineWorktreeType(prompt, complexity);
      const worktreeName = this.generateWorktreeName(prompt, worktreeType);

      const worktree = await this.worktreeManager.createWorktree({
        name: worktreeName,
        type: worktreeType,
        baseBranch: 'main',
        description: prompt.substring(0, 100),
        autoCreated: true,
      });

      // 2. 啟動 Claude CLI 實例在該 Worktree 中
      const cliInstance = await this.cliInstanceManager.spawn({
        workingDir: worktree.path,
        prompt: prompt,
        battleId: bindingId,
      });

      // 3. 創建戰鬥實例
      const battle = await this.battleManager.createBattle({
        prompt,
        complexity,
        zone,
        enemy,
        worktreeId: worktree.id,
        cliInstanceId: cliInstance.id,
      });

      // 4. 創建綁定關係
      const binding: BattleWorktreeBinding = {
        id: bindingId,
        battle,
        worktree,
        cliInstance,
        binding: {
          createdBy: 'battle',
          autoCreated: true,
          canDetach: false, // 戰鬥期間不可解綁
        },
        lifecycle: {
          phase: 'in_progress',
          canMerge: false,
          canKeep: false,
          canDiscard: true, // 可取消
        },
        stats: {
          commits: 0,
          filesChanged: 0,
          linesAdded: 0,
          linesDeleted: 0,
        },
      };

      this.bindings.set(bindingId, binding);

      // 5. 設置事件監聽
      this.setupEventListeners(binding);

      // 6. 觸發創建事件
      this.emit('binding:created', binding);

      return binding;
    } catch (error) {
      // 清理已創建的資源
      await this.cleanup(bindingId);
      throw error;
    }
  }

  /**
   * 更新戰鬥進度
   */
  async updateProgress(
    battleId: string,
    progress: number,
    stats: Partial<BattleWorktreeBinding['stats']>
  ): Promise<void> {
    const binding = this.bindings.get(battleId);
    if (!binding) {
      throw new Error(`Binding not found: ${battleId}`);
    }

    // 更新進度
    binding.battle.progress = progress;

    // 更新統計
    if (stats) {
      binding.stats = { ...binding.stats, ...stats };
    }

    // 更新時間戳
    binding.battle.lastActivity = Date.now();

    // 觸發更新事件
    this.emit('binding:progress', binding);
  }

  /**
   * 處理戰鬥完成
   */
  async handleBattleComplete(
    battleId: string,
    result: 'victory' | 'defeat' | 'flee'
  ): Promise<void> {
    const binding = this.bindings.get(battleId);
    if (!binding) {
      throw new Error(`Binding not found: ${battleId}`);
    }

    // 更新戰鬥狀態
    binding.battle.status = 'completed';
    binding.battle.result = result;
    binding.battle.completedAt = Date.now();

    // 更新生命週期
    binding.lifecycle.phase = 'post_battle';
    binding.lifecycle.canMerge = true;
    binding.lifecycle.canKeep = true;
    binding.lifecycle.canDiscard = true;

    // 關閉 CLI 實例
    await this.cliInstanceManager.stop(binding.cliInstance.id);

    // 收集最終統計
    const finalStats = await this.collectFinalStats(binding.worktree.path);
    binding.stats = finalStats;

    // 觸發完成事件
    this.emit('binding:completed', binding);
  }

  /**
   * 合併到主分支
   */
  async merge(battleId: string): Promise<void> {
    const binding = this.bindings.get(battleId);
    if (!binding) {
      throw new Error(`Binding not found: ${battleId}`);
    }

    if (!binding.lifecycle.canMerge) {
      throw new Error('Cannot merge at this stage');
    }

    try {
      // 1. 執行合併
      await this.worktreeManager.merge({
        worktreeId: binding.worktree.id,
        targetBranch: 'main',
        message: `Merge: ${binding.battle.prompt}`,
      });

      // 2. 刪除 Worktree
      await this.worktreeManager.remove(binding.worktree.id);

      // 3. 歸檔戰鬥記錄
      await this.battleManager.archive(binding.battle.id, {
        status: 'merged',
        mergedAt: Date.now(),
      });

      // 4. 從綁定列表移除
      this.bindings.delete(battleId);

      // 5. 觸發合併完成事件
      this.emit('binding:merged', binding);
    } catch (error) {
      this.emit('binding:merge_failed', { binding, error });
      throw error;
    }
  }

  /**
   * 保留 Worktree
   */
  async keep(battleId: string): Promise<void> {
    const binding = this.bindings.get(battleId);
    if (!binding) {
      throw new Error(`Binding not found: ${battleId}`);
    }

    // 更新狀態
    binding.lifecycle.phase = 'kept';
    binding.worktree.status = 'kept';
    binding.worktree.keptAt = Date.now();

    // 更新綁定關係
    binding.binding.canDetach = true; // 現在可以解綁

    // 觸發保留事件
    this.emit('binding:kept', binding);
  }

  /**
   * 放棄並刪除
   */
  async discard(battleId: string, confirmed: boolean = false): Promise<void> {
    if (!confirmed) {
      throw new Error('Discard requires confirmation');
    }

    const binding = this.bindings.get(battleId);
    if (!binding) {
      throw new Error(`Binding not found: ${battleId}`);
    }

    try {
      // 1. 停止 CLI（如果還在運行）
      if (binding.cliInstance.status === 'running') {
        await this.cliInstanceManager.stop(binding.cliInstance.id);
      }

      // 2. 強制刪除 Worktree
      await this.worktreeManager.remove(binding.worktree.id, {
        force: true,
      });

      // 3. 刪除戰鬥記錄
      await this.battleManager.delete(binding.battle.id);

      // 4. 從綁定列表移除
      this.bindings.delete(battleId);

      // 5. 觸發刪除事件
      this.emit('binding:discarded', binding);
    } catch (error) {
      this.emit('binding:discard_failed', { binding, error });
      throw error;
    }
  }

  /**
   * 獲取活躍戰鬥
   */
  getActive(): BattleWorktreeBinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => b.lifecycle.phase === 'in_progress'
    );
  }

  /**
   * 獲取保留的 Worktree
   */
  getKept(): BattleWorktreeBinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => b.lifecycle.phase === 'kept'
    );
  }

  /**
   * 設置事件監聽
   */
  private setupEventListeners(binding: BattleWorktreeBinding): void {
    // 監聽 CLI 輸出
    this.cliInstanceManager.on(
      `output:${binding.cliInstance.id}`,
      (data) => {
        this.handleCLIOutput(binding.id, data);
      }
    );

    // 監聽 CLI 錯誤
    this.cliInstanceManager.on(
      `error:${binding.cliInstance.id}`,
      (error) => {
        this.handleCLIError(binding.id, error);
      }
    );

    // 監聽 CLI 退出
    this.cliInstanceManager.on(
      `exit:${binding.cliInstance.id}`,
      (code, signal) => {
        this.handleCLIExit(binding.id, code, signal);
      }
    );
  }

  /**
   * 處理 CLI 輸出
   */
  private async handleCLIOutput(
    battleId: string,
    data: string
  ): Promise<void> {
    const binding = this.bindings.get(battleId);
    if (!binding) return;

    // 解析輸出，更新進度
    const progress = this.parseProgress(data);
    if (progress !== null) {
      await this.updateProgress(battleId, progress, {});
    }

    // 檢測 Git 操作
    if (data.includes('git commit')) {
      binding.stats.commits++;
      this.emit('binding:git_activity', {
        battleId,
        activity: 'commit',
      });
    }
  }

  /**
   * 處理 CLI 錯誤
   */
  private handleCLIError(battleId: string, error: Error): void {
    this.emit('binding:cli_error', {
      battleId,
      error,
    });
  }

  /**
   * 處理 CLI 退出
   */
  private async handleCLIExit(
    battleId: string,
    code: number,
    signal: string
  ): Promise<void> {
    if (code === 0) {
      // 正常完成
      await this.handleBattleComplete(battleId, 'victory');
    } else {
      // 異常退出
      await this.handleBattleComplete(battleId, 'defeat');
    }
  }

  /**
   * 清理資源
   */
  private async cleanup(battleId: string): Promise<void> {
    const binding = this.bindings.get(battleId);
    if (!binding) return;

    // 停止 CLI
    if (binding.cliInstance) {
      await this.cliInstanceManager.stop(binding.cliInstance.id);
    }

    // 刪除 Worktree
    if (binding.worktree) {
      await this.worktreeManager.remove(binding.worktree.id, {
        force: true,
      });
    }

    // 刪除戰鬥
    if (binding.battle) {
      await this.battleManager.delete(binding.battle.id);
    }

    // 從列表移除
    this.bindings.delete(battleId);
  }

  /**
   * 收集最終統計
   */
  private async collectFinalStats(
    worktreePath: string
  ): Promise<BattleWorktreeBinding['stats']> {
    const { execSync } = require('child_process');

    // Commits 數量
    const commits = parseInt(
      execSync('git rev-list --count HEAD ^main', {
        cwd: worktreePath,
      }).toString().trim()
    );

    // 文件變更統計
    const diffStat = execSync('git diff --stat main...HEAD', {
      cwd: worktreePath,
    }).toString();

    const filesChanged = (diffStat.match(/\n/g) || []).length - 1;

    // 行數統計
    const shortstat = execSync('git diff --shortstat main...HEAD', {
      cwd: worktreePath,
    }).toString();

    const linesAddedMatch = shortstat.match(/(\d+) insertion/);
    const linesDeletedMatch = shortstat.match(/(\d+) deletion/);

    const linesAdded = linesAddedMatch ? parseInt(linesAddedMatch[1]) : 0;
    const linesDeleted = linesDeletedMatch
      ? parseInt(linesDeletedMatch[1])
      : 0;

    return {
      commits,
      filesChanged,
      linesAdded,
      linesDeleted,
    };
  }

  /**
   * 生成唯一 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 判定 Worktree 類型
   */
  private determineWorktreeType(
    prompt: string,
    complexity: number
  ): WorktreeType {
    const lowerPrompt = prompt.toLowerCase();

    if (
      lowerPrompt.includes('fix') ||
      lowerPrompt.includes('bug') ||
      lowerPrompt.includes('修復')
    ) {
      return 'fix';
    }

    if (
      lowerPrompt.includes('hotfix') ||
      lowerPrompt.includes('緊急') ||
      lowerPrompt.includes('urgent')
    ) {
      return 'hotfix';
    }

    if (
      lowerPrompt.includes('experiment') ||
      lowerPrompt.includes('試驗') ||
      lowerPrompt.includes('poc')
    ) {
      return 'experiment';
    }

    return 'feature'; // 默認為功能開發
  }

  /**
   * 生成 Worktree 名稱
   */
  private generateWorktreeName(
    prompt: string,
    type: WorktreeType
  ): string {
    // 清理 prompt，生成簡短摘要
    const summary = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 4) // 最多 4 個單詞
      .join('-');

    return `${type}/${summary}`;
  }

  /**
   * 解析進度
   */
  private parseProgress(output: string): number | null {
    // 基於 CLI 輸出特徵估算進度
    // 這是簡化版，實際需要更複雜的邏輯

    if (output.includes('Reading files')) return 10;
    if (output.includes('Analyzing')) return 30;
    if (output.includes('Modifying')) return 50;
    if (output.includes('Testing')) return 70;
    if (output.includes('Completed')) return 100;

    return null;
  }
}

export default WorktreeBattleManager;
```

---

### 2. WorktreeManager

**職責**: 管理 Git Worktree 操作

```typescript
// bridge/worktree-battle/WorktreeManager.ts

import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Worktree {
  id: string;
  name: string;
  type: 'feature' | 'fix' | 'experiment' | 'hotfix';
  branch: string;
  baseBranch: string;
  path: string;
  description?: string;
  createdAt: number;
  createdBy: 'battle' | 'manual';
  autoCreated: boolean;
  status?: 'active' | 'kept' | 'archived';
  keptAt?: number;
}

class WorktreeManager {
  private worktrees: Map<string, Worktree>;
  private projectRoot: string;
  private worktreesBaseDir: string;

  constructor() {
    this.worktrees = new Map();
    this.projectRoot = this.detectProjectRoot();
    this.worktreesBaseDir = path.join(
      this.projectRoot,
      '..',
      'worktrees'
    );

    // 確保 worktrees 目錄存在
    if (!fs.existsSync(this.worktreesBaseDir)) {
      fs.mkdirSync(this.worktreesBaseDir, { recursive: true });
    }

    // 加載現有 worktrees
    this.loadExistingWorktrees();
  }

  /**
   * 創建 Worktree
   */
  async createWorktree(options: {
    name: string;
    type: Worktree['type'];
    baseBranch: string;
    description?: string;
    autoCreated?: boolean;
  }): Promise<Worktree> {
    const { name, type, baseBranch, description, autoCreated = false } = options;

    // 生成分支名稱
    const branchName = `${type}/${name}`;

    // 生成文件路徑
    const sanitizedName = name.replace(/\//g, '-');
    const worktreePath = path.join(
      this.worktreesBaseDir,
      `${type}-${sanitizedName}`
    );

    // 檢查路徑衝突
    if (fs.existsSync(worktreePath)) {
      throw new Error(`Worktree path already exists: ${worktreePath}`);
    }

    try {
      // 執行 git worktree add
      const cmd = [
        'git',
        'worktree',
        'add',
        '-b',
        branchName,
        worktreePath,
        baseBranch,
      ];

      execSync(cmd.join(' '), {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      // 驗證創建成功
      if (!fs.existsSync(worktreePath)) {
        throw new Error('Worktree creation failed: path does not exist');
      }

      // 創建 Worktree 記錄
      const worktree: Worktree = {
        id: this.generateId('wt'),
        name,
        type,
        branch: branchName,
        baseBranch,
        path: worktreePath,
        description,
        createdAt: Date.now(),
        createdBy: autoCreated ? 'battle' : 'manual',
        autoCreated,
        status: 'active',
      };

      this.worktrees.set(worktree.id, worktree);

      return worktree;
    } catch (error) {
      // 清理失敗的創建
      if (fs.existsSync(worktreePath)) {
        this.forceRemoveDirectory(worktreePath);
      }
      throw error;
    }
  }

  /**
   * 刪除 Worktree
   */
  async remove(
    worktreeId: string,
    options?: { force?: boolean }
  ): Promise<void> {
    const worktree = this.worktrees.get(worktreeId);
    if (!worktree) {
      throw new Error(`Worktree not found: ${worktreeId}`);
    }

    const force = options?.force || false;

    try {
      // 執行 git worktree remove
      const cmd = ['git', 'worktree', 'remove', worktree.path];
      if (force) {
        cmd.push('--force');
      }

      execSync(cmd.join(' '), {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      // 刪除分支（如果是自動創建的）
      if (worktree.autoCreated) {
        try {
          execSync(`git branch -${force ? 'D' : 'd'} ${worktree.branch}`, {
            cwd: this.projectRoot,
            stdio: 'pipe',
          });
        } catch (error) {
          // 分支刪除失敗不影響 worktree 刪除
          console.warn(`Failed to delete branch ${worktree.branch}:`, error);
        }
      }

      // 從記錄中移除
      this.worktrees.delete(worktreeId);
    } catch (error) {
      throw new Error(`Failed to remove worktree: ${error.message}`);
    }
  }

  /**
   * 合併 Worktree
   */
  async merge(options: {
    worktreeId: string;
    targetBranch: string;
    message?: string;
  }): Promise<void> {
    const { worktreeId, targetBranch, message } = options;

    const worktree = this.worktrees.get(worktreeId);
    if (!worktree) {
      throw new Error(`Worktree not found: ${worktreeId}`);
    }

    try {
      // 切換到目標分支
      execSync(`git checkout ${targetBranch}`, {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      // 執行合併
      const mergeMsg = message || `Merge ${worktree.branch}`;
      execSync(
        `git merge ${worktree.branch} --no-ff -m "${mergeMsg}"`,
        {
          cwd: this.projectRoot,
          stdio: 'pipe',
        }
      );
    } catch (error) {
      throw new Error(`Merge failed: ${error.message}`);
    }
  }

  /**
   * 列出所有 Worktree
   */
  list(): Worktree[] {
    return Array.from(this.worktrees.values());
  }

  /**
   * 獲取 Worktree
   */
  get(worktreeId: string): Worktree | undefined {
    return this.worktrees.get(worktreeId);
  }

  /**
   * 檢測項目根目錄
   */
  private detectProjectRoot(): string {
    try {
      const root = execSync('git rev-parse --show-toplevel', {
        encoding: 'utf-8',
      }).trim();
      return root;
    } catch (error) {
      throw new Error('Not a git repository');
    }
  }

  /**
   * 加載現有 Worktrees
   */
  private loadExistingWorktrees(): void {
    try {
      const output = execSync('git worktree list --porcelain', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
      });

      // 解析輸出
      const worktrees = this.parseWorktreeList(output);

      // 只加載在 worktreesBaseDir 中的 worktree
      worktrees.forEach((wt) => {
        if (wt.path.startsWith(this.worktreesBaseDir)) {
          this.worktrees.set(wt.id, wt);
        }
      });
    } catch (error) {
      console.warn('Failed to load existing worktrees:', error);
    }
  }

  /**
   * 解析 worktree list 輸出
   */
  private parseWorktreeList(output: string): Worktree[] {
    const worktrees: Worktree[] = [];
    const entries = output.split('\n\n');

    entries.forEach((entry) => {
      const lines = entry.split('\n');
      const pathLine = lines.find((l) => l.startsWith('worktree '));
      const branchLine = lines.find((l) => l.startsWith('branch '));

      if (pathLine) {
        const worktreePath = pathLine.replace('worktree ', '');
        const branch = branchLine
          ? branchLine.replace('branch refs/heads/', '')
          : 'unknown';

        // 嘗試從路徑推斷類型和名稱
        const pathParts = path.basename(worktreePath).split('-');
        const type = pathParts[0] as Worktree['type'];
        const name = pathParts.slice(1).join('-');

        worktrees.push({
          id: this.generateId('wt'),
          name,
          type: type || 'feature',
          branch,
          baseBranch: 'main',
          path: worktreePath,
          createdAt: Date.now(),
          createdBy: 'manual',
          autoCreated: false,
          status: 'active',
        });
      }
    });

    return worktrees;
  }

  /**
   * 強制刪除目錄
   */
  private forceRemoveDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default WorktreeManager;
```

---

### 3. CLIInstanceManager

**職責**: 管理 Claude CLI 進程實例

```typescript
// bridge/worktree-battle/CLIInstanceManager.ts

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

interface CLIInstance {
  id: string;
  processId: number;
  workingDir: string;
  status: 'starting' | 'running' | 'idle' | 'error' | 'stopped';
  startedAt: number;
  stoppedAt?: number;
  lastActivity: number;
  battleId: string;
}

class CLIInstanceManager extends EventEmitter {
  private instances: Map<string, CLIInstance>;
  private processes: Map<string, ChildProcess>;
  private outputBuffers: Map<string, string>;

  constructor() {
    super();
    this.instances = new Map();
    this.processes = new Map();
    this.outputBuffers = new Map();
  }

  /**
   * 啟動 CLI 實例
   */
  async spawn(options: {
    workingDir: string;
    prompt: string;
    battleId: string;
  }): Promise<CLIInstance> {
    const { workingDir, prompt, battleId } = options;

    const instanceId = this.generateId('cli');

    try {
      // 啟動 Claude CLI 進程
      const cliProcess = spawn('claude', ['code'], {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      if (!cliProcess.pid) {
        throw new Error('Failed to spawn CLI process');
      }

      // 創建實例記錄
      const instance: CLIInstance = {
        id: instanceId,
        processId: cliProcess.pid,
        workingDir,
        status: 'starting',
        startedAt: Date.now(),
        lastActivity: Date.now(),
        battleId,
      };

      this.instances.set(instanceId, instance);
      this.processes.set(instanceId, cliProcess);
      this.outputBuffers.set(instanceId, '');

      // 設置進程事件監聽
      this.setupProcessListeners(instanceId, cliProcess);

      // 等待 CLI 準備就緒
      await this.waitForReady(instanceId);

      // 發送初始 prompt
      this.sendPrompt(instanceId, prompt);

      // 更新狀態
      instance.status = 'running';

      return instance;
    } catch (error) {
      // 清理失敗的實例
      await this.cleanup(instanceId);
      throw error;
    }
  }

  /**
   * 停止 CLI 實例
   */
  async stop(instanceId: string): Promise<void> {
    const process = this.processes.get(instanceId);
    const instance = this.instances.get(instanceId);

    if (!process || !instance) {
      return;
    }

    try {
      // 優雅關閉
      process.kill('SIGTERM');

      // 等待進程退出（最多 5 秒）
      await this.waitForExit(process, 5000);
    } catch (error) {
      // 強制關閉
      process.kill('SIGKILL');
    } finally {
      instance.status = 'stopped';
      instance.stoppedAt = Date.now();
    }
  }

  /**
   * 發送 Prompt
   */
  sendPrompt(instanceId: string, prompt: string): void {
    const process = this.processes.get(instanceId);
    if (!process || !process.stdin) {
      throw new Error(`CLI instance not found or stdin unavailable: ${instanceId}`);
    }

    process.stdin.write(prompt + '\n');

    // 更新活動時間
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.lastActivity = Date.now();
    }
  }

  /**
   * 設置進程監聽
   */
  private setupProcessListeners(
    instanceId: string,
    process: ChildProcess
  ): void {
    // 監聽標準輸出
    process.stdout?.on('data', (data) => {
      this.handleOutput(instanceId, data.toString());
    });

    // 監聽標準錯誤
    process.stderr?.on('data', (data) => {
      this.handleError(instanceId, data.toString());
    });

    // 監聽退出
    process.on('exit', (code, signal) => {
      this.handleExit(instanceId, code, signal);
    });

    // 監聽錯誤
    process.on('error', (error) => {
      this.handleProcessError(instanceId, error);
    });
  }

  /**
   * 處理輸出
   */
  private handleOutput(instanceId: string, data: string): void {
    // 添加到緩衝區
    const buffer = this.outputBuffers.get(instanceId) || '';
    this.outputBuffers.set(instanceId, buffer + data);

    // 觸發輸出事件
    this.emit(`output:${instanceId}`, data);

    // 更新活動時間
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.lastActivity = Date.now();
    }
  }

  /**
   * 處理錯誤
   */
  private handleError(instanceId: string, data: string): void {
    this.emit(`error:${instanceId}`, new Error(data));

    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
    }
  }

  /**
   * 處理退出
   */
  private handleExit(
    instanceId: string,
    code: number | null,
    signal: string | null
  ): void {
    this.emit(`exit:${instanceId}`, code, signal);

    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = 'stopped';
      instance.stoppedAt = Date.now();
    }

    // 清理資源
    this.cleanup(instanceId);
  }

  /**
   * 處理進程錯誤
   */
  private handleProcessError(instanceId: string, error: Error): void {
    this.emit(`error:${instanceId}`, error);

    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = 'error';
    }
  }

  /**
   * 等待 CLI 準備就緒
   */
  private async waitForReady(instanceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('CLI startup timeout'));
      }, 10000); // 10 秒超時

      const listener = (data: string) => {
        // 檢測 CLI 準備就緒的信號
        if (
          data.includes('Claude Code') ||
          data.includes('Ready') ||
          data.includes('>')
        ) {
          clearTimeout(timeout);
          this.removeListener(`output:${instanceId}`, listener);
          resolve();
        }
      };

      this.on(`output:${instanceId}`, listener);
    });
  }

  /**
   * 等待進程退出
   */
  private async waitForExit(
    process: ChildProcess,
    timeout: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Process exit timeout'));
      }, timeout);

      process.on('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  /**
   * 清理資源
   */
  private async cleanup(instanceId: string): Promise<void> {
    this.processes.delete(instanceId);
    this.outputBuffers.delete(instanceId);
  }

  /**
   * 生成唯一 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取實例
   */
  get(instanceId: string): CLIInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * 列出所有實例
   */
  list(): CLIInstance[] {
    return Array.from(this.instances.values());
  }
}

export default CLIInstanceManager;
```

---

## 數據結構

### 數據持久化

```typescript
// bridge/worktree-battle/DataStore.ts

import * as fs from 'fs';
import * as path from 'path';

interface DataStore {
  bindings: BattleWorktreeBinding[];
  worktrees: Worktree[];
  battles: Battle[];
  archivedBattles: ArchivedBattle[];
}

class PersistenceManager {
  private dataPath: string;

  constructor() {
    this.dataPath = path.join(
      process.cwd(),
      '.rpg-cli',
      'worktree-battle-data.json'
    );

    // 確保目錄存在
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 保存數據
   */
  save(data: DataStore): void {
    fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
  }

  /**
   * 加載數據
   */
  load(): DataStore | null {
    if (!fs.existsSync(this.dataPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.dataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  }

  /**
   * 清除數據
   */
  clear(): void {
    if (fs.existsSync(this.dataPath)) {
      fs.unlinkSync(this.dataPath);
    }
  }
}

export default PersistenceManager;
```

---

## API 設計

### REST API Endpoints

```typescript
// bridge/api/worktree-battle-routes.ts

import express from 'express';
import WorktreeBattleManager from '../worktree-battle/WorktreeBattleManager';

const router = express.Router();
const manager = new WorktreeBattleManager();

/**
 * 創建戰鬥（自動創建 Worktree）
 * POST /api/worktree-battle/create
 */
router.post('/create', async (req, res) => {
  const { prompt, complexity, zone, enemy } = req.body;

  try {
    const binding = await manager.createBattleWithWorktree({
      prompt,
      complexity,
      zone,
      enemy,
    });

    res.json({
      success: true,
      data: binding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 獲取活躍戰鬥列表
 * GET /api/worktree-battle/active
 */
router.get('/active', (req, res) => {
  const activeBattles = manager.getActive();
  res.json({
    success: true,
    data: activeBattles,
  });
});

/**
 * 獲取保留的 Worktree 列表
 * GET /api/worktree-battle/kept
 */
router.get('/kept', (req, res) => {
  const keptWorktrees = manager.getKept();
  res.json({
    success: true,
    data: keptWorktrees,
  });
});

/**
 * 合併戰鬥
 * POST /api/worktree-battle/:battleId/merge
 */
router.post('/:battleId/merge', async (req, res) => {
  const { battleId } = req.params;

  try {
    await manager.merge(battleId);
    res.json({
      success: true,
      message: 'Battle merged successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 保留戰鬥
 * POST /api/worktree-battle/:battleId/keep
 */
router.post('/:battleId/keep', async (req, res) => {
  const { battleId } = req.params;

  try {
    await manager.keep(battleId);
    res.json({
      success: true,
      message: 'Battle kept successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 放棄戰鬥
 * POST /api/worktree-battle/:battleId/discard
 */
router.post('/:battleId/discard', async (req, res) => {
  const { battleId } = req.params;
  const { confirmed } = req.body;

  try {
    await manager.discard(battleId, confirmed);
    res.json({
      success: true,
      message: 'Battle discarded successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

---

## WebSocket 協議

### 事件定義

```typescript
// bridge/websocket/worktree-battle-events.ts

export const WorktreeBattleEvents = {
  // Client → Server
  CREATE_BATTLE: 'worktree_battle:create',
  MERGE_BATTLE: 'worktree_battle:merge',
  KEEP_BATTLE: 'worktree_battle:keep',
  DISCARD_BATTLE: 'worktree_battle:discard',

  // Server → Client
  BATTLE_CREATED: 'worktree_battle:created',
  BATTLE_PROGRESS: 'worktree_battle:progress',
  BATTLE_COMPLETED: 'worktree_battle:completed',
  BATTLE_MERGED: 'worktree_battle:merged',
  BATTLE_KEPT: 'worktree_battle:kept',
  BATTLE_DISCARDED: 'worktree_battle:discarded',

  // 錯誤事件
  BATTLE_ERROR: 'worktree_battle:error',
  CLI_ERROR: 'worktree_battle:cli_error',
  GIT_ERROR: 'worktree_battle:git_error',

  // Git 活動
  GIT_ACTIVITY: 'worktree_battle:git_activity',
};
```

### WebSocket Handler

```typescript
// bridge/websocket/worktree-battle-handler.ts

import { Socket } from 'socket.io';
import WorktreeBattleManager from '../worktree-battle/WorktreeBattleManager';
import { WorktreeBattleEvents } from './worktree-battle-events';

export function setupWorktreeBattleHandlers(
  socket: Socket,
  manager: WorktreeBattleManager
): void {
  /**
   * 創建戰鬥
   */
  socket.on(WorktreeBattleEvents.CREATE_BATTLE, async (data, callback) => {
    try {
      const binding = await manager.createBattleWithWorktree(data);
      callback({ success: true, data: binding });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  /**
   * 合併戰鬥
   */
  socket.on(WorktreeBattleEvents.MERGE_BATTLE, async (data, callback) => {
    try {
      await manager.merge(data.battleId);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  /**
   * 保留戰鬥
   */
  socket.on(WorktreeBattleEvents.KEEP_BATTLE, async (data, callback) => {
    try {
      await manager.keep(data.battleId);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  /**
   * 放棄戰鬥
   */
  socket.on(WorktreeBattleEvents.DISCARD_BATTLE, async (data, callback) => {
    try {
      await manager.discard(data.battleId, data.confirmed);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  /**
   * 監聽管理器事件並廣播
   */
  manager.on('binding:created', (binding) => {
    socket.emit(WorktreeBattleEvents.BATTLE_CREATED, binding);
  });

  manager.on('binding:progress', (binding) => {
    socket.emit(WorktreeBattleEvents.BATTLE_PROGRESS, {
      battleId: binding.id,
      progress: binding.battle.progress,
      stats: binding.stats,
    });
  });

  manager.on('binding:completed', (binding) => {
    socket.emit(WorktreeBattleEvents.BATTLE_COMPLETED, binding);
  });

  manager.on('binding:merged', (binding) => {
    socket.emit(WorktreeBattleEvents.BATTLE_MERGED, binding);
  });

  manager.on('binding:kept', (binding) => {
    socket.emit(WorktreeBattleEvents.BATTLE_KEPT, binding);
  });

  manager.on('binding:discarded', (binding) => {
    socket.emit(WorktreeBattleEvents.BATTLE_DISCARDED, binding);
  });

  manager.on('binding:git_activity', (data) => {
    socket.emit(WorktreeBattleEvents.GIT_ACTIVITY, data);
  });

  manager.on('binding:cli_error', (data) => {
    socket.emit(WorktreeBattleEvents.CLI_ERROR, data);
  });
}
```

---

## 實作優先級

### Phase 1: 核心功能 (Week 1-2)

**目標**: 實現基本的戰鬥-Worktree 綁定

**任務**:
1. ✅ WorktreeManager 基礎實現
   - createWorktree()
   - removeWorktree()
   - list()

2. ✅ CLIInstanceManager 基礎實現
   - spawn()
   - stop()
   - 基礎事件監聽

3. ✅ WorktreeBattleManager 核心
   - createBattleWithWorktree()
   - handleBattleComplete()
   - merge()

4. ✅ 數據持久化
   - PersistenceManager
   - 保存/加載綁定記錄

**驗收標準**:
- 能夠創建戰鬥並自動創建 Worktree
- CLI 在 Worktree 中正確啟動
- 戰鬥完成後能夠合併到主分支
- 數據在重啟後能夠恢復

---

### Phase 2: 進度追蹤 (Week 3)

**目標**: 實現戰鬥進度監控

**任務**:
1. ✅ CLI 輸出解析
   - 進度估算邏輯
   - Git 操作檢測

2. ✅ 統計收集
   - Commits 計數
   - 文件變更統計
   - 行數統計

3. ✅ 實時廣播
   - WebSocket 進度更新
   - UI 進度條更新

**驗收標準**:
- 戰鬥進度準確顯示
- Git 活動實時更新
- 統計數據正確

---

### Phase 3: 後處理選項 (Week 4)

**目標**: 實現完整的後處理流程

**任務**:
1. ✅ Keep 功能
   - 保留 Worktree
   - 狀態管理

2. ✅ Discard 功能
   - 二次確認機制
   - 強制刪除

3. ✅ 公會大廳 UI
   - 活躍戰鬥列表
   - 保留 Worktree 管理

**驗收標準**:
- 三種後處理選項全部可用
- 用戶可在公會大廳管理所有 Worktree

---

### Phase 4: 並行管理 (Week 5)

**目標**: 支持多戰鬥並行

**任務**:
1. ✅ 並行限制
   - 最大並行數控制 (3)
   - 隊列機制

2. ✅ 自動啟動
   - 戰鬥完成時自動啟動排隊戰鬥
   - 隊列狀態更新

3. ✅ 資源管理
   - CLI 實例池管理
   - 自動清理

**驗收標準**:
- 最多 3 個戰鬥同時進行
- 超過上限自動排隊
- 隊列狀態清晰顯示

---

### Phase 5: 錯誤處理 (Week 6)

**目標**: 完善錯誤處理和恢復機制

**任務**:
1. ✅ Git 錯誤處理
   - 自動重試
   - 用戶友好的錯誤提示

2. ✅ CLI 崩潰處理
   - 進度保存
   - 恢復選項

3. ✅ 檢查點機制
   - 定期保存進度
   - 崩潰後恢復

**驗收標準**:
- Git 錯誤能夠優雅處理
- CLI 崩潰時進度不丟失
- 提供清晰的恢復選項

---

## 測試策略

### 單元測試

```typescript
// bridge/__tests__/WorktreeManager.test.ts

import WorktreeManager from '../worktree-battle/WorktreeManager';

describe('WorktreeManager', () => {
  let manager: WorktreeManager;

  beforeEach(() => {
    manager = new WorktreeManager();
  });

  describe('createWorktree', () => {
    it('should create a new worktree', async () => {
      const worktree = await manager.createWorktree({
        name: 'test-feature',
        type: 'feature',
        baseBranch: 'main',
      });

      expect(worktree.id).toBeDefined();
      expect(worktree.type).toBe('feature');
      expect(worktree.branch).toBe('feature/test-feature');
    });

    it('should throw error if path exists', async () => {
      await manager.createWorktree({
        name: 'test-feature',
        type: 'feature',
        baseBranch: 'main',
      });

      await expect(
        manager.createWorktree({
          name: 'test-feature',
          type: 'feature',
          baseBranch: 'main',
        })
      ).rejects.toThrow('path already exists');
    });
  });

  describe('remove', () => {
    it('should remove worktree', async () => {
      const worktree = await manager.createWorktree({
        name: 'test-feature',
        type: 'feature',
        baseBranch: 'main',
      });

      await manager.remove(worktree.id);

      expect(manager.get(worktree.id)).toBeUndefined();
    });
  });
});
```

### 集成測試

```typescript
// bridge/__tests__/WorktreeBattleManager.integration.test.ts

import WorktreeBattleManager from '../worktree-battle/WorktreeBattleManager';

describe('WorktreeBattleManager Integration', () => {
  let manager: WorktreeBattleManager;

  beforeEach(() => {
    manager = new WorktreeBattleManager();
  });

  it('should create battle with worktree and CLI', async () => {
    const binding = await manager.createBattleWithWorktree({
      prompt: 'Refactor authentication system',
      complexity: 12,
      zone: 'wilderness.forest',
      enemy: {
        type: 'Legacy Code Dragon',
        level: 7,
        hp: 1100,
      },
    });

    expect(binding.worktree).toBeDefined();
    expect(binding.cliInstance).toBeDefined();
    expect(binding.battle).toBeDefined();
    expect(binding.cliInstance.status).toBe('running');
  }, 30000); // 30 秒超時

  it('should handle battle completion and merge', async () => {
    const binding = await manager.createBattleWithWorktree({
      prompt: 'Add dark mode',
      complexity: 8,
      zone: 'wilderness.mountains',
      enemy: {
        type: 'Feature Goblin',
        level: 4,
        hp: 600,
      },
    });

    // 模擬戰鬥完成
    await manager.handleBattleComplete(binding.id, 'victory');

    expect(binding.lifecycle.phase).toBe('post_battle');
    expect(binding.lifecycle.canMerge).toBe(true);

    // 執行合併
    await manager.merge(binding.id);

    // 驗證 worktree 已刪除
    expect(manager.get(binding.id)).toBeUndefined();
  }, 60000); // 60 秒超時
});
```

---

## 性能優化

### 1. CLI 進程池復用

```typescript
// 當戰鬥結束時，不立即關閉 CLI 實例
// 而是將其標記為"空閒"，供新戰鬥復用

class CLIInstancePool {
  private idleInstances: CLIInstance[] = [];

  async getOrCreate(workingDir: string): Promise<CLIInstance> {
    // 檢查是否有空閒實例
    const idle = this.idleInstances.find(
      (i) => i.workingDir === workingDir
    );

    if (idle) {
      idle.status = 'running';
      return idle;
    }

    // 否則創建新實例
    return await this.cliInstanceManager.spawn({ workingDir });
  }

  markIdle(instance: CLIInstance): void {
    instance.status = 'idle';
    this.idleInstances.push(instance);

    // 5 分鐘後自動關閉空閒實例
    setTimeout(() => {
      if (instance.status === 'idle') {
        this.cliInstanceManager.stop(instance.id);
        this.idleInstances = this.idleInstances.filter(
          (i) => i.id !== instance.id
        );
      }
    }, 5 * 60 * 1000);
  }
}
```

### 2. Git 操作批處理

```typescript
// 避免頻繁執行 Git 命令
// 使用批處理和緩存

class GitOperationBatcher {
  private pendingOps: GitOperation[] = [];
  private batchInterval = 1000; // 1 秒

  constructor() {
    setInterval(() => this.flush(), this.batchInterval);
  }

  add(op: GitOperation): void {
    this.pendingOps.push(op);
  }

  private async flush(): Promise<void> {
    if (this.pendingOps.length === 0) return;

    const ops = this.pendingOps.splice(0);

    // 批量執行
    for (const op of ops) {
      await op.execute();
    }
  }
}
```

### 3. 進度計算優化

```typescript
// 使用啟發式算法估算進度
// 避免頻繁執行 Git diff

class ProgressEstimator {
  private baselineComplexity: number;
  private toolUsesCompleted: number = 0;
  private estimatedTotalToolUses: number;

  constructor(complexity: number) {
    this.baselineComplexity = complexity;
    // 基於複雜度估算工具使用次數
    this.estimatedTotalToolUses = complexity * 5;
  }

  estimateProgress(toolUses: number): number {
    this.toolUsesCompleted = toolUses;

    // 基於工具使用次數估算進度
    const progress = Math.min(
      (toolUses / this.estimatedTotalToolUses) * 100,
      95 // 最多 95%，最後 5% 留給完成確認
    );

    return Math.round(progress);
  }
}
```

---

## 總結

本實作細節文檔提供了 Worktree-Battle 整合系統的完整技術實現方案：

**核心組件**:
1. ✅ WorktreeBattleManager - 統一管理綁定關係
2. ✅ WorktreeManager - Git Worktree 操作
3. ✅ CLIInstanceManager - Claude CLI 進程管理

**技術特點**:
- 🎯 完整的數據持久化
- 🎯 清晰的 API 設計
- 🎯 實時 WebSocket 通信
- 🎯 分階段實作計劃
- 🎯 完善的測試策略
- 🎯 性能優化方案

**開發路線**:
- Phase 1-2: 核心功能 + 進度追蹤 (3 週)
- Phase 3-4: 後處理 + 並行管理 (2 週)
- Phase 5: 錯誤處理 (1 週)
- **總計**: 6 週完整實現

**下一步**:
- 開始 Phase 1 開發
- 編寫單元測試
- 集成到現有系統
