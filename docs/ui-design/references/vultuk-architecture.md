# Vultuk Architecture Analysis - For Code Quest Implementation

> **來源**: [vultuk/claude-code-web](https://github.com/vultuk/claude-code-web)
> **目的**: 提供 Code Quest 多戰鬥系統的技術參考架構

---

## 總覽

vultuk/claude-code-web 是一個使用 **node-pty** 的完整 Claude CLI Web UI 實作，特別適合作為 Code Quest 多 AI 並行戰鬥系統的參考架構。

**核心技術棧**:
- **node-pty**: PTY (偽終端) 管理，提供完整的 TTY 支援
- **WebSocket**: 實時雙向通訊
- **xterm.js**: 前端終端模擬器
- **Express**: HTTP 伺服器
- **Session Persistence**: 檔案系統持久化

**關鍵優勢**:
- ✅ 完整的 ANSI 色彩支援
- ✅ 多 Session 並行管理
- ✅ 多客戶端同步觀看
- ✅ 可靠的暫停/恢復
- ✅ 動態終端尺寸調整
- ✅ 生產級錯誤處理

---

## 1. PTY 管理架構

### 1.1 Bridge 設計模式

vultuk 使用 **Bridge 類別** 來管理每個 CLI 工具的 PTY 進程：

```javascript
// 三個 Bridge：ClaudeBridge, AgentBridge, CodexBridge
class ClaudeBridge {
  sessions = new Map(); // sessionId → { pty, outputBuffer, active }

  startSession(sessionId, options = {}) {
    const { cols = 120, rows = 30, workingDir = null } = options;

    // 1. 尋找 Claude CLI 路徑 (7 個搜尋路徑)
    const claudeCommand = this.findClaudeCommand();

    // 2. 使用 node-pty 生成進程
    const pty = spawn(claudeCommand, ['--print'], {
      name: 'xterm-256color',      // 完整色彩支援
      cols, rows,
      cwd: workingDir || process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1',          // 強制啟用色彩
        COLORTERM: 'truecolor'     // True color 支援
      }
    });

    // 3. 建立 Session 追蹤
    const session = {
      id: sessionId,
      pty: pty,
      outputBuffer: '',            // 循環緩衝 (10KB 上限)
      active: true,
      created: Date.now(),
      workingDir: workingDir || process.cwd()
    };

    // 4. 設定事件處理器
    this.setupPtyHandlers(session);

    this.sessions.set(sessionId, session);
    return session;
  }
}
```

**Code Quest 應用**:
```javascript
// 為每個 AI 戰鬥建立獨立的 Bridge
class BattleBridge extends ClaudeBridge {
  startBattle(battleId, aiModel, prompt, options) {
    // aiModel: 'haiku' | 'sonnet' | 'opus'
    const claudeArgs = [
      '--print',
      '--model', aiModel,
      prompt
    ];

    return this.startSession(battleId, {
      ...options,
      args: claudeArgs
    });
  }
}
```

### 1.2 PTY 事件處理

```javascript
setupPtyHandlers(session) {
  const { pty, id: sessionId } = session;

  // 資料輸出事件
  pty.on('data', (data) => {
    session.outputBuffer += data;

    // 維護 10KB 循環緩衝
    if (session.outputBuffer.length > 10240) {
      session.outputBuffer = session.outputBuffer.slice(-5120);
    }

    // 廣播給所有連接的客戶端
    this.onOutput?.(sessionId, data);
  });

  // 進程退出事件
  pty.on('exit', (code, signal) => {
    session.active = false;
    this.onExit?.(sessionId, { code, signal });
    this.sessions.delete(sessionId);
  });

  // 錯誤處理
  pty.on('error', (error) => {
    console.error(`Session ${sessionId} error:`, error);
    session.active = false;
    this.onError?.(sessionId, error);
    this.sessions.delete(sessionId);
  });
}
```

**Code Quest 應用**:
```javascript
// 將 PTY 輸出轉換為 RPG 事件
setupBattleHandlers(session) {
  session.pty.on('data', (data) => {
    // 解析 Claude 輸出為戰鬥事件
    const rpgEvents = this.outputParser.parse(data);

    rpgEvents.forEach(event => {
      switch (event.type) {
        case 'tool_use':
          this.emitSkillCast(session.id, event);
          break;
        case 'text':
          this.emitDialogue(session.id, event);
          break;
        case 'thinking':
          this.emitThinking(session.id, event);
          break;
      }
    });
  });
}
```

### 1.3 指令探索 (Command Discovery)

vultuk 使用 **7 層搜尋路徑** 來找到 Claude CLI：

```javascript
findClaudeCommand() {
  const searchPaths = [
    '/home/ec2-user/.claude/local/claude',  // EC2 instance
    'claude',                                 // system PATH
    'claude-code',                            // alternative name
    path.join(os.homedir(), '.claude/local/claude'),
    path.join(os.homedir(), '.local/bin/claude'),
    '/usr/local/bin/claude',
    '/usr/bin/claude'
  ];

  for (const cmd of searchPaths) {
    try {
      execSync(`which ${cmd}`, { stdio: 'ignore' });
      return cmd;
    } catch {
      continue;
    }
  }

  throw new Error('Claude CLI not found');
}
```

**Code Quest 應用**:
```javascript
// 支援多個 AI CLI
findAICLI(aiType) {
  const searchConfigs = {
    claude: [
      'claude',
      path.join(os.homedir(), '.claude/local/claude')
    ],
    gemini: [
      'gemini-cli',
      path.join(os.homedir(), '.gemini/cli')
    ],
    // 未來擴展其他 AI
  };

  const paths = searchConfigs[aiType] || [];
  for (const cmd of paths) {
    if (this.commandExists(cmd)) return cmd;
  }

  throw new Error(`${aiType} CLI not found`);
}
```

---

## 2. Session 管理架構

### 2.1 雙層儲存系統

vultuk 使用 **記憶體 Map + 檔案系統持久化** 的雙層架構：

```javascript
class ClaudeCodeWebServer {
  // 記憶體層：快速存取
  claudeSessions = new Map(); // sessionId → session

  // 檔案層：持久化
  sessionStore = new SessionStore();

  constructor() {
    // 啟動時載入
    this.claudeSessions = await this.sessionStore.loadSessions();

    // 定期儲存 (每 30 秒)
    setInterval(() => {
      this.sessionStore.saveSessions(this.claudeSessions);
    }, 30000);

    // 優雅關機時儲存
    process.on('SIGINT', () => this.cleanup());
  }
}
```

**Session 資料結構**:

```javascript
const session = {
  // 基本資訊
  id: 'uuid',
  name: 'Session Name',
  created: Date.now(),
  lastActivity: Date.now(),

  // 狀態
  active: false,          // 是否有執行中的進程
  agent: 'claude',        // 'claude' | 'codex' | 'agent'

  // 環境
  workingDir: '/path/to/project',

  // 連接管理
  connections: new Set(), // WebSocket IDs

  // 輸出緩衝
  outputBuffer: [],       // 最後 1000 行

  // 使用統計
  usage: {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheTokens: 0,
    costs: {}
  }
};
```

**Code Quest 應用**:
```javascript
// 戰鬥 Session 擴展
const battleSession = {
  ...session,

  // RPG 特定資料
  battleData: {
    aiModel: 'sonnet',        // haiku | sonnet | opus
    playerLevel: 5,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 100,
    exp: 0,
    gold: 0,

    // 戰鬥狀態
    currentEnemy: {
      name: 'Bug Monster',
      hp: 80,
      maxHp: 120,
      level: 5
    },

    // 技能冷卻
    skillCooldowns: {
      'Read': 0,
      'Write': 5,    // 5 秒剩餘
      'Grep': 0
    },

    // 戰鬥日誌
    battleLog: [],

    // Worktree 隔離
    isWorktree: false,
    worktreePath: null
  }
};
```

### 2.2 Session 持久化

```javascript
class SessionStore {
  constructor() {
    this.storePath = path.join(
      process.env.HOME,
      '.claude-code-web',
      'sessions.json'
    );
  }

  async saveSessions(sessions) {
    const sessionArray = Array.from(sessions.entries())
      .map(([id, session]) => ({
        id,
        name: session.name,
        created: session.created,
        lastActivity: session.lastActivity,
        workingDir: session.workingDir,
        outputBuffer: session.outputBuffer
          .split('\n')
          .slice(-100)    // 只儲存最後 100 行
          .join('\n'),
        usage: session.usage
        // 注意: connections, pty 等執行時資料不儲存
      }));

    // 原子寫入 (使用暫存檔)
    const tempPath = this.storePath + '.tmp';
    await fs.promises.writeFile(
      tempPath,
      JSON.stringify(sessionArray, null, 2)
    );
    await fs.promises.rename(tempPath, this.storePath);
  }

  async loadSessions() {
    try {
      const data = await fs.promises.readFile(this.storePath, 'utf-8');
      const sessions = JSON.parse(data);

      // 驗證過期時間 (7 天)
      const now = Date.now();
      const WEEK = 7 * 24 * 60 * 60 * 1000;

      const activeSessions = new Map();
      sessions.forEach(session => {
        if (now - session.created < WEEK) {
          activeSessions.set(session.id, session);
        }
      });

      return activeSessions;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return new Map(); // 首次執行
      }

      // 損壞的檔案重新命名
      const backupPath = `${this.storePath}.corrupted-${Date.now()}`;
      await fs.promises.rename(this.storePath, backupPath);
      console.error('Corrupted session file backed up to:', backupPath);

      return new Map();
    }
  }
}
```

**Code Quest 應用**:
```javascript
// 儲存戰鬥狀態
class BattleStore extends SessionStore {
  constructor() {
    super();
    this.storePath = path.join(
      process.env.HOME,
      '.code-quest',
      'battles.json'
    );
  }

  async saveBattles(battles) {
    const battleArray = Array.from(battles.entries())
      .map(([id, battle]) => ({
        ...battle,
        // 只儲存必要的 RPG 資料
        battleData: {
          aiModel: battle.battleData.aiModel,
          playerLevel: battle.battleData.playerLevel,
          hp: battle.battleData.hp,
          mp: battle.battleData.mp,
          exp: battle.battleData.exp,
          gold: battle.battleData.gold,
          currentEnemy: battle.battleData.currentEnemy,
          isWorktree: battle.battleData.isWorktree
        },
        // 戰鬥日誌只保留最後 50 條
        battleLog: battle.battleData.battleLog.slice(-50)
      }));

    await this.atomicWrite(battleArray);
  }
}
```

### 2.3 生命週期管理

```javascript
class ClaudeCodeWebServer {
  createSession(sessionId, options = {}) {
    const session = {
      id: sessionId,
      name: options.name || `Session-${sessionId.slice(0, 8)}`,
      created: Date.now(),
      lastActivity: Date.now(),
      active: false,
      connections: new Set(),
      outputBuffer: [],
      usage: { requests: 0, inputTokens: 0, outputTokens: 0 }
    };

    this.claudeSessions.set(sessionId, session);
    this.sessionStore.saveSessions(this.claudeSessions);
    return session;
  }

  deleteSession(sessionId) {
    const session = this.claudeSessions.get(sessionId);
    if (!session) return;

    // 1. 通知所有連接的客戶端
    session.connections.forEach(wsId => {
      this.broadcastToConnection(wsId, {
        type: 'session_deleted',
        sessionId
      });
    });

    // 2. 停止執行中的進程
    if (session.agent === 'claude') {
      this.claudeBridge.stopSession(sessionId);
    }

    // 3. 從記憶體移除
    this.claudeSessions.delete(sessionId);

    // 4. 持久化更新
    this.sessionStore.saveSessions(this.claudeSessions);
  }

  cleanup() {
    console.log('Graceful shutdown initiated...');

    // 1. 儲存所有 Session
    await this.sessionStore.saveSessions(this.claudeSessions);

    // 2. 停止所有進程
    this.claudeBridge.cleanup();

    // 3. 關閉所有 WebSocket
    this.wss.clients.forEach(ws => {
      ws.close(1000, 'Server shutting down');
    });

    // 4. 關閉 HTTP 伺服器
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

## 3. WebSocket 通訊架構

### 3.1 連接建立

```javascript
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  // 1. 產生連接 ID
  const wsId = uuid();

  // 2. 解析 URL 參數
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');
  const token = url.searchParams.get('token') ||
                req.headers.authorization?.replace('Bearer ', '');

  // 3. 驗證身份
  if (!this.authManager.validateToken(token)) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  // 4. 自動加入 Session (如果指定)
  if (sessionId) {
    const session = this.claudeSessions.get(sessionId);
    if (session) {
      session.connections.add(wsId);

      // 重播輸出緩衝
      ws.send(JSON.stringify({
        type: 'session_joined',
        sessionId,
        outputBuffer: session.outputBuffer,
        sessionMetadata: {
          name: session.name,
          created: session.created,
          workingDir: session.workingDir
        }
      }));
    }
  }

  // 5. 訊息處理器
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    this.handleMessage(ws, wsId, message);
  });

  // 6. 清理
  ws.on('close', () => {
    this.claudeSessions.forEach(session => {
      session.connections.delete(wsId);
    });
  });
});
```

**Code Quest 應用**:
```javascript
// 戰鬥專用 WebSocket
wss.on('connection', (ws, req) => {
  const wsId = uuid();
  const { battleId, token } = parseConnectionParams(req);

  // 驗證身份
  if (!this.authManager.validateToken(token)) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  // 加入戰鬥觀戰
  if (battleId) {
    const battle = this.battles.get(battleId);
    if (battle) {
      battle.connections.add(wsId);

      // 發送戰鬥狀態快照
      ws.send(JSON.stringify({
        type: 'battle_joined',
        battleId,
        battleState: {
          player: {
            level: battle.battleData.playerLevel,
            hp: battle.battleData.hp,
            mp: battle.battleData.mp
          },
          enemy: battle.battleData.currentEnemy,
          log: battle.battleData.battleLog.slice(-20)
        }
      }));
    }
  }
});
```

### 3.2 訊息協議

**前端 → 後端**:

```javascript
// 發送輸入
{
  type: 'input',
  sessionId: 'uuid',
  data: 'command to send\n'
}

// 調整終端大小
{
  type: 'resize',
  sessionId: 'uuid',
  cols: 120,
  rows: 30
}

// 啟動 Claude
{
  type: 'start_claude',
  sessionId: 'uuid',
  workingDir: '/path/to/project'
}

// 停止 Session
{
  type: 'stop',
  sessionId: 'uuid'
}
```

**後端 → 前端**:

```javascript
// 輸出資料
{
  type: 'output',
  sessionId: 'uuid',
  data: 'terminal output text'
}

// 進程退出
{
  type: 'exit',
  sessionId: 'uuid',
  code: 0,
  signal: null
}

// 使用統計更新
{
  type: 'usage_update',
  sessionId: 'uuid',
  usage: {
    inputTokens: 100,
    outputTokens: 50,
    cacheTokens: 0
  }
}
```

**Code Quest 擴展協議**:

```javascript
// RPG 事件
{
  type: 'rpg_event',
  battleId: 'uuid',
  event: {
    type: 'skill_cast',
    skillName: 'Read',
    target: 'src/auth.ts',
    mpCost: 10,
    animation: 'scroll_unfurl'
  }
}

{
  type: 'rpg_event',
  battleId: 'uuid',
  event: {
    type: 'damage_dealt',
    amount: 25,
    target: 'enemy',
    damageType: 'logic'
  }
}

{
  type: 'rpg_event',
  battleId: 'uuid',
  event: {
    type: 'level_up',
    newLevel: 6,
    statsGain: { maxHp: 20, maxMp: 10 }
  }
}
```

### 3.3 廣播機制

```javascript
class ClaudeCodeWebServer {
  // 廣播給 Session 的所有連接
  broadcastToSession(sessionId, message) {
    const session = this.claudeSessions.get(sessionId);
    if (!session) return;

    const payload = JSON.stringify({
      ...message,
      sessionId
    });

    session.connections.forEach(wsId => {
      const ws = this.getWebSocketById(wsId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  // 廣播給單一連接
  broadcastToConnection(wsId, message) {
    const ws = this.getWebSocketById(wsId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // WebSocket ID 追蹤
  getWebSocketById(wsId) {
    for (const ws of this.wss.clients) {
      if (ws.id === wsId) return ws;
    }
    return null;
  }
}
```

**Code Quest 應用**:
```javascript
// 多戰鬥廣播管理
class BattleBroadcaster {
  // 廣播給特定戰鬥的觀戰者
  broadcastToBattle(battleId, event) {
    const battle = this.battles.get(battleId);
    if (!battle) return;

    const message = {
      type: 'rpg_event',
      battleId,
      event,
      timestamp: Date.now()
    };

    battle.connections.forEach(wsId => {
      this.sendToConnection(wsId, message);
    });
  }

  // 廣播給所有活躍戰鬥
  broadcastToAllBattles(event) {
    this.battles.forEach((battle, battleId) => {
      if (battle.active) {
        this.broadcastToBattle(battleId, event);
      }
    });
  }

  // 廣播系統通知 (例如：伺服器維護)
  broadcastSystemNotification(notification) {
    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'system_notification',
          notification
        }));
      }
    });
  }
}
```

---

## 4. 多 Session 並行處理

### 4.1 Session 隔離模型

```javascript
class ClaudeCodeWebServer {
  // 每個 Session 完全獨立
  claudeSessions = new Map(); // sessionId → session

  // 每個 Session 包含:
  // - 獨立的 PTY 進程
  // - 獨立的工作目錄
  // - 獨立的輸出緩衝
  // - 獨立的連接集合
  // - 獨立的使用統計
}

// Bridge 層也維護獨立 Session
class ClaudeBridge {
  sessions = new Map(); // sessionId → { pty, outputBuffer }

  startSession(sessionId, options) {
    // 每個 Session 生成完全獨立的 PTY 進程
    const pty = spawn('claude', args, {
      cwd: options.workingDir,
      env: { ...process.env }
    });

    this.sessions.set(sessionId, {
      id: sessionId,
      pty: pty,
      outputBuffer: '',
      active: true
    });
  }
}
```

**Code Quest 應用**:
```javascript
// 多 AI 並行戰鬥
class ParallelBattleManager {
  battles = new Map(); // battleId → battle

  // 同時啟動多個戰鬥
  startParallelBattles(configs) {
    const battleIds = [];

    configs.forEach(config => {
      const battleId = uuid();

      // 為每個戰鬥建立獨立 Session
      const battle = this.createBattle(battleId, {
        aiModel: config.aiModel,     // haiku, sonnet, opus
        prompt: config.prompt,
        workingDir: config.workingDir,
        isWorktree: config.isWorktree
      });

      battleIds.push(battleId);
    });

    return battleIds;
  }

  // 範例：並行 3 個戰鬥
  async launchTripleBattle() {
    const battleIds = this.startParallelBattles([
      {
        aiModel: 'haiku',
        prompt: '更新 README',
        workingDir: process.cwd(),
        isWorktree: false
      },
      {
        aiModel: 'sonnet',
        prompt: '實作登入功能',
        workingDir: '/worktrees/login-feature',
        isWorktree: true
      },
      {
        aiModel: 'opus',
        prompt: '重構資料庫架構',
        workingDir: '/worktrees/db-refactor',
        isWorktree: true
      }
    ]);

    console.log('Three parallel battles started:', battleIds);
  }
}
```

### 4.2 多客戶端同步觀看

```javascript
// 多個 WebSocket 可以連接到同一個 Session
class ClaudeCodeWebServer {
  handleJoinSession(ws, wsId, sessionId) {
    const session = this.claudeSessions.get(sessionId);
    if (!session) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Session not found'
      }));
      return;
    }

    // 加入連接集合
    session.connections.add(wsId);

    // 重播歷史輸出
    ws.send(JSON.stringify({
      type: 'session_joined',
      sessionId,
      outputBuffer: session.outputBuffer,
      sessionMetadata: {
        name: session.name,
        created: session.created,
        active: session.active
      }
    }));

    console.log(`Client ${wsId} joined session ${sessionId}`);
    console.log(`Total observers: ${session.connections.size}`);
  }

  // 當 PTY 有輸出時，廣播給所有觀察者
  setupPtyBroadcasting() {
    this.claudeBridge.onOutput = (sessionId, data) => {
      this.broadcastToSession(sessionId, {
        type: 'output',
        data
      });
    };
  }
}
```

**Code Quest 應用**:
```javascript
// 多人觀戰戰鬥
class BattleSpectator {
  // 玩家可以邀請其他人觀看自己的戰鬥
  inviteSpectator(battleId, spectatorWsId) {
    const battle = this.battles.get(battleId);
    if (!battle) return;

    // 加入觀戰者
    battle.spectators.add(spectatorWsId);

    // 發送完整戰鬥狀態
    this.sendToConnection(spectatorWsId, {
      type: 'spectator_joined',
      battleId,
      battleState: this.getBattleSnapshot(battle)
    });

    // 通知其他觀戰者
    this.broadcastToBattle(battleId, {
      type: 'spectator_joined',
      spectatorId: spectatorWsId,
      spectatorCount: battle.spectators.size
    });
  }

  // 範例：教學模式
  // 老師啟動戰鬥，學生觀看 AI 如何解決問題
  teachingMode(teacherBattleId, studentWsIds) {
    studentWsIds.forEach(studentWsId => {
      this.inviteSpectator(teacherBattleId, studentWsId);
    });
  }
}
```

### 4.3 資源管理與清理

```javascript
class ClaudeCodeWebServer {
  // 優雅關機
  async cleanup() {
    console.log('Shutting down gracefully...');

    // 1. 儲存 Session 狀態
    await this.sessionStore.saveSessions(this.claudeSessions);

    // 2. 停止所有 PTY 進程
    this.claudeBridge.cleanup();
    this.agentBridge.cleanup();
    this.codexBridge.cleanup();

    // 3. 關閉所有 WebSocket 連接
    this.wss.clients.forEach(ws => {
      ws.close(1000, 'Server shutting down');
    });

    // 4. 關閉 HTTP 伺服器
    this.server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // 5. 30 秒後強制退出
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }
}

// Bridge 層清理
class ClaudeBridge {
  cleanup() {
    this.sessions.forEach((session, sessionId) => {
      this.stopSession(sessionId);
    });
  }

  stopSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.active = false;

    // 1. 先發送 SIGTERM (優雅關閉)
    session.pty.kill('SIGTERM');

    // 2. 5 秒後如果還在執行，發送 SIGKILL (強制終止)
    const killTimeout = setTimeout(() => {
      session.pty.kill('SIGKILL');
    }, 5000);

    // 3. 監聽退出事件
    session.pty.on('exit', () => {
      clearTimeout(killTimeout);
      this.sessions.delete(sessionId);
      console.log(`Session ${sessionId} terminated`);
    });
  }
}
```

---

## 5. 錯誤處理與恢復

### 5.1 PTY 錯誤處理

```javascript
class ClaudeBridge {
  setupPtyHandlers(session) {
    const { pty, id: sessionId } = session;

    // 錯誤事件
    pty.on('error', (error) => {
      console.error(`Session ${sessionId} error:`, error);

      session.active = false;

      // 呼叫錯誤回調
      this.onError?.(sessionId, {
        type: 'pty_error',
        message: error.message,
        stack: error.stack
      });

      // 清理 Session
      this.sessions.delete(sessionId);

      // 通知伺服器
      this.server?.notifySessionError(sessionId, error);
    });

    // 退出事件
    pty.on('exit', (code, signal) => {
      session.active = false;

      const exitInfo = {
        code,
        signal,
        timestamp: Date.now(),
        message: signal
          ? `Process killed by ${signal}`
          : `Process exited with code ${code}`
      };

      console.log(`Session ${sessionId} exited:`, exitInfo);

      // 呼叫退出回調
      this.onExit?.(sessionId, exitInfo);

      // 清理
      this.sessions.delete(sessionId);
    });
  }
}
```

**Code Quest 應用**:
```javascript
// 戰鬥錯誤處理
class BattleErrorHandler {
  setupBattleHandlers(battle) {
    const { pty, id: battleId } = battle;

    pty.on('error', (error) => {
      // 將錯誤轉換為 RPG 事件
      this.broadcastToBattle(battleId, {
        type: 'battle_error',
        errorType: 'pty_failure',
        message: `⚠️ 戰鬥中斷: ${error.message}`,
        canRetry: true
      });

      // 記錄到戰鬥日誌
      battle.battleData.battleLog.push({
        type: 'error',
        timestamp: Date.now(),
        message: error.message
      });

      // 標記戰鬥失敗
      this.markBattleFailed(battleId, error);
    });

    pty.on('exit', (code, signal) => {
      if (code !== 0) {
        // 非正常退出
        this.broadcastToBattle(battleId, {
          type: 'battle_failed',
          reason: signal || `Exit code ${code}`,
          canRetry: true
        });
      } else {
        // 正常完成
        this.broadcastToBattle(battleId, {
          type: 'battle_victory',
          rewards: this.calculateRewards(battle)
        });
      }
    });
  }
}
```

### 5.2 WebSocket 重連機制

```javascript
// 前端重連邏輯
class TerminalConnection {
  maxReconnectAttempts = 5;
  reconnectDelay = 1000;      // 初始延遲 1 秒
  reconnectAttempts = 0;

  connect(sessionId = null) {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = `${protocol}//${location.host}`;
    if (sessionId) {
      wsUrl += `?sessionId=${sessionId}`;
    }
    wsUrl = window.authManager.getWebSocketUrl(wsUrl);

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      // 重置重連計數
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      console.log('Connected to server');

      // 觸發連接成功事件
      this.onConnected?.();
    };

    this.socket.onerror = (event) => {
      console.error('WebSocket error:', event);
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);

      // 嘗試重連
      this.attemptReconnect();
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.onReconnectFailed?.();
      return;
    }

    this.reconnectAttempts++;

    // 指數退避 (1s → 2s → 4s → 8s → 16s)
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    // 觸發重連中事件
    this.onReconnecting?.(this.reconnectAttempts, delay);

    setTimeout(() => {
      this.connect(this.currentSessionId);
    }, delay);
  }

  // 手動重連
  forceReconnect() {
    this.reconnectAttempts = 0;
    this.socket?.close();
    this.connect(this.currentSessionId);
  }
}
```

**Code Quest 應用**:
```javascript
// 戰鬥重連處理
class BattleConnection extends TerminalConnection {
  constructor(battleId) {
    super();
    this.battleId = battleId;

    // 重連回調
    this.onReconnecting = (attempt, delay) => {
      // 顯示重連 UI
      this.showReconnectingModal(attempt, delay);
    };

    this.onConnected = () => {
      // 隱藏重連 UI
      this.hideReconnectingModal();

      // 請求戰鬥狀態同步
      this.requestBattleSync();
    };

    this.onReconnectFailed = () => {
      // 顯示錯誤訊息
      this.showErrorModal({
        title: '連接失敗',
        message: '無法重新連接到戰鬥伺服器',
        actions: [
          { label: '重試', onClick: () => this.forceReconnect() },
          { label: '返回城鎮', onClick: () => this.returnToTown() }
        ]
      });
    };
  }

  requestBattleSync() {
    // 請求完整戰鬥狀態
    this.send({
      type: 'sync_battle_state',
      battleId: this.battleId
    });
  }
}
```

### 5.3 損壞檔案恢復

```javascript
class SessionStore {
  async loadSessions() {
    try {
      const data = await fs.promises.readFile(this.storePath, 'utf-8');
      const sessions = JSON.parse(data);

      // 驗證過期時間 (7 天)
      const now = Date.now();
      const WEEK = 7 * 24 * 60 * 60 * 1000;

      return sessions.reduce((map, session) => {
        if (now - session.created < WEEK) {
          map.set(session.id, session);
        }
        return map;
      }, new Map());

    } catch (error) {
      if (error.code === 'ENOENT') {
        // 檔案不存在 (首次執行)
        return new Map();
      }

      // 損壞的 JSON - 備份並重新開始
      const backupPath = `${this.storePath}.corrupted-${Date.now()}`;
      await fs.promises.rename(this.storePath, backupPath);

      console.error('Sessions file was corrupted, backed up to:', backupPath);

      // 嘗試從備份恢復
      const recovered = await this.recoverFromBackup(backupPath);
      if (recovered) {
        console.log('Recovered sessions from backup');
        return recovered;
      }

      return new Map(); // 全新開始
    }
  }

  async recoverFromBackup(backupPath) {
    try {
      // 逐行讀取，跳過損壞的行
      const content = await fs.promises.readFile(backupPath, 'utf-8');
      const lines = content.split('\n');

      const validSessions = [];
      let currentSession = '';

      for (const line of lines) {
        currentSession += line;
        try {
          // 嘗試解析
          const sessions = JSON.parse(currentSession);
          validSessions.push(...sessions);
          currentSession = '';
        } catch {
          // 繼續累積
          continue;
        }
      }

      if (validSessions.length > 0) {
        return new Map(validSessions.map(s => [s.id, s]));
      }

      return null;
    } catch {
      return null;
    }
  }
}
```

---

## 6. 身份驗證與速率限制

### 6.1 Token 驗證

```javascript
class AuthManager {
  constructor(requiredToken = null) {
    this.requiredToken = requiredToken;
    this.requests = {}; // IP → count
  }

  validateToken(token) {
    if (!this.requiredToken) return true; // 未啟用驗證
    return token === this.requiredToken;
  }

  createMiddleware() {
    return (req, res, next) => {
      if (!this.requiredToken) {
        next();
        return;
      }

      // 檢查 Token
      const token = req.headers.authorization?.replace('Bearer ', '') ||
                    req.query.token;

      if (!this.validateToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 速率限制
      const key = req.ip;
      if (!this.rateLimit(key)) {
        return res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: 60
        });
      }

      next();
    };
  }
}
```

### 6.2 速率限制

```javascript
class AuthManager {
  rateLimit(identifier, limit = 100, windowMs = 60 * 1000) {
    const now = Date.now();
    const windowKey = Math.floor(now / windowMs);
    const key = `${identifier}:${windowKey}`;

    this.requests[key] = (this.requests[key] || 0) + 1;

    if (this.requests[key] > limit) {
      return false; // 超過限制
    }

    return true;
  }

  // 清理舊的速率限制記錄
  cleanupRateLimit(olderThanHours = 1) {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    Object.keys(this.requests).forEach(key => {
      const timestamp = parseInt(key.split(':')[1]) * 60 * 1000;
      if (timestamp < cutoff) {
        delete this.requests[key];
      }
    });
  }
}
```

**Code Quest 應用**:
```javascript
// 遊戲內速率限制
class BattleRateLimiter {
  // 防止戰鬥刷頻
  canStartBattle(playerId) {
    const key = `battle:${playerId}`;
    const limit = 10;           // 每分鐘最多 10 場戰鬥
    const windowMs = 60 * 1000;

    return this.authManager.rateLimit(key, limit, windowMs);
  }

  // 防止 Skill 濫用
  canCastSkill(playerId, skillName) {
    const key = `skill:${playerId}:${skillName}`;
    const limit = 30;           // 每分鐘最多 30 次同一技能
    const windowMs = 60 * 1000;

    return this.authManager.rateLimit(key, limit, windowMs);
  }
}
```

---

## 7. 使用統計與分析

### 7.1 Token 追蹤

```javascript
class UsageAnalytics {
  sessions = new Map(); // sessionId → sessionData
  rollingWindows = new Map(); // windowId → windowData

  startSession(sessionId) {
    const sessionData = {
      id: sessionId,
      startTime: Date.now(),
      expirationTime: Date.now() + (5 * 60 * 60 * 1000), // 5 小時
      tokens: { input: 0, output: 0, cache: 0 },
      windows: [] // 多個重疊的時間視窗
    };

    this.sessions.set(sessionId, sessionData);

    // 建立滾動視窗 (5, 10, 15, 30, 60 分鐘)
    const windowDurations = [5, 10, 15, 30, 60];
    windowDurations.forEach(minutes => {
      const windowId = `${sessionId}-${minutes}m`;
      this.rollingWindows.set(windowId, {
        duration: minutes * 60 * 1000,
        tokens: 0,
        startTime: Date.now()
      });
    });
  }

  recordTokenUsage(sessionId, inputTokens, outputTokens, cacheTokens) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 更新 Session 總計
    session.tokens.input += inputTokens;
    session.tokens.output += outputTokens;
    session.tokens.cache += cacheTokens;

    // 更新滾動視窗
    const totalTokens = inputTokens + outputTokens + cacheTokens;
    session.windows.forEach(windowId => {
      const window = this.rollingWindows.get(windowId);
      if (window) {
        window.tokens += totalTokens;
      }
    });
  }

  calculateBurnRate() {
    // 計算所有活躍 Session 的加權平均燒錢率
    const activeSessions = Array.from(this.sessions.values())
      .filter(s => Date.now() < s.expirationTime);

    if (activeSessions.length === 0) return 0;

    const rates = activeSessions.map(session => {
      const elapsed = (Date.now() - session.startTime) / 1000; // 秒
      const totalTokens = session.tokens.input + session.tokens.output;
      return totalTokens / elapsed; // tokens/秒
    });

    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  predictDepletion(currentBalance) {
    const burnRate = this.calculateBurnRate();
    if (burnRate === 0) return Infinity;

    // 以目前燒錢率，多久會用完餘額
    const secondsRemaining = currentBalance / burnRate;
    return new Date(Date.now() + (secondsRemaining * 1000));
  }
}
```

**Code Quest 應用**:
```javascript
// RPG 資源追蹤
class BattleUsageTracker extends UsageAnalytics {
  recordBattleUsage(battleId, event) {
    const battle = this.battles.get(battleId);
    if (!battle) return;

    // Token → MP 轉換
    const mpCost = this.calculateMPCost(event);
    battle.battleData.mp -= mpCost;

    // 記錄到統計
    this.recordTokenUsage(
      battleId,
      event.inputTokens || 0,
      event.outputTokens || 0,
      event.cacheTokens || 0
    );

    // 廣播 MP 更新
    this.broadcastToBattle(battleId, {
      type: 'mp_update',
      currentMP: battle.battleData.mp,
      maxMP: battle.battleData.maxMp,
      mpCost: mpCost
    });

    // 檢查 MP 耗盡
    if (battle.battleData.mp <= 0) {
      this.handleMPDepletion(battleId);
    }
  }

  calculateMPCost(event) {
    // 根據 AI 模型計算 MP 消耗
    const baseCost = {
      'haiku': 5,   // 便宜
      'sonnet': 15, // 平衡
      'opus': 50    // 昂貴
    };

    const modelCost = baseCost[event.aiModel] || 15;
    const tokenMultiplier = (event.inputTokens + event.outputTokens) / 1000;

    return Math.ceil(modelCost * tokenMultiplier);
  }
}
```

---

## 8. Code Quest 整合建議

### 8.1 架構映射

| vultuk 元件 | Code Quest 元件 | 說明 |
|------------|----------------|------|
| ClaudeBridge | BattleBridge | 管理單個 AI 戰鬥的 PTY 進程 |
| ClaudeCodeWebServer | BattleServer | 管理多個並行戰鬥 |
| SessionStore | BattleStore | 持久化戰鬥狀態 |
| UsageAnalytics | BattleUsageTracker | 追蹤 MP/Token 使用 |
| AuthManager | PlayerAuthManager | 玩家身份驗證 |

### 8.2 關鍵實作步驟

**步驟 1**: 建立 BattleBridge

```javascript
class BattleBridge extends ClaudeBridge {
  startBattle(battleId, config) {
    const { aiModel, prompt, workingDir, isWorktree } = config;

    // 1. 尋找 Claude CLI
    const claudeCommand = this.findClaudeCommand();

    // 2. 組裝參數
    const args = [
      '--print',
      '--model', aiModel,
      prompt
    ];

    // 3. 生成 PTY
    const pty = spawn(claudeCommand, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: workingDir,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1',
        COLORTERM: 'truecolor'
      }
    });

    // 4. 建立戰鬥 Session
    const battle = {
      id: battleId,
      pty: pty,
      outputBuffer: '',
      battleData: this.initBattleData(config),
      connections: new Set()
    };

    // 5. 設定事件處理
    this.setupBattleHandlers(battle);

    this.sessions.set(battleId, battle);
    return battle;
  }

  initBattleData(config) {
    return {
      aiModel: config.aiModel,
      playerLevel: config.playerLevel || 1,
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100,
      exp: 0,
      gold: 0,
      currentEnemy: this.generateEnemy(config),
      battleLog: [],
      isWorktree: config.isWorktree,
      worktreePath: config.isWorktree ? config.workingDir : null
    };
  }
}
```

**步驟 2**: 建立 OutputParser (PTY → RPG 事件)

```javascript
class OutputParser {
  parse(data) {
    const events = [];

    // 解析 Claude 輸出
    const lines = data.split('\n');
    for (const line of lines) {
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
        // 非 JSON 行 - 直接輸出
        if (line.trim()) {
          events.push({
            type: 'dialogue',
            speaker: 'system',
            message: line
          });
        }
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

  mapToolToSkill(toolName) {
    const mapping = {
      'Read': '閱讀卷軸',
      'Write': '書寫魔法',
      'Edit': '編輯之術',
      'Grep': '搜尋之眼',
      'Bash': '終端召喚'
    };
    return mapping[toolName] || toolName;
  }
}
```

**步驟 3**: 建立 BattleServer

```javascript
class BattleServer {
  constructor() {
    this.battles = new Map();
    this.battleBridge = new BattleBridge();
    this.battleStore = new BattleStore();
    this.outputParser = new OutputParser();

    // 載入儲存的戰鬥
    this.loadBattles();

    // 定期儲存
    setInterval(() => this.saveBattles(), 30000);
  }

  startBattle(config) {
    const battleId = uuid();

    // 啟動戰鬥
    const battle = this.battleBridge.startBattle(battleId, config);

    // 設定輸出處理
    this.battleBridge.onOutput = (id, data) => {
      const events = this.outputParser.parse(data);
      events.forEach(event => {
        this.broadcastToBattle(id, { type: 'rpg_event', event });
      });
    };

    this.battles.set(battleId, battle);
    return battleId;
  }

  // 多戰鬥並行
  startParallelBattles(configs) {
    return configs.map(config => this.startBattle(config));
  }
}
```

---

## 9. 總結

### 9.1 核心要點

1. **node-pty 是關鍵** - 提供完整的 TTY 支援，是實現多戰鬥系統的基礎
2. **Bridge 模式** - 每個 AI 戰鬥是獨立的 PTY 進程，透過 Bridge 管理
3. **雙層儲存** - 記憶體 Map (快速) + 檔案系統 (持久化)
4. **多客戶端同步** - 使用 WebSocket 廣播，支援多人觀戰
5. **完整錯誤處理** - PTY 錯誤、WebSocket 重連、檔案損壞恢復
6. **生產級品質** - 速率限制、身份驗證、優雅關機

### 9.2 vultuk 優勢

- ✅ **經過驗證的架構** - 已在生產環境運行
- ✅ **完整的實作** - 包含所有必要元件
- ✅ **可擴展設計** - 易於添加新功能
- ✅ **錯誤恢復機制** - 生產級的可靠性
- ✅ **性能優化** - 循環緩衝、原子寫入、速率限制

### 9.3 與 spawn() 比較

| 特性 | node-pty | spawn() |
|------|----------|---------|
| 色彩支援 | ✅ 完整 | ❌ 無 |
| 暫停/恢復 | ✅ 可靠 | ⚠️ 不可靠 |
| 終端調整 | ✅ 完整 | ❌ 無 |
| 多 Session | ✅ 簡單 | ⚠️ 複雜 |
| 生產準備度 | ✅ 高 | ⚠️ 低 |

### 9.4 下一步行動

1. **研究 vultuk 原始碼** - 克隆倉庫並運行
2. **建立 POC** - 實作單個戰鬥 (BattleBridge + OutputParser)
3. **測試多戰鬥** - 驗證並行戰鬥隔離性
4. **添加 RPG 層** - 將 PTY 輸出映射為 RPG 事件
5. **Worktree 整合** - 為不同戰鬥使用隔離的工作樹

---

## 參考資源

- **倉庫**: https://github.com/vultuk/claude-code-web
- **node-pty 文檔**: https://github.com/microsoft/node-pty
- **xterm.js 文檔**: https://xtermjs.org/
- **WebSocket 規範**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

**Code Quest 相關文檔**:
- `docs/ui-design/00-OVERVIEW.md` - 專案總覽
- `docs/ui-design/05-BATTLE-MANAGEMENT.md` - 戰鬥管理設計
- `docs/ui-design/systems/03-battle-system.md` - 戰鬥系統詳細規格

---

> 本文檔基於 vultuk/claude-code-web 的深度分析
> 最後更新: 2026-02-09
