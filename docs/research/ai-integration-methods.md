# AI 整合實作方法研究報告

**研究日期**: 2026-02-09
**研究目的**: 為 Code Quest 專案決定最佳的 AI 整合方式

---

## 📋 目錄

1. [實作方案比較](#實作方案比較)
2. [OpenClaw 架構研究](#openclaw-架構研究)
3. [Claude Code 網頁版專案分析](#claude-code-網頁版專案分析)
4. [技術決策建議](#技術決策建議)
5. [實作路線圖](#實作路線圖)

---

## 實作方案比較

### 方案 1：Claude Code CLI 包裝 ⭐ (推薦)

**實作方式**：
- Bridge Layer 使用 `child_process.spawn('claude')` 或 `node-pty` 啟動 CLI
- 攔截標準輸出 (stdout/stderr)
- 解析 JSON 格式輸出

**優點**：
- ✅ **零額外成本** - 使用用戶現有的 Claude Code 訂閱
- ✅ **完整功能** - 自動獲得所有 Skills、Subagents、MCP 支援
- ✅ **自動更新** - Claude Code 更新時自動獲得新功能
- ✅ **已有實作** - 10.5MB 單一 bundle，零外部依賴
- ✅ **符合原始願景** - 「不修改 Claude 核心，只加 RPG 包裝」

**挑戰**：
- ⚠️ **輸出解析複雜** - 需要解析 streaming output
- ⚠️ **進程管理** - 需要處理進程生命週期
- ⚠️ **錯誤處理** - CLI 崩潰時的恢復機制

**技術細節**：
```bash
# Headless 模式執行
claude -p "prompt" --output-format stream-json

# 在 CI/CD 中使用
claude -p "run tests" --streaming --format json
```

**Claude Code 架構特點**：
- 使用 TypeScript + React + Ink + Bun 構建
- 單一 cli.js 文件 (10.5MB)
- 內建 ripgrep 和 Tree-sitter WASM
- 90% 的代碼由 AI 自己生成
- 讀取 CLAUDE.md 作為權威指導

---

### 方案 2：Claude API 直接整合

**實作方式**：
- 直接使用 `@anthropic-ai/sdk` 呼叫 API
- 自行實作 tool use、streaming、錯誤處理

**優點**：
- ✅ **完全控制** - 可以精確控制每個 API 呼叫
- ✅ **輕量化** - 不需要啟動完整的 CLI 進程
- ✅ **輸出可預測** - API 回應格式穩定

**挑戰**：
- ❌ **額外成本** - 用戶需要單獨支付 API 費用
- ❌ **功能缺失** - 需要自己實作 Skills、Subagents
- ❌ **維護負擔** - 需要跟隨 Claude API 更新
- ❌ **違背設計理念** - 變成「另一個 Claude 客戶端」而非「RPG 包裝」

**API 價格** (2026)：
- Sonnet: $3/MTok (input), $15/MTok (output)
- Opus: 更高價格
- Haiku: 更低價格

---

### 方案 3：OpenClaw 風格架構

**實作方式**：
- Gateway 服務 (localhost:18789)
- Docker sandbox 執行
- Skills 系統 (JavaScript/TypeScript 函數)
- 支援多平台訊息整合

**優點**：
- ✅ **安全沙盒** - Docker 隔離執行環境
- ✅ **可擴展** - Skills 系統易於擴展
- ✅ **多平台** - 可同時支援多個訊息平台

**挑戰**：
- ❌ **架構過重** - 需要 Docker、Gateway、Skills 系統
- ❌ **偏離目標** - OpenClaw 是「個人 AI 助手」，Code Quest 是「RPG 遊戲化 Claude Code」
- ❌ **重複造輪** - Claude Code 已經提供這些功能
- ❌ **學習曲線** - 用戶需要理解 OpenClaw 架構

---

## OpenClaw 架構研究

### 核心概念

OpenClaw 是一個開源的本地 AI 助手框架，主要特點：

**架構組件**：
```
┌─────────────────────────────────────┐
│  Gateway (localhost:18789)          │  ← 通訊層
│  - Telegram/Discord/Slack 整合      │
│  - 訊息路由                         │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  Core System                        │  ← 核心邏輯
│  - 任務處理                         │
│  - Skills 執行                      │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  Docker Sandbox                     │  ← 執行環境
│  - 隔離執行                         │
│  - 文件操作                         │
└─────────────────────────────────────┘
```

**Skills 系統**：
- JavaScript/TypeScript 函數
- 支援 web browsing、file operations、shell execution
- 易於擴展新功能

**安全機制**：
- Docker 容器隔離
- 所有操作在沙盒內執行
- 保護主機系統和數據

**最新發展** (2026.2.2)：
- 169 個提交，25 位貢獻者
- 改進建構效能
- 加強 Onchain 整合
- 社群動能增長

### 為何不採用 OpenClaw？

OpenClaw 的設計目標與 Code Quest 不同：

| 比較點 | OpenClaw | Code Quest |
|--------|----------|------------|
| **目標** | 個人 AI 助手 | RPG 遊戲化 Claude Code |
| **執行環境** | Docker 沙盒 | 本地 Claude Code |
| **整合方式** | 多平台訊息 | 單一 RPG UI |
| **架構複雜度** | 高（Gateway + Docker） | 低（Bridge + UI） |
| **學習曲線** | 需要理解多組件 | 專注遊戲體驗 |

---

## Claude Code 網頁版專案分析

### 1. sugyan/claude-code-webui ⭐ (最簡潔)

**GitHub**: https://github.com/sugyan/claude-code-webui

**技術架構**：
```
Frontend (React + Vite)
    ↓ WebSocket/SSE
Backend (Deno or Node.js)
    ↓ child_process.spawn()
Claude CLI (本地進程)
```

**核心技術**：
- **Frontend**: Vite + React + TypeScript
- **Backend**: Deno 或 Node.js（兩者都支援）
- **通訊**: WebSocket 或 Server-Sent Events
- **CLI 啟動**: `child_process.spawn('claude', [...args])`

**關鍵功能**：
- ✅ 即時串流回應
- ✅ 會話歷史保存
- ✅ Permission Mode 切換
- ✅ 專案目錄選擇
- ✅ 工具權限控制

**實作範例**：
```typescript
// Backend 啟動 Claude CLI
const claudeProcess = spawn('claude', [
  '--project', projectPath,
  '--streaming'
]);

// 串流輸出到 WebSocket
claudeProcess.stdout.on('data', (chunk) => {
  ws.send(JSON.stringify({
    type: 'stream',
    data: chunk.toString()
  }));
});
```

**適用場景**：
- 簡單的聊天介面
- 快速原型驗證
- 學習 Claude CLI 整合

---

### 2. siteboon/claudecodeui (CloudCLI) 🚀 (功能最完整)

**GitHub**: https://github.com/siteboon/claudecodeui

**技術架構**：
```
Frontend (React 18 + Vite + CodeMirror)
    ↓ WebSocket + REST API
Backend (Express + WebSocket)
    ↓ Session Management
Claude Code / Cursor CLI / Codex
```

**核心技術**：
- **Frontend**:
  - React 18 (現代 Hooks 架構)
  - Vite (快速建構)
  - CodeMirror (程式碼編輯器，支援多種語言)
  - Tailwind CSS (樣式框架)

- **Backend**:
  - Node.js + Express
  - WebSocket (即時通訊)
  - REST API (專案管理)
  - Session Discovery (掃描 `~/.claude/projects/`)

**關鍵功能**：
- ✅ **多 Agent 支援** - Claude Code / Cursor CLI / Codex
- ✅ **行動裝置支援** - 響應式設計
- ✅ **遠端專案管理** - 從任何設備訪問
- ✅ **進階程式碼編輯** - CodeMirror 整合
- ✅ **任務整合** - TaskMaster AI (可選)

**實作範例**：
```typescript
// 發現現有 Claude 會話
const projectsDir = path.join(os.homedir(), '.claude', 'projects');
const projects = fs.readdirSync(projectsDir);

// 透過 WebSocket 推送專案更新
io.on('connection', (socket) => {
  socket.on('project-refresh', () => {
    const sessions = discoverSessions();
    socket.emit('sessions-updated', sessions);
  });
});
```

**適用場景**：
- 需要多 AI Agent 支援
- 行動端訪問需求
- 完整的程式碼編輯功能

---

### 3. vultuk/claude-code-web 🔥 (多會話管理)

**GitHub**: https://github.com/vultuk/claude-code-web

**技術架構**：
```
Frontend (xterm.js + WebSocket)
    ↓
Backend (Session Manager + node-pty)
    ↓
Multiple Claude CLI Processes
```

**核心技術**：
- **Frontend**:
  - **xterm.js** - 完整的終端模擬器
  - WebSocket - 即時雙向通訊
  - ANSI 顏色支援

- **Backend**:
  - **node-pty** - 偽終端（Pseudo Terminal）
  - Session 持久化
  - 多用戶連線支援
  - 訂閱計劃檢測（pro/max5/max20）

**關鍵功能**：
- ✅ **多會話並行** - 同時運行多個 Claude 會話（關鍵功能！）
- ✅ **瀏覽器斷線繼續** - Session 在後台持續運行
- ✅ **多用戶協作** - 多人可連接同一會話
- ✅ **完整終端體驗** - ANSI 顏色、游標控制
- ✅ **跨重啟持久化** - 伺服器重啟後恢復會話

**實作範例**：
```typescript
import * as pty from 'node-pty';

class SessionManager {
  private sessions: Map<string, pty.IPty> = new Map();

  createSession(id: string, plan: 'pro' | 'max5' | 'max20') {
    // 使用 node-pty 創建偽終端
    const claudePty = pty.spawn('claude', [
      '--plan', plan,
      '--streaming'
    ], {
      name: 'xterm-256color',
      cols: 80,
      rows: 30
    });

    this.sessions.set(id, claudePty);

    // 轉發輸出到 WebSocket
    claudePty.on('data', (data) => {
      this.broadcast(id, data);
    });

    return claudePty;
  }

  // 支援輸入寫入
  writeToSession(id: string, data: string) {
    const pty = this.sessions.get(id);
    if (pty) {
      pty.write(data);
    }
  }
}
```

**適用場景**：
- **多 AI 並行工作** - 正是 Code Quest 需要的！
- 團隊協作開發
- 需要完整終端體驗

---

## 技術決策建議

### 🎯 推薦方案：CLI 包裝 + node-pty + 多會話管理

基於研究結果，建議 Code Quest 採用以下架構：

```typescript
┌─────────────────────────────────────────┐
│  Frontend: React 18 + Vite              │
│  - RPG UI (Pixel Art + DQ 風格)         │
│  - xterm.js (選配：終端模擬)             │
│  - Framer Motion (戰鬥動畫)              │
│  - Zustand (狀態管理)                    │
└─────────────┬───────────────────────────┘
              │ WebSocket
┌─────────────▼───────────────────────────┐
│  Bridge Layer: Node.js + Express        │
│  - BattleSessionManager (借鑒 vultuk)   │
│  - CLIProcessManager (借鑒 sugyan)      │
│  - OutputParser (自訂 RPG 映射)         │
│  - WebSocket Server (即時通訊)          │
└─────────────┬───────────────────────────┘
              │ node-pty (偽終端)
┌─────────────▼───────────────────────────┐
│  Claude Code CLI (多進程並行)            │
│  ├─ Battle 1: Haiku Process             │
│  ├─ Battle 2: Sonnet Process            │
│  └─ Battle 3: Opus Process              │
└─────────────────────────────────────────┘
```

### 關鍵技術選擇

#### 1. 使用 node-pty 而非 child_process

**理由**：
- ✅ **完整終端模擬** - 支援互動式提示、顏色碼
- ✅ **更好的進程控制** - 可以發送信號、調整終端大小
- ✅ **ANSI 顏色支援** - 可用於戰鬥特效視覺化
- ✅ **已驗證** - vultuk 證明可用於多會話管理

**對比**：
| 特性 | child_process | node-pty |
|------|---------------|----------|
| 終端模擬 | ❌ 基礎 | ✅ 完整 |
| ANSI 顏色 | ⚠️ 有限 | ✅ 完整支援 |
| 互動提示 | ❌ 困難 | ✅ 原生支援 |
| 終端大小 | ❌ 無法調整 | ✅ 動態調整 |
| 複雜度 | ⭐⭐ 簡單 | ⭐⭐⭐ 中等 |

#### 2. 借鑒 vultuk 的多會話管理

**為何重要**：
- 這正是 Code Quest 的核心需求：**多 AI 並行戰鬥**
- 已驗證的架構，不需要從零開始
- 支援瀏覽器斷線後繼續運行（派遣系統需要）

**核心概念**：
```typescript
interface BattleSession {
  id: string;                    // 唯一識別碼
  model: 'haiku'|'sonnet'|'opus'; // AI 模型
  pty: pty.IPty;                 // 偽終端實例
  status: 'active'|'paused'|'completed';
  mpCost: number;                // 累計 MP 消耗
  createdAt: Date;
  lastActivity: Date;
}
```

#### 3. 借鑒 siteboon 的專案發現機制

**功能**：
- 自動掃描 `~/.claude/projects/` 目錄
- 列出現有的 Claude Code 會話
- 允許恢復先前的對話

**用途**：
- 玩家可以查看「戰鬥歷史」
- 恢復未完成的任務
- 整合現有 Claude Code 工作流程

---

## 實作路線圖

### Phase 0: 核心概念驗證 (Week 1-2)

**目標**: 證明 CLI 包裝方案可行

**任務**：
```typescript
// 1. 基礎 CLI 啟動
class CLIProcessManager {
  async start() {
    this.process = spawn('claude', ['--streaming']);
    // 基礎輸出捕獲
  }
}

// 2. 簡單的 WebSocket 轉發
io.on('connection', (socket) => {
  socket.emit('claude-output', data);
});

// 3. 驗證輸出格式
// 測試 --output-format stream-json
```

**驗收標準**：
- ✅ 成功啟動 Claude CLI
- ✅ 捕獲並解析 stdout
- ✅ 透過 WebSocket 推送到 Frontend
- ✅ 顯示基本的聊天介面

---

### Phase 1: node-pty 整合 (Week 3-4)

**目標**: 升級為完整終端模擬

**任務**：
```typescript
// 1. 替換為 node-pty
import * as pty from 'node-pty';

class BattleSessionManager {
  createBattle(model: string, prompt: string) {
    const claudePty = pty.spawn('claude', [
      '--model', model,
      '--streaming',
      '-p', prompt
    ], {
      name: 'xterm-256color',
      cols: 120,
      rows: 40
    });

    return claudePty;
  }
}

// 2. 實作多會話管理
private sessions: Map<string, BattleSession> = new Map();

// 3. Session 持久化
async saveSessions() {
  // 儲存 session 狀態到檔案
}
```

**驗收標準**：
- ✅ node-pty 成功運行
- ✅ 支援 ANSI 顏色碼
- ✅ 可以管理多個並行會話
- ✅ Session 可以暫停/恢復

---

### Phase 2: RPG 事件解析 (Week 5-6)

**目標**: 將 Claude 輸出轉換為 RPG 事件

**任務**：
```typescript
class OutputParser {
  parseRPGEvent(data: string): RPGEvent {
    const event = JSON.parse(data);

    // Tool Use → 魔法施放
    if (event.type === 'tool_use') {
      return {
        type: 'skill-cast',
        skill: this.mapToolToSkill(event.tool),
        mpCost: this.calculateMPCost(event)
      };
    }

    // Token Usage → MP 消耗
    if (event.usage) {
      return {
        type: 'mp-consumed',
        amount: this.calculateMPFromTokens(event.usage)
      };
    }

    // Text → 對話
    if (event.type === 'text') {
      return {
        type: 'dialogue',
        content: event.content
      };
    }
  }

  private mapToolToSkill(tool: string): Skill {
    const mapping = {
      'Read': 'vision-magic',
      'Write': 'creation-magic',
      'Grep': 'search-magic',
      'Bash': 'command-magic',
      // ... 更多映射
    };
    return mapping[tool] || 'unknown';
  }
}
```

**驗收標準**：
- ✅ 正確識別 tool_use 事件
- ✅ 計算 MP 消耗
- ✅ 映射到對應的 RPG 技能
- ✅ 生成戰鬥動畫事件

---

### Phase 3: UI 整合 (Week 7-10)

**目標**: 實作完整的 RPG UI

**任務**：
```typescript
// 1. 戰鬥畫面
<BattleScreen
  session={currentBattle}
  onSkillCast={handleSkillCast}
/>

// 2. 快速切換選單 (DQ 風格)
<BattleMenu
  battles={activeBattles}
  onSwitch={switchBattle}
/>

// 3. 動畫系統
<SkillAnimation
  skill={currentSkill}
  target={enemy}
/>
```

**驗收標準**：
- ✅ Pixel Art 視覺風格
- ✅ 戰鬥動畫流暢
- ✅ DQ 風格彈出選單
- ✅ 多戰鬥快速切換

---

### Phase 4: 錯誤處理與優化 (Week 11-12)

**目標**: 穩定性與效能

**任務**：
```typescript
// 1. 自動重啟機制
class ProcessMonitor {
  async watchProcess(pty: pty.IPty) {
    pty.on('exit', (code) => {
      if (code !== 0) {
        this.autoRestart(pty);
      }
    });
  }
}

// 2. 狀態恢復
async recoverSession(sessionId: string) {
  const saved = await this.loadSession(sessionId);
  return this.createBattle(saved.model, saved.lastPrompt);
}

// 3. 效能監控
class PerformanceMonitor {
  trackMemory() { /* ... */ }
  trackLatency() { /* ... */ }
}
```

**驗收標準**：
- ✅ CLI 崩潰自動恢復
- ✅ Session 狀態持久化
- ✅ 記憶體使用監控
- ✅ WebSocket 延遲 < 100ms

---

## 關鍵程式碼範例

### 完整的 BattleSessionManager

```typescript
// packages/bridge/src/battle-session-manager.ts
import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

interface BattleSession {
  id: string;
  model: 'haiku' | 'sonnet' | 'opus';
  pty: pty.IPty;
  status: 'active' | 'paused' | 'completed';
  mpCost: number;
  createdAt: Date;
  lastActivity: Date;
  prompt: string;
  workingDirectory?: string;
}

interface RPGEvent {
  type: 'skill-cast' | 'mp-consumed' | 'dialogue' | 'battle-complete' | 'error';
  data: any;
  timestamp: Date;
}

export class BattleSessionManager extends EventEmitter {
  private sessions: Map<string, BattleSession> = new Map();
  private sessionsDir: string;

  constructor() {
    super();
    this.sessionsDir = path.join(process.cwd(), '.claude-quest', 'sessions');
    this.initSessionsDir();
  }

  private async initSessionsDir() {
    await fs.mkdir(this.sessionsDir, { recursive: true });
  }

  /**
   * 創建新的戰鬥會話
   */
  async createBattle(
    model: 'haiku' | 'sonnet' | 'opus',
    prompt: string,
    workingDirectory?: string
  ): Promise<string> {
    const battleId = `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 使用 node-pty 創建偽終端
    const claudePty = pty.spawn('claude', [
      '--model', model,
      '--streaming',
      '--format', 'json',
      '-p', prompt
    ], {
      name: 'xterm-256color',
      cols: 120,
      rows: 40,
      cwd: workingDirectory || process.cwd(),
      env: process.env
    });

    const session: BattleSession = {
      id: battleId,
      model,
      pty: claudePty,
      status: 'active',
      mpCost: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      prompt,
      workingDirectory
    };

    this.sessions.set(battleId, session);

    // 監聽輸出
    claudePty.on('data', (data) => {
      this.handleOutput(battleId, data);
    });

    // 監聽退出
    claudePty.on('exit', (code, signal) => {
      this.handleExit(battleId, code, signal);
    });

    // 持久化
    await this.saveSession(session);

    this.emit('battle-created', battleId);
    return battleId;
  }

  /**
   * 處理 CLI 輸出
   */
  private handleOutput(battleId: string, data: string) {
    const session = this.sessions.get(battleId);
    if (!session) return;

    session.lastActivity = new Date();

    try {
      // 解析 JSON 輸出
      const lines = data.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          const rpgEvent = this.parseRPGEvent(event);

          // 更新 MP 消耗
          if (rpgEvent.type === 'mp-consumed') {
            session.mpCost += rpgEvent.data.amount;
          }

          // 發送 RPG 事件
          this.emit('battle-event', battleId, rpgEvent);
        } catch (e) {
          // 非 JSON 行，可能是純文字輸出
          this.emit('battle-event', battleId, {
            type: 'dialogue',
            data: { text: line },
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      this.emit('error', battleId, error);
    }
  }

  /**
   * 將 Claude 事件轉換為 RPG 事件
   */
  private parseRPGEvent(claudeEvent: any): RPGEvent {
    // Tool Use → 技能施放
    if (claudeEvent.type === 'tool_use') {
      return {
        type: 'skill-cast',
        data: {
          skill: this.mapToolToSkill(claudeEvent.name),
          target: claudeEvent.input,
          tool: claudeEvent.name
        },
        timestamp: new Date()
      };
    }

    // Token Usage → MP 消耗
    if (claudeEvent.type === 'message' && claudeEvent.usage) {
      return {
        type: 'mp-consumed',
        data: {
          amount: this.calculateMPFromTokens(claudeEvent.usage)
        },
        timestamp: new Date()
      };
    }

    // Text → 對話
    if (claudeEvent.type === 'text' || claudeEvent.type === 'message') {
      return {
        type: 'dialogue',
        data: {
          text: claudeEvent.content || claudeEvent.text
        },
        timestamp: new Date()
      };
    }

    // 預設
    return {
      type: 'dialogue',
      data: claudeEvent,
      timestamp: new Date()
    };
  }

  /**
   * 工具 → 技能映射
   */
  private mapToolToSkill(tool: string): string {
    const mapping: Record<string, string> = {
      'Read': 'vision-magic',
      'Write': 'creation-magic',
      'Edit': 'modification-magic',
      'Grep': 'search-magic',
      'Glob': 'detection-magic',
      'Bash': 'command-magic',
      'Task': 'summon-magic',
      'WebFetch': 'knowledge-magic',
      'WebSearch': 'exploration-magic'
    };
    return mapping[tool] || 'unknown-magic';
  }

  /**
   * Token → MP 計算
   */
  private calculateMPFromTokens(usage: any): number {
    const { input_tokens = 0, output_tokens = 0 } = usage;

    // 價格（每 1M tokens）
    const prices = {
      haiku: { input: 0.8, output: 4 },
      sonnet: { input: 3, output: 15 },
      opus: { input: 15, output: 75 }
    };

    // 假設 Sonnet，實際應根據 session.model 判斷
    const price = prices.sonnet;

    const inputCost = (input_tokens / 1_000_000) * price.input;
    const outputCost = (output_tokens / 1_000_000) * price.output;
    const totalCost = inputCost + outputCost;

    // 轉換為遊戲 MP（$1 = 100 MP）
    return Math.ceil(totalCost * 100);
  }

  /**
   * 處理進程退出
   */
  private handleExit(battleId: string, code: number, signal: number) {
    const session = this.sessions.get(battleId);
    if (!session) return;

    if (code === 0) {
      session.status = 'completed';
      this.emit('battle-complete', battleId);
    } else {
      this.emit('battle-error', battleId, { code, signal });
    }
  }

  /**
   * 發送輸入到戰鬥
   */
  async sendInput(battleId: string, input: string): Promise<void> {
    const session = this.sessions.get(battleId);
    if (!session || session.status !== 'active') {
      throw new Error(`Battle ${battleId} not active`);
    }

    session.pty.write(input + '\n');
    session.lastActivity = new Date();
  }

  /**
   * 暫停戰鬥
   */
  async pauseBattle(battleId: string): Promise<void> {
    const session = this.sessions.get(battleId);
    if (!session) return;

    // 發送 SIGTSTP (Ctrl+Z)
    session.pty.kill('SIGTSTP');
    session.status = 'paused';

    this.emit('battle-paused', battleId);
  }

  /**
   * 恢復戰鬥
   */
  async resumeBattle(battleId: string): Promise<void> {
    const session = this.sessions.get(battleId);
    if (!session) return;

    // 發送 SIGCONT
    session.pty.kill('SIGCONT');
    session.status = 'active';

    this.emit('battle-resumed', battleId);
  }

  /**
   * 終止戰鬥
   */
  async terminateBattle(battleId: string): Promise<void> {
    const session = this.sessions.get(battleId);
    if (!session) return;

    session.pty.kill();
    session.status = 'completed';
    this.sessions.delete(battleId);

    this.emit('battle-terminated', battleId);
  }

  /**
   * 獲取所有活躍戰鬥
   */
  getActiveBattles(): Array<{id: string, model: string, status: string, mpCost: number}> {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      model: s.model,
      status: s.status,
      mpCost: s.mpCost
    }));
  }

  /**
   * 持久化 Session
   */
  private async saveSession(session: BattleSession): Promise<void> {
    const sessionFile = path.join(this.sessionsDir, `${session.id}.json`);
    const data = {
      id: session.id,
      model: session.model,
      status: session.status,
      mpCost: session.mpCost,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      prompt: session.prompt,
      workingDirectory: session.workingDirectory
    };

    await fs.writeFile(sessionFile, JSON.stringify(data, null, 2));
  }

  /**
   * 載入已保存的 Sessions
   */
  async loadSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionsDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const data = await fs.readFile(
          path.join(this.sessionsDir, file),
          'utf-8'
        );

        const sessionData = JSON.parse(data);
        // 注意：不恢復 pty，只顯示歷史記錄
        this.emit('session-loaded', sessionData);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }
}
```

---

## 資料來源

### 官方文檔
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code on the Web](https://code.claude.com/docs/en/claude-code-on-the-web)

### 技術架構
- [Claude Code Internals - High-Level Architecture](https://kotrotsos.medium.com/claude-code-internals-part-1-high-level-architecture-9881c68c799f)
- [How Claude Code is Built](https://newsletter.pragmaticengineer.com/p/how-claude-code-is-built)

### 社群專案
- [sugyan/claude-code-webui](https://github.com/sugyan/claude-code-webui) - 簡潔的聊天介面
- [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) - 完整多 Agent 支援
- [vultuk/claude-code-web](https://github.com/vultuk/claude-code-web) - 多會話終端模擬
- [d-kimuson/claude-code-viewer](https://github.com/d-kimuson/claude-code-viewer) - 完整功能客戶端

### OpenClaw 相關
- [OpenClaw Official Site](https://openclaw.ai/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw: Practical Guide (2026)](https://aimlapi.com/blog/openclaw-a-practical-guide-to-local-ai-agents-for-developers)

### 比較與評測
- [Claude API vs CLI Comparison](https://apidog.com/blog/claude-code-vs-claude-api/)
- [Agentic CLI Tools Compared](https://aimultiple.com/agentic-cli)

---

## 結論

**最佳方案**：採用 **Claude Code CLI 包裝 + node-pty + 多會話管理**

**核心理由**：
1. ✅ 符合 Code Quest 設計理念（RPG 包裝，不修改核心）
2. ✅ 零額外成本（使用現有訂閱）
3. ✅ 社群已驗證的架構（vultuk 證明多會話可行）
4. ✅ 完整功能支援（Skills、Subagents、MCP）
5. ✅ 適合多 AI 並行（正是我們需要的）

**下一步行動**：
1. 建立 POC - 驗證 node-pty 基本功能
2. 實作 BattleSessionManager - 多會話管理
3. 開發 OutputParser - RPG 事件映射
4. 整合 WebSocket - 即時推送到 UI

**預期時程**：12 週完成核心功能
