# Code Quest

基於 Web 的 Claude Code 客戶端，支援即時 Session 管理、檔案瀏覽器與多傳輸層。

[English](README.md)

## 特色功能

- **Claude Code Web 介面** — 瀏覽器終端、對話歷史、工具呼叫展示、Thinking 面板
- **Session 管理** — 建立、恢復、分支、重命名 Claude Code session；持久化到 SQLite 或 MySQL
- **檔案瀏覽器** — 瀏覽、讀取、比對檔案差異；整合 git status 與 openspec
- **分離式部署** — Server 部署在雲端，Summoner agent 在本機執行並回連 Server
- **多傳輸層** — 原生 WebSocket（`/ws`）或 Socket.IO（`/socket.io`），可在執行期切換
- **多 AI Provider** — 內建 Claude adapter；可透過 `ProviderAdapter` 介面新增 Gemini 等其他 provider
- **即時推送** — 檔案、git、openspec 異動從 Summoner → Server → 瀏覽器自動同步

## 架構

```
┌─────────────────────────────────────────────┐
│  瀏覽器  (apps/web)                          │
│  React 19 · Zustand · Tailwind v4           │
│  終端介面 · 檔案瀏覽器 · Diff 檢視器         │
└───────────────────┬─────────────────────────┘
                    │ WebSocket /ws
                    │（或 Socket.IO /socket.io）
┌───────────────────▼─────────────────────────┐
│  Server  (apps/server)                      │
│  Express · InversifyJS DI · Drizzle ORM     │
│  Session store · Channel manager            │
│  SQLite（主要）· MySQL（選用）               │
└───────────┬─────────────────────────────────┘
            │ WebSocket /summoner（RPC）
            │ Bearer token 認證 · 自動重連
┌───────────▼─────────────────────────────────┐
│  Summoner  (apps/summoner)                  │
│  獨立 binary · 在本機執行                   │
│  LocalFilesystemService · LocalGitService   │
│  ProviderAdapter · stream 解析器            │
└───────────┬─────────────────────────────────┘
            │ child_process（spawn）
┌───────────▼─────────────────────────────────┐
│  Claude Code CLI（或其他 AI provider）       │
└─────────────────────────────────────────────┘
```

**核心設計原則：**
- Summoner 負責所有本地 I/O（檔案、git、CLI spawn）；Server 只做路由和持久化
- 所有 wire 型別統一定義在 `packages/schemas`，由 server、web、summoner 共用
- 檔案／git／openspec snapshot 透過 `packages/broadcaster` DataSource pattern 推送，無需輪詢

## 快速開始

```bash
pnpm install
pnpm dev
```

開啟 `http://localhost:5173`。

## 專案結構

```
apps/
├── server/       # Express 後端 — session、檔案、git 管理
├── web/          # React 19 前端 — 終端介面、檔案瀏覽器、diff 檢視
└── summoner/     # AI provider agent — stream 解析、bun 編譯 binary

packages/
├── schemas/      # 共用 Zod schema、型別合約、service interface
├── transport/    # 同構 WebSocket 傳輸（resumable socket、pipeline）
├── broadcaster/  # DataSource / Broadcaster — 推送 snapshot 給 summoner agent
├── watch/        # WatchService — LocalWatchService（chokidar）、RemoteWatchService
├── filesystem/   # LocalFilesystemService 與 RemoteFilesystemService
├── git/          # LocalGitService 與 RemoteGitService
├── openspec/     # LocalOpenspecService 與 OpenspecService 介面
├── diff-file/    # LocalDiffFileService 與 DiffFileService 介面
├── db-schema/    # Drizzle ORM table 定義（SQLite + MySQL）
├── utils/        # 共用工具（mime type、log config、name validator）
└── test-kit/     # 共用 test fake 與 segment builder

deploy/           # Dockerfile + docker-compose
```

## 指令

```bash
pnpm dev              # 啟動 server + web（開發模式）
pnpm build            # 建置所有套件
pnpm test             # 執行所有測試
pnpm lint             # Biome lint 檢查
```

## 設定

複製 `apps/server/.env.example` 並依需求調整。主要環境變數：

| 變數 | 預設值 | 說明 |
|---|---|---|
| `APP_PORT` | `3000` | HTTP server 埠號 |
| `DATABASE_SQLITE_URL` | — | SQLite 路徑（如 `file:./data/code-quest.db`） |
| `DATABASE_URL` | — | MySQL URL（選用） |
| `TRANSPORT` | `ws` | `ws` / `socketio` / `both` |
| `SUMMONER_MODE` | `local` | `local` 或 `remote` |
| `SUMMONER_TOKEN` | — | remote summoner 認證 token |
| `CLI_AUTO_MODE` | `true` | 傳遞 `--auto-mode` 給 Claude Code |
| `CLI_BYPASS_PERMISSIONS` | `true` | 傳遞 `--dangerously-skip-permissions` |
| `LOG_LEVEL` | `info` | Pino log 層級 |
| `EXPLORER_ROOTS` | 家目錄 | 允許瀏覽的根目錄（逗號分隔） |
