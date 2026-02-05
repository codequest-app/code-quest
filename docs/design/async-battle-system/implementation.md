# Async Battle System - Implementation

## 系統架構

### 整體架構圖

```
┌──────────────────────────────────────────────────────────────┐
│                        User Input                             │
└───────────────────────────┬──────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│                      SmartRouter                               │
│  • analyzePrompt()      - 分析提示詞複雜度                      │
│  • determineType()      - 判斷任務類型                         │
│  • determineRoute()     - 決定執行路徑                         │
└───────────────────────────┬───────────────────────────────────┘
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
┌──────────────────────┐      ┌──────────────────────┐
│    Dialog Track      │      │    MainCLI           │
│  • 即時響應           │      │  • 主線程管理         │
│  • 簡單對話           │      │  • 同步/異步調度      │
└──────────────────────┘      └──────────┬───────────┘
                                         ↓
                              ┌──────────┴───────────┐
                              ↓                      ↓
                    ┌──────────────────┐  ┌──────────────────┐
                    │   Main Sync      │  │  Battle Async    │
                    │  • 同步執行       │  │  • 異步執行       │
                    │  • 顯示進度       │  │  • 多實例管理     │
                    └──────────────────┘  └─────────┬────────┘
                                                    ↓
                                          ┌─────────────────────┐
                                          │ BattleInstancePool  │
                                          │  • 實例池管理        │
                                          │  • 並發控制 (max 3) │
                                          │  • 排隊機制          │
                                          └─────────────────────┘
```

### 數據流

```
用戶輸入
  ↓
SmartRouter 分析
  ↓
路由決策
  ↓
┌─────────────────────┬─────────────────────┐
│ Dialog (complexity<3)│ MainCLI (≥3)       │
└─────────────────────┴─────────┬───────────┘
                                ↓
                    ┌───────────┴───────────┐
                    │ Sync (<8)  │ Async (≥8)│
                    └───────────┬────────────┘
                                ↓
                    ┌───────────────────────┐
                    │  BattleInstancePool   │
                    │  • 創建實例            │
                    │  • 執行 Claude CLI    │
                    │  • 監控進度            │
                    │  • WebSocket 推送     │
                    └───────────────────────┘
                                ↓
                    ┌───────────────────────┐
                    │  UI Update (Real-time)│
                    └───────────────────────┘
```

## 核心類實現

### 1. SmartRouter

**職責**：分析用戶輸入，決定執行路徑

```typescript
interface AnalysisResult {
  type: 'question' | 'task' | 'command';
  complexity: number;          // 0-15
  level: 'trivial' | 'simple' | 'normal' | 'complex' | 'hard' | 'boss';
  route: 'dialog' | 'main_sync' | 'battle_async';
  factors: {
    length: number;            // 0-3
    keywords: number;          // 0-6
    fileCount: number;         // 0-3
    toolComplexity: number;    // 0-3
    dependencies: number;      // 0-2
  };
  estimatedTime: number;       // 秒
}

class SmartRouter {
  private keywords = {
    heavy: ['重構', '遷移', '升級', '整個', '所有', '完整', '系統', '架構'],
    medium: ['創建', '實作', '開發', '優化', '設計', '集成', '添加', '實現'],
    light: ['修復', '更新', '檢查', '查看', '顯示', '刪除', '改名']
  };

  private filePatterns = {
    multiple: /多個|所有|整個|全部/,
    specific: /\.(ts|js|tsx|jsx|css|html|json|md)/g
  };

  private toolPatterns = {
    complex: /重構|遷移|測試|部署|發布/,
    medium: /創建|編輯|優化|設計/,
    simple: /查看|讀取|檢查|顯示/
  };

  /**
   * 分析用戶輸入，返回路由決策
   */
  analyzePrompt(prompt: string): AnalysisResult {
    const factors = {
      length: this.analyzeLengthFactor(prompt),
      keywords: this.analyzeKeywords(prompt),
      fileCount: this.analyzeFileCount(prompt),
      toolComplexity: this.analyzeToolComplexity(prompt),
      dependencies: this.analyzeDependencies(prompt)
    };

    const complexity =
      factors.length +
      factors.keywords +
      factors.fileCount +
      factors.toolComplexity +
      factors.dependencies;

    return {
      type: this.determineType(prompt),
      complexity,
      level: this.determineLevel(complexity),
      route: this.determineRoute(complexity),
      factors,
      estimatedTime: this.estimateTime(complexity)
    };
  }

  /**
   * 1. 長度因素分析 (0-3 分)
   */
  private analyzeLengthFactor(prompt: string): number {
    const length = prompt.length;
    if (length > 200) return 3;
    if (length > 100) return 2;
    return 1;
  }

  /**
   * 2. 關鍵字分析 (0-6 分)
   */
  private analyzeKeywords(prompt: string): number {
    let score = 0;

    // 重量級關鍵字 ×3
    for (const keyword of this.keywords.heavy) {
      if (prompt.includes(keyword)) {
        score += 3;
      }
    }

    // 中量級關鍵字 ×2
    for (const keyword of this.keywords.medium) {
      if (prompt.includes(keyword)) {
        score += 2;
      }
    }

    // 輕量級關鍵字 ×1
    for (const keyword of this.keywords.light) {
      if (prompt.includes(keyword)) {
        score += 1;
      }
    }

    // 最多 6 分
    return Math.min(score, 6);
  }

  /**
   * 3. 文件數量分析 (0-3 分)
   */
  private analyzeFileCount(prompt: string): number {
    // 檢查是否明確提到多個文件
    if (this.filePatterns.multiple.test(prompt)) {
      return 3;
    }

    // 計算提到的具體文件數
    const fileMatches = prompt.match(this.filePatterns.specific);
    if (fileMatches) {
      const fileCount = fileMatches.length;
      if (fileCount >= 3) return 3;
      if (fileCount === 2) return 2;
      if (fileCount === 1) return 1;
    }

    // 沒有提到文件
    return 0;
  }

  /**
   * 4. 工具複雜度分析 (0-3 分)
   */
  private analyzeToolComplexity(prompt: string): number {
    if (this.toolPatterns.complex.test(prompt)) {
      return 3;
    }
    if (this.toolPatterns.medium.test(prompt)) {
      return 2;
    }
    if (this.toolPatterns.simple.test(prompt)) {
      return 1;
    }
    return 0;
  }

  /**
   * 5. 依賴關係分析 (0-2 分)
   */
  private analyzeDependencies(prompt: string): number {
    const dependencyKeywords = ['集成', '整合', '依賴', '連接', '配合'];
    for (const keyword of dependencyKeywords) {
      if (prompt.includes(keyword)) {
        return 2;
      }
    }
    return 0;
  }

  /**
   * 判斷任務類型
   */
  private determineType(prompt: string): 'question' | 'task' | 'command' {
    // 問題型：以問號結尾或包含疑問詞
    if (prompt.endsWith('?') || prompt.includes('什麼') || prompt.includes('如何')) {
      return 'question';
    }

    // 命令型：以斜杠開頭
    if (prompt.startsWith('/')) {
      return 'command';
    }

    // 任務型：其他
    return 'task';
  }

  /**
   * 根據複雜度確定等級
   */
  private determineLevel(complexity: number): AnalysisResult['level'] {
    if (complexity < 3) return 'trivial';
    if (complexity < 5) return 'simple';
    if (complexity < 8) return 'normal';
    if (complexity < 11) return 'complex';
    if (complexity < 14) return 'hard';
    return 'boss';
  }

  /**
   * 根據複雜度決定路由
   */
  private determineRoute(complexity: number): AnalysisResult['route'] {
    if (complexity < 3) return 'dialog';
    if (complexity < 8) return 'main_sync';
    return 'battle_async';
  }

  /**
   * 估算執行時間（秒）
   */
  private estimateTime(complexity: number): number {
    // 基礎時間 + 複雜度 × 因子
    const baseTime = 5;
    const factor = 20; // 每分複雜度約 20 秒
    return baseTime + (complexity * factor);
  }

  /**
   * 格式化分析結果為可讀字符串
   */
  formatAnalysis(result: AnalysisResult): string {
    return `
分析結果:
  類型: ${result.type}
  複雜度: ${result.complexity}/15 (${result.level})
  執行路徑: ${result.route}
  預計時間: ${Math.ceil(result.estimatedTime / 60)} 分鐘

因素分解:
  • 長度: ${result.factors.length}/3
  • 關鍵字: ${result.factors.keywords}/6
  • 文件數: ${result.factors.fileCount}/3
  • 工具複雜度: ${result.factors.toolComplexity}/3
  • 依賴關係: ${result.factors.dependencies}/2
    `.trim();
  }
}
```

### 使用示例

```typescript
const router = new SmartRouter();

// 示例 1: 簡單問題
const result1 = router.analyzePrompt("現在是什麼模式？");
console.log(router.formatAnalysis(result1));
// 輸出:
// 複雜度: 1/15 (trivial)
// 執行路徑: dialog

// 示例 2: 中等任務
const result2 = router.analyzePrompt("修復 login.ts 的類型錯誤");
console.log(router.formatAnalysis(result2));
// 輸出:
// 複雜度: 5/15 (normal)
// 執行路徑: main_sync

// 示例 3: 複雜任務
const result3 = router.analyzePrompt("重構整個認證系統，添加 OAuth 支持，更新所有相關文件");
console.log(router.formatAnalysis(result3));
// 輸出:
// 複雜度: 12/15 (hard)
// 執行路徑: battle_async
```

---

## 2. MainCLI

**職責**：主線程管理，協調同步和異步執行

```typescript
interface CLIState {
  mode: 'idle' | 'processing' | 'waiting';
  currentTask: string | null;
  isBlocked: boolean;
}

class MainCLI {
  private state: CLIState = {
    mode: 'idle',
    currentTask: null,
    isBlocked: false
  };

  private router: SmartRouter;
  private battlePool: BattleInstancePool;
  private ui: UIManager;

  constructor() {
    this.router = new SmartRouter();
    this.battlePool = new BattleInstancePool();
    this.ui = new UIManager();
  }

  /**
   * 處理用戶輸入（主入口）
   */
  async handleInput(prompt: string): Promise<void> {
    // 1. 分析輸入
    const analysis = this.router.analyzePrompt(prompt);

    console.log(`[Router] ${analysis.route} (complexity: ${analysis.complexity})`);

    // 2. 根據路由執行
    switch (analysis.route) {
      case 'dialog':
        await this.handleDialog(prompt);
        break;

      case 'main_sync':
        await this.handleMainSync(prompt, analysis);
        break;

      case 'battle_async':
        await this.handleBattleAsync(prompt, analysis);
        break;
    }
  }

  /**
   * 路徑 1: Dialog Track - 即時響應
   */
  private async handleDialog(prompt: string): Promise<void> {
    // 不阻塞，立即響應
    this.state.mode = 'processing';

    try {
      const response = await this.getQuickResponse(prompt);
      this.ui.displayMessage(response);
    } catch (error) {
      this.ui.displayError('無法處理對話', error);
    } finally {
      this.state.mode = 'idle';
    }
  }

  /**
   * 路徑 2: Main Sync - 同步戰鬥
   */
  private async handleMainSync(
    prompt: string,
    analysis: AnalysisResult
  ): Promise<void> {
    // 阻塞主線程，但顯示進度
    this.state.mode = 'processing';
    this.state.isBlocked = true;
    this.state.currentTask = prompt;

    try {
      // 創建戰鬥
      const battle = this.createBattle(prompt, analysis);

      // 在主對話區顯示戰鬥開始
      this.ui.displayBattleStart(battle);

      // 同步執行 Claude CLI
      const result = await this.executeClaudeSync(prompt, (progress) => {
        // 實時更新進度
        this.ui.updateBattleProgress(battle.id, progress);
      });

      // 顯示戰鬥結果
      this.ui.displayBattleResult(battle.id, result);

    } catch (error) {
      this.ui.displayBattleFailure(error);
    } finally {
      this.state.mode = 'idle';
      this.state.isBlocked = false;
      this.state.currentTask = null;
    }
  }

  /**
   * 路徑 3: Battle Async - 異步戰鬥
   */
  private async handleBattleAsync(
    prompt: string,
    analysis: AnalysisResult
  ): Promise<void> {
    // 不阻塞，立即返回
    this.state.mode = 'processing';

    try {
      // 提交到戰鬥實例池
      const battleId = await this.battlePool.startBattle(prompt, analysis);

      // 在主對話區顯示啟動通知
      this.ui.displayBattleCreated(battleId, prompt);

      // 立即返回，不等待完成
      console.log(`[MainCLI] Battle ${battleId} started in background`);

    } catch (error) {
      if (error.code === 'POOL_FULL') {
        this.ui.displayQueueNotification(prompt);
      } else {
        this.ui.displayError('無法啟動戰鬥', error);
      }
    } finally {
      this.state.mode = 'idle';
    }
  }

  /**
   * 創建戰鬥對象
   */
  private createBattle(prompt: string, analysis: AnalysisResult) {
    return {
      id: this.generateBattleId(),
      prompt,
      analysis,
      enemy: this.generateEnemy(analysis),
      status: 'preparing',
      progress: 0,
      startTime: Date.now()
    };
  }

  /**
   * 生成戰鬥 ID
   */
  private generateBattleId(): string {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 根據複雜度生成敵人
   */
  private generateEnemy(analysis: AnalysisResult) {
    const enemyTypes = {
      trivial: { name: '小蟲子', hp: 10 },
      simple: { name: 'Bug怪物', hp: 50 },
      normal: { name: '錯誤魔獸', hp: 100 },
      complex: { name: '系統惡魔', hp: 200 },
      hard: { name: '架構魔王', hp: 500 },
      boss: { name: '魔王級 Bug', hp: 1000 }
    };

    const enemy = enemyTypes[analysis.level];
    return {
      ...enemy,
      maxHP: enemy.hp,
      level: analysis.complexity
    };
  }

  /**
   * 同步執行 Claude CLI
   */
  private async executeClaudeSync(
    prompt: string,
    onProgress: (progress: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const claude = spawn('claude', ['code'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 發送提示
      claude.stdin.write(prompt + '\n');
      claude.stdin.end();

      let output = '';
      let progress = 0;

      // 監聽輸出
      claude.stdout.on('data', (data: Buffer) => {
        output += data.toString();

        // 簡單的進度估算（實際應解析 Claude 輸出）
        progress = Math.min(progress + 0.1, 0.95);
        onProgress(progress);
      });

      // 完成
      claude.on('close', (code: number) => {
        if (code === 0) {
          onProgress(1.0);
          resolve({ output, success: true });
        } else {
          reject(new Error(`Claude exited with code ${code}`));
        }
      });

      // 錯誤
      claude.on('error', (error: Error) => {
        reject(error);
      });
    });
  }

  /**
   * 快速響應（Dialog Track）
   */
  private async getQuickResponse(prompt: string): Promise<string> {
    // 簡單的規則匹配或調用輕量級 API
    if (prompt.includes('模式')) {
      return '當前在探索模式';
    }
    if (prompt.includes('戰鬥')) {
      const battles = this.battlePool.getActiveBattles();
      return `進行中的戰鬥：${battles.length} 個`;
    }

    // 其他問題調用快速 API
    return '我不確定，請詳細描述';
  }

  /**
   * 檢查主線程狀態
   */
  isBlocked(): boolean {
    return this.state.isBlocked;
  }

  /**
   * 獲取當前任務
   */
  getCurrentTask(): string | null {
    return this.state.currentTask;
  }
}
```

---

## 3. BattleInstancePool

**職責**：管理多個並發戰鬥實例

```typescript
interface BattleInstance {
  id: string;
  prompt: string;
  analysis: AnalysisResult;
  enemy: {
    name: string;
    hp: number;
    maxHP: number;
    level: number;
  };
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  process?: any; // Child process
  worktreePath?: string; // Git worktree 路徑
  branchName?: string;   // Git 分支名稱
  toolsUsed: number;
  goldSpent: number;
  actions: Array<{
    timestamp: number;
    tool: string;
    file?: string;
    damage: number;
  }>;
}

class BattleInstancePool {
  private instances: Map<string, BattleInstance> = new Map();
  private queue: Array<{ prompt: string; analysis: AnalysisResult }> = [];
  private maxConcurrent = 3;
  private ws: WebSocketManager;

  constructor() {
    this.ws = new WebSocketManager();
  }

  /**
   * 啟動新戰鬥
   */
  async startBattle(
    prompt: string,
    analysis: AnalysisResult
  ): Promise<string> {
    // 檢查是否達到最大並發數
    const runningCount = this.getRunningCount();

    if (runningCount >= this.maxConcurrent) {
      // 加入隊列
      this.queue.push({ prompt, analysis });
      const position = this.queue.length;

      // 通知 UI
      this.ws.broadcast('queue:added', {
        prompt,
        position,
        estimatedWait: this.estimateQueueWait()
      });

      throw { code: 'POOL_FULL', message: '已達到最大並發數，已加入隊列' };
    }

    // 創建戰鬥實例
    const battleId = this.generateBattleId();
    const battle: BattleInstance = {
      id: battleId,
      prompt,
      analysis,
      enemy: this.generateEnemy(analysis),
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      toolsUsed: 0,
      goldSpent: 0,
      actions: []
    };

    this.instances.set(battleId, battle);

    // 通知 UI 創建
    this.ws.broadcast('battle:created', {
      battleId,
      prompt,
      enemy: battle.enemy
    });

    // 執行戰鬥
    this.executeBattle(battle);

    return battleId;
  }

  /**
   * 執行戰鬥（異步）
   */
  private async executeBattle(battle: BattleInstance): Promise<void> {
    try {
      // 🔥 步驟 1: 創建獨立 worktree
      const { worktreePath, branchName } = await this.createWorktree(battle.id);
      battle.worktreePath = worktreePath;
      battle.branchName = branchName;

      console.log(`[Battle ${battle.id}] Worktree created: ${worktreePath}`);

      // 廣播 worktree 創建事件
      this.ws.broadcast('battle:worktree_created', {
        battleId: battle.id,
        worktreePath,
        branchName
      });

      // 更新狀態為運行中
      battle.status = 'running';
      this.ws.broadcast('battle:started', { battleId: battle.id });

      // 🔥 步驟 2: 在 worktree 目錄中啟動 Claude CLI 進程
      const { spawn } = require('child_process');
      const claude = spawn('claude', ['code'], {
        cwd: worktreePath,  // ← 關鍵：在獨立目錄執行
        stdio: ['pipe', 'pipe', 'pipe']
      });

      battle.process = claude;

      // 發送提示
      claude.stdin.write(battle.prompt + '\n');
      claude.stdin.end();

      // 監聽輸出
      claude.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        this.parseClaudeOutput(battle, output);
      });

      // 監聽錯誤
      claude.stderr.on('data', (data: Buffer) => {
        console.error(`[Battle ${battle.id}] Error:`, data.toString());
      });

      // 完成
      claude.on('close', async (code: number) => {
        if (code === 0) {
          // 🔥 步驟 3: 戰鬥成功，合併 worktree
          await this.mergeWorktree(battle);
          this.completeBattle(battle);
        } else {
          // 失敗不合併，保留 worktree 供檢查
          this.failBattle(battle, `Claude exited with code ${code}`);
        }

        // 🔥 步驟 4: 清理 worktree（延遲清理）
        setTimeout(async () => {
          await this.cleanupWorktree(battle);
        }, 5000);
      });

    } catch (error) {
      this.failBattle(battle, error.message);
      // 清理失敗的 worktree
      if (battle.worktreePath) {
        await this.cleanupWorktree(battle);
      }
    }
  }

  /**
   * 解析 Claude 輸出，更新戰鬥進度
   */
  private parseClaudeOutput(battle: BattleInstance, output: string): void {
    // 簡化版本：檢測工具使用
    const toolPatterns = [
      { pattern: /Read\(/g, tool: 'Read', damage: 10 },
      { pattern: /Write\(/g, tool: 'Write', damage: 20 },
      { pattern: /Edit\(/g, tool: 'Edit', damage: 25 },
      { pattern: /Bash\(/g, tool: 'Bash', damage: 15 },
      { pattern: /Grep\(/g, tool: 'Grep', damage: 12 }
    ];

    for (const { pattern, tool, damage } of toolPatterns) {
      const matches = output.match(pattern);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          // 記錄動作
          const action = {
            timestamp: Date.now(),
            tool,
            damage
          };
          battle.actions.push(action);
          battle.toolsUsed++;

          // 計算進度
          const damageDealt = battle.toolsUsed * (damage / 10);
          battle.progress = Math.min(damageDealt / battle.enemy.maxHP, 1.0);
          battle.enemy.hp = Math.max(
            battle.enemy.maxHP - damageDealt,
            0
          );

          // 廣播工具使用事件
          this.ws.broadcast('battle:tool_used', {
            battleId: battle.id,
            tool,
            damage,
            progress: battle.progress,
            enemyHP: battle.enemy.hp
          });

          // 廣播進度更新
          this.ws.broadcast('battle:progress', {
            battleId: battle.id,
            progress: battle.progress,
            enemyHP: battle.enemy.hp,
            enemyMaxHP: battle.enemy.maxHP,
            timeElapsed: Date.now() - battle.startTime
          });
        }
      }
    }
  }

  /**
   * 完成戰鬥
   */
  private completeBattle(battle: BattleInstance): void {
    battle.status = 'completed';
    battle.endTime = Date.now();
    battle.progress = 1.0;
    battle.enemy.hp = 0;

    const duration = battle.endTime - battle.startTime;
    const goldEarned = Math.floor(battle.analysis.complexity * 10);
    const expEarned = Math.floor(battle.analysis.complexity * 50);

    // 廣播完成事件
    this.ws.broadcast('battle:completed', {
      battleId: battle.id,
      duration,
      goldEarned,
      expEarned
    });

    // 清理並檢查隊列
    setTimeout(() => {
      this.instances.delete(battle.id);
      this.processQueue();
    }, 5000); // 5 秒後清理
  }

  /**
   * 戰鬥失敗
   */
  private failBattle(battle: BattleInstance, reason: string): void {
    battle.status = 'failed';
    battle.endTime = Date.now();

    // 廣播失敗事件
    this.ws.broadcast('battle:failed', {
      battleId: battle.id,
      reason
    });

    // 清理並檢查隊列
    setTimeout(() => {
      this.instances.delete(battle.id);
      this.processQueue();
    }, 5000);
  }

  /**
   * 處理隊列
   */
  private processQueue(): void {
    const runningCount = this.getRunningCount();

    if (runningCount < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        console.log('[Pool] Processing queued battle');
        this.startBattle(next.prompt, next.analysis).catch(console.error);
      }
    }
  }

  /**
   * 暫停戰鬥
   */
  pauseBattle(battleId: string): void {
    const battle = this.instances.get(battleId);
    if (battle && battle.status === 'running') {
      battle.status = 'paused';
      if (battle.process) {
        battle.process.kill('SIGSTOP'); // 暫停進程
      }
      this.ws.broadcast('battle:paused', { battleId });
    }
  }

  /**
   * 恢復戰鬥
   */
  resumeBattle(battleId: string): void {
    const battle = this.instances.get(battleId);
    if (battle && battle.status === 'paused') {
      battle.status = 'running';
      if (battle.process) {
        battle.process.kill('SIGCONT'); // 恢復進程
      }
      this.ws.broadcast('battle:resumed', { battleId });
    }
  }

  /**
   * 取消戰鬥
   */
  cancelBattle(battleId: string): void {
    const battle = this.instances.get(battleId);
    if (battle) {
      if (battle.process) {
        battle.process.kill('SIGTERM');
      }
      this.failBattle(battle, '用戶取消');
    }
  }

  /**
   * 獲取運行中的戰鬥數量
   */
  private getRunningCount(): number {
    let count = 0;
    for (const battle of this.instances.values()) {
      if (battle.status === 'running' || battle.status === 'pending') {
        count++;
      }
    }
    return count;
  }

  /**
   * 獲取所有活躍戰鬥
   */
  getActiveBattles(): BattleInstance[] {
    return Array.from(this.instances.values()).filter(
      b => b.status === 'running' || b.status === 'pending'
    );
  }

  /**
   * 獲取戰鬥詳情
   */
  getBattle(battleId: string): BattleInstance | undefined {
    return this.instances.get(battleId);
  }

  /**
   * 估算隊列等待時間
   */
  private estimateQueueWait(): number {
    // 簡化：假設每個戰鬥平均 10 分鐘
    const avgBattleTime = 10 * 60 * 1000;
    return Math.ceil(this.queue.length * (avgBattleTime / this.maxConcurrent));
  }

  /**
   * 生成戰鬥 ID
   */
  private generateBattleId(): string {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成敵人
   */
  private generateEnemy(analysis: AnalysisResult) {
    const enemyTypes = {
      trivial: { name: '小蟲子', hp: 10 },
      simple: { name: 'Bug怪物', hp: 50 },
      normal: { name: '錯誤魔獸', hp: 100 },
      complex: { name: '系統惡魔', hp: 200 },
      hard: { name: '架構魔王', hp: 500 },
      boss: { name: '魔王級 Bug', hp: 1000 }
    };

    const enemy = enemyTypes[analysis.level];
    return {
      ...enemy,
      maxHP: enemy.hp,
      level: analysis.complexity
    };
  }

  /**
   * 創建 Git Worktree（每個戰鬥獨立目錄）
   */
  private async createWorktree(battleId: string): Promise<{
    worktreePath: string;
    branchName: string;
  }> {
    const { execSync } = require('child_process');
    const path = require('path');

    // 生成分支名和路徑
    const branchName = `battle/${battleId}`;
    const worktreePath = path.join(process.cwd(), 'worktrees', battleId);

    try {
      // 創建 worktree 和分支
      // git worktree add worktrees/battle_123 -b battle/battle_123
      execSync(`git worktree add "${worktreePath}" -b ${branchName}`, {
        stdio: 'pipe'
      });

      console.log(`[Worktree] Created: ${worktreePath} (${branchName})`);

      return { worktreePath, branchName };
    } catch (error) {
      console.error('[Worktree] Creation failed:', error.message);
      throw new Error(`Failed to create worktree: ${error.message}`);
    }
  }

  /**
   * 合併 Worktree 到主分支
   */
  private async mergeWorktree(battle: BattleInstance): Promise<void> {
    if (!battle.branchName) {
      console.warn('[Worktree] No branch to merge');
      return;
    }

    const { execSync } = require('child_process');

    try {
      // 切換到主分支
      execSync('git checkout main', { stdio: 'pipe' });

      // 合併戰鬥分支
      execSync(`git merge ${battle.branchName} --no-ff -m "Merge battle ${battle.id}: ${battle.prompt}"`, {
        stdio: 'pipe'
      });

      console.log(`[Worktree] Merged: ${battle.branchName} → main`);

      // 廣播合併事件
      this.ws.broadcast('battle:merged', {
        battleId: battle.id,
        branchName: battle.branchName
      });
    } catch (error) {
      console.error('[Worktree] Merge failed:', error.message);
      // 合併失敗不影響戰鬥完成狀態，但記錄錯誤
      this.ws.broadcast('battle:merge_failed', {
        battleId: battle.id,
        error: error.message
      });
    }
  }

  /**
   * 清理 Worktree（刪除目錄和分支）
   */
  private async cleanupWorktree(battle: BattleInstance): Promise<void> {
    if (!battle.worktreePath || !battle.branchName) {
      return;
    }

    const { execSync } = require('child_process');

    try {
      // 刪除 worktree
      execSync(`git worktree remove "${battle.worktreePath}" --force`, {
        stdio: 'pipe'
      });

      // 刪除分支
      execSync(`git branch -D ${battle.branchName}`, {
        stdio: 'pipe'
      });

      console.log(`[Worktree] Cleaned: ${battle.worktreePath}`);

      // 廣播清理事件
      this.ws.broadcast('battle:worktree_cleaned', {
        battleId: battle.id
      });
    } catch (error) {
      console.error('[Worktree] Cleanup failed:', error.message);
      // 清理失敗不是致命錯誤，只記錄
    }
  }
}
```

---

## 4. WebSocketManager

**職責**：實時推送戰鬥狀態更新到 UI

```typescript
import { Server as WebSocketServer } from 'ws';

interface WSMessage {
  event: string;
  data: any;
  timestamp: number;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<any> = new Set();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws) => {
      console.log('[WS] Client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('[WS] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WS] Error:', error);
        this.clients.delete(ws);
      });
    });
  }

  /**
   * 廣播消息給所有客戶端
   */
  broadcast(event: string, data: any): void {
    const message: WSMessage = {
      event,
      data,
      timestamp: Date.now()
    };

    const payload = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    }

    console.log(`[WS] Broadcast: ${event}`, data);
  }

  /**
   * 發送消息給特定客戶端
   */
  send(client: any, event: string, data: any): void {
    if (client.readyState === 1) {
      const message: WSMessage = {
        event,
        data,
        timestamp: Date.now()
      };
      client.send(JSON.stringify(message));
    }
  }

  /**
   * 關閉服務器
   */
  close(): void {
    this.wss.close();
  }
}
```

---

## 集成示例

### 完整流程示例

```typescript
// 初始化系統
const mainCLI = new MainCLI();

// 用戶輸入 1: 簡單問題
await mainCLI.handleInput("現在是什麼模式？");
// → Dialog Track
// → 立即響應

// 用戶輸入 2: 中等任務
await mainCLI.handleInput("修復 login.ts 的類型錯誤");
// → Main Sync
// → 主線程執行，顯示進度
// → 等待完成

// 用戶輸入 3: 複雜任務
await mainCLI.handleInput("重構整個認證系統，添加 OAuth 支持");
// → Battle Async
// → 立即返回
// → 後台執行，WebSocket 推送進度

// 用戶可以繼續輸入
await mainCLI.handleInput("當前有哪些戰鬥？");
// → Dialog Track
// → 立即響應戰鬥列表
```

---

## 性能優化

### 1. 進程管理

```typescript
class ProcessPool {
  private pool: Array<ChildProcess> = [];
  private maxPoolSize = 3;

  /**
   * 預熱進程池
   */
  preheat(): void {
    for (let i = 0; i < this.maxPoolSize; i++) {
      const process = spawn('claude', ['code'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      this.pool.push(process);
    }
  }

  /**
   * 獲取空閒進程
   */
  acquire(): ChildProcess | null {
    return this.pool.pop() || null;
  }

  /**
   * 歸還進程
   */
  release(process: ChildProcess): void {
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(process);
    } else {
      process.kill();
    }
  }
}
```

### 2. 智能調度

```typescript
class SmartScheduler {
  /**
   * 根據系統負載動態調整並發數
   */
  adjustConcurrency(): number {
    const cpuUsage = os.loadavg()[0];
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;

    if (cpuUsage > 80 || memUsage > 500) {
      return 1; // 降低並發
    } else if (cpuUsage < 50 && memUsage < 300) {
      return 5; // 提高並發
    }
    return 3; // 默認
  }
}
```

### 3. 緩存機制

```typescript
class AnalysisCache {
  private cache: Map<string, AnalysisResult> = new Map();
  private maxSize = 100;

  /**
   * 緩存分析結果
   */
  set(prompt: string, result: AnalysisResult): void {
    const key = this.hash(prompt);
    this.cache.set(key, result);

    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * 獲取緩存
   */
  get(prompt: string): AnalysisResult | undefined {
    const key = this.hash(prompt);
    return this.cache.get(key);
  }

  private hash(str: string): string {
    return require('crypto').createHash('md5').update(str).digest('hex');
  }
}
```

---

## 錯誤處理

### 錯誤類型

```typescript
class BattleError extends Error {
  constructor(
    public code: string,
    message: string,
    public battleId?: string
  ) {
    super(message);
  }
}

// 錯誤碼
const ErrorCodes = {
  POOL_FULL: '戰鬥池已滿',
  PROCESS_FAILED: '進程執行失敗',
  TIMEOUT: '執行超時',
  INVALID_INPUT: '無效輸入',
  RESOURCE_EXHAUSTED: '資源耗盡'
};
```

### 錯誤恢復

```typescript
class ErrorRecovery {
  /**
   * 自動重試
   */
  async retryBattle(
    battleId: string,
    maxRetries: number = 3
  ): Promise<void> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.restartBattle(battleId);
        return;
      } catch (error) {
        attempt++;
        console.error(`[Retry ${attempt}/${maxRetries}]`, error);
        await this.delay(1000 * attempt);
      }
    }

    throw new BattleError('MAX_RETRIES', `Failed after ${maxRetries} attempts`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 測試策略

### 單元測試

```typescript
describe('SmartRouter', () => {
  it('should route simple questions to dialog', () => {
    const router = new SmartRouter();
    const result = router.analyzePrompt("現在是什麼模式？");
    expect(result.route).toBe('dialog');
    expect(result.complexity).toBeLessThan(3);
  });

  it('should route medium tasks to main_sync', () => {
    const router = new SmartRouter();
    const result = router.analyzePrompt("修復 login.ts 的類型錯誤");
    expect(result.route).toBe('main_sync');
    expect(result.complexity).toBeGreaterThanOrEqual(3);
    expect(result.complexity).toBeLessThan(8);
  });

  it('should route complex tasks to battle_async', () => {
    const router = new SmartRouter();
    const result = router.analyzePrompt("重構整個認證系統");
    expect(result.route).toBe('battle_async');
    expect(result.complexity).toBeGreaterThanOrEqual(8);
  });
});
```

### 集成測試

```typescript
describe('MainCLI Integration', () => {
  it('should handle concurrent battles', async () => {
    const cli = new MainCLI();

    const battle1 = cli.handleInput("重構系統 A");
    const battle2 = cli.handleInput("重構系統 B");
    const battle3 = cli.handleInput("重構系統 C");

    await Promise.all([battle1, battle2, battle3]);

    const pool = cli['battlePool'];
    expect(pool.getActiveBattles().length).toBeLessThanOrEqual(3);
  });
});
```

---

## 部署配置

### 環境變量

```bash
# .env
MAX_CONCURRENT_BATTLES=3
WEBSOCKET_PORT=8080
CLAUDE_CLI_PATH=/usr/local/bin/claude
BATTLE_TIMEOUT=1800000  # 30 分鐘
ENABLE_CACHE=true
LOG_LEVEL=info
```

### 啟動腳本

```typescript
// index.ts
import { MainCLI } from './MainCLI';

async function main() {
  const cli = new MainCLI();

  console.log('🎮 Code Quest - Async Battle System');
  console.log('Version: 1.0.0');
  console.log('Max Concurrent Battles:', process.env.MAX_CONCURRENT_BATTLES);

  // 啟動 REPL
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', async (line: string) => {
    await cli.handleInput(line.trim());
    rl.prompt();
  });
}

main().catch(console.error);
```

---

## 監控和日誌

### 性能指標

```typescript
class MetricsCollector {
  private metrics = {
    totalBattles: 0,
    completedBattles: 0,
    failedBattles: 0,
    avgDuration: 0,
    avgComplexity: 0
  };

  recordBattle(battle: BattleInstance): void {
    this.metrics.totalBattles++;

    if (battle.status === 'completed') {
      this.metrics.completedBattles++;
      const duration = battle.endTime! - battle.startTime;
      this.metrics.avgDuration =
        (this.metrics.avgDuration * (this.metrics.completedBattles - 1) + duration) /
        this.metrics.completedBattles;
    } else if (battle.status === 'failed') {
      this.metrics.failedBattles++;
    }

    this.metrics.avgComplexity =
      (this.metrics.avgComplexity * (this.metrics.totalBattles - 1) + battle.analysis.complexity) /
      this.metrics.totalBattles;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.completedBattles / this.metrics.totalBattles
    };
  }
}
```

### 結構化日誌

```typescript
class Logger {
  log(level: string, message: string, meta?: any): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
    console.log(JSON.stringify(entry));
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  error(message: string, error: Error, meta?: any): void {
    this.log('error', message, {
      error: {
        message: error.message,
        stack: error.stack
      },
      ...meta
    });
  }
}
```

---

## 未來擴展

### 1. 智能預測

```typescript
class ComplexityPredictor {
  /**
   * 基於歷史數據的機器學習預測
   */
  predictComplexity(prompt: string): number {
    // 使用簡單的線性回歸或決策樹
    // 基於歷史數據訓練模型
    return predicted_complexity;
  }
}
```

### 2. 動態資源分配

```typescript
class DynamicResourceAllocator {
  /**
   * 根據任務優先級動態分配資源
   */
  allocate(battles: BattleInstance[]): void {
    // 高優先級任務獲得更多 CPU/內存
    // 低優先級任務可以被暫停
  }
}
```

### 3. 分佈式執行

```typescript
class DistributedBattlePool {
  /**
   * 在多台機器上分佈執行戰鬥
   */
  async distributeBattle(battle: BattleInstance): Promise<void> {
    // 選擇負載最低的機器
    // 通過 gRPC 或 HTTP 調用遠程執行
  }
}
```
