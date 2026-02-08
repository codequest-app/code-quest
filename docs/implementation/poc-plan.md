# Code Quest POC 實作計畫

**建立日期**: 2026-02-09
**目標**: 建立完整的 Code Quest 概念驗證（Proof of Concept）

---

## 🎯 POC 目標

驗證 Code Quest 核心架構的可行性：
1. ✅ Bridge Layer 可以成功啟動和管理 Claude Code CLI
2. ✅ RPGUI 能夠呈現 Dragon Quest 風格的戰鬥 UI
3. ✅ Claude CLI 輸出可以解析為 RPG 事件
4. ✅ WebSocket 能夠即時推送事件到前端
5. ✅ 前端可以顯示戰鬥動畫和狀態更新

---

## 📁 專案結構

```
code-quest/
├── packages/
│   ├── bridge/                    # Bridge Layer (Node.js)
│   │   ├── src/
│   │   │   ├── index.ts          # 主入口
│   │   │   ├── cli-manager.ts    # CLI 進程管理
│   │   │   ├── output-parser.ts  # 輸出解析器
│   │   │   ├── rpg-mapper.ts     # RPG 事件映射
│   │   │   └── websocket.ts      # WebSocket 伺服器
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                        # Frontend (React + Vite)
│       ├── src/
│       │   ├── main.tsx          # React 入口
│       │   ├── App.tsx           # 主應用
│       │   ├── components/
│       │   │   ├── RPG/          # RPGUI 組件封裝
│       │   │   │   ├── Container.tsx
│       │   │   │   ├── Button.tsx
│       │   │   │   └── ProgressBar.tsx
│       │   │   └── Battle/       # 戰鬥相關組件
│       │   │       ├── BattleScreen.tsx
│       │   │       ├── EnemyDisplay.tsx
│       │   │       └── PlayerStatus.tsx
│       │   ├── hooks/
│       │   │   └── useWebSocket.ts
│       │   └── styles/
│       │       └── rpg.css       # RPGUI 樣式
│       ├── public/
│       │   └── assets/
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── package.json                   # Root package.json (workspace)
├── pnpm-workspace.yaml           # pnpm workspace 配置
└── turbo.json                     # Turborepo 配置
```

---

## 🔧 技術棧決策

### Backend (Bridge Layer)
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5
- **進程管理**: `node-pty` (偽終端)
- **WebSocket**: `ws` 庫
- **HTTP Server**: Express (可選，用於健康檢查)

### Frontend (UI)
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **UI Framework**: RPGUI + 自訂組件
- **Animation**: Framer Motion
- **State Management**: Zustand (輕量)
- **WebSocket Client**: 原生 WebSocket API

### Monorepo 工具
- **Package Manager**: pnpm
- **Build Orchestration**: Turborepo

---

## 📝 實作步驟

### Step 1: Monorepo 初始化 ✅

```bash
# 1. 初始化根目錄
npm init -y

# 2. 安裝 pnpm 和 turbo
npm install -g pnpm
pnpm add -D turbo

# 3. 創建 workspace 配置
# pnpm-workspace.yaml
packages:
  - 'packages/*'

# 4. 創建 turbo 配置
# turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

### Step 2: Bridge Layer 實作 ✅

#### 2.1 基礎設定

```bash
cd packages/bridge
pnpm init
pnpm add node-pty ws express
pnpm add -D typescript @types/node @types/ws @types/express tsx
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

#### 2.2 CLI Manager 實作

**src/cli-manager.ts**:
```typescript
import * as pty from 'node-pty';
import { EventEmitter } from 'events';

export interface CLIManagerConfig {
  cliPath?: string;
  workingDirectory?: string;
  model?: 'haiku' | 'sonnet' | 'opus';
}

export class CLIManager extends EventEmitter {
  private pty: pty.IPty | null = null;
  private isRunning = false;

  constructor(private config: CLIManagerConfig = {}) {
    super();
  }

  async start(prompt: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('CLI is already running');
    }

    const args = [
      '--model', this.config.model || 'sonnet',
      '--streaming',
      '--format', 'json',
      '-p', prompt
    ];

    this.pty = pty.spawn('claude', args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: this.config.workingDirectory || process.cwd(),
      env: process.env
    });

    this.isRunning = true;

    // 監聽輸出
    this.pty.on('data', (data) => {
      this.emit('output', data);
    });

    // 監聽退出
    this.pty.on('exit', (code, signal) => {
      this.isRunning = false;
      this.emit('exit', { code, signal });
    });
  }

  write(input: string): void {
    if (!this.pty || !this.isRunning) {
      throw new Error('CLI is not running');
    }
    this.pty.write(input);
  }

  kill(): void {
    if (this.pty) {
      this.pty.kill();
      this.isRunning = false;
    }
  }
}
```

#### 2.3 Output Parser 實作

**src/output-parser.ts**:
```typescript
export interface ClaudeEvent {
  type: string;
  [key: string]: any;
}

export interface RPGEvent {
  type: 'skill-cast' | 'mp-consumed' | 'dialogue' | 'battle-complete' | 'damage';
  data: any;
  timestamp: number;
}

export class OutputParser {
  parseRPGEvent(raw: string): RPGEvent | null {
    try {
      const claudeEvent: ClaudeEvent = JSON.parse(raw);

      // Tool Use → 技能施放
      if (claudeEvent.type === 'tool_use') {
        return {
          type: 'skill-cast',
          data: {
            skill: this.mapToolToSkill(claudeEvent.name),
            toolName: claudeEvent.name,
            params: claudeEvent.input
          },
          timestamp: Date.now()
        };
      }

      // Token Usage → MP 消耗
      if (claudeEvent.type === 'message' && claudeEvent.usage) {
        return {
          type: 'mp-consumed',
          data: {
            amount: this.calculateMP(claudeEvent.usage),
            tokens: claudeEvent.usage
          },
          timestamp: Date.now()
        };
      }

      // Text Content → 對話
      if (claudeEvent.type === 'content_block_delta') {
        return {
          type: 'dialogue',
          data: {
            text: claudeEvent.delta?.text || ''
          },
          timestamp: Date.now()
        };
      }

      return null;
    } catch (e) {
      // 非 JSON 行，當作純文字
      return {
        type: 'dialogue',
        data: { text: raw },
        timestamp: Date.now()
      };
    }
  }

  private mapToolToSkill(tool: string): string {
    const mapping: Record<string, string> = {
      'Read': '🔍 Vision Magic',
      'Write': '✍️ Creation Magic',
      'Edit': '✏️ Modification Magic',
      'Grep': '🔎 Search Magic',
      'Glob': '🗺️ Detection Magic',
      'Bash': '⚡ Command Magic',
      'Task': '🌟 Summon Magic',
      'WebFetch': '📚 Knowledge Magic',
      'WebSearch': '🌐 Exploration Magic'
    };
    return mapping[tool] || '❓ Unknown Magic';
  }

  private calculateMP(usage: { input_tokens: number; output_tokens: number }): number {
    // Sonnet 價格: $3/MTok (input), $15/MTok (output)
    const inputCost = (usage.input_tokens / 1_000_000) * 3;
    const outputCost = (usage.output_tokens / 1_000_000) * 15;

    // $1 = 100 MP
    return Math.ceil((inputCost + outputCost) * 100);
  }
}
```

#### 2.4 WebSocket Server 實作

**src/websocket.ts**:
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export class RPGWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      console.log('Client connected');
      this.clients.add(ws);

      ws.on('message', (data) => {
        this.handleMessage(ws, data.toString());
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: string) {
    try {
      const data = JSON.parse(message);

      if (data.type === 'start-battle') {
        this.emit('start-battle', data.prompt);
      } else if (data.type === 'send-input') {
        this.emit('send-input', data.input);
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  broadcast(event: any): void {
    const message = JSON.stringify(event);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  emit(event: string, data: any): void {
    // 這裡可以用 EventEmitter 模式，簡化版先用 broadcast
    this.broadcast({ type: event, data });
  }
}
```

#### 2.5 主入口整合

**src/index.ts**:
```typescript
import express from 'express';
import { createServer } from 'http';
import { CLIManager } from './cli-manager';
import { OutputParser } from './output-parser';
import { RPGWebSocketServer } from './websocket';

const app = express();
const server = createServer(app);
const wss = new RPGWebSocketServer(server);
const parser = new OutputParser();

let currentCLI: CLIManager | null = null;

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 處理 WebSocket 事件
wss.on('start-battle', (prompt: string) => {
  console.log('Starting battle with prompt:', prompt);

  // 創建新的 CLI Manager
  currentCLI = new CLIManager({
    model: 'sonnet',
    workingDirectory: process.cwd()
  });

  // 監聽輸出
  currentCLI.on('output', (data: string) => {
    // 解析每一行
    const lines = data.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      const rpgEvent = parser.parseRPGEvent(line);
      if (rpgEvent) {
        // 廣播 RPG 事件到前端
        wss.broadcast({
          type: 'rpg-event',
          event: rpgEvent
        });
      }
    });
  });

  // 監聽退出
  currentCLI.on('exit', ({ code, signal }) => {
    console.log('CLI exited:', code, signal);
    wss.broadcast({
      type: 'battle-complete',
      data: { code, signal }
    });
    currentCLI = null;
  });

  // 啟動 CLI
  currentCLI.start(prompt).catch(error => {
    console.error('Failed to start CLI:', error);
    wss.broadcast({
      type: 'error',
      error: error.message
    });
  });
});

wss.on('send-input', (input: string) => {
  if (currentCLI) {
    currentCLI.write(input + '\n');
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Bridge server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});
```

---

### Step 3: Frontend 實作 ✅

#### 3.1 基礎設定

```bash
cd packages/ui
pnpm create vite . --template react-ts
pnpm add rpgui framer-motion zustand
pnpm add -D @types/node
```

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  }
});
```

#### 3.2 引入 RPGUI 樣式

**src/main.tsx**:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/rpg.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**src/styles/rpg.css**:
```css
/* 引入 RPGUI */
@import 'rpgui/dist/rpgui.css';

/* 全域樣式 */
body {
  margin: 0;
  padding: 0;
  background: #000;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
}

#root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* DQ 主題色 */
:root {
  --color-gold: #f4d03f;
  --color-dark-gold: #c39c43;
  --color-hp: #4caf50;
  --color-mp: #2196f3;
  --color-exp: #ffc107;
}
```

#### 3.3 WebSocket Hook

**src/hooks/useWebSocket.ts**:
```typescript
import { useEffect, useState, useCallback } from 'react';

interface RPGEvent {
  type: string;
  data: any;
  timestamp: number;
}

export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [events, setEvents] = useState<RPGEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'rpg-event') {
          setEvents(prev => [...prev, data.event]);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  const startBattle = useCallback((prompt: string) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        type: 'start-battle',
        prompt
      }));
      setEvents([]); // 清空之前的事件
    }
  }, [ws, isConnected]);

  const sendInput = useCallback((input: string) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        type: 'send-input',
        input
      }));
    }
  }, [ws, isConnected]);

  return {
    isConnected,
    events,
    startBattle,
    sendInput
  };
}
```

#### 3.4 RPGUI 組件封裝

**src/components/RPG/Container.tsx**:
```tsx
import { ReactNode } from 'react';

interface ContainerProps {
  variant?: 'framed' | 'framed-golden' | 'framed-golden-2' | 'framed-grey';
  children: ReactNode;
  className?: string;
}

export function Container({ variant = 'framed-golden', children, className = '' }: ContainerProps) {
  return (
    <div className={`rpgui-container ${variant} ${className}`}>
      {children}
    </div>
  );
}
```

**src/components/RPG/Button.tsx**:
```tsx
import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'golden';
}

export function Button({ children, variant = 'default', className = '', ...props }: ButtonProps) {
  const variantClass = variant === 'golden' ? 'rpgui-button golden' : 'rpgui-button';

  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

**src/components/RPG/ProgressBar.tsx**:
```tsx
interface ProgressBarProps {
  current: number;
  max: number;
  color?: 'red' | 'green' | 'blue' | 'purple';
  label?: string;
}

export function ProgressBar({ current, max, color = 'green', label }: ProgressBarProps) {
  const percentage = Math.round((current / max) * 100);

  return (
    <div className="mb-2">
      {label && <label className="text-sm mb-1 block">{label}</label>}
      <div className={`rpgui-progress ${color}`}>
        <div className="rpgui-progress-fill" style={{ width: `${percentage}%` }} />
        <div className="rpgui-progress-track" />
        <span className="rpgui-progress-label">{current}/{max}</span>
      </div>
    </div>
  );
}
```

#### 3.5 戰鬥畫面組件

**src/components/Battle/BattleScreen.tsx**:
```tsx
import { Container } from '../RPG/Container';
import { Button } from '../RPG/Button';
import { ProgressBar } from '../RPG/ProgressBar';
import { motion } from 'framer-motion';

interface BattleScreenProps {
  player: {
    name: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
  };
  enemy: {
    name: string;
    hp: number;
    maxHp: number;
  };
  battleLog: string[];
  onStartBattle: () => void;
}

export function BattleScreen({ player, enemy, battleLog, onStartBattle }: BattleScreenProps) {
  return (
    <div className="rpgui-content flex flex-col items-center justify-center min-h-screen p-4">
      {/* 敵人顯示 */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <Container variant="framed-grey">
          <h2 className="text-xl mb-4">{enemy.name}</h2>
          <ProgressBar
            current={enemy.hp}
            max={enemy.maxHp}
            color="red"
            label="HP"
          />
        </Container>
      </motion.div>

      {/* 戰鬥日誌 */}
      <Container variant="framed" className="w-full max-w-2xl mb-8 max-h-40 overflow-y-auto">
        {battleLog.map((log, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="mb-2 text-sm"
          >
            {log}
          </motion.div>
        ))}
      </Container>

      {/* 玩家狀態 */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <Container variant="framed-golden">
          <h2 className="text-lg mb-4">{player.name}</h2>
          <ProgressBar
            current={player.hp}
            max={player.maxHp}
            color="green"
            label="HP"
          />
          <ProgressBar
            current={player.mp}
            max={player.maxMp}
            color="blue"
            label="MP"
          />
        </Container>
      </motion.div>

      {/* 開始戰鬥按鈕 */}
      <Button variant="golden" onClick={onStartBattle}>
        ⚔️ 開始戰鬥
      </Button>
    </div>
  );
}
```

#### 3.6 主應用組件

**src/App.tsx**:
```tsx
import { useState, useEffect } from 'react';
import { BattleScreen } from './components/Battle/BattleScreen';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { isConnected, events, startBattle } = useWebSocket('ws://localhost:3001');

  const [player] = useState({
    name: 'Code Warrior',
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50
  });

  const [enemy] = useState({
    name: 'Bug Monster',
    hp: 80,
    maxHp: 80
  });

  const [battleLog, setBattleLog] = useState<string[]>([
    '戰鬥準備中...',
    '請點擊「開始戰鬥」按鈕'
  ]);

  // 處理 RPG 事件
  useEffect(() => {
    events.forEach(event => {
      switch (event.type) {
        case 'skill-cast':
          setBattleLog(prev => [...prev, `✨ 施放 ${event.data.skill}`]);
          break;
        case 'mp-consumed':
          setBattleLog(prev => [...prev, `💙 消耗 ${event.data.amount} MP`]);
          break;
        case 'dialogue':
          if (event.data.text.trim()) {
            setBattleLog(prev => [...prev, `💬 ${event.data.text.trim()}`]);
          }
          break;
      }
    });
  }, [events]);

  const handleStartBattle = () => {
    setBattleLog(['⚔️ 戰鬥開始！']);
    startBattle('寫一個 hello world 函數');
  };

  return (
    <>
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded">
          未連接到伺服器
        </div>
      )}

      <BattleScreen
        player={player}
        enemy={enemy}
        battleLog={battleLog}
        onStartBattle={handleStartBattle}
      />
    </>
  );
}

export default App;
```

---

### Step 4: 整合測試 ✅

#### 4.1 啟動流程

```bash
# Terminal 1: 啟動 Bridge
cd packages/bridge
pnpm dev

# Terminal 2: 啟動 UI
cd packages/ui
pnpm dev
```

#### 4.2 測試檢查清單

- [ ] Bridge 啟動成功（http://localhost:3001/health 回應 OK）
- [ ] UI 啟動成功（http://localhost:3000 顯示畫面）
- [ ] WebSocket 連接成功（瀏覽器 console 無錯誤）
- [ ] 點擊「開始戰鬥」按鈕
- [ ] Bridge 成功啟動 Claude CLI
- [ ] 前端收到 RPG 事件並顯示在戰鬥日誌
- [ ] 技能施放動畫正常顯示
- [ ] HP/MP 條正常更新

---

## 🎯 成功標準

POC 視為成功需滿足：

1. ✅ **技術可行性驗證**
   - Claude CLI 可以被 node-pty 控制
   - 輸出可以被解析為結構化事件
   - WebSocket 即時通訊正常

2. ✅ **視覺呈現驗證**
   - RPGUI 成功呈現 DQ 風格
   - 金色框架、復古字體正常顯示
   - 動畫流暢（60fps）

3. ✅ **整合驗證**
   - Bridge ↔ Claude CLI 通訊正常
   - Bridge ↔ Frontend 通訊正常
   - 端到端流程完整

---

## 🔄 迭代計畫

POC 完成後的改進方向：

### Phase 1: 功能增強
- [ ] 多會話管理（Haiku/Sonnet/Opus 並行）
- [ ] 戰鬥日誌持久化
- [ ] 錯誤恢復機制

### Phase 2: UI 優化
- [ ] 技能動畫特效（PixiJS）
- [ ] 傷害數字彈出
- [ ] 勝利/失敗畫面

### Phase 3: 遊戲化增強
- [ ] EXP/Level 系統
- [ ] 成就系統
- [ ] 技能冷卻顯示

---

## 📋 決策記錄

所有實作過程中的決策將由 AI 自行決定，包括但不限於：

1. **技術選型**: 具體的 npm 套件版本
2. **程式碼風格**: TypeScript 嚴格模式、ESLint 規則
3. **錯誤處理**: try-catch 策略、錯誤訊息格式
4. **效能優化**: debounce/throttle 時機
5. **檔案組織**: 具體的檔案命名和目錄結構
6. **測試範圍**: 哪些功能需要單元測試

**原則**:
- 優先選擇簡單方案
- 避免過度設計
- 保持程式碼可讀性
- 專注於核心功能驗證

---

## 🚀 執行指令

當準備開始實作時，執行以下指令：

```bash
# 1. 切換新分支
git checkout -b poc/bridge-rpg-ui

# 2. 開始實作
# （按照上述步驟逐步實作）

# 3. 完成後提交
git add .
git commit -m "feat(poc): complete Bridge + RPGUI proof of concept"
git push origin poc/bridge-rpg-ui
```

---

## 📝 備註

- POC 目標是**驗證可行性**，不是完整產品
- 可以使用硬編碼的測試數據
- UI 可以簡化，不需要所有功能
- 重點在於**核心流程打通**

當 POC 成功後，將總結經驗並規劃下一階段的完整實作。
