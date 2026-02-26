# PTY Architecture - Multi-Battle Implementation

## 設計理念

Code Quest 使用 **node-pty** 實現多 AI 並行戰鬥系統，架構參考 [vultuk/claude-code-web](https://github.com/vultuk/claude-code-web)。

**核心優勢**:
- ✅ 完整的 ANSI 色彩支援 (RPG 視覺效果)
- ✅ 多 Session 並行管理 (Haiku + Sonnet + Opus 同時戰鬥)
- ✅ 可靠的暫停/恢復 (Worktree 切換)
- ✅ 動態終端調整 (響應式 UI)
- ✅ 生產級錯誤處理

---

## 核心架構：三層設計

```
┌─────────────────────────────────────────┐
│  RPG UI Layer (React)                   │
│  - 戰鬥畫面、技能動畫、HP/MP 顯示        │
│  - WebSocket 客戶端                     │
└─────────────────┬───────────────────────┘
                  │ WebSocket
┌─────────────────▼───────────────────────┐
│  Battle Server (Node.js)                │
│  - BattleServer: 管理多場戰鬥            │
│  - OutputParser: PTY 輸出 → RPG 事件    │
│  - BattleStore: 持久化戰鬥狀態           │
└─────────────────┬───────────────────────┘
                  │ node-pty
┌─────────────────▼───────────────────────┐
│  BattleBridge (PTY Manager)             │
│  - 每個戰鬥 = 獨立的 PTY 進程            │
│  - xterm-256color 環境                  │
│  - 完整的 TTY 支援                      │
└─────────────────┬───────────────────────┘
                  │ spawn()
┌─────────────────▼───────────────────────┐
│  Claude CLI                             │
│  claude --print --model haiku "prompt"  │
└─────────────────────────────────────────┘
```

---

## 關鍵元件

### 1. BattleBridge - PTY 進程管理

```javascript
class BattleBridge {
  sessions = new Map(); // battleId → { pty, battleData }

  startBattle(battleId, config) {
    const { aiModel, prompt, workingDir, isWorktree } = config;

    // 1. 尋找 Claude CLI 路徑
    const claudeCommand = this.findClaudeCommand();

    // 2. 組裝指令參數
    const args = [
      '--print',
      '--model', aiModel,  // haiku | sonnet | opus
      prompt
    ];

    // 3. 使用 node-pty 生成進程
    const pty = spawn(claudeCommand, args, {
      name: 'xterm-256color',      // 256 色支援
      cols: 120,
      rows: 30,
      cwd: workingDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1',          // 強制啟用色彩
        COLORTERM: 'truecolor'     // True color
      }
    });

    // 4. 建立戰鬥 Session
    const battle = {
      id: battleId,
      pty: pty,
      outputBuffer: '',            // 循環緩衝 (10KB)
      battleData: {
        aiModel,
        hp: 100,
        mp: 100,
        exp: 0,
        gold: 0,
        battleLog: [],
        isWorktree
      },
      connections: new Set()       // WebSocket IDs
    };

    // 5. 設定事件處理
    this.setupPtyHandlers(battle);

    this.sessions.set(battleId, battle);
    return battle;
  }

  setupPtyHandlers(battle) {
    const { pty, id: battleId } = battle;

    // PTY 資料輸出
    pty.on('data', (data) => {
      battle.outputBuffer += data;

      // 維護 10KB 循環緩衝
      if (battle.outputBuffer.length > 10240) {
        battle.outputBuffer = battle.outputBuffer.slice(-5120);
      }

      // 呼叫輸出回調 (廣播給觀戰者)
      this.onOutput?.(battleId, data);
    });

    // 進程退出
    pty.on('exit', (code, signal) => {
      battle.active = false;
      this.onExit?.(battleId, { code, signal });
      this.sessions.delete(battleId);
    });

    // 錯誤處理
    pty.on('error', (error) => {
      console.error(`Battle ${battleId} error:`, error);
      battle.active = false;
      this.onError?.(battleId, error);
      this.sessions.delete(battleId);
    });
  }

  // 發送輸入到 PTY
  sendInput(battleId, data) {
    const battle = this.sessions.get(battleId);
    if (battle && battle.pty) {
      battle.pty.write(data);
    }
  }

  // 調整終端大小
  resize(battleId, cols, rows) {
    const battle = this.sessions.get(battleId);
    if (battle && battle.pty) {
      battle.pty.resize(cols, rows);
    }
  }

  // 停止戰鬥 (優雅關閉)
  stopBattle(battleId) {
    const battle = this.sessions.get(battleId);
    if (!battle) return;

    battle.active = false;

    // 1. SIGTERM (優雅關閉)
    battle.pty.kill('SIGTERM');

    // 2. 5 秒後 SIGKILL (強制終止)
    const killTimeout = setTimeout(() => {
      battle.pty.kill('SIGKILL');
    }, 5000);

    // 3. 清理
    battle.pty.on('exit', () => {
      clearTimeout(killTimeout);
      this.sessions.delete(battleId);
    });
  }

  // 清理所有戰鬥
  cleanup() {
    this.sessions.forEach((battle, battleId) => {
      this.stopBattle(battleId);
    });
  }
}
```

### 2. OutputParser - PTY 輸出轉 RPG 事件

```javascript
class OutputParser {
  parse(data) {
    const events = [];

    // 解析 Claude 輸出 (NDJSON 格式)
    const lines = data.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const json = JSON.parse(line);

        switch (json.type) {
          case 'tool_use':
            events.push(this.createSkillCastEvent(json));
            break;

          case 'text':
            events.push(this.createDialogueEvent(json));
            break;

          case 'thinking':
            events.push(this.createThinkingEvent(json));
            break;

          case 'result':
            events.push(this.createBattleEndEvent(json));
            break;
        }
      } catch {
        // 非 JSON 行 - 系統訊息
        events.push({
          type: 'dialogue',
          speaker: 'system',
          message: line
        });
      }
    }

    return events;
  }

  createSkillCastEvent(json) {
    return {
      type: 'skill_cast',
      skillName: this.mapToolToSkill(json.name),
      target: json.input?.file_path || json.input?.pattern,
      mpCost: this.calculateMPCost(json.name),
      animation: this.getSkillAnimation(json.name),
      timestamp: Date.now()
    };
  }

  createDialogueEvent(json) {
    return {
      type: 'dialogue',
      speaker: 'claude',
      message: json.text,
      timestamp: Date.now()
    };
  }

  createBattleEndEvent(json) {
    return {
      type: 'battle_end',
      result: json.error ? 'failed' : 'victory',
      rewards: json.error ? null : {
        exp: 100,
        gold: 50
      },
      timestamp: Date.now()
    };
  }

  // 工具 → 技能映射
  mapToolToSkill(toolName) {
    const mapping = {
      'Read': '閱讀卷軸',
      'Write': '書寫魔法',
      'Edit': '編輯之術',
      'Grep': '搜尋之眼',
      'Bash': '終端召喚',
      'Task': '召喚夥伴'
    };
    return mapping[toolName] || toolName;
  }

  // 計算 MP 消耗
  calculateMPCost(toolName) {
    const baseCosts = {
      'Read': 5,
      'Write': 10,
      'Edit': 8,
      'Grep': 7,
      'Bash': 15,
      'Task': 50
    };
    return baseCosts[toolName] || 10;
  }

  // 技能動畫
  getSkillAnimation(toolName) {
    const animations = {
      'Read': 'scroll_unfurl',
      'Write': 'quill_writing',
      'Edit': 'pencil_edit',
      'Grep': 'magnifying_glass',
      'Bash': 'terminal_flash'
    };
    return animations[toolName] || 'default';
  }
}
```

### 3. BattleServer - 多戰鬥管理

```javascript
class BattleServer {
  constructor() {
    this.battles = new Map();           // battleId → battle
    this.battleBridge = new BattleBridge();
    this.battleStore = new BattleStore();
    this.outputParser = new OutputParser();

    // 載入儲存的戰鬥
    this.loadBattles();

    // 定期儲存 (每 30 秒)
    setInterval(() => this.saveBattles(), 30000);

    // 優雅關機
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  // 啟動單個戰鬥
  startBattle(config) {
    const battleId = uuid();

    // 啟動 PTY 進程
    const battle = this.battleBridge.startBattle(battleId, {
      aiModel: config.aiModel,       // haiku | sonnet | opus
      prompt: config.prompt,
      workingDir: config.workingDir,
      isWorktree: config.isWorktree
    });

    // 設定輸出處理 (PTY → RPG 事件)
    this.battleBridge.onOutput = (id, data) => {
      const events = this.outputParser.parse(data);
      events.forEach(event => {
        this.handleRPGEvent(id, event);
        this.broadcastToBattle(id, { type: 'rpg_event', event });
      });
    };

    // 設定退出處理
    this.battleBridge.onExit = (id, exitInfo) => {
      this.handleBattleEnd(id, exitInfo);
    };

    // 設定錯誤處理
    this.battleBridge.onError = (id, error) => {
      this.handleBattleError(id, error);
    };

    this.battles.set(battleId, battle);
    return battleId;
  }

  // 並行啟動多個戰鬥
  startParallelBattles(configs) {
    return configs.map(config => this.startBattle(config));
  }

  // 處理 RPG 事件 (更新戰鬥狀態)
  handleRPGEvent(battleId, event) {
    const battle = this.battles.get(battleId);
    if (!battle) return;

    switch (event.type) {
      case 'skill_cast':
        // 扣除 MP
        battle.battleData.mp -= event.mpCost;
        if (battle.battleData.mp < 0) battle.battleData.mp = 0;

        // 記錄戰鬥日誌
        battle.battleData.battleLog.push({
          type: 'skill',
          skillName: event.skillName,
          mpCost: event.mpCost,
          timestamp: event.timestamp
        });
        break;

      case 'battle_end':
        if (event.result === 'victory') {
          // 獲得獎勵
          battle.battleData.exp += event.rewards.exp;
          battle.battleData.gold += event.rewards.gold;

          // 檢查升級
          this.checkLevelUp(battle);
        }
        break;
    }
  }

  // 廣播給戰鬥的所有觀戰者
  broadcastToBattle(battleId, message) {
    const battle = this.battles.get(battleId);
    if (!battle) return;

    const payload = JSON.stringify({
      ...message,
      battleId,
      timestamp: Date.now()
    });

    battle.connections.forEach(wsId => {
      const ws = this.getWebSocketById(wsId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  // WebSocket 連接管理
  handleWebSocketConnection(ws, battleId) {
    const wsId = uuid();
    ws.id = wsId;

    // 加入戰鬥觀戰
    const battle = this.battles.get(battleId);
    if (battle) {
      battle.connections.add(wsId);

      // 發送戰鬥狀態快照
      ws.send(JSON.stringify({
        type: 'battle_joined',
        battleId,
        battleState: {
          hp: battle.battleData.hp,
          mp: battle.battleData.mp,
          exp: battle.battleData.exp,
          gold: battle.battleData.gold,
          battleLog: battle.battleData.battleLog.slice(-20)
        }
      }));
    }

    // 清理
    ws.on('close', () => {
      this.battles.forEach(b => {
        b.connections.delete(wsId);
      });
    });
  }

  // 優雅關機
  async cleanup() {
    console.log('Shutting down gracefully...');

    // 1. 儲存戰鬥狀態
    await this.saveBattles();

    // 2. 停止所有戰鬥
    this.battleBridge.cleanup();

    // 3. 關閉 WebSocket
    this.wss.clients.forEach(ws => {
      ws.close(1000, 'Server shutting down');
    });

    // 4. 關閉伺服器
    this.server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // 5. 30 秒強制退出
    setTimeout(() => {
      console.error('Forced shutdown');
      process.exit(1);
    }, 30000);
  }
}
```

---

## 使用範例

### 範例 1：啟動單個戰鬥

```javascript
const battleServer = new BattleServer();

// 啟動 Haiku 戰鬥
const battleId = battleServer.startBattle({
  aiModel: 'haiku',
  prompt: '修復登入頁面的 CSS 問題',
  workingDir: process.cwd(),
  isWorktree: false
});

console.log(`Battle started: ${battleId}`);
```

### 範例 2：並行三個戰鬥

```javascript
// 同時派遣三個 AI
const [battle1, battle2, battle3] = battleServer.startParallelBattles([
  {
    aiModel: 'haiku',
    prompt: '更新 README',
    workingDir: process.cwd(),
    isWorktree: false
  },
  {
    aiModel: 'sonnet',
    prompt: '實作使用者認證功能',
    workingDir: '/worktrees/auth-feature',
    isWorktree: true
  },
  {
    aiModel: 'opus',
    prompt: '重構資料庫架構',
    workingDir: '/worktrees/db-refactor',
    isWorktree: true
  }
]);

console.log('Three parallel battles:', { battle1, battle2, battle3 });
```

### 範例 3：觀戰戰鬥

```javascript
// WebSocket 客戶端加入戰鬥
ws.send(JSON.stringify({
  type: 'join_battle',
  battleId: 'battle-uuid'
}));

// 接收 RPG 事件
ws.on('message', (data) => {
  const message = JSON.parse(data);

  if (message.type === 'rpg_event') {
    const { event } = message;

    switch (event.type) {
      case 'skill_cast':
        console.log(`✨ ${event.skillName} - MP: ${event.mpCost}`);
        break;

      case 'dialogue':
        console.log(`[${event.speaker}] ${event.message}`);
        break;

      case 'battle_end':
        console.log(`戰鬥結束: ${event.result}`);
        if (event.rewards) {
          console.log(`獲得: ${event.rewards.exp} EXP, ${event.rewards.gold} Gold`);
        }
        break;
    }
  }
});
```

---

## 關鍵設計決策

### 為何使用 node-pty？

| 特性 | node-pty | child_process.spawn() |
|------|----------|----------------------|
| **ANSI 色彩** | ✅ 完整支援 | ❌ Claude 會停用色彩 |
| **暫停/恢復** | ✅ SIGTSTP/SIGCONT 可靠 | ⚠️ 不可靠 |
| **終端調整** | ✅ resize() 方法 | ❌ 無法調整 |
| **多 Session** | ✅ 簡單隔離 | ⚠️ 複雜 |
| **Code Quest 評分** | ⭐⭐⭐⭐⭐ 9/10 | ⭐⭐ 2/10 |

### 循環緩衝設計

```javascript
// 為何使用 10KB 循環緩衝？
if (battle.outputBuffer.length > 10240) {
  battle.outputBuffer = battle.outputBuffer.slice(-5120);
}
```

**理由**:
- 防止記憶體洩漏 (長時間戰鬥會累積大量輸出)
- 保留最新的輸出 (最後 5KB)
- 新加入的觀戰者可以看到最近的戰鬥日誌

### 優雅關機設計

```javascript
// SIGTERM → 等待 5 秒 → SIGKILL
battle.pty.kill('SIGTERM');

setTimeout(() => {
  battle.pty.kill('SIGKILL');
}, 5000);
```

**理由**:
- SIGTERM 允許進程清理資源
- 5 秒足夠 Claude 儲存狀態
- SIGKILL 作為最後手段，防止僵屍進程

---

## 故障排除

### 問題 1：PTY 無法啟動

**症狀**: `Error: posix_spawnp failed`

**解決方案**:
```bash
# 檢查 spawn-helper 權限
chmod +x node_modules/node-pty/build/Release/spawn-helper
```

### 問題 2：色彩未顯示

**症狀**: Claude 輸出沒有 ANSI 色彩

**解決方案**:
```javascript
// 確保環境變數正確
env: {
  ...process.env,
  TERM: 'xterm-256color',
  FORCE_COLOR: '1',
  COLORTERM: 'truecolor'
}
```

### 問題 3：戰鬥無法停止

**症狀**: `stopBattle()` 後進程仍在執行

**解決方案**:
```javascript
// 使用 5 秒超時的強制終止
battle.pty.kill('SIGTERM');
setTimeout(() => {
  battle.pty.kill('SIGKILL');
}, 5000);
```

---

## 與其他系統整合

### 與 Worktree 系統整合

```javascript
// Worktree 隔離戰鬥
const worktreeBattle = battleServer.startBattle({
  aiModel: 'opus',
  prompt: '重構資料庫架構',
  workingDir: '/worktrees/db-refactor',  // 隔離的工作樹
  isWorktree: true                        // 標記為 Worktree
});
```

**視覺標示**:
- 🔵 藍色: 當前目錄戰鬥
- 🟣 紫色: Worktree 隔離戰鬥

### 與戰鬥管理系統整合

```javascript
// 快速切換選單
按 Tab 顯示:
┌─────────────────────────────────┐
│ 🎯 活躍戰鬥列表                  │
├─────────────────────────────────┤
│ 1. 🔵 [Haiku] 更新 README        │
│    HP: ████████░░ 80%            │
│    MP: ██████░░░░ 60%            │
│                                  │
│ 2. 🟣 [Sonnet] 實作認證功能 ⭐    │
│    HP: ██████████ 100%           │
│    MP: ████░░░░░░ 40%            │
│                                  │
│ 3. 🟣 [Opus] 重構資料庫           │
│    HP: ████░░░░░░ 40%            │
│    MP: ██░░░░░░░░ 20%            │
└─────────────────────────────────┘
```

---

## 相關文檔

深入了解請查看:

- **vultuk 架構分析**: `docs/ui-design/references/vultuk-architecture.md`
- **戰鬥管理設計**: `docs/ui-design/05-BATTLE-MANAGEMENT.md`
- **戰鬥系統規格**: `docs/ui-design/systems/03-battle-system.md`
- **專案總覽**: `/project-overview`
- **戰鬥管理 Skill**: `/battle-management`

---

## 快速參考

**關鍵 API**:

```javascript
// 啟動戰鬥
battleServer.startBattle(config)

// 並行戰鬥
battleServer.startParallelBattles([config1, config2, config3])

// 發送輸入
battleBridge.sendInput(battleId, 'command\n')

// 調整大小
battleBridge.resize(battleId, 120, 30)

// 停止戰鬥
battleBridge.stopBattle(battleId)

// 廣播事件
battleServer.broadcastToBattle(battleId, event)
```

**環境設定**:

```javascript
{
  name: 'xterm-256color',
  cols: 120,
  rows: 30,
  env: {
    TERM: 'xterm-256color',
    FORCE_COLOR: '1',
    COLORTERM: 'truecolor'
  }
}
```

記住：**node-pty 是 Code Quest 多戰鬥系統的基石**！
