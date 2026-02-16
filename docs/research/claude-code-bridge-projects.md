# Claude Code Bridge / Wrapper 專案調研

> 調研日期：2026-02-16

## 調研目的

調查將 Claude Code CLI 橋接到各種前端（Discord、Slack、Web UI）的開源專案，
了解生態現狀，找出可借鏡的架構與模式。

---

## 1. 各專案與 Claude/Gemini 的互動方式

### 互動方式比較表

| # | 專案 | 互動方式 | 串流 | 多模型 |
|---|------|---------|------|--------|
| 1 | **CloudCLI** (claudecodeui) | Claude Agent SDK (`claude-agent-sdk`) | Yes | Cursor CLI, OpenAI Codex |
| 2 | **CUI** (wbopan/cui) | Claude Code SDK (`claude-code`) | Yes | 多 LLM router（OpenRouter, Ollama）；Gemini 僅語音轉文字 |
| 3 | **claude-code-webui** (sugyan) | Claude Code SDK (`claude-code`) | Yes | 無 |
| 4 | **slack-bot** (mpociot) | Claude Code SDK (`claude-code`) | Yes | Bedrock / Vertex AI（同為 Claude） |
| 5 | **discord bot** (zebbern) | Claude Code SDK (`claude-code`) | Yes | 無（可切 opus/sonnet/haiku） |
| 6 | **Claude-Code-Remote** (JessyTsui) | CLI via PTY (node-pty) + Claude hooks | 終端 relay | 無 |
| 7 | **afk-code** (clharman) | CLI via PTY (node-pty) + JSONL 檔案監控 | JSONL watch | 無 |
| 8 | **sandbox-bot** (RhysSullivan) | CLI subprocess（Vercel Sandbox 內） | Yes (stream-json) | 無 |
| 9 | **discord-claude-bot** (twtrubiks) | CLI subprocess (`subprocess.run(["claude", "-p"])`) | **No** | 無 |
| — | **cc-office（我們）** | CLI subprocess (`child_process.spawn` + 自寫 StreamParser) | Yes (stream-json) | **Claude + Gemini** |

### 三種主流整合方式

**1. Claude Code SDK（主流，5/9 採用）**
- npm 套件 `@anthropic-ai/claude-code`，呼叫 `query()` 函式
- 原生串流、session resume、permission 控制、abort
- 不需自己解析 JSONL，SDK 直接給結構化事件

**2. CLI subprocess（2/9 + 我們）**
- 直接 spawn `claude` 命令，加 `--output-format stream-json` 或 `-p`
- 需自己解析 stdout JSONL
- **cc-office 屬於這類**：`child_process.spawn` + 自寫 `StreamParser`（Claude parser + Gemini parser）

**3. CLI via PTY（2/9）**
- 用 node-pty spawn 互動式 `claude` 終端
- 注入輸入、讀取輸出，保留完整 CLI 互動能力

> **cc-office 架構說明**：終端面板（xterm.js）使用 node-pty，但 AI 對話是用普通 `child_process.spawn`，兩者是分開的系統。

---

## 2. 深度分析：twtrubiks/discord-claude-bot

- **URL**: https://github.com/twtrubiks/discord-claude-bot
- **語言**: Python（三個檔案）
- **架構**: discord.py + `subprocess.run(["claude", "-p", prompt])` + APScheduler + JSON 持久化

### 核心特色

| 功能 | 說明 |
|---|---|
| 雙層記憶 | session summary（對話壓縮）+ long-term memory（跨 session 使用者偏好），存為 JSON |
| 自動摘要壓縮 | 對話滿 16 筆 → Claude 產生摘要；摘要超 2000 字 → 遞迴再壓縮 |
| 事實萃取 | 摘要 prompt 同時要求輸出 `===SUMMARY===` 和 `===FACTS===`，一次呼叫兩用 |
| 排程提醒 | `/remind`、`/every`、`/daily` — APScheduler 4.x with cron/interval/date triggers |
| 訊息切割 | 超過 Discord 2000 字限制時，保持 code fence 完整性地分段 |
| 白名單 | `ALLOWED_USER_IDS` 限制存取 |

### Claude CLI 互動方式

- 用 `claude -p` 一次性模式，**無串流**
- `ThreadPoolExecutor(4)` + `run_in_executor` 避免阻塞 asyncio
- 指數退避重試（最多 3 次，timeout 600s）
- 每次呼叫前 `build_context()` 把 timestamp + system prompt + memory + summary + recent messages 拼成單一 prompt

### 對我們的價值

- **有限**：我們已有完整 subprocess + stream-json 串流解析 + 多 session 管理，架構遠比它複雜
- **可借鏡**：對話摘要壓縮 + 長期記憶萃取模式，可用於 coordinator 的 context window 管理

---

## 3. Chat Platform / Web UI / Remote 專案總覽

### Web UI Wrappers

#### CloudCLI (siteboon/claudecodeui) ⭐ ~6,300

- **URL**: https://github.com/siteboon/claudecodeui
- **Tech**: React 18 + Vite + Express + WebSocket + CodeMirror + Tailwind
- **互動**: Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- **特色**: 多 CLI 支援（Claude Code / Cursor / Codex）、內建檔案瀏覽器與程式碼編輯器、TaskMaster AI 整合、Git 整合
- **與我們的差異**: 最接近的競品，但**沒有多 agent 編排**，無 wave/dependency 排程

#### CUI (wbopan/cui) ⭐ ~1,100

- **URL**: https://github.com/wbopan/cui
- **Tech**: TypeScript + React + Vite + Tailwind + Node.js ≥ 20
- **互動**: Claude Code SDK (`@anthropic-ai/claude-code`)，多 LLM router 支援 OpenRouter/Ollama
- **特色**: 平行背景 agent、任務 fork/resume/archive、多模型支援、push 通知、Gemini 2.5 Flash 語音輸入
- **與我們的差異**: 有平行 agent 概念，但沒有 wave/dependency 排程和 worktree 隔離

#### claude-code-webui (sugyan) ⭐ ~913

- **URL**: https://github.com/sugyan/claude-code-webui
- **Tech**: Deno/Node.js + Vite + React + Hono
- **互動**: Claude Code SDK (`@anthropic-ai/claude-code`)
- **特色**: 瀏覽器聊天介面、即時串流、專案目錄選擇、權限管理、對話歷史
- **與我們的差異**: 輕量 Web UI，無編排功能

### Multi-Platform Remote

#### Claude-Code-Remote (JessyTsui) ⭐ ~1,100

- **URL**: https://github.com/JessyTsui/Claude-Code-Remote
- **Tech**: Node.js ≥ 14 + SMTP/IMAP + Telegram Bot API + LINE SDK
- **互動**: CLI via PTY (node-pty) + Claude hooks
- **特色**: Email/Telegram/LINE 遠端控制 Claude Code、tmux 整合、團隊協作
- **與我們的差異**: 專注遠端通知/控制，非即時互動 UI

#### afk-code (clharman) ⭐ ~72

- **URL**: https://github.com/clharman/afk-code
- **Tech**: TypeScript + Node.js 18+ + Unix sockets + JSONL 監控
- **互動**: CLI via PTY (node-pty) + JSONL 檔案監控
- **特色**: 雙向 relay 監控**現有** Claude session（非侵入式）、Siri 整合、自動圖片偵測
- **與我們的差異**: 獨特的非侵入式 session relay 架構

### Chat Platform Bots

#### mpociot/claude-code-slack-bot ⭐ ~119

- **URL**: https://github.com/mpociot/claude-code-slack-bot
- **Tech**: Node.js 18+ + TypeScript + Slack Socket Mode SDK + Claude Code SDK
- **互動**: Claude Code SDK (`@anthropic-ai/claude-code`)，支援 Bedrock/Vertex AI
- **特色**: 即時串流回應、thread context、MCP server 整合（filesystem/GitHub/PostgreSQL）
- **與我們的差異**: Slack 專用，無多 agent 編排

#### zebbern/claude-code-discord ⭐ ~86

- **URL**: https://github.com/zebbern/claude-code-discord
- **Tech**: Deno + Discord.js + Claude Code SDK
- **互動**: Claude Code SDK (`@anthropic-ai/claude-code`)
- **特色**: 45+ slash commands、Docker 容器隔離、role-based access、MCP server 整合、任務管理
- **與我們的差異**: 比 twtrubiks 更完整的 Discord 方案，但仍是單 agent

#### claude-sandbox-bot (RhysSullivan)

- **URL**: https://github.com/RhysSullivan/claude-sandbox-bot
- **Tech**: Bun
- **互動**: CLI subprocess（Vercel Sandbox 內安裝 CLI 後跑 stream-json）
- **特色**: Vercel Sandbox 隔離執行、thread-based 串流輸出

### Workflow Automation

#### AnandChowdhary/claude-code-slack-bot

- **URL**: https://github.com/AnandChowdhary/claude-code-slack-bot
- **Tech**: Cloudflare Workers + Hono + TypeScript
- **特色**: Slack feature request → GitHub Issue → Claude Code Action 自動實作 PR

#### MattKilmer/claude-autofix-bot

- **URL**: https://github.com/MattKilmer/claude-autofix-bot
- **特色**: Slack bug report → Claude Code CLI → Git PR 全自動管線

---

## 4. 高相關參考專案（依類別）

### Claude Code SDK（遷移目標）

| 專案 | Stars | 說明 | 參考價值 |
|---|---|---|---|
| [anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) | 官方 | 官方 TypeScript SDK，原生串流、session resume、permission 控制 | 從 CLI subprocess 遷移的首選目標 |
| [anthropics/claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos) | 官方 | 官方 demo，含**多 agent 研究系統**（fan-out/fan-in） | orchestrator 模式參考 |
| [ben-vargas/ai-sdk-provider-claude-code](https://github.com/ben-vargas/ai-sdk-provider-claude-code) | — | Vercel AI SDK wrapper，支援 mid-session 訊息注入（supervisor 模式） | 串流橋接 + 中途介入 worker 的模式 |
| [ben-vargas/ai-sdk-provider-gemini-cli](https://github.com/ben-vargas/ai-sdk-provider-gemini-cli) | — | 同上但包裝 Gemini CLI | 我們整合 Gemini 的替代架構 |

### 多 Agent 編排

| 專案 | Stars | 說明 | 參考價值 |
|---|---|---|---|
| [ruvnet/claude-flow](https://github.com/ruvnet/claude-flow) | ~14,100 | agent swarm 平台，wave/dependency 排程、stream-json 串接 | **最接近我們 orchestrator 的開源專案** |
| [awslabs/agent-squad](https://github.com/awslabs/agent-squad) | ~2,000+ | AWS 多 agent 框架，intent 路由 + context 管理 | 乾淨的 TypeScript 多 agent 架構參考 |
| [darrenhinde/OpenAgentsControl](https://github.com/darrenhinde/OpenAgentsControl) | — | plan-first → 拆原子任務 → 平行執行 + 自動測試 | 和我們的 planning → wave dispatch 流程相似 |

### Git Worktree + AI 隔離

| 專案 | Stars | 說明 | 參考價值 |
|---|---|---|---|
| [kbwo/ccmanager](https://github.com/kbwo/ccmanager) | ~811 | 多 CLI session 管理（Claude+Gemini+Codex+Cursor），worktree 隔離，session 資料跨 worktree 複製 | **與我們最對口**：同時管理 Claude + Gemini + worktree |
| [coderabbitai/git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) | ~1,100 | CodeRabbit 出品，worktree 生命週期管理（config 複製、依賴安裝、port 衝突避免） | worktree 實務問題的解法 |
| [nwiizo/ccswarm](https://github.com/nwiizo/ccswarm) | ~68 | Master/Worker + worktree + 品質審查迴圈，多 provider agent pool | **架構最接近我們**：master 編排 + worker 隔離 + 自動 review |
| [Xuanwo/xlaude](https://github.com/Xuanwo/xlaude) | ~129 | 每個 worktree 配一個 Claude session，追蹤對話歷史 | worktree-per-agent 的 session 管理 UI |
| [automazeio/ccpm](https://github.com/automazeio/ccpm) | — | GitHub Issues → 分析可平行化任務 → 多 agent 執行 → merge | issue-driven 的平行化工作流 |

### xterm.js + AI 整合

| 專案 | Stars | 說明 | 參考價值 |
|---|---|---|---|
| [wavetermdev/waveterm](https://github.com/wavetermdev/waveterm) | ~17,300 | AI-native 終端，xterm.js + 可拖曳 blocks（終端/AI chat/編輯器/瀏覽器），多 AI provider | **UI 架構的頂級參考**：terminal + AI 並排佈局 |

### Gemini CLI 整合

| 專案 | Stars | 說明 | 參考價值 |
|---|---|---|---|
| [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) | 官方 | 官方 Gemini CLI，TypeScript 實作 | 我們包裝的上游，了解 JSONL 格式和 MCP 擴展 |
| [google-github-actions/run-gemini-cli](https://github.com/google-github-actions/run-gemini-cli) | 官方 | GitHub Action 包裝 Gemini CLI 做 PR review | subprocess 方式呼叫 Gemini CLI 的參考 |

---

## 5. 生態定位分析

```
                    單 Agent                    多 Agent 編排
                 ┌──────────────────────┬──────────────────────┐
   Terminal UI   │ CloudCLI, webui      │ cc-office (我們)      │
                 │ CUI, waveterm        │ claude-flow           │
                 ├──────────────────────┼──────────────────────┤
   Chat Platform │ discord-claude-bot   │                      │
   (Discord/     │ claude-code-discord  │ (尚無專案)            │
    Slack/etc)   │ slack-bot (mpociot)  │                      │
                 ├──────────────────────┼──────────────────────┤
   CLI / TUI     │ ccmanager, xlaude    │ ccswarm, ccpm         │
                 ├──────────────────────┼──────────────────────┤
   Remote/Notify │ Claude-Code-Remote   │                      │
                 │ afk-code             │                      │
                 └──────────────────────┴──────────────────────┘
```

**cc-office 的獨特定位**：

- AI 對話透過 `child_process.spawn` + stream-json JSONL 解析（非 PTY、非 SDK）
- 另有獨立的終端面板透過 node-pty 提供真實終端體驗
- 多 agent 編排（wave/dependency + worktree 隔離）是 Web UI 類中獨有的功能
- 同時支援 Claude + Gemini 雙 provider 做為程式碼 agent，目前沒有其他專案做到

---

## 6. 最高優先參考 + 可借鏡模式

| 優先 | 專案 | 參考方向 |
|------|------|---------|
| 1 | **claude-agent-sdk** | 從 CLI subprocess 遷移到 SDK 的直接路徑 |
| 2 | **claude-flow** ⭐14k | 最接近的 orchestrator 參考：wave 排程 + stream-json |
| 3 | **ccmanager** ⭐811 | 同時管理 Claude + Gemini + worktree，和我們最對口 |
| 4 | **ccswarm** | master/worker + worktree 隔離 + 品質 review，完整架構最接近 |
| 5 | **waveterm** ⭐17k | xterm.js + AI chat UI 的標竿 |
| 6 | **git-worktree-runner** ⭐1.1k | worktree 生命週期的實務解法（CodeRabbit 出品） |
| 7 | **ai-sdk-provider-claude-code** | mid-session 訊息注入（supervisor 介入 worker） |
| 8 | **agent-squad** ⭐2k | 乾淨的 TypeScript 多 agent 框架 |

### 可借鏡模式清單

#### 高優先

| 來源 | 模式 | 應用場景 |
|---|---|---|
| claude-agent-sdk | SDK 遷移：原生串流 + session resume + permission 控制 | 取代自寫 StreamParser，降低維護成本 |
| claude-flow | wave/dependency 排程 + stream-json agent 串接 | orchestrator 架構對照與改進 |
| ccmanager | 多 CLI session + worktree 隔離 + session 資料跨 worktree 複製 | worktree 管理改善 |
| waveterm | xterm.js blocks 佈局（終端/AI/編輯器並排） | UI 架構參考 |
| twtrubiks | 對話摘要壓縮 + 長期記憶萃取 | coordinator 的 context window 管理 |

#### 中優先

| 來源 | 模式 | 應用場景 |
|---|---|---|
| ccswarm | master/worker + 品質審查迴圈 | orchestrator 加入自動 code review |
| ai-sdk-provider-claude-code | mid-session 訊息注入（supervisor 模式） | coordinator 中途介入 worker |
| git-worktree-runner | worktree config 複製、依賴安裝、port 衝突避免 | worktree 生命週期 robustness |
| CUI | 平行 agent UI 呈現（fork/resume/archive） | OrchestratorPanel 的 worker 管理 UX |
| afk-code | 非侵入式 JSONL session 監控 + Unix socket relay | 支援監控已存在的 CLI session |

#### 低優先

| 來源 | 模式 | 應用場景 |
|---|---|---|
| CloudCLI | 檔案瀏覽器 + 程式碼編輯器整合 | 未來的 workspace 可視化 |
| Claude-Code-Remote | Email/Telegram 遠端通知 | 長時間任務完成通知 |
| AnandChowdhary | Slack → Issue → PR 自動化管線 | CI/CD 整合 |
| agent-squad | intent 路由 + context 管理 | 動態任務分派 |
