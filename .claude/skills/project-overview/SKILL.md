---
name: project-overview
description: >
  cc-office project overview — current phase (Claude Code web client with
  protocol alignment to the VS Code extension) plus the long-term RPG roadmap
  (Code Quest). Use when asking what this project does, planning architecture,
  understanding which features are built vs planned, or framing new features.
---

# cc-office — 專案總覽

## TL;DR

**當下**：cc-office 是 Claude Code CLI 的 web 客戶端，對齊官方 VS Code extension 的 protocol — ChatPanel / PermissionModePicker / SessionContext / Storybook 覆蓋、design tokens、Tailwind scale 等。

**長期願景（roadmap）**：把 Claude Code 的使用體驗包裝成 RPG 遊戲（Code Quest / CodeLand），**此願景目前尚未實作**，相關 skill（`battle-management`、`map-system`）描述的是目標，不是現況。

做決策時以當下 client 為準；roadmap 內容當 reference，不當 spec 套用。

---

## 當前架構（已實作）

```
┌──────────────────────────────────────────┐
│  Client (apps/web)                │  ← React + Vite
│  - ChatPanel / Permission UI             │
│  - SessionContext / ChannelProvider      │
│  - Storybook stories, Tailwind v4 tokens │
└──────────────────┬───────────────────────┘
                   │ WebSocket /ws
┌──────────────────▼───────────────────────┐
│  Server (apps/server)                │  ← Node + Inversify
│  - WsTransport + middleware pipeline     │
│  - socket handlers, ChannelManager       │
│  - SessionStore (Drizzle / SQLite)       │
│  - 對齊 Claude Code extension protocol   │
└──────────────────┬───────────────────────┘
                   │ WebSocket /summoner (RPC)
┌──────────────────▼───────────────────────┐
│  Summoner (apps/summoner)            │  ← 獨立 process，本地端執行
│  - Agent: 接收 server RPC 指令           │
│  - ChildProcessProvider (spawn CLI)      │
│  - LocalFilesystemService / LocalGitService │
│  - createConnectionLoop 自動重連          │
└──────────────────┬───────────────────────┘
                   │ child_process
┌──────────────────▼───────────────────────┐
│  Claude / Gemini CLI                     │
└──────────────────────────────────────────┘
```

### 部署模式

Server 可部署在雲端或遠端主機，Summoner 在**本地端**獨立執行：
```bash
# 1. 啟動 server（遠端）
pnpm --filter server start

# 2. 本地跑 summoner，連回 server
pnpm --filter @code-quest/summoner start --server <url> --token <token>

# 3. 瀏覽器開 client
```
Summoner 負責所有本地操作（檔案讀寫、git、spawn CLI），server 只做路由和狀態管理。

### Packages

| Package | 職責 |
|---|---|
| `client` | React UI，WebSocket 連線，Storybook，Tailwind v4 |
| `server` | Express + WsTransport，DI container，session 持久化 |
| `summoner` | 獨立 agent process — ws client 連回 server，本地執行 CLI / fs / git |
| `shared` | 跨 package 的型別、zod schema、transport 層（WsTransport, Envelope, Pipeline） |

### 關鍵設計原則（當前）

- **Protocol alignment**：跟 Claude Code VS Code extension 的 stream JSON / control request / permission 流程對齊；以實際 CLI output 為真相來源（`docs/protocol/`）
- **Multi-provider**：Claude / Gemini 透過 summoner adapter 抽象
- **Transport 解耦**：WsTransport + Envelope protocol + middleware pipeline（auth / heartbeat / resumable），handler 透過 TypedSocket 抽象不依賴具體傳輸層
- **分離式部署**：server 在雲端，summoner 在本地端，透過 WebSocket RPC 通訊
- **Session lifecycle**：spawn → channel → resume；session 可跨 window 共享、可從 DB 還原

---

## 長期願景：Code Quest（Roadmap，**尚未實作**）

把 Claude Code 使用體驗包裝成 RPG — CodeLand 世界、11 核心系統、HP/MP/EXP/Gold、戰鬥觸發規則、pixel art 視覺 — 完整設計詳見 `rpg-roadmap` skill，相關子系統詳見 `battle-management` / `map-system`。

**為何先做 client**：RPG 層需要穩定的「跟 Claude CLI 對話」底層。先把 client ↔ server ↔ CLI 的 protocol 做紮實，RPG 才有上層可以蓋。`docs/ui-design/` 與 roadmap skill 都是設計草稿，**不是驗證過的 spec**。

---

## 使用建議

- 問「專案現在長什麼樣、目前架構」→ 本 skill 的「當前架構」段
- 問「session / protocol / handler / UI 怎麼寫」→ 對應的 domain skill（`socket-io`、`parser-development`、`fake-summoner-*`、`tailwind-v4`…）
- 問「RPG / 戰鬥 / 地圖」→ 對應 roadmap skill，但先跟使用者確認是要設計 roadmap 還是落地實作

遇到現況跟 `docs/ui-design/` 或 roadmap skill 衝突時：**現況優先**，roadmap 當參考。
