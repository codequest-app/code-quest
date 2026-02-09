# Code Quest POC 實作計畫

**建立日期**: 2026-02-09
**目標**: 建立完整的 Code Quest 概念驗證（Proof of Concept）

---

## 🎯 POC 目標

驗證 Code Quest 核心架構的可行性：

### Phase 0: 驗證階段 ✅ (已完成)
1. ✅ node-pty 可以成功控制 Claude Code 和 Gemini CLI
2. ✅ 正確的 CLI 參數：`--output-format stream-json --verbose`
3. ✅ 可捕獲所有 RPG 所需資訊（Tool use、Token、Cost）
4. ✅ 並行多進程驗證通過
5. ✅ Worktree 隔離驗證通過

### Phase 1: xterm.js 終端整合 🚧 (進行中)
1. 🎯 使用 xterm.js 呈現原始終端介面
2. 🎯 node-pty + Socket.io 實時串流輸出
3. 🎯 Tab 介面支援多個 AI 實例（Claude/Gemini）
4. 🎯 可同時開啟多個終端（Haiku/Sonnet/Opus）
5. 🎯 基礎的實例管理（新增/關閉/切換）

### Phase 2: RPG 包裝層 ⏳ (待開始)
1. ⏳ RPGUI 能夠呈現 Dragon Quest 風格的戰鬥 UI
2. ⏳ Claude CLI 輸出可以解析為 RPG 事件
3. ⏳ 前端可以顯示戰鬥動畫和狀態更新
4. ⏳ 從 Tab 介面改為 DQ 風格彈出選單

---

## 📁 專案結構

### Phase 1 結構（xterm.js 終端整合）

```
code-quest/
├── packages/
│   ├── server/                    # Backend (Node.js + Express + Socket.io)
│   │   ├── src/
│   │   │   ├── index.ts          # 主入口
│   │   │   ├── terminal/
│   │   │   │   ├── manager.ts    # 終端實例管理器
│   │   │   │   ├── session.ts    # 單一終端 Session
│   │   │   │   └── types.ts      # 類型定義
│   │   │   ├── socket/
│   │   │   │   └── handlers.ts   # Socket.io 事件處理
│   │   │   └── __tests__/        # 測試文件
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── client/                    # Frontend (React + Vite)
│       ├── src/
│       │   ├── main.tsx          # React 入口
│       │   ├── App.tsx           # 主應用
│       │   ├── components/
│       │   │   ├── Terminal/     # 終端相關組件
│       │   │   │   ├── Terminal.tsx       # xterm.js 包裝
│       │   │   │   ├── TerminalTabs.tsx   # Tab 介面
│       │   │   │   └── NewTerminalDialog.tsx  # 新增終端對話框
│       │   │   └── __tests__/    # 組件測試
│       │   ├── hooks/
│       │   │   ├── useTerminal.ts    # Terminal hook
│       │   │   ├── useSocket.ts      # Socket.io hook
│       │   │   └── __tests__/        # Hook 測試
│       │   ├── stores/
│       │   │   └── terminalStore.ts  # 終端狀態管理
│       │   └── types/
│       │       └── terminal.ts       # 類型定義
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── vitest.config.ts      # Vitest 配置
│
├── package.json                   # Root package.json (workspace)
├── pnpm-workspace.yaml           # pnpm workspace 配置
└── turbo.json                     # Turborepo 配置
```

### Phase 2 結構（RPG 包裝層）- 未來擴展

```
packages/
├── server/
│   └── src/
│       ├── parsers/
│       │   ├── output-parser.ts  # CLI 輸出解析
│       │   └── rpg-mapper.ts     # RPG 事件映射
│       └── __tests__/
│
└── client/
    └── src/
        ├── components/
        │   ├── RPG/              # RPGUI 組件
        │   └── Battle/           # 戰鬥畫面
        └── styles/
            └── rpg.css
```

---

## 🔧 技術棧決策

### Backend (Server)
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5
- **Framework**: Express 4
- **進程管理**: `node-pty` ^1.0.0 (偽終端)
- **WebSocket**: `socket.io` ^4.7.0 (雙向通訊)
- **Testing**: Vitest + Supertest

### Frontend (Client)
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **Terminal**: `xterm` ^5.3.0 + `xterm-addon-fit` + `xterm-addon-web-links`
- **WebSocket**: `socket.io-client` ^4.7.0
- **State Management**: Zustand ^4.5.0 (輕量)
- **UI Library**: Tailwind CSS + Headless UI (Phase 1)
- **Testing**: Vitest + React Testing Library

### Phase 2 擴展 (未來)
- **Animation**: Framer Motion
- **Pixel Art UI**: RPGUI.js
- **Game Engine**: PixiJS (技能特效)

### Monorepo 工具
- **Package Manager**: pnpm 8+
- **Build Orchestration**: Turborepo 1.x

---

## 📝 Phase 1 實作步驟（xterm.js 終端整合）

### TDD 開發流程

**測試優先原則**：
1. 寫測試 (Red) → 2. 最小實作 (Green) → 3. 重構 (Refactor)

**測試覆蓋目標**：
- 單元測試：核心邏輯 >80%
- 整合測試：關鍵流程 100%
- E2E 測試：主要使用場景

---

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

### Step 2: Server 端實作（TDD）

#### 2.1 基礎設定

```bash
cd packages/server
pnpm init
pnpm add express socket.io node-pty cors
pnpm add -D typescript @types/node @types/express @types/cors tsx vitest supertest @types/supertest
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
    "skipLibCheck": true,
    "types": ["node", "vitest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/types.ts']
    }
  }
});
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

#### 2.2 類型定義（測試先行）

**src/terminal/types.ts**:
```typescript
export type AIProvider = 'claude' | 'gemini';
export type ClaudeModel = 'haiku' | 'sonnet' | 'opus';
export type GeminiModel = 'auto-gemini-2.5';

export interface TerminalConfig {
  provider: AIProvider;
  model: ClaudeModel | GeminiModel;
  workingDirectory?: string;
}

export interface TerminalSession {
  id: string;
  config: TerminalConfig;
  isRunning: boolean;
  createdAt: number;
}

export interface TerminalOutput {
  sessionId: string;
  data: string;
  timestamp: number;
}
```

#### 2.3 終端 Session 實作（TDD）

**測試先行 - src/terminal/__tests__/session.test.ts**:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TerminalSession } from '../session';
import type { TerminalConfig } from '../types';

describe('TerminalSession', () => {
  let session: TerminalSession;
  const config: TerminalConfig = {
    provider: 'claude',
    model: 'sonnet',
    workingDirectory: process.cwd()
  };

  beforeEach(() => {
    session = new TerminalSession(config);
  });

  afterEach(() => {
    session.kill();
  });

  it('should create session with unique id', () => {
    expect(session.id).toBeDefined();
    expect(session.id).toMatch(/^[a-z0-9-]+$/);
  });

  it('should not be running initially', () => {
    expect(session.isRunning).toBe(false);
  });

  it('should start with correct CLI command for Claude', async () => {
    const onData = vi.fn();
    session.on('data', onData);

    await session.start('Say hello');

    expect(session.isRunning).toBe(true);
    // 等待輸出
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(onData).toHaveBeenCalled();
  });

  it('should use correct parameters for Gemini', async () => {
    const geminiSession = new TerminalSession({
      provider: 'gemini',
      model: 'auto-gemini-2.5'
    });

    const onData = vi.fn();
    geminiSession.on('data', onData);

    await geminiSession.start('Say hello');
    expect(geminiSession.isRunning).toBe(true);

    geminiSession.kill();
  });

  it('should emit exit event when process ends', (done) => {
    session.on('exit', ({ code }) => {
      expect(code).toBeDefined();
      done();
    });

    session.start('Say hello').then(() => {
      // 發送 Ctrl+C 結束
      session.kill();
    });
  });

  it('should handle write input', async () => {
    await session.start('');

    expect(() => {
      session.write('test input\n');
    }).not.toThrow();
  });

  it('should throw error if starting already running session', async () => {
    await session.start('Say hello');

    await expect(session.start('Another prompt')).rejects.toThrow(
      'Session is already running'
    );
  });
});
```

**實作 - src/terminal/session.ts**:
```typescript
import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import type { TerminalConfig } from './types';

export class TerminalSession extends EventEmitter {
  public readonly id: string;
  public isRunning: boolean = false;
  private pty: pty.IPty | null = null;
  private createdAt: number;

  constructor(private config: TerminalConfig) {
    super();
    this.id = randomUUID();
    this.createdAt = Date.now();
  }

  async start(prompt?: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Session is already running');
    }

    const { command, args } = this.buildCommand(prompt);

    this.pty = pty.spawn(command, args, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: this.config.workingDirectory || process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color'
      }
    });

    this.isRunning = true;

    this.pty.onData((data) => {
      this.emit('data', {
        sessionId: this.id,
        data,
        timestamp: Date.now()
      });
    });

    this.pty.onExit(({ exitCode, signal }) => {
      this.isRunning = false;
      this.emit('exit', { code: exitCode, signal });
    });
  }

  write(data: string): void {
    if (!this.pty || !this.isRunning) {
      throw new Error('Session is not running');
    }
    this.pty.write(data);
  }

  resize(cols: number, rows: number): void {
    if (this.pty) {
      this.pty.resize(cols, rows);
    }
  }

  kill(): void {
    if (this.pty) {
      this.pty.kill();
      this.isRunning = false;
      this.pty = null;
    }
  }

  private buildCommand(prompt?: string): { command: string; args: string[] } {
    if (this.config.provider === 'claude') {
      const args: string[] = ['--print'];

      // 從驗證結果得知的正確參數
      args.push('--output-format', 'stream-json');
      args.push('--verbose');

      if (this.config.model) {
        args.push('--model', this.config.model);
      }

      if (prompt) {
        args.push('-p', prompt);
      }

      return { command: 'claude', args };
    } else {
      // Gemini
      const args: string[] = [];

      if (prompt) {
        args.push('-p', prompt);
      }

      args.push('--output-format', 'stream-json');

      if (this.config.model) {
        args.push('--model', this.config.model);
      }

      return { command: 'gemini', args };
    }
  }

  getInfo() {
    return {
      id: this.id,
      config: this.config,
      isRunning: this.isRunning,
      createdAt: this.createdAt
    };
  }
}
```

#### 2.4 終端管理器實作（TDD）

**測試先行 - src/terminal/__tests__/manager.test.ts**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TerminalManager } from '../manager';
import type { TerminalConfig } from '../types';

describe('TerminalManager', () => {
  let manager: TerminalManager;

  beforeEach(() => {
    manager = new TerminalManager();
  });

  afterEach(() => {
    manager.killAll();
  });

  it('should create new session', async () => {
    const config: TerminalConfig = {
      provider: 'claude',
      model: 'sonnet'
    };

    const sessionId = await manager.createSession(config, 'Say hello');

    expect(sessionId).toBeDefined();
    expect(manager.getSession(sessionId)).toBeDefined();
  });

  it('should return all sessions', async () => {
    const config1: TerminalConfig = { provider: 'claude', model: 'haiku' };
    const config2: TerminalConfig = { provider: 'gemini', model: 'auto-gemini-2.5' };

    await manager.createSession(config1);
    await manager.createSession(config2);

    const sessions = manager.getAllSessions();
    expect(sessions).toHaveLength(2);
  });

  it('should kill specific session', async () => {
    const config: TerminalConfig = { provider: 'claude', model: 'sonnet' };
    const sessionId = await manager.createSession(config);

    manager.killSession(sessionId);

    const session = manager.getSession(sessionId);
    expect(session?.isRunning).toBe(false);
  });

  it('should kill all sessions', async () => {
    await manager.createSession({ provider: 'claude', model: 'haiku' });
    await manager.createSession({ provider: 'claude', model: 'sonnet' });

    manager.killAll();

    const sessions = manager.getAllSessions();
    sessions.forEach(session => {
      expect(session.isRunning).toBe(false);
    });
  });
});
```

**實作 - src/terminal/manager.ts**:
```typescript
import { TerminalSession } from './session';
import type { TerminalConfig } from './types';

export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();

  async createSession(config: TerminalConfig, prompt?: string): Promise<string> {
    const session = new TerminalSession(config);

    // 轉發事件到 Manager 層
    session.on('data', (output) => {
      this.emit('session:data', output);
    });

    session.on('exit', ({ code, signal }) => {
      this.emit('session:exit', {
        sessionId: session.id,
        code,
        signal
      });
    });

    this.sessions.set(session.id, session);

    if (prompt) {
      await session.start(prompt);
    }

    return session.id;
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  killSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.kill();
    }
  }

  killAll(): void {
    this.sessions.forEach(session => session.kill());
  }

  // EventEmitter 功能（簡化版）
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}
```

#### 2.5 Output Parser 實作（Phase 2 準備）

**src/parsers/output-parser.ts** (暫時保留，Phase 2 使用):
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

#### 2.6 Socket.io 事件處理

**src/socket/handlers.ts**:
```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';
import { TerminalManager } from '../terminal/manager';
import type { TerminalConfig } from '../terminal/types';

export function setupSocketHandlers(io: SocketIOServer, manager: TerminalManager) {
  // 轉發 Manager 事件到所有 Socket 客戶端
  manager.on('session:data', (output) => {
    io.emit('terminal:data', output);
  });

  manager.on('session:exit', (event) => {
    io.emit('terminal:exit', event);
  });

  // 處理客戶端連接
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // 創建新終端
    socket.on('terminal:create', async (data: { config: TerminalConfig; prompt?: string }) => {
      try {
        const sessionId = await manager.createSession(data.config, data.prompt);
        const session = manager.getSession(sessionId);

        socket.emit('terminal:created', {
          sessionId,
          info: session?.getInfo()
        });
      } catch (error) {
        socket.emit('terminal:error', {
          message: error instanceof Error ? error.message : 'Failed to create terminal'
        });
      }
    });

    // 寫入終端輸入
    socket.on('terminal:input', (data: { sessionId: string; input: string }) => {
      const session = manager.getSession(data.sessionId);
      if (session) {
        session.write(data.input);
      }
    });

    // 調整終端大小
    socket.on('terminal:resize', (data: { sessionId: string; cols: number; rows: number }) => {
      const session = manager.getSession(data.sessionId);
      if (session) {
        session.resize(data.cols, data.rows);
      }
    });

    // 關閉特定終端
    socket.on('terminal:kill', (data: { sessionId: string }) => {
      manager.killSession(data.sessionId);
    });

    // 獲取所有終端列表
    socket.on('terminal:list', () => {
      const sessions = manager.getAllSessions().map(s => s.getInfo());
      socket.emit('terminal:list', sessions);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
```

#### 2.7 主入口整合

**src/index.ts**:
```typescript
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { TerminalManager } from './terminal/manager';
import { setupSocketHandlers } from './socket/handlers';

const app = express();
const server = createServer(app);

// Socket.io 設定
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Express 中間件
app.use(cors());
app.use(express.json());

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// 初始化 Terminal Manager
const manager = new TerminalManager();

// 設定 Socket.io 事件處理
setupSocketHandlers(io, manager);

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  manager.killAll();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// 啟動伺服器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🖥️  Terminal Manager initialized`);
});
```

---

### Step 3: Client 端實作（TDD）

#### 3.1 基礎設定

```bash
cd packages/client
pnpm create vite . --template react-ts
pnpm add xterm xterm-addon-fit xterm-addon-web-links socket.io-client zustand
pnpm add -D @types/node vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
```

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
});
```

**src/test/setup.ts**:
```typescript
import '@testing-library/jest-dom';
```

#### 3.2 類型定義

**src/types/terminal.ts**:
```typescript
export type AIProvider = 'claude' | 'gemini';
export type ClaudeModel = 'haiku' | 'sonnet' | 'opus';
export type GeminiModel = 'auto-gemini-2.5';

export interface TerminalConfig {
  provider: AIProvider;
  model: ClaudeModel | GeminiModel;
  workingDirectory?: string;
}

export interface TerminalTab {
  id: string;
  title: string;
  config: TerminalConfig;
  isActive: boolean;
  isRunning: boolean;
  createdAt: number;
}
```

#### 3.3 Zustand Store

**src/stores/terminalStore.ts**:
```typescript
import { create } from 'zustand';
import type { TerminalTab, TerminalConfig } from '../types/terminal';

interface TerminalStore {
  tabs: TerminalTab[];
  activeTabId: string | null;

  addTab: (config: TerminalConfig) => string;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<TerminalTab>) => void;
  getActiveTab: () => TerminalTab | undefined;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (config) => {
    const id = crypto.randomUUID();
    const tab: TerminalTab = {
      id,
      title: `${config.provider} (${config.model})`,
      config,
      isActive: false,
      isRunning: false,
      createdAt: Date.now()
    };

    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: id
    }));

    return id;
  },

  removeTab: (id) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActiveId = state.activeTabId === id
        ? (newTabs[0]?.id || null)
        : state.activeTabId;

      return {
        tabs: newTabs,
        activeTabId: newActiveId
      };
    });
  },

  setActiveTab: (id) => {
    set({ activeTabId: id });
  },

  updateTab: (id, updates) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      )
    }));
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId);
  }
}));
```

#### 3.4 Socket.io Hook（TDD）

**測試先行 - src/hooks/__tests__/useSocket.test.ts**:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSocket } from '../useSocket';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn()
  }))
}));

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should connect to socket server', () => {
    const { result } = renderHook(() => useSocket('http://localhost:3001'));

    expect(result.current.isConnected).toBe(false);
  });

  it('should emit terminal:create event', () => {
    const { result } = renderHook(() => useSocket('http://localhost:3001'));

    const config = { provider: 'claude' as const, model: 'sonnet' as const };
    result.current.createTerminal(config, 'Say hello');

    // Socket emit 應該被調用
    expect(result.current.socket?.emit).toHaveBeenCalled();
  });
});
```

**實作 - src/hooks/useSocket.ts**:
```typescript
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { TerminalConfig } from '../types/terminal';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  createTerminal: (config: TerminalConfig, prompt?: string) => void;
  sendInput: (sessionId: string, input: string) => void;
  resizeTerminal: (sessionId: string, cols: number, rows: number) => void;
  killTerminal: (sessionId: string) => void;
  requestTerminalList: () => void;
}

export function useSocket(url: string): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [url]);

  const createTerminal = useCallback((config: TerminalConfig, prompt?: string) => {
    socketRef.current?.emit('terminal:create', { config, prompt });
  }, []);

  const sendInput = useCallback((sessionId: string, input: string) => {
    socketRef.current?.emit('terminal:input', { sessionId, input });
  }, []);

  const resizeTerminal = useCallback((sessionId: string, cols: number, rows: number) => {
    socketRef.current?.emit('terminal:resize', { sessionId, cols, rows });
  }, []);

  const killTerminal = useCallback((sessionId: string) => {
    socketRef.current?.emit('terminal:kill', { sessionId });
  }, []);

  const requestTerminalList = useCallback(() => {
    socketRef.current?.emit('terminal:list');
  }, []);

  return {
    socket,
    isConnected,
    createTerminal,
    sendInput,
    resizeTerminal,
    killTerminal,
    requestTerminalList
  };
}
```

#### 3.5 引入樣式

**src/main.tsx**:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'xterm/css/xterm.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**src/index.css**:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #1e1e1e;
  color: #d4d4d4;
}

#root {
  min-height: 100vh;
}
```

#### 3.6 Terminal 組件（TDD）

**測試先行 - src/components/Terminal/__tests__/Terminal.test.tsx**:
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Terminal } from '../Terminal';

describe('Terminal', () => {
  it('should render terminal container', () => {
    const onData = vi.fn();
    render(<Terminal sessionId="test-1" onData={onData} />);

    const container = screen.getByTestId('terminal-container');
    expect(container).toBeInTheDocument();
  });

  it('should initialize xterm instance', () => {
    const onData = vi.fn();
    const { container } = render(<Terminal sessionId="test-1" onData={onData} />);

    // xterm 應該創建 canvas 元素
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
```

**實作 - src/components/Terminal/Terminal.tsx**:
```tsx
import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

interface TerminalProps {
  sessionId: string;
  onData: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
}

export function Terminal({ sessionId, onData, onResize }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 創建 xterm 實例
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78'
      },
      scrollback: 10000
    });

    // 添加插件
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    // 掛載到 DOM
    xterm.open(terminalRef.current);

    // 自適應大小
    fitAddon.fit();

    // 監聽用戶輸入
    xterm.onData((data) => {
      onData(data);
    });

    // 監聽大小變化
    xterm.onResize(({ cols, rows }) => {
      onResize?.(cols, rows);
    });

    // 監聽窗口大小變化
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [sessionId, onData, onResize]);

  // 暴露 write 方法供父組件使用
  useEffect(() => {
    if (xtermRef.current) {
      // 可以通過 ref 或 context 暴露
      (window as any)[`terminal_${sessionId}`] = {
        write: (data: string) => xtermRef.current?.write(data),
        clear: () => xtermRef.current?.clear(),
        fit: () => fitAddonRef.current?.fit()
      };
    }

    return () => {
      delete (window as any)[`terminal_${sessionId}`];
    };
  }, [sessionId]);

  return (
    <div
      ref={terminalRef}
      data-testid="terminal-container"
      className="w-full h-full"
    />
  );
}
```

#### 3.7 Terminal Tabs 組件

**src/components/Terminal/TerminalTabs.tsx**:
```tsx
import { useTerminalStore } from '../../stores/terminalStore';

interface TerminalTabsProps {
  onNewTerminal: () => void;
}

export function TerminalTabs({ onNewTerminal }: TerminalTabsProps) {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTerminalStore();

  return (
    <div className="flex items-center bg-[#2d2d2d] border-b border-[#1e1e1e] overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            flex items-center gap-2 px-4 py-2 cursor-pointer
            border-r border-[#1e1e1e] min-w-[150px] max-w-[200px]
            hover:bg-[#37373d] transition-colors
            ${tab.id === activeTabId ? 'bg-[#1e1e1e]' : 'bg-[#2d2d2d]'}
          `}
          onClick={() => setActiveTab(tab.id)}
        >
          <span
            className={`
              w-2 h-2 rounded-full
              ${tab.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}
            `}
          />
          <span className="flex-1 text-sm truncate">{tab.title}</span>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              removeTab(tab.id);
            }}
          >
            ×
          </button>
        </div>
      ))}

      <button
        className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#37373d] transition-colors"
        onClick={onNewTerminal}
      >
        +
      </button>
    </div>
  );
}
```

#### 3.8 新增終端對話框

**src/components/Terminal/NewTerminalDialog.tsx**:
```tsx
import { useState } from 'react';
import type { AIProvider, ClaudeModel, GeminiModel, TerminalConfig } from '../../types/terminal';

interface NewTerminalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: TerminalConfig, prompt?: string) => void;
}

export function NewTerminalDialog({ isOpen, onClose, onCreate }: NewTerminalDialogProps) {
  const [provider, setProvider] = useState<AIProvider>('claude');
  const [model, setModel] = useState<ClaudeModel | GeminiModel>('sonnet');
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    onCreate({ provider, model }, prompt || undefined);
    setPrompt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2d2d2d] rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">新增終端</h2>

        <div className="space-y-4">
          {/* AI Provider 選擇 */}
          <div>
            <label className="block text-sm mb-2">AI Provider</label>
            <select
              className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2"
              value={provider}
              onChange={(e) => {
                const newProvider = e.target.value as AIProvider;
                setProvider(newProvider);
                setModel(newProvider === 'claude' ? 'sonnet' : 'auto-gemini-2.5');
              }}
            >
              <option value="claude">Claude</option>
              <option value="gemini">Gemini</option>
            </select>
          </div>

          {/* Model 選擇 */}
          <div>
            <label className="block text-sm mb-2">Model</label>
            <select
              className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2"
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
            >
              {provider === 'claude' ? (
                <>
                  <option value="haiku">Haiku (快速)</option>
                  <option value="sonnet">Sonnet (平衡)</option>
                  <option value="opus">Opus (強大)</option>
                </>
              ) : (
                <option value="auto-gemini-2.5">Gemini 2.5</option>
              )}
            </select>
          </div>

          {/* 初始 Prompt */}
          <div>
            <label className="block text-sm mb-2">初始 Prompt（可選）</label>
            <textarea
              className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2 resize-none"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：Say hello"
            />
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            onClick={handleCreate}
          >
            創建
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 3.9 WebSocket Hook (已在 3.4 完成)
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

#### 3.10 主應用組件

**src/App.tsx**:
```tsx
import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useTerminalStore } from './stores/terminalStore';
import { TerminalTabs } from './components/Terminal/TerminalTabs';
import { Terminal } from './components/Terminal/Terminal';
import { NewTerminalDialog } from './components/Terminal/NewTerminalDialog';
import type { TerminalConfig } from './types/terminal';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function App() {
  const {
    socket,
    isConnected,
    createTerminal,
    sendInput,
    resizeTerminal,
    killTerminal,
    requestTerminalList
  } = useSocket(SERVER_URL);

  const { tabs, activeTabId, addTab, updateTab, getActiveTab } = useTerminalStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 監聽 Socket 事件
  useEffect(() => {
    if (!socket) return;

    // 終端創建成功
    socket.on('terminal:created', ({ sessionId, info }) => {
      updateTab(activeTabId!, { isRunning: true });
      console.log('Terminal created:', sessionId, info);
    });

    // 接收終端輸出
    socket.on('terminal:data', ({ sessionId, data }) => {
      // 寫入到對應的 xterm 實例
      const terminalAPI = (window as any)[`terminal_${sessionId}`];
      if (terminalAPI) {
        terminalAPI.write(data);
      }
    });

    // 終端退出
    socket.on('terminal:exit', ({ sessionId, code }) => {
      const tab = tabs.find(t => t.id === sessionId);
      if (tab) {
        updateTab(sessionId, { isRunning: false });
      }
      console.log('Terminal exited:', sessionId, code);
    });

    // 錯誤處理
    socket.on('terminal:error', ({ message }) => {
      console.error('Terminal error:', message);
      alert(`錯誤：${message}`);
    });

    return () => {
      socket.off('terminal:created');
      socket.off('terminal:data');
      socket.off('terminal:exit');
      socket.off('terminal:error');
    };
  }, [socket, tabs, activeTabId, updateTab]);

  // 新增終端
  const handleCreateTerminal = (config: TerminalConfig, prompt?: string) => {
    const tabId = addTab(config);
    createTerminal(config, prompt);
  };

  // 處理終端輸入
  const handleTerminalData = (data: string) => {
    const activeTab = getActiveTab();
    if (activeTab) {
      sendInput(activeTab.id, data);
    }
  };

  // 處理終端大小變化
  const handleTerminalResize = (cols: number, rows: number) => {
    const activeTab = getActiveTab();
    if (activeTab) {
      resizeTerminal(activeTab.id, cols, rows);
    }
  };

  // 關閉終端
  const handleCloseTerminal = (tabId: string) => {
    killTerminal(tabId);
  };

  // 初始加載時請求終端列表
  useEffect(() => {
    if (isConnected) {
      requestTerminalList();
    }
  }, [isConnected, requestTerminalList]);

  return (
    <div className="flex flex-col h-screen">
      {/* 連接狀態指示器 */}
      {!isConnected && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm">
          未連接到伺服器 ({SERVER_URL})
        </div>
      )}

      {/* Tab 列 */}
      <TerminalTabs onNewTerminal={() => setIsDialogOpen(true)} />

      {/* 終端顯示區 */}
      <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`w-full h-full ${tab.id === activeTabId ? 'block' : 'hidden'}`}
          >
            <Terminal
              sessionId={tab.id}
              onData={handleTerminalData}
              onResize={handleTerminalResize}
            />
          </div>
        ))}

        {/* 無終端時的提示 */}
        {tabs.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-4">尚無終端</p>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"
                onClick={() => setIsDialogOpen(true)}
              >
                + 新增終端
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 新增終端對話框 */}
      <NewTerminalDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreate={handleCreateTerminal}
      />
    </div>
  );
}

export default App;
```

---

### Step 4: 整合測試與 TDD 驗證

#### 4.1 後端測試

```bash
cd packages/server
pnpm test          # 執行所有測試
pnpm test:coverage # 生成覆蓋率報告
```

**測試項目**：
- [ ] TerminalSession 單元測試
- [ ] TerminalManager 單元測試
- [ ] Socket.io 事件處理整合測試
- [ ] 健康檢查端點測試

#### 4.2 前端測試

```bash
cd packages/client
pnpm test          # 執行所有測試
pnpm test:coverage # 生成覆蓋率報告
```

**測試項目**：
- [ ] useSocket Hook 測試
- [ ] useTerminalStore 測試
- [ ] Terminal 組件測試
- [ ] TerminalTabs 組件測試

#### 4.3 E2E 測試（手動）

```bash
# Terminal 1: 啟動 Server
cd packages/server
pnpm dev

# Terminal 2: 啟動 Client
cd packages/client
pnpm dev
```

**測試檢查清單**：
- [ ] Server 啟動成功（http://localhost:3001/health 回應 OK）
- [ ] Client 啟動成功（http://localhost:5173 顯示畫面）
- [ ] Socket.io 連接成功（瀏覽器 console 顯示 "Socket connected"）
- [ ] 點擊「+ 新增終端」按鈕
- [ ] 選擇 Claude Sonnet，輸入 "Say hello"
- [ ] 終端成功創建並顯示
- [ ] Claude CLI 輸出正確顯示在 xterm
- [ ] 可以在終端中輸入內容
- [ ] 創建第二個終端（Gemini）
- [ ] Tab 切換功能正常
- [ ] 兩個終端輸出互不干擾
- [ ] 關閉終端功能正常
- [ ] 終端自動調整大小（resize 窗口測試）

---

## 🎯 Phase 1 成功標準

### 技術驗證 ✅

1. **終端整合**
   - ✅ xterm.js 成功顯示終端
   - ✅ node-pty 成功控制 Claude Code CLI
   - ✅ node-pty 成功控制 Gemini CLI
   - ✅ 終端輸出實時顯示（無明顯延遲）

2. **多實例管理**
   - ✅ 可同時開啟多個終端（至少 3 個）
   - ✅ Tab 切換功能正常
   - ✅ 各終端輸出完全隔離
   - ✅ 創建/關閉終端功能正常

3. **雙向通訊**
   - ✅ Server ↔ Client Socket.io 通訊正常
   - ✅ Server ↔ CLI 進程通訊正常
   - ✅ 用戶輸入正確傳遞到 CLI
   - ✅ CLI 輸出正確顯示到前端

4. **TDD 覆蓋率**
   - ✅ Server 端單元測試 >80%
   - ✅ Client 端單元測試 >80%
   - ✅ 關鍵流程整合測試 100%

---

## 🔄 後續 Phase 規劃

### Phase 2: RPG 包裝層 ⏳

基於 Phase 1 的終端基礎，加入 RPG 元素：

#### 2.1 輸出解析
- [ ] OutputParser：解析 `stream-json` 格式
- [ ] RPGMapper：Tool use → 技能施放
- [ ] Token usage → MP 消耗計算
- [ ] Cost → Gold 消耗計算

#### 2.2 RPG UI
- [ ] RPGUI.js 整合
- [ ] 戰鬥畫面（覆蓋在終端上方）
- [ ] 技能施放動畫
- [ ] HP/MP/EXP 進度條

#### 2.3 切換機制
- [ ] 將 Tab 列改為 DQ 風格彈出選單
- [ ] 按 `Tab` 鍵彈出選單
- [ ] 選單顯示所有活躍戰鬥
- [ ] 單一焦點全螢幕顯示

### Phase 3: 遊戲化增強 ⏳

- [ ] 等級系統（EXP 累積升級）
- [ ] 技能冷卻系統
- [ ] 成就系統
- [ ] 戰鬥歷史記錄
- [ ] Worktree 整合（平行世界）

### Phase 4: 進階功能 ⏳

- [ ] 多模型切換（Haiku/Sonnet/Opus 動態選擇）
- [ ] 非同步戰鬥（背景派遣）
- [ ] 地圖系統（城鎮/野外/副本）
- [ ] 夥伴系統（Subagent 映射）

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

### 初始化專案（Monorepo）

```bash
# 1. 創建 workspace 配置
cat > pnpm-workspace.yaml <<EOF
packages:
  - 'packages/*'
EOF

# 2. 創建 packages 目錄
mkdir -p packages/server packages/client

# 3. 初始化各 package
cd packages/server && pnpm init && cd ../..
cd packages/client && pnpm create vite . --template react-ts && cd ../..

# 4. 安裝依賴（根據 Step 2 和 Step 3 的說明）
```

### TDD 開發流程

```bash
# 1. 寫測試（Red）
pnpm test  # 應該失敗

# 2. 最小實作（Green）
# 編寫代碼讓測試通過

# 3. 重構（Refactor）
# 優化代碼品質

# 4. 提交
git add .
git commit -m "feat: implement feature X with tests"
```

### 測試與開發

```bash
# 後端開發
cd packages/server
pnpm test --watch    # 測試監視模式
pnpm dev             # 開發模式

# 前端開發
cd packages/client
pnpm test --watch    # 測試監視模式
pnpm dev             # 開發模式

# 同時運行（根目錄）
pnpm --filter server dev & pnpm --filter client dev
```

### Git 工作流程

```bash
# 當前在 poc/node-pty-validation 分支

# 1. 更新 POC 計畫（本步驟）
git add docs/implementation/poc-plan.md
git commit -m "docs(poc): update plan for Phase 1 xterm.js integration with TDD"

# 2. 合併到 main
git checkout main
git merge poc/node-pty-validation

# 3. 切新分支開始實作
git checkout -b poc/xterm-integration

# 4. 開始 TDD 開發...
```

---

## 📝 Phase 1 重點提醒

### TDD 優先
- ✅ **測試先行**：先寫測試，再寫實作
- ✅ **持續重構**：保持代碼品質
- ✅ **覆蓋率目標**：>80%

### 簡化優先
- ✅ **核心功能**：終端 + Tab + 多實例
- ❌ **不要做**：RPG UI、動畫、複雜狀態管理
- ❌ **不要做**：過度設計、提前優化

### 驗證目標
- ✅ xterm.js 可以顯示 Claude Code 和 Gemini 輸出
- ✅ 可以同時開啟多個終端並切換
- ✅ 雙向通訊（輸入/輸出）正常

**Phase 1 完成後**：
- 我們將有一個可用的終端管理器
- 可以同時使用多個 Claude/Gemini 實例
- 為 Phase 2 的 RPG 包裝打好基礎

**Phase 2 再考慮**：
- RPG UI 包裝
- 輸出解析（stream-json）
- 技能動畫、HP/MP 顯示
