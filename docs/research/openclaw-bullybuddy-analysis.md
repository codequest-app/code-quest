# OpenClaw BullyBuddy 專案分析

> 來源：https://github.com/ChenKuanSun/openclaw-bullybuddy
> 分析日期：2026-02-13

## 概覽

**Claude Code session manager** — 用來 spawn、管理、監控多個 Claude Code instance 的工具，提供 web dashboard 和 CLI，不依賴 tmux。

- npm 套件名：`openclaw-bullybuddy`
- 語言：TypeScript（主）、Shell、HTML、CSS
- 授權：MIT

## 功能

- Session 管理 — spawn、kill、monitor Claude Code instances（透過 `node-pty`）
- Smart state detection — 即時分析 PTY 輸出偵測 working、idle、permission_needed、compacting、error 狀態
- Web dashboard — 即時 terminal view + session sidebar + groups + settings
- 3D lobster view — Three.js 場景，動畫龍蝦 workers 按 project 分組
- CLI（`bullybuddy`）— 完整 terminal interface 用於 scripting 和自動化
- Session groups — 按 project 或用途組織 sessions
- Webhook notifications — POST 到外部 URL（如 OpenClaw）通知狀態變化
- Auth tokens — 每次 server 啟動時生成隨機 token

## 架構

```
src/
├── server/
│   ├── index.ts            # HTTP server 入口
│   ├── api.ts              # REST API routes
│   ├── session-manager.ts  # 核心：session 生命週期管理
│   ├── state-detector.ts   # 核心：ANSI pattern matching 偵測 Claude 狀態
│   ├── ws-bridge.ts        # WebSocket bridge（原生 ws）
│   ├── transcript.ts       # 對話記錄
│   ├── webhook.ts          # Webhook 通知
│   ├── audit-log.ts        # 審計日誌
│   ├── types.ts            # 型別定義
│   └── utils.ts            # 工具函式（stripAnsi 等）
├── dashboard/
│   ├── main.ts             # Dashboard 入口
│   ├── ws-client.ts        # WebSocket client
│   ├── sidebar.ts          # Session 列表 sidebar
│   ├── session-panel.ts    # Terminal 面板
│   ├── lobster-scene.ts    # Three.js 3D 場景
│   ├── lobster.ts          # 龍蝦模型
│   └── styles.css          # 樣式
└── cli/
    ├── index.ts            # CLI 入口（commander）
    └── client.ts           # API client
```

技術選型：

| 層級 | 技術 |
|------|------|
| Server | 原生 Node.js `http` + `ws`（無框架） |
| Dashboard | Vanilla TypeScript + xterm.js + Three.js，Vite 建置 |
| CLI | `commander` 指令解析 |
| PTY | `node-pty` process 管理（無 tmux） |
| State | ANSI pattern matching 偵測 Claude 狀態 |

## 與 cc-office 的架構比較

| | **BullyBuddy** | **cc-office** |
|---|---|---|
| Process 管理 | `node-pty`（PTY） | `child_process.spawn`（pipe stdin/stdout） |
| 與 Claude 通訊 | 原始 PTY 輸出（ANSI） | `-p --output-format stream-json`（結構化 JSON） |
| 狀態偵測 | ANSI pattern matching（regex） | 解析 stream-json 事件 |
| WebSocket | 原生 `ws` | `socket.io` |
| Dashboard | Vanilla TS + xterm.js + Three.js | React + xterm.js |
| Claude 執行模式 | 互動模式（`claude`） | 非互動模式（`claude -p`） |

## 核心設計分析

### 1. State Detector

最核心的元件。用 ANSI 輸出 pattern matching 偵測 Claude 狀態。

```typescript
type DetailedState = 'starting' | 'idle' | 'working' | 'permission_needed' | 'compacting' | 'error';
```

**機制：**
- 維護每個 session 的 2KB sliding window（最近的純文字輸出，已 strip ANSI）
- 定義多組 regex pattern，每組對應一個狀態
- 每次收到新輸出，所有 pattern 都在 window 上測試
- **最後出現的 pattern 優先**（最新輸出決定狀態）
- 30 秒無輸出自動從 `working` → `idle`
- 累計各狀態的時間用於 metrics

**Pattern 範例：**

| 狀態 | 匹配的 Pattern |
|------|---------------|
| `idle` | `❯` prompt 符號在結尾 |
| `working` | spinner `✻`、`thinking...`、`reading xxx.ts`、`writing xxx.ts` 等 |
| `permission_needed` | `"do you want to proceed?"`、`"Allow once/always"`、`"Yes / No"`、`"Deny...Allow"` 等 |
| `compacting` | `"compacting conversation"` |
| `error` | `"Error:"`（行首）、`APIError`、`rate limit`、`ENOENT` 等 |

### 2. Session Manager

- 用 `node-pty` 直接 spawn `claude`（互動模式，不是 `-p` 模式）
- 保留 2MB scrollback buffer（前端 subscribe 時可取得歷史）
- Transcript 功能：在 `working→idle` 轉換時擷取 assistant 回應
- 支援 `task` 參數：spawn 後等 Claude idle 再自動送 task
- CLI flag allowlist：只允許安全的 claude CLI flags 通過
- 上限 100 個 sessions
- 環境變數隔離：從 child process 移除敏感 env（BB_TOKEN 等）

### 3. WS Bridge

- 原生 WebSocket（`ws` 套件）
- Subscribe/unsubscribe 模型：client 訂閱特定 session 的輸出
- 16ms 批次合併 PTY 輸出，減少 WS 訊息數量
- Auth token 驗證（timing-safe compare）
- Subscribe 時自動 resize PTY 並送 scrollback

### 4. 互動模式 vs -p 模式

**關鍵差異**：BullyBuddy 跑的是互動模式 `claude`（不是 `claude -p`），這意味著：
- Claude **會**正常使用 `AskUserQuestion`（不會被 auto-deny）
- Permission prompts 會正常顯示在 PTY 輸出中
- 使用者可直接在 terminal 互動回答
- State detector 偵測到 `permission_needed` 後通知 dashboard 顯示狀態

## 對 cc-office 的啟示

### AskUserQuestion 處理

我們用 `-p --output-format stream-json`，AskUserQuestion 在此模式下**會被 auto-deny**。BullyBuddy 完全不同 — 它保持互動模式，用 PTY pattern matching 處理所有互動。

兩條可能的路線：

1. **維持 `-p` 模式**（目前方案）
   - 接受 auto-deny
   - 從 stream-json 偵測 `tool_use` name=AskUserQuestion
   - 用 `--resume` 把使用者的選擇送回
   - 優點：結構化資料、易於解析
   - 缺點：AskUserQuestion 已被 deny，需要額外 resume 流程

2. **改為 PTY 模式**（BullyBuddy 做法）
   - 直接跑 `claude` 互動模式
   - 用 ANSI pattern matching 偵測狀態
   - 直接在 PTY 寫入使用者回答
   - 優點：原生互動、AskUserQuestion 正常運作
   - 缺點：需要大改架構、ANSI 解析不穩定、無結構化資料

### 可借鏡的設計

- **State detection 概念**：即使維持 `-p` 模式，也可以為 session 維護 detailedState
- **Scrollback buffer**：2MB 上限 + 前端 subscribe 時送歷史的機制
- **Output batching**：16ms 合併 WS 訊息，減少網路開銷
- **Session groups**：多 session 按 project 分組管理
- **Webhook**：狀態變化時通知外部系統
- **Audit log**：記錄所有操作

## 環境變數

| 變數 | 預設 | 說明 |
|------|------|------|
| `BB_PORT` | `18900` | Server port |
| `BB_HOST` | `127.0.0.1` | Bind address |
| `BB_TOKEN` | 自動生成 | Auth token |
| `BB_SKIP_PERMISSIONS` | `false` | 自動加 `--dangerously-skip-permissions` |
| `BB_ENABLE_BROWSE` | `false` | 啟用目錄瀏覽 API |
| `BB_EXTRA_ARGS` | 無 | 額外允許的 claude CLI flags（逗號分隔） |
| `BB_OPENCLAW_WEBHOOK_URL` | 無 | Webhook URL |

## REST API

| Method | Endpoint | 說明 |
|--------|----------|------|
| `GET` | `/health` | Server 狀態 |
| `GET` | `/api/sessions` | Session 列表（可用 `?group=` 過濾） |
| `POST` | `/api/sessions` | Spawn session |
| `GET` | `/api/sessions/:id` | Session 詳情（含 detailedState） |
| `POST` | `/api/sessions/:id/input` | 送輸入 |
| `POST` | `/api/sessions/:id/resize` | Resize PTY |
| `DELETE` | `/api/sessions/:id` | Kill session |
| `POST` | `/api/sessions/:id/mute` | 靜音 webhook |
| `POST` | `/api/sessions/:id/unmute` | 取消靜音 |
| `POST` | `/api/sessions/:id/task` | 設定 task metadata |
| `GET` | `/api/groups` | Group 列表 |
| `GET` | `/api/summary` | 彙總狀態 |
| `GET` | `/api/sessions/:id/transcript` | 對話記錄 |
