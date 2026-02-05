# 異步戰鬥系統設計

**日期**: 2026-02-05
**版本**: v1.0
**基於**: Scene-System-Design.md, Feature-Overview.md

---

## 核心概念

### 問題陳述

**傳統 CLI 的阻塞問題**:
```
用戶: "重構認證系統"
    ↓
等待 Claude 完成...（5-10 分鐘）⏳
    ↓
期間無法對話、無法提問
    ❌ 體驗差
```

### 解決方案：非阻塞雙軌系統

**新設計**:
```
[對話軌道 - 永不阻塞]      [戰鬥軌道 - 背景運行]
        🏰                         ⚔️
        │                          │
用戶: "重構認證系統"               │
    │──────────啟動───────────→ 戰鬥 #1 開始
    │                              │
用戶: "什麼是 JWT？"               │
    │                              │
立即回答 ✅                        戰鬥 #1: 35%
    │                              │
用戶: "創建用戶 API"               │
    │──────────啟動───────────→ 戰鬥 #2 排隊
    │                              │
繼續對話...                        戰鬥進行中...
```

**設計原則**:
- ✅ 對話永不阻塞
- ✅ 智能路由（對話/簡單任務/複雜任務）
- ✅ 資源動態管理（按需啟動/關閉）
- ✅ 成本可控（大部分請求用主 CLI）

---

## 系統架構

### 混合雙軌架構 ⭐

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (React)                          │
│                                                               │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ 探索面板 │  │   對話窗口       │  │   戰鬥列表       │  │
│  │ (左側)   │  │   (中央)         │  │   (右側)         │  │
│  │          │  │                  │  │                  │  │
│  │ 🧙 Lv.5  │  │  💬 持續對話     │  │  ⚔️ 戰鬥 A       │  │
│  │ HP: 100  │  │  💬 隨時提問     │  │  進度: 85%       │  │
│  │ MP: 85   │  │  💬 不會阻塞     │  │                  │  │
│  │          │  │                  │  │  ⏸️ 戰鬥 B       │  │
│  │ 主菜單   │  │  [輸入框]        │  │  排隊中          │  │
│  └──────────┘  └──────────────────┘  └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                  Bridge Layer (Node.js)                      │
│                                                               │
│  ┌──────────────────────────────────────────────┐            │
│  │           SmartRouter (智能路由器)            │            │
│  │                                              │            │
│  │  analyzePrompt(prompt)                       │            │
│  │    ↓                                         │            │
│  │  ┌────────┬─────────┬──────────┐             │            │
│  │  │ 對話型 │ 簡單任務 │ 複雜任務 │             │            │
│  │  └────┬───┴────┬────┴─────┬────┘             │            │
│  └───────┼────────┼──────────┼──────────────────┘            │
│          │        │          │                               │
│          ▼        ▼          ▼                               │
│  ┌───────────┐ ┌─────────┐ ┌──────────────────────┐         │
│  │ 主 Claude │ │ 主      │ │ 戰鬥實例池           │         │
│  │ CLI       │ │ Claude  │ │ (BattleInstancePool) │         │
│  │ (常駐)    │ │ CLI     │ │                      │         │
│  │           │ │ (常駐)  │ │ [實例 1] 戰鬥 A      │         │
│  │ 對話模式  │ │         │ │ [實例 2] 戰鬥 B      │         │
│  │ 立即響應  │ │ 同步執行│ │ [實例 3] 空閒        │         │
│  │ < 2 秒    │ │ 15-30秒 │ │                      │         │
│  └───────────┘ └─────────┘ │ 最多 3 個並行        │         │
│                             │ 空閒自動關閉         │         │
│                             └──────────────────────┘         │
└───────────────────────────────────────────────────────────────┘
```

### 三種處理路徑

#### 路徑 1: 對話型（立即）

```
用戶: "什麼是閉包？"
    ↓
SmartRouter 分析
    ↓
類型: dialog
複雜度: 1
    ↓
路由到: 主 Claude CLI (對話模式)
    ↓
立即響應（< 2 秒）
    ✅ 不阻塞
```

#### 路徑 2: 簡單任務（同步）

```
用戶: "修復登入按鈕 Bug"
    ↓
SmartRouter 分析
    ↓
類型: task
複雜度: 5
    ↓
路由到: 主 Claude CLI (任務模式)
    ↓
同步執行（15-30 秒）
    ⚠️ 輕微阻塞（可接受）
```

#### 路徑 3: 複雜任務（異步）

```
用戶: "重構整個認證系統並確保向後兼容"
    ↓
SmartRouter 分析
    ↓
類型: task
複雜度: 12
    ↓
路由到: 新戰鬥實例（背景）
    ↓
立即返回 battleId
    ↓
用戶可以繼續對話
    ✅ 完全不阻塞
```

---

## 智能路由器（SmartRouter）

### 複雜度分析算法

```javascript
class SmartRouter {
  analyzePrompt(prompt) {
    let complexity = 0;

    // 1. 長度因素（0-3 分）
    if (prompt.length > 200) complexity += 3;
    else if (prompt.length > 100) complexity += 2;
    else complexity += 1;

    // 2. 關鍵字權重
    const weights = {
      // 重量級關鍵字（+3 分）
      heavy: [
        '重構', '遷移', '升級', '整個', '所有',
        'refactor', 'migrate', 'upgrade', 'entire', 'all'
      ],
      // 中量級關鍵字（+2 分）
      medium: [
        '創建', '實作', '開發', '優化',
        'create', 'implement', 'develop', 'optimize'
      ],
      // 輕量級關鍵字（+1 分）
      light: [
        '修復', '更新', '檢查',
        'fix', 'update', 'check'
      ]
    };

    complexity += this.countKeywords(prompt, weights.heavy) * 3;
    complexity += this.countKeywords(prompt, weights.medium) * 2;
    complexity += this.countKeywords(prompt, weights.light) * 1;

    // 3. 多步驟檢測（+2 分）
    const multiStepKeywords = ['並且', '然後', '接著', 'and then', 'also'];
    if (multiStepKeywords.some(kw => prompt.includes(kw))) {
      complexity += 2;
    }

    // 4. 範圍檢測（+3 分）
    const scopeKeywords = ['所有文件', '整個項目', '全部', 'all files', 'entire project'];
    if (scopeKeywords.some(kw => prompt.includes(kw))) {
      complexity += 3;
    }

    // 5. 技術深度（+1-2 分）
    const advancedKeywords = ['架構', '設計模式', '性能優化', 'architecture', 'design pattern'];
    if (advancedKeywords.some(kw => prompt.includes(kw))) {
      complexity += 2;
    }

    // 計算等級
    const level = Math.floor(complexity / 2);

    return {
      type: this.determineType(prompt),
      complexity,
      level,
      route: this.determineRoute(complexity)
    };
  }

  determineType(prompt) {
    // 問題關鍵字
    const questionKeywords = [
      '什麼', '為什麼', '如何', '怎麼', '是否',
      'what', 'why', 'how', 'explain', 'describe'
    ];

    if (questionKeywords.some(kw => prompt.includes(kw))) {
      return 'dialog';
    }

    // 任務關鍵字
    const taskKeywords = [
      '修復', '創建', '實作', '開發', '重構',
      'fix', 'create', 'implement', 'refactor'
    ];

    if (taskKeywords.some(kw => prompt.includes(kw))) {
      return 'task';
    }

    // 默認為對話
    return 'dialog';
  }

  determineRoute(complexity) {
    if (complexity < 3) return 'dialog';      // 對話模式
    if (complexity < 8) return 'main_sync';   // 主 CLI 同步
    return 'battle_async';                     // 戰鬥實例異步
  }

  async route(prompt) {
    const analysis = this.analyzePrompt(prompt);

    switch (analysis.route) {
      case 'dialog':
        // 路徑 1: 對話模式
        return await this.mainCLI.ask(prompt);

      case 'main_sync':
        // 路徑 2: 主 CLI 同步執行
        return await this.mainCLI.executeTask(prompt);

      case 'battle_async':
        // 路徑 3: 戰鬥實例異步
        const battleId = await this.battleQueue.startBattle(prompt, analysis);
        return {
          type: 'battle_started',
          battleId,
          analysis,
          message: `戰鬥 #${battleId} 已啟動，您可以繼續對話`
        };
    }
  }
}
```

### 路由決策表

| 複雜度 | 範圍 | 路由目標 | 響應時間 | 阻塞 | 範例 |
|--------|------|----------|----------|------|------|
| 0-2 | 對話、知識問答 | 主 CLI (對話) | < 2 秒 | ❌ | "什麼是閉包？" |
| 3-7 | 簡單任務、單文件 | 主 CLI (同步) | 15-30 秒 | ⚠️ 輕微 | "修復登入 Bug" |
| 8-10 | 中等任務、多文件 | 戰鬥實例 | 2-5 分鐘 | ❌ | "創建用戶模塊" |
| 11-15 | 複雜任務、大範圍 | 戰鬥實例 | 5-15 分鐘 | ❌ | "重構認證系統" |
| 16+ | 超大型任務 | 戰鬥實例 | 15+ 分鐘 | ❌ | "重寫整個後端" |

---

## 主 Claude CLI 管理

### CLI 生命週期

```javascript
class MainCLI {
  constructor() {
    this.process = null;
    this.mode = 'idle'; // idle, dialog, task
    this.outputBuffer = '';
    this.currentPromise = null;
  }

  // 啟動主 CLI（應用啟動時）
  async start() {
    this.process = spawn('claude', ['code'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      this.handleOutput(data);
    });

    this.mode = 'idle';
    console.log('✅ 主 Claude CLI 已啟動');
  }

  // 對話模式（不使用工具）
  async ask(question) {
    if (this.mode === 'task') {
      // 如果主 CLI 正在執行任務，等待完成
      await this.waitForIdle();
    }

    this.mode = 'dialog';

    return new Promise((resolve) => {
      this.currentPromise = resolve;

      // 發送問題（不觸發工具）
      this.process.stdin.write(question + '\n');

      // 監聽回應
      this.onResponse = (response) => {
        this.mode = 'idle';
        resolve(response);
      };
    });
  }

  // 任務模式（使用工具，同步執行）
  async executeTask(prompt) {
    if (this.mode !== 'idle') {
      await this.waitForIdle();
    }

    this.mode = 'task';

    return new Promise((resolve, reject) => {
      this.currentPromise = resolve;

      // 發送任務
      this.process.stdin.write(prompt + '\n');

      // 監聽完成
      this.onTaskComplete = (result) => {
        this.mode = 'idle';
        resolve(result);
      };

      // 超時保護（30 秒）
      setTimeout(() => {
        if (this.mode === 'task') {
          reject(new Error('任務超時，轉為戰鬥模式'));
        }
      }, 30000);
    });
  }

  async waitForIdle() {
    return new Promise((resolve) => {
      if (this.mode === 'idle') {
        resolve();
      } else {
        this.onIdle = resolve;
      }
    });
  }

  handleOutput(data) {
    this.outputBuffer += data.toString();

    // 檢測回應完成
    if (this.isResponseComplete(this.outputBuffer)) {
      const response = this.parseResponse(this.outputBuffer);
      this.outputBuffer = '';

      if (this.mode === 'dialog' && this.onResponse) {
        this.onResponse(response);
      } else if (this.mode === 'task' && this.onTaskComplete) {
        this.onTaskComplete(response);
      }
    }
  }

  isResponseComplete(output) {
    // 偵測 Claude 回應結束標記
    return output.includes('\n\n') ||
           output.includes('```') ||
           output.trim().endsWith('?') ||
           output.trim().endsWith('。');
  }
}
```

---

## 戰鬥實例池管理

### 實例池設計

```javascript
class BattleInstancePool {
  constructor() {
    this.instances = new Map(); // battleId -> instance
    this.maxConcurrent = 3;     // 最多 3 個並行
    this.queue = [];            // 等待隊列
  }

  // 啟動新戰鬥
  async startBattle(prompt, analysis) {
    const battleId = this.generateBattleId();

    const battle = {
      id: battleId,
      prompt,
      analysis,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      instance: null,
      enemy: null,
      logs: []
    };

    // 加入管理
    this.instances.set(battleId, battle);

    // 廣播：新戰鬥加入
    this.broadcast({
      type: 'battle_added',
      battle: this.serializeBattle(battle)
    });

    // 嘗試立即執行
    await this.tryExecute(battle);

    return battleId;
  }

  async tryExecute(battle) {
    const running = this.getRunningBattles();

    if (running.length < this.maxConcurrent) {
      // 有空位，立即執行
      await this.executeBattle(battle);
    } else {
      // 加入隊列
      this.queue.push(battle);
      battle.status = 'queued';

      this.broadcast({
        type: 'battle_queued',
        battleId: battle.id,
        position: this.queue.length
      });
    }
  }

  async executeBattle(battle) {
    battle.status = 'running';

    // 生成敵人
    battle.enemy = this.generateEnemy(battle.analysis);

    // 啟動 Claude CLI 實例
    const claudeProcess = spawn('claude', ['code'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    battle.instance = {
      process: claudeProcess,
      startTime: Date.now()
    };

    // 廣播：戰鬥開始
    this.broadcast({
      type: 'battle_started',
      battleId: battle.id,
      enemy: battle.enemy
    });

    // 發送 Prompt
    claudeProcess.stdin.write(battle.prompt + '\n');

    // 監聽輸出
    claudeProcess.stdout.on('data', (data) => {
      this.handleBattleProgress(battle, data);
    });

    // 監聽完成
    claudeProcess.on('close', (code) => {
      this.handleBattleComplete(battle, code);
    });

    // 監聽錯誤
    claudeProcess.on('error', (err) => {
      this.handleBattleError(battle, err);
    });
  }

  handleBattleProgress(battle, data) {
    const output = data.toString();
    battle.logs.push(output);

    // 計算進度（簡化版）
    const progress = this.calculateProgress(battle);
    battle.progress = progress;

    // 廣播進度
    this.broadcast({
      type: 'battle_progress',
      battleId: battle.id,
      progress,
      latestLog: output.slice(-200) // 最近 200 字
    });

    // 檢測工具使用（轉化為魔法）
    const toolUsed = this.detectToolUsage(output);
    if (toolUsed) {
      this.broadcast({
        type: 'spell_cast',
        battleId: battle.id,
        spell: this.mapToolToSpell(toolUsed)
      });
    }
  }

  async handleBattleComplete(battle, code) {
    battle.status = 'completed';
    battle.endTime = Date.now();
    battle.duration = battle.endTime - battle.startTime;

    // 計算獎勵
    const rewards = this.calculateRewards(battle);

    // 廣播完成
    this.broadcast({
      type: 'battle_completed',
      battleId: battle.id,
      rewards,
      duration: battle.duration
    });

    // 關閉實例
    battle.instance.process.kill();
    battle.instance = null;

    // 執行下一個隊列中的戰鬥
    if (this.queue.length > 0) {
      const nextBattle = this.queue.shift();
      await this.executeBattle(nextBattle);
    }
  }

  handleBattleError(battle, error) {
    battle.status = 'failed';
    battle.error = error.message;

    this.broadcast({
      type: 'battle_failed',
      battleId: battle.id,
      error: error.message
    });

    // 關閉實例
    if (battle.instance) {
      battle.instance.process.kill();
      battle.instance = null;
    }
  }

  // 計算進度（基於日誌分析）
  calculateProgress(battle) {
    const totalSteps = this.estimateSteps(battle.analysis);
    const completedSteps = this.countCompletedSteps(battle.logs);

    return Math.min(99, Math.floor((completedSteps / totalSteps) * 100));
  }

  estimateSteps(analysis) {
    // 基於複雜度估算步驟數
    return Math.max(5, analysis.complexity);
  }

  countCompletedSteps(logs) {
    // 計算已完成的工具調用
    let steps = 0;
    const fullLog = logs.join('');

    // 檢測工具完成標記
    const toolPatterns = [
      /Read.*completed/gi,
      /Write.*completed/gi,
      /Edit.*completed/gi,
      /Bash.*completed/gi
    ];

    toolPatterns.forEach(pattern => {
      const matches = fullLog.match(pattern);
      if (matches) steps += matches.length;
    });

    return steps;
  }

  // 生成敵人
  generateEnemy(analysis) {
    const level = analysis.level;
    const enemyTypes = {
      1: { name: 'Bug怪物', icon: '🐛' },
      2: { name: '功能幽靈', icon: '🔧' },
      3: { name: '架構惡魔', icon: '🏗️' },
      4: { name: '文檔精靈', icon: '📝' },
      5: { name: '測試守衛', icon: '🧪' },
      6: { name: '審查巨人', icon: '🔍' },
      7: { name: '傳說巨龍', icon: '🐉' }
    };

    const typeKey = Math.min(7, Math.max(1, Math.floor(level / 3) + 1));
    const type = enemyTypes[typeKey];

    return {
      ...type,
      level,
      maxHp: 100 * level,
      hp: 100 * level,
      attack: 5 + level * 2,
      defense: level
    };
  }

  // 計算獎勵
  calculateRewards(battle) {
    const baseExp = 20;
    const baseGold = 5;
    const level = battle.enemy.level;

    return {
      exp: baseExp * level,
      gold: baseGold * level,
      bonus: battle.duration < 60000 ? { exp: 10, reason: '快速完成' } : null
    };
  }

  // 獲取戰鬥狀態
  getBattle(battleId) {
    return this.instances.get(battleId);
  }

  getRunningBattles() {
    return Array.from(this.instances.values())
      .filter(b => b.status === 'running');
  }

  getActiveBattles() {
    return Array.from(this.instances.values())
      .filter(b => b.status !== 'completed' && b.status !== 'failed');
  }

  // 取消戰鬥
  async cancelBattle(battleId) {
    const battle = this.instances.get(battleId);

    if (!battle) return;

    if (battle.status === 'running' && battle.instance) {
      battle.instance.process.kill();
    }

    battle.status = 'cancelled';

    this.broadcast({
      type: 'battle_cancelled',
      battleId
    });
  }

  generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  serializeBattle(battle) {
    return {
      id: battle.id,
      prompt: battle.prompt,
      status: battle.status,
      progress: battle.progress,
      enemy: battle.enemy,
      startTime: battle.startTime,
      analysis: battle.analysis
    };
  }

  broadcast(event) {
    // 透過 WebSocket 廣播給所有客戶端
    global.wss?.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  }
}
```

---

## UI 設計

### 三面板佈局

```
┌────────────────────────────────────────────────────────────────┐
│ RPG-CLI                                                         │
├────────────┬──────────────────────────────┬─────────────────────┤
│            │                              │                     │
│ 【探索】   │      【對話窗口】            │   【戰鬥列表】      │
│  20%       │        50%                   │     30%             │
│            │                              │                     │
│ ┌────────┐ │  ┌─────────────────────────┐ │ ┌─────────────────┐│
│ │ 角色   │ │  │ 💬 你: 重構認證系統     │ │ │ ⚔️ 進行中 (2/3) ││
│ │ 狀態   │ │  │                         │ │ │                 ││
│ │        │ │  │ ⚙️ 戰鬥 #1 已啟動      │ │ │ #1 重構認證     ││
│ │ 🧙 Lv.5│ │  │                         │ │ │ ████████░░ 85%  ││
│ │ HP: ██ │ │  │ 💬 你: 什麼是 JWT？    │ │ │ 2分30秒         ││
│ │ MP: ██ │ │  │                         │ │ │ [詳情][取消]    ││
│ │ EXP:██ │ │  │ 💬 Claude: JWT 是一種  │ │ │                 ││
│ └────────┘ │  │    安全的令牌格式...    │ │ │ #3 創建 API     ││
│            │  │                         │ │ │ ███░░░░░░░ 35%  ││
│ ┌────────┐ │  │ 💬 你: Session 的區別？ │ │ │ 1分05秒         ││
│ │ 主菜單 │ │  │                         │ │ │ [詳情][取消]    ││
│ │        │ │  │ 💬 Claude: 主要區別在  │ │ │                 ││
│ │📊 狀態 │ │  │    於存儲位置...        │ │ ├─────────────────┤
│ │🔮 技能 │ │  │                         │ │ │ ⏸️ 排隊中 (1)   ││
│ │🧙 夥伴 │ │  └─────────────────────────┘ │ │                 ││
│ │🏆 成就 │ │                              │ │ #2 寫測試       ││
│ │🌲Workt │ │  ┌─────────────────────────┐ │ │ 等待: 第1位     ││
│ │⚙️ 設定 │ │  │ > _                     │ │ │ [詳情][取消]    ││
│ └────────┘ │  └─────────────────────────┘ │ │                 ││
│            │                              │ ├─────────────────┤
│            │                              │ │ ✅ 已完成 (3)   ││
│            │                              │ │ [查看歷史]      ││
│            │                              │ └─────────────────┘│
└────────────┴──────────────────────────────┴─────────────────────┘
```

### 戰鬥卡片設計

```
┌─────────────────────────────────────┐
│ ⚔️ 戰鬥 #1 - 重構認證系統          │
├─────────────────────────────────────┤
│                                     │
│ 【狀態】 進行中                      │
│ 【進度】 ████████░░ 85%             │
│ 【時間】 已用 2分30秒                │
│                                     │
│ 【敵人】 🏗️ 架構惡魔 Lv.12         │
│ HP: ███░░░░░░░ 350/2000             │
│                                     │
│ 【最近行動】                         │
│ • 📖 讀心術 - 分析現有代碼           │
│ • ✏️ 改寫術 - 更新 auth.ts          │
│ • 🧪 試煉之法 - 執行測試 (進行中)   │
│                                     │
│ [查看詳情] [暫停] [取消]            │
└─────────────────────────────────────┘
```

### 戰鬥詳情彈窗

```
┌──────────────────────────────────────────────┐
│ ⚔️ 戰鬥詳情 - #1                            │
├──────────────────────────────────────────────┤
│                                              │
│ 【基本資訊】                                  │
│ Prompt: "重構整個認證系統並確保向後兼容"     │
│ 開始時間: 10:00:15                           │
│ 已用時間: 2分30秒                            │
│ 複雜度: 12 (超大型任務)                      │
│                                              │
│ 【敵人資訊】                                  │
│ 名稱: 🏗️ 架構惡魔                          │
│ 等級: Lv.12                                  │
│ HP: 350/2000                                 │
│ 攻擊力: 29                                   │
│                                              │
│ 【戰鬥日誌】                                  │
│ ┌──────────────────────────────────────┐     │
│ │ [10:00:15] 戰鬥開始                  │     │
│ │ [10:00:20] 📖 使用讀心術             │     │
│ │ [10:00:25] 💡 發現弱點！攻擊 +15%    │     │
│ │ [10:00:30] ✏️ 使用改寫術             │     │
│ │ [10:00:35] 💥 造成 85 點傷害         │     │
│ │ [10:01:10] 🧪 使用試煉之法           │     │
│ │ [10:01:15] ✅ Test 1/15 passed       │     │
│ │ [10:01:20] ✅ Test 2/15 passed       │     │
│ │ [10:02:30] 🌀 施法進行中...          │     │
│ │ [自動滾動到最新]                     │     │
│ └──────────────────────────────────────┘     │
│                                              │
│ [暫停] [取消戰鬥] [關閉]                     │
└──────────────────────────────────────────────┘
```

---

## WebSocket 事件定義

### 客戶端 → 服務器

```typescript
// 發送 Prompt
{
  type: 'user_message',
  message: string
}

// 查詢戰鬥狀態
{
  type: 'get_battle_status',
  battleId: string
}

// 取消戰鬥
{
  type: 'cancel_battle',
  battleId: string
}

// 暫停戰鬥
{
  type: 'pause_battle',
  battleId: string
}

// 恢復戰鬥
{
  type: 'resume_battle',
  battleId: string
}
```

### 服務器 → 客戶端

```typescript
// 即時對話回應
{
  type: 'dialog_response',
  message: string,
  timestamp: number
}

// 戰鬥啟動
{
  type: 'battle_started',
  battleId: string,
  enemy: Enemy,
  message: string
}

// 戰鬥加入隊列
{
  type: 'battle_queued',
  battleId: string,
  position: number
}

// 戰鬥進度更新
{
  type: 'battle_progress',
  battleId: string,
  progress: number,      // 0-100
  latestLog: string
}

// 魔法施放（工具使用）
{
  type: 'spell_cast',
  battleId: string,
  spell: {
    name: string,
    icon: string,
    mpCost: number,
    effect: string
  }
}

// 戰鬥完成
{
  type: 'battle_completed',
  battleId: string,
  rewards: {
    exp: number,
    gold: number,
    bonus?: { exp: number, reason: string }
  },
  duration: number
}

// 戰鬥失敗
{
  type: 'battle_failed',
  battleId: string,
  error: string
}

// 戰鬥取消
{
  type: 'battle_cancelled',
  battleId: string
}
```

---

## 使用場景

### 場景 1：持續對話 + 背景戰鬥

```
時間軸：

10:00:00 用戶: "重構整個認證系統並確保向後兼容"
         → 分析: 複雜度 12
         → 路由: 戰鬥實例
         → 回應: "戰鬥 #1 已啟動"
         → 右側顯示: 戰鬥 #1 進行中 0%

10:00:15 用戶: "認證系統為什麼要重構？"
         → 分析: 複雜度 1 (對話)
         → 路由: 主 CLI (對話模式)
         → 回應: "重構的主要原因..." (< 2 秒)
         → 戰鬥 #1: 15%

10:01:00 用戶: "JWT 和 Session 的區別？"
         → 路由: 主 CLI (對話模式)
         → 回應: "JWT 是無狀態..." (< 2 秒)
         → 戰鬥 #1: 45%

10:02:00 用戶: "順便創建一個用戶註冊 API"
         → 分析: 複雜度 6
         → 路由: 主 CLI (同步)
         → 回應: "正在創建..." (25 秒)
         → 戰鬥 #1: 65%

10:02:30 用戶: "測試要用什麼框架？"
         → 路由: 主 CLI (對話模式)
         → 回應: "推薦使用..." (< 2 秒)
         → 戰鬥 #1: 85%

10:03:00 🔔 通知: "戰鬥 #1 完成！"
         → 顯示獎勵: 經驗值 +240, 金幣 +60
         → 玩家升級: Lv.5 → Lv.6
```

### 場景 2：多戰鬥並行管理

```
10:00 用戶: "重構認證系統"
      → 戰鬥 #1 啟動 (複雜度 12)

10:01 用戶: "創建用戶管理模塊"
      → 戰鬥 #2 啟動 (複雜度 10)

10:02 用戶: "優化資料庫查詢"
      → 戰鬥 #3 啟動 (複雜度 9)

10:03 用戶: "寫完整的測試套件"
      → 戰鬥 #4 排隊 (達到並行上限 3)

右側顯示:
⚔️ 進行中 (3/3)
├─ #1 重構認證 85%
├─ #2 用戶模塊 65%
└─ #3 優化查詢 40%

⏸️ 排隊中 (1)
└─ #4 寫測試 (等待第1位)

10:05 戰鬥 #1 完成
      → 戰鬥 #4 自動開始
```

### 場景 3：Plan Mode 不阻塞對話

```
10:00 用戶: "遷移到 TypeScript 5.0"
      → 戰鬥 #5 啟動

10:01 Claude 觸發 Plan Mode
      → 彈出戰術規劃彈窗
      → 戰鬥 #5 暫停

      [彈窗覆蓋層]
      🧙 戰術規劃 - 戰鬥 #5

      建議的遷移步驟:
      1. 更新 tsconfig.json
      2. 修復類型錯誤
      3. 測試驗證

      [批准] [修改] [取消]

10:02 同時，用戶可以繼續對話:
      用戶: "TypeScript 5.0 有什麼新特性？"
      → 主 CLI 立即回答 ✅

10:03 用戶批准計劃
      → 戰鬥 #5 繼續
      → 彈窗關閉
```

---

## 實作優先級

### Phase 2.5: 基礎異步系統

- [ ] SmartRouter 基礎實作
- [ ] 複雜度分析算法
- [ ] 主 Claude CLI 管理（對話 + 同步任務）
- [ ] 基礎 WebSocket 事件
- [ ] 簡單的三面板 UI

### Phase 3: 完整戰鬥池

- [ ] BattleInstancePool 完整實作
- [ ] 多戰鬥並行管理
- [ ] 戰鬥隊列系統
- [ ] 進度計算和廣播
- [ ] 戰鬥詳情 UI
- [ ] 取消/暫停功能

### Phase 4: 優化和擴展

- [ ] 智能路由優化（機器學習調整閾值）
- [ ] 實例池動態擴展
- [ ] 戰鬥優先級系統
- [ ] 更精確的進度計算
- [ ] 性能監控和優化

---

## 技術挑戰與解決方案

### 挑戰 1: 進度計算不準確

**問題**: 無法準確知道 Claude 任務進度

**解決方案**:
1. 基於日誌分析估算
2. 檢測工具調用完成
3. 根據複雜度估算總步驟數
4. 保守估算（最高 99%）

### 挑戰 2: 資源消耗過高

**問題**: 多個 Claude 實例消耗大量資源

**解決方案**:
1. 大部分請求用主 CLI（80%+）
2. 戰鬥實例按需啟動
3. 空閒自動關閉（5 分鐘無活動）
4. 並行上限控制（最多 3 個）

### 挑戰 3: 複雜度誤判

**問題**: 智能路由可能將複雜任務判斷為簡單

**解決方案**:
1. 設置超時保護（30 秒）
2. 超時自動升級為戰鬥模式
3. 用戶可手動指定模式
4. 收集數據持續優化算法

### 挑戰 4: 多實例狀態同步

**問題**: 多個實例可能修改同一文件

**解決方案**:
1. 文件鎖機制
2. 戰鬥開始前檢查文件狀態
3. 衝突檢測和警告
4. 用戶可選擇戰鬥優先級

---

## 總結

### 核心優勢

1. **用戶體驗**
   - ✅ 對話永不阻塞
   - ✅ 簡單任務快速完成
   - ✅ 複雜任務背景運行
   - ✅ 多任務並行管理

2. **成本效益**
   - ✅ 80%+ 請求用主 CLI
   - ✅ 戰鬥實例按需啟動
   - ✅ 自動資源管理
   - ✅ 並行數量可控

3. **技術可行性**
   - ✅ 智能路由清晰
   - ✅ 實例管理簡單
   - ✅ 狀態追蹤完善
   - ✅ 擴展性強

### 與傳統場景系統的整合

**探索模式** = 對話軌道 + 主菜單
**戰鬥模式** = 戰鬥列表 + 進行中的異步戰鬥

兩者並行，互不干擾！

---

**版本**: v1.0
**最後更新**: 2026-02-05
