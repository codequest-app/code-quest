# Worktree Manual System - Implementation

## 系統架構

```
┌─────────────────────────────────────────────┐
│          User Interface Layer                │
│  (React Components + State Management)       │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│         Business Logic Layer                 │
│           WorktreeManager                    │
│  • createWorktree()                          │
│  • switchToWorktree()                        │
│  • mergeWorktree()                           │
│  • removeWorktree()                          │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│          Git Operations Layer                │
│  • GitWorktreeService                        │
│  • GitStashService                           │
│  • GitMergeService                           │
└──────────────┬──────────────────────────────┘
               ↓
┌─────────────────────────────────────────────┐
│         Metadata & Storage Layer             │
│  • MetadataStore                             │
│  • FileSystemService                         │
└─────────────────────────────────────────────┘
```

## 核心類：WorktreeManager

### 完整實現

```typescript
import { exec, execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface WorldType {
  id: string;
  icon: string;
  name: string;
  description: string;
  color: string;
  protection: 'none' | 'low' | 'medium' | 'high';
  priority?: 'high' | 'critical';
  temporary?: boolean;
  allowedActions: string[];
  features: Record<string, any>;
  summonCost: {
    mp: number;
    cooldown: number; // 秒
  };
}

interface WorktreeMetadata {
  id: string;
  name: string;
  type: 'feature' | 'fix' | 'experiment' | 'hotfix';
  path: string;
  branch: string;
  baseBranch: string;
  description: string;
  tags: string[];
  createdAt: string;
  lastActivity: string;
  lastCommit: string | null;
  stats: {
    commits: number;
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    workingHours: number;
  };
  progress: {
    status: 'planning' | 'in_progress' | 'review' | 'completed';
    completion: number;
    milestones: Array<{ name: string; done: boolean }>;
  };
  activities: Array<{
    timestamp: string;
    type: string;
    message: string;
    author: string;
  }>;
  flags: {
    hasUncommitted: boolean;
    hasConflicts: boolean;
    needsReview: boolean;
    isStale: boolean;
  };
  metadata: {
    assignedTo: string;
    reviewers: string[];
    linkedIssue: string | null;
    estimatedTime: number;
    actualTime: number;
  };
}

class WorktreeManager {
  private projectPath: string;
  private worktreesPath: string;
  private metadataPath: string;
  private activeWorktrees: Map<string, WorktreeMetadata> = new Map();
  private lastSummonTimes: Map<string, number> = new Map();

  private worldTypes: Record<string, WorldType> = {
    feature: {
      id: 'feature',
      icon: '⚔️',
      name: '冒險世界',
      description: '開發新功能的平行時間線',
      color: '#50C878',
      protection: 'low',
      allowedActions: ['commit', 'push', 'merge', 'delete'],
      features: {
        autoCleanup: true,
        suggestionEnabled: true
      },
      summonCost: { mp: 10, cooldown: 0 }
    },
    fix: {
      id: 'fix',
      icon: '🛡️',
      name: '修復世界',
      description: '快速修復問題的緊急時間線',
      color: '#E27D60',
      protection: 'medium',
      priority: 'high',
      allowedActions: ['commit', 'push', 'merge', 'delete'],
      features: {
        quickMerge: true,
        autoTest: true
      },
      summonCost: { mp: 15, cooldown: 0 }
    },
    experiment: {
      id: 'experiment',
      icon: '🔮',
      name: '實驗世界',
      description: '安全的實驗空間，可隨時放棄',
      color: '#9B59B6',
      protection: 'none',
      temporary: true,
      allowedActions: ['commit', 'delete', 'abandon'],
      features: {
        safeZone: true,
        autoExpire: 7
      },
      summonCost: { mp: 5, cooldown: 0 }
    },
    hotfix: {
      id: 'hotfix',
      icon: '🚨',
      name: '緊急世界',
      description: '緊急修復生產環境問題',
      color: '#FF4444',
      protection: 'medium',
      priority: 'critical',
      allowedActions: ['commit', 'push', 'merge_to_main'],
      features: {
        fastTrack: true,
        skipCI: false,
        notifyTeam: true
      },
      summonCost: { mp: 20, cooldown: 300 }
    }
  };

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.worktreesPath = path.join(projectPath, '..', 'worktrees');
    this.metadataPath = path.join(this.worktreesPath, '.metadata.json');

    this.ensureWorktreesDir();
    this.loadMetadata();
  }

  /**
   * 創建新時間線
   */
  async createWorktree(options: {
    name: string;
    type: 'feature' | 'fix' | 'experiment' | 'hotfix';
    baseBranch: string;
    description?: string;
    tags?: string[];
    estimatedTime?: number;
    milestones?: string[];
  }): Promise<WorktreeMetadata> {
    const {
      name,
      type,
      baseBranch,
      description = '',
      tags = [],
      estimatedTime = 0,
      milestones = []
    } = options;

    // 1. 檢查 MP
    const worldType = this.worldTypes[type];
    const user = this.getUser(); // 從全局狀態獲取用戶

    if (user.mp < worldType.summonCost.mp) {
      throw new Error(`⚡ MP 不足！需要 ${worldType.summonCost.mp} MP，當前 ${user.mp} MP。`);
    }

    // 2. 檢查冷卻
    if (worldType.summonCost.cooldown > 0) {
      const lastSummon = this.lastSummonTimes.get(type) || 0;
      const elapsed = Date.now() - lastSummon;
      const cooldownMs = worldType.summonCost.cooldown * 1000;

      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        throw new Error(`🕐 冷卻中，剩餘 ${remaining} 秒`);
      }
    }

    // 3. 生成分支名稱和路徑
    const branchName = `${type}/${name}`;
    const worktreePath = path.join(this.worktreesPath, name);

    // 4. 檢查是否已存在
    if (fs.existsSync(worktreePath)) {
      throw new Error(`❌ 時間線 "${name}" 已存在`);
    }

    // 5. 執行 git worktree add
    try {
      await this.exec(
        `git worktree add "${worktreePath}" -b ${branchName} ${baseBranch}`
      );
    } catch (error) {
      throw new Error(`創建 worktree 失敗: ${error.message}`);
    }

    // 6. 創建元數據
    const metadata: WorktreeMetadata = {
      id: this.generateId(),
      name,
      type,
      path: worktreePath,
      branch: branchName,
      baseBranch,
      description,
      tags,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      lastCommit: null,
      stats: {
        commits: 0,
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0,
        workingHours: 0
      },
      progress: {
        status: 'planning',
        completion: 0,
        milestones: milestones.map(name => ({ name, done: false }))
      },
      activities: [],
      flags: {
        hasUncommitted: false,
        hasConflicts: false,
        needsReview: false,
        isStale: false
      },
      metadata: {
        assignedTo: user.id,
        reviewers: [],
        linkedIssue: null,
        estimatedTime,
        actualTime: 0
      }
    };

    // 7. 保存元數據
    this.saveWorktreeMetadata(metadata);
    this.activeWorktrees.set(metadata.id, metadata);

    // 8. 消耗 MP
    user.mp -= worldType.summonCost.mp;
    this.updateUser(user);

    // 9. 記錄召喚時間
    this.lastSummonTimes.set(type, Date.now());

    // 10. 播放創建動畫
    await this.playCreateAnimation(worldType);

    // 11. 觸發事件
    this.emitEvent('worktree:created', metadata);

    return metadata;
  }

  /**
   * 列出所有時間線
   */
  async listWorktrees(): Promise<WorktreeMetadata[]> {
    // 執行 git worktree list
    const output = await this.exec('git worktree list --porcelain');
    const worktrees = this.parseWorktreeList(output);

    // 合併元數據並更新狀態
    const enriched = worktrees.map(wt => {
      const metadata = this.loadWorktreeMetadataByBranch(wt.branch);
      if (!metadata) {
        // 如果沒有元數據（可能是外部創建的），創建基本元數據
        return this.createBasicMetadata(wt);
      }

      // 更新動態狀態
      metadata.flags.hasUncommitted = this.checkUncommitted(wt.path);

      return metadata;
    });

    return enriched;
  }

  /**
   * 切換到時間線
   */
  async switchToWorktree(worktreeId: string): Promise<WorktreeMetadata> {
    const worktree = this.activeWorktrees.get(worktreeId);
    if (!worktree) {
      throw new Error('❌ 時間線不存在');
    }

    // 檢查戰鬥狀態
    const gameState = this.getGameState();
    if (gameState.inBattle) {
      throw new Error('⚔️ 戰鬥中無法切換時間線！請先完成當前戰鬥。');
    }

    // 檢查 MP
    const user = this.getUser();
    const switchCost = 5;
    if (user.mp < switchCost) {
      throw new Error(`⚡ MP 不足！需要 ${switchCost} MP，當前 ${user.mp} MP。`);
    }

    // 檢查當前目錄狀態
    const currentPath = process.cwd();
    const hasChanges = await this.checkUncommittedChanges(currentPath);

    if (hasChanges) {
      // 提示用戶處理未提交的變更
      const action = await this.promptHandleChanges();

      switch (action) {
        case 'commit':
          await this.quickCommit();
          break;
        case 'stash':
          await this.stashChanges();
          break;
        case 'discard':
          if (!(await this.confirmDiscard())) {
            throw new Error('⛔ 用戶取消切換');
          }
          await this.discardChanges();
          break;
        case 'cancel':
          throw new Error('⛔ 用戶取消切換');
      }
    }

    // 播放傳送動畫
    await this.playTeleportAnimation();

    // 切換工作目錄
    process.chdir(worktree.path);

    // 消耗 MP
    user.mp -= switchCost;
    this.updateUser(user);

    // 更新最後活動時間
    worktree.lastActivity = new Date().toISOString();
    this.saveWorktreeMetadata(worktree);

    // 通知編輯器
    await this.notifyEditor(worktree.path);

    // 觸發事件
    this.emitEvent('worktree:switched', worktree);

    return worktree;
  }

  /**
   * 合併時間線
   */
  async mergeWorktree(
    sourceId: string,
    targetBranch: string = 'main',
    options: {
      autoResolve?: boolean;
      autoCleanup?: boolean;
      strategy?: 'auto' | 'manual' | 'pr';
    } = {}
  ): Promise<{
    success: boolean;
    reward?: { exp: number; gold: number };
    conflicts?: number;
    cancelled?: boolean;
    needsManualResolve?: boolean;
  }> {
    const source = this.activeWorktrees.get(sourceId);
    if (!source) {
      throw new Error('❌ 源時間線不存在');
    }

    // 檢查 MP
    const user = this.getUser();
    const mergeCost = 20;
    if (user.mp < mergeCost) {
      throw new Error(`⚡ MP 不足！需要 ${mergeCost} MP，當前 ${user.mp} MP。`);
    }

    // 檢查是否有未提交變更
    if (source.flags.hasUncommitted) {
      throw new Error('⚠️ 請先提交所有變更');
    }

    // 切換到主目錄
    const originalPath = process.cwd();
    process.chdir(this.projectPath);

    try {
      // 檢查衝突
      const conflicts = await this.checkMergeConflicts(source.branch, targetBranch);

      if (conflicts.length > 0) {
        if (options.strategy === 'auto' && options.autoResolve) {
          // AI 自動解決衝突
          await this.autoResolveConflicts(conflicts);
        } else if (options.strategy === 'manual') {
          // 需要手動解決
          return {
            success: false,
            needsManualResolve: true,
            conflicts: conflicts.length
          };
        } else if (options.strategy === 'pr') {
          // 創建 Pull Request
          await this.createPullRequest(source, targetBranch);
          return { success: true, conflicts: conflicts.length };
        }
      }

      // 執行合併
      await this.exec(`git checkout ${targetBranch}`);
      await this.exec(`git merge ${source.branch} --no-ff -m "Merge ${source.branch}: ${source.description}"`);

      // 播放合併動畫
      await this.playMergeAnimation();

      // 消耗 MP
      user.mp -= mergeCost;

      // 計算獎勵
      const reward = this.calculateMergeReward(source);
      user.exp += reward.exp;
      user.gold += reward.gold;
      this.updateUser(user);

      // 更新元數據
      source.progress.status = 'completed';
      source.progress.completion = 1.0;
      this.saveWorktreeMetadata(source);

      // 清理
      if (options.autoCleanup !== false) {
        const shouldCleanup = await this.promptCleanup(source);
        if (shouldCleanup) {
          await this.removeWorktree(sourceId, { force: false, deleteBranch: true });
        }
      }

      // 觸發事件
      this.emitEvent('worktree:merged', { source, target: targetBranch, reward });

      return {
        success: true,
        reward,
        conflicts: conflicts.length
      };
    } catch (error) {
      throw new Error(`合併失敗: ${error.message}`);
    } finally {
      process.chdir(originalPath);
    }
  }

  /**
   * 刪除時間線
   */
  async removeWorktree(
    worktreeId: string,
    options: {
      force?: boolean;
      deleteBranch?: boolean;
    } = {}
  ): Promise<{ success: boolean; branchDeleted: boolean; cancelled?: boolean }> {
    const worktree = this.activeWorktrees.get(worktreeId);
    if (!worktree) {
      throw new Error('❌ 時間線不存在');
    }

    const force = options.force || false;

    // 檢查未提交變更
    if (!force && worktree.flags.hasUncommitted) {
      const confirm = await this.confirmDeleteWithChanges();
      if (!confirm) {
        return { success: false, branchDeleted: false, cancelled: true };
      }
    }

    // 刪除 worktree（免費操作，不消耗 MP）
    await this.exec(`git worktree remove "${worktree.path}" ${force ? '--force' : ''}`);

    // 詢問是否刪除分支
    const deleteBranch =
      options.deleteBranch !== undefined
        ? options.deleteBranch
        : await this.promptDeleteBranch();

    if (deleteBranch) {
      await this.exec(`git branch -D ${worktree.branch}`);
    }

    // 清理元數據
    this.activeWorktrees.delete(worktreeId);
    this.deleteWorktreeMetadata(worktreeId);

    // 觸發事件
    this.emitEvent('worktree:removed', { worktree, branchDeleted: deleteBranch });

    return { success: true, branchDeleted: deleteBranch };
  }

  /**
   * Stash 管理
   */
  async stashChanges(message?: string): Promise<{ name: string; timestamp: number }> {
    const stashName = message || `WIP-${Date.now()}`;
    await this.exec(`git stash push -m "${stashName}" --include-untracked`);

    return {
      name: stashName,
      timestamp: Date.now()
    };
  }

  async listStashes(): Promise<Array<{ id: number; name: string; timestamp: string }>> {
    const output = await this.exec('git stash list');
    return this.parseStashList(output);
  }

  async applyStash(stashId: number): Promise<void> {
    await this.exec(`git stash pop stash@{${stashId}}`);
  }

  async dropStash(stashId: number): Promise<void> {
    await this.exec(`git stash drop stash@{${stashId}}`);
  }

  /**
   * 工具方法
   */
  private async exec(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.projectPath }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  private parseWorktreeList(output: string): Array<{ path: string; branch: string }> {
    const lines = output.split('\n');
    const worktrees: Array<{ path: string; branch: string }> = [];
    let current: any = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        current.path = line.substring(9);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace('refs/heads/', '');
      } else if (line === '') {
        if (current.path) {
          worktrees.push(current);
          current = {};
        }
      }
    }

    return worktrees;
  }

  private parseStashList(output: string): Array<{ id: number; name: string; timestamp: string }> {
    const lines = output.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const match = line.match(/stash@\{(\d+)\}: (.*?): (.*)/);
      return {
        id: index,
        name: match ? match[3] : line,
        timestamp: new Date().toISOString() // 簡化版本
      };
    });
  }

  private async checkUncommittedChanges(path: string = this.projectPath): Promise<boolean> {
    const status = await this.exec('git status --porcelain');
    return status.trim().length > 0;
  }

  private checkUncommitted(worktreePath: string): boolean {
    try {
      const result = execSync('git status --porcelain', {
        cwd: worktreePath,
        encoding: 'utf8'
      });
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  private async checkMergeConflicts(
    sourceBranch: string,
    targetBranch: string
  ): Promise<string[]> {
    // 簡化版本：使用 git merge --no-commit --no-ff 檢測衝突
    try {
      await this.exec(`git merge --no-commit --no-ff ${sourceBranch}`);
      await this.exec('git merge --abort'); // 取消合併
      return []; // 無衝突
    } catch (error) {
      // 有衝突
      const conflictFiles = await this.exec('git diff --name-only --diff-filter=U');
      await this.exec('git merge --abort'); // 取消合併
      return conflictFiles.split('\n').filter(f => f.trim());
    }
  }

  private calculateMergeReward(source: WorktreeMetadata): { exp: number; gold: number } {
    const baseReward = { exp: 100, gold: 50 };
    const complexityMultiplier = source.stats.commits * 0.1 + source.stats.filesChanged * 0.05;

    return {
      exp: Math.floor(baseReward.exp * (1 + complexityMultiplier)),
      gold: Math.floor(baseReward.gold * (1 + complexityMultiplier))
    };
  }

  private generateId(): string {
    return `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 元數據管理
   */
  private loadMetadata(): void {
    if (fs.existsSync(this.metadataPath)) {
      const data = fs.readFileSync(this.metadataPath, 'utf8');
      const allMetadata = JSON.parse(data);

      for (const [id, metadata] of Object.entries(allMetadata)) {
        this.activeWorktrees.set(id, metadata as WorktreeMetadata);
      }
    }
  }

  private saveWorktreeMetadata(metadata: WorktreeMetadata): void {
    const allMetadata = this.loadAllMetadata();
    allMetadata[metadata.id] = metadata;
    fs.writeFileSync(this.metadataPath, JSON.stringify(allMetadata, null, 2));
  }

  private loadWorktreeMetadataByBranch(branch: string): WorktreeMetadata | null {
    const allMetadata = this.loadAllMetadata();
    return Object.values(allMetadata).find(m => m.branch === branch) || null;
  }

  private deleteWorktreeMetadata(worktreeId: string): void {
    const allMetadata = this.loadAllMetadata();
    delete allMetadata[worktreeId];
    fs.writeFileSync(this.metadataPath, JSON.stringify(allMetadata, null, 2));
  }

  private loadAllMetadata(): Record<string, WorktreeMetadata> {
    if (fs.existsSync(this.metadataPath)) {
      const data = fs.readFileSync(this.metadataPath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  }

  private ensureWorktreesDir(): void {
    if (!fs.existsSync(this.worktreesPath)) {
      fs.mkdirSync(this.worktreesPath, { recursive: true });
    }
  }

  /**
   * 動畫和UI交互（占位符，實際由UI層實現）
   */
  private async playCreateAnimation(worldType: WorldType): Promise<void> {
    // 觸發創建動畫事件
    this.emitEvent('animation:create', worldType);
    await this.delay(2000); // 等待動畫完成
  }

  private async playTeleportAnimation(): Promise<void> {
    this.emitEvent('animation:teleport', {});
    await this.delay(1500);
  }

  private async playMergeAnimation(): Promise<void> {
    this.emitEvent('animation:merge', {});
    await this.delay(2000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 用戶交互提示（占位符，實際由UI層實現）
   */
  private async promptHandleChanges(): Promise<'commit' | 'stash' | 'discard' | 'cancel'> {
    // 實際應彈出UI讓用戶選擇
    return 'stash'; // 默認暫存
  }

  private async confirmDiscard(): Promise<boolean> {
    // 實際應彈出確認對話框
    return false;
  }

  private async promptCleanup(source: WorktreeMetadata): Promise<boolean> {
    // 實際應彈出詢問對話框
    return true; // 默認清理
  }

  private async promptDeleteBranch(): Promise<boolean> {
    // 實際應彈出詢問對話框
    return true; // 默認刪除分支
  }

  private async confirmDeleteWithChanges(): Promise<boolean> {
    // 實際應彈出警告對話框
    return false;
  }

  /**
   * 其他輔助方法（占位符）
   */
  private async quickCommit(): Promise<void> {
    // 快速提交所有變更
    await this.exec('git add .');
    await this.exec('git commit -m "WIP: Quick commit before switching"');
  }

  private async discardChanges(): Promise<void> {
    await this.exec('git reset --hard');
    await this.exec('git clean -fd');
  }

  private async notifyEditor(path: string): Promise<void> {
    // 通知編輯器重新載入工作目錄
    this.emitEvent('editor:reload', { path });
  }

  private async autoResolveConflicts(conflicts: string[]): Promise<void> {
    // AI 自動解決衝突（簡化版本）
    console.log('Auto-resolving conflicts:', conflicts);
  }

  private async createPullRequest(source: WorktreeMetadata, targetBranch: string): Promise<void> {
    // 創建 Pull Request
    console.log('Creating PR:', source.branch, '→', targetBranch);
  }

  private createBasicMetadata(wt: { path: string; branch: string }): WorktreeMetadata {
    // 為外部創建的 worktree 創建基本元數據
    return {
      id: this.generateId(),
      name: path.basename(wt.path),
      type: 'feature', // 默認類型
      path: wt.path,
      branch: wt.branch,
      baseBranch: 'main',
      description: '',
      tags: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      lastCommit: null,
      stats: { commits: 0, filesChanged: 0, linesAdded: 0, linesDeleted: 0, workingHours: 0 },
      progress: { status: 'in_progress', completion: 0, milestones: [] },
      activities: [],
      flags: { hasUncommitted: false, hasConflicts: false, needsReview: false, isStale: false },
      metadata: { assignedTo: '', reviewers: [], linkedIssue: null, estimatedTime: 0, actualTime: 0 }
    };
  }

  /**
   * 獲取全局狀態（占位符，實際由全局狀態管理提供）
   */
  private getUser(): { id: string; mp: number; exp: number; gold: number } {
    // 從全局狀態獲取用戶信息
    return { id: 'user_001', mp: 100, exp: 0, gold: 0 };
  }

  private updateUser(user: { id: string; mp: number; exp: number; gold: number }): void {
    // 更新全局用戶狀態
    console.log('User updated:', user);
  }

  private getGameState(): { inBattle: boolean } {
    // 從全局狀態獲取遊戲狀態
    return { inBattle: false };
  }

  /**
   * 事件系統
   */
  private emitEvent(eventName: string, data: any): void {
    // 觸發事件（實際應使用 EventEmitter 或全局事件總線）
    console.log(`[Event] ${eventName}:`, data);
  }
}

export default WorktreeManager;
```

## 輔助服務類

### GitWorktreeService

```typescript
class GitWorktreeService {
  /**
   * 創建 worktree
   */
  static async create(
    basePath: string,
    worktreePath: string,
    branchName: string,
    baseBranch: string
  ): Promise<void> {
    const command = `git worktree add "${worktreePath}" -b ${branchName} ${baseBranch}`;
    await this.exec(command, basePath);
  }

  /**
   * 刪除 worktree
   */
  static async remove(basePath: string, worktreePath: string, force: boolean = false): Promise<void> {
    const command = `git worktree remove "${worktreePath}" ${force ? '--force' : ''}`;
    await this.exec(command, basePath);
  }

  /**
   * 列出所有 worktree
   */
  static async list(basePath: string): Promise<Array<{ path: string; branch: string; head: string }>> {
    const output = await this.exec('git worktree list --porcelain', basePath);
    return this.parseWorktreeList(output);
  }

  /**
   * 修復 worktree（清理損壞的 worktree）
   */
  static async prune(basePath: string): Promise<void> {
    await this.exec('git worktree prune', basePath);
  }

  private static async exec(command: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  private static parseWorktreeList(output: string): Array<{ path: string; branch: string; head: string }> {
    const lines = output.split('\n');
    const worktrees: Array<{ path: string; branch: string; head: string }> = [];
    let current: any = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        current.path = line.substring(9);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace('refs/heads/', '');
      } else if (line.startsWith('HEAD ')) {
        current.head = line.substring(5);
      } else if (line === '') {
        if (current.path) {
          worktrees.push(current);
          current = {};
        }
      }
    }

    return worktrees;
  }
}
```

## RPG 元素整合

### 成就系統

```typescript
const worktreeAchievements = [
  {
    id: 'first_worktree',
    name: '🌍 時空探索者',
    description: '創建第一個平行時間線',
    condition: (stats) => stats.totalWorktreesCreated >= 1,
    reward: { exp: 50, gold: 20 }
  },
  {
    id: 'multi_worktree',
    name: '⚡ 多重任務大師',
    description: '同時維護3個以上的時間線',
    condition: (stats) => stats.activeWorktrees >= 3,
    reward: { exp: 100, gold: 50, skill: 'parallel_thinking' }
  },
  {
    id: 'first_merge',
    name: '🔀 時空融合',
    description: '成功合併第一個時間線',
    condition: (stats) => stats.totalMerges >= 1,
    reward: { exp: 80, gold: 30 }
  },
  {
    id: 'conflict_resolver',
    name: '🛡️ 衝突調停者',
    description: '解決10次合併衝突',
    condition: (stats) => stats.conflictsResolved >= 10,
    reward: { exp: 200, gold: 100, title: '調停大師' }
  },
  {
    id: 'clean_master',
    name: '🧹 整潔大師',
    description: '清理20個已完成的時間線',
    condition: (stats) => stats.worktreesCleaned >= 20,
    reward: { exp: 150, gold: 75 }
  },
  {
    id: 'time_traveler',
    name: '⏰ 時空旅行者',
    description: '在不同時間線間切換100次',
    condition: (stats) => stats.totalSwitches >= 100,
    reward: { exp: 300, gold: 150 }
  },
  {
    id: 'parallel_master',
    name: '🌀 平行世界大師',
    description: '同時維護10個時間線',
    condition: (stats) => stats.activeWorktrees >= 10,
    reward: { exp: 500, gold: 250, title: '時空領主' }
  }
];
```

### 被動技能

```typescript
const worktreePassiveSkills = {
  quick_switch: {
    id: 'quick_switch',
    name: '快速切換',
    description: '時間線切換速度提升50%',
    effect: { switchSpeedMultiplier: 1.5 },
    unlockLevel: 10
  },

  auto_stash: {
    id: 'auto_stash',
    name: '自動暫存',
    description: '切換時自動處理未提交變更',
    effect: { autoStashEnabled: true },
    unlockLevel: 15
  },

  merge_master: {
    id: 'merge_master',
    name: '合併大師',
    description: 'AI 輔助解決衝突，成功率+30%',
    effect: { conflictResolutionBonus: 0.3 },
    unlockLevel: 20
  },

  parallel_mind: {
    id: 'parallel_mind',
    name: '平行思維',
    description: '可同時維護的時間線數量 +2',
    effect: { maxWorktreesBonus: 2 },
    unlockLevel: 25
  },

  time_optimizer: {
    id: 'time_optimizer',
    name: '時空優化',
    description: '自動清理過期時間線，磁碟使用 -30%',
    effect: { autoCleanupEnabled: true, diskUsageReduction: 0.3 },
    unlockLevel: 30
  }
};
```

## 測試策略

### 單元測試

```typescript
describe('WorktreeManager', () => {
  let manager: WorktreeManager;

  beforeEach(() => {
    manager = new WorktreeManager('/path/to/project');
  });

  describe('createWorktree', () => {
    it('should create a new worktree with correct structure', async () => {
      const worktree = await manager.createWorktree({
        name: 'test-feature',
        type: 'feature',
        baseBranch: 'main'
      });

      expect(worktree).toHaveProperty('id');
      expect(worktree.name).toBe('test-feature');
      expect(worktree.type).toBe('feature');
      expect(worktree.branch).toBe('feature/test-feature');
    });

    it('should fail if MP is insufficient', async () => {
      // Mock user with 0 MP
      await expect(
        manager.createWorktree({
          name: 'test',
          type: 'feature',
          baseBranch: 'main'
        })
      ).rejects.toThrow('MP 不足');
    });

    it('should respect cooldown for hotfix worlds', async () => {
      await manager.createWorktree({
        name: 'hotfix1',
        type: 'hotfix',
        baseBranch: 'main'
      });

      await expect(
        manager.createWorktree({
          name: 'hotfix2',
          type: 'hotfix',
          baseBranch: 'main'
        })
      ).rejects.toThrow('冷卻中');
    });
  });

  describe('switchToWorktree', () => {
    it('should switch working directory', async () => {
      const worktree = await manager.createWorktree({
        name: 'test',
        type: 'feature',
        baseBranch: 'main'
      });

      await manager.switchToWorktree(worktree.id);

      expect(process.cwd()).toBe(worktree.path);
    });

    it('should fail if in battle', async () => {
      // Mock game state in battle
      await expect(
        manager.switchToWorktree('some-id')
      ).rejects.toThrow('戰鬥中無法切換');
    });
  });

  describe('mergeWorktree', () => {
    it('should merge successfully without conflicts', async () => {
      const worktree = await manager.createWorktree({
        name: 'test',
        type: 'feature',
        baseBranch: 'main'
      });

      const result = await manager.mergeWorktree(worktree.id, 'main');

      expect(result.success).toBe(true);
      expect(result.reward).toBeDefined();
    });

    it('should detect conflicts', async () => {
      const worktree = await manager.createWorktree({
        name: 'test',
        type: 'feature',
        baseBranch: 'main'
      });

      // Mock conflicts
      const result = await manager.mergeWorktree(worktree.id, 'main', {
        strategy: 'manual'
      });

      expect(result.needsManualResolve).toBe(true);
      expect(result.conflicts).toBeGreaterThan(0);
    });
  });
});
```

## 性能優化

### 1. 元數據緩存

```typescript
class MetadataCache {
  private cache: Map<string, WorktreeMetadata> = new Map();
  private ttl: number = 60000; // 1分鐘

  get(id: string): WorktreeMetadata | null {
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.lastActivity < this.ttl) {
      return cached;
    }
    return null;
  }

  set(id: string, metadata: WorktreeMetadata): void {
    this.cache.set(id, metadata);
  }

  invalidate(id: string): void {
    this.cache.delete(id);
  }
}
```

### 2. 批量操作

```typescript
class BatchWorktreeOperations {
  async createMultiple(worktrees: Array<{ name: string; type: string; baseBranch: string }>): Promise<WorktreeMetadata[]> {
    // 並行創建多個 worktree
    return await Promise.all(
      worktrees.map(wt => this.manager.createWorktree(wt))
    );
  }

  async removeMultiple(ids: string[]): Promise<void> {
    // 並行刪除多個 worktree
    await Promise.all(
      ids.map(id => this.manager.removeWorktree(id))
    );
  }
}
```

## 錯誤處理

```typescript
class WorktreeError extends Error {
  constructor(
    public code: string,
    message: string,
    public worktreeId?: string
  ) {
    super(message);
  }
}

const ErrorCodes = {
  MP_INSUFFICIENT: 'MP_INSUFFICIENT',
  COOLDOWN_ACTIVE: 'COOLDOWN_ACTIVE',
  WORKTREE_EXISTS: 'WORKTREE_EXISTS',
  WORKTREE_NOT_FOUND: 'WORKTREE_NOT_FOUND',
  IN_BATTLE: 'IN_BATTLE',
  HAS_UNCOMMITTED: 'HAS_UNCOMMITTED',
  MERGE_CONFLICT: 'MERGE_CONFLICT',
  GIT_ERROR: 'GIT_ERROR'
};
```

## 部署和維護

### 配置文件

```json
// worktree-config.json
{
  "worktreesPath": "../worktrees",
  "maxConcurrent": 10,
  "autoCleanup": {
    "enabled": true,
    "daysBeforeExpire": 7,
    "ignoreTypes": ["hotfix"]
  },
  "mpCosts": {
    "create": {
      "feature": 10,
      "fix": 15,
      "experiment": 5,
      "hotfix": 20
    },
    "switch": 5,
    "merge": 20
  },
  "cooldowns": {
    "hotfix": 300
  }
}
```

### 日誌系統

```typescript
class WorktreeLogger {
  log(level: 'info' | 'warn' | 'error', message: string, metadata?: any): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata
    };
    console.log(JSON.stringify(entry));
  }
}
```
