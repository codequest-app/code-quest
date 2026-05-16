# Code Quest

Web-based Claude Code client with real-time session management, file explorer, and multi-transport support.

[中文說明](README.zh.md)

## Features

- **Web UI for Claude Code** — browser-based terminal, conversation history, tool-use display, thinking panel
- **Session management** — spawn, resume, fork, and rename Claude Code sessions; persisted to SQLite or MySQL
- **File explorer** — browse, read, and diff files; git status integration; openspec support
- **Split deployment** — server runs in the cloud, Summoner agent runs locally and connects back via WebSocket
- **Multi-transport** — raw WebSocket (`/ws`) or Socket.IO (`/socket.io`), configurable at runtime
- **Multi-provider ready** — Claude adapter ships built-in; Gemini and others can be added via `ProviderAdapter`
- **Real-time push** — file/git/openspec changes flow from Summoner → server → browser automatically
- **Full protocol implementation** — directly spawns Claude Code CLI with `--output-format stream-json --input-format stream-json`, parses the complete NDJSON protocol (system, assistant, user, result, stream_event, control_request), and responds to permission/elicitation prompts over stdin — no SDK abstraction in between

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser  (apps/web)                        │
│  React 19 · Zustand · Tailwind v4           │
│  Terminal UI · File Explorer · Diff Viewer  │
└───────────────────┬─────────────────────────┘
                    │ WebSocket /ws
                    │ (or Socket.IO /socket.io)
┌───────────────────▼─────────────────────────┐
│  Server  (apps/server)                      │
│  Express · InversifyJS DI · Drizzle ORM     │
│  Session store · Channel manager            │
│  SQLite (primary) · MySQL (optional)        │
└───────────┬─────────────────────────────────┘
            │ WebSocket /summoner  (RPC)
            │ bearer token auth · auto-reconnect
┌───────────▼─────────────────────────────────┐
│  Summoner  (apps/summoner)                  │
│  Standalone binary · runs on local machine  │
│  LocalFilesystemService · LocalGitService   │
│  ProviderAdapter · stream parser            │
└───────────┬─────────────────────────────────┘
            │ child_process (spawn)
┌───────────▼─────────────────────────────────┐
│  Claude Code CLI  (or other AI providers)   │
└─────────────────────────────────────────────┘
```

**Key design decisions:**
- Summoner handles all local I/O (files, git, CLI spawn) — server only does routing and persistence
- All wire types are defined once in `packages/schemas` and shared across server, web, and summoner
- File/git/openspec snapshots are pushed via `packages/broadcaster` DataSource pattern — no polling

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Project Structure

```
apps/
├── server/       # Express backend — session, file, git management
├── web/          # React 19 frontend — terminal UI, file explorer, diffs
└── summoner/     # AI provider agent — stream parsing, bun-compiled binary

packages/
├── schemas/      # Shared Zod schemas, type contracts, service interfaces
├── transport/    # Isomorphic WebSocket transport (resumable socket, pipeline)
├── broadcaster/  # DataSource / Broadcaster — push snapshots to summoner agents
├── watch/        # WatchService — LocalWatchService (chokidar), RemoteWatchService
├── filesystem/   # LocalFilesystemService and RemoteFilesystemService
├── git/          # LocalGitService and RemoteGitService
├── openspec/     # LocalOpenspecService and OpenspecService interface
├── diff-file/    # LocalDiffFileService and DiffFileService interface
├── db-schema/    # Drizzle ORM table definitions (SQLite + MySQL)
├── utils/        # Shared utilities (mime types, log config, validators)
└── test-kit/     # Shared test fakes and segment builders

deploy/           # Dockerfile + docker-compose
```

## Scripts

```bash
pnpm dev              # Start server + web (dev mode)
pnpm build            # Build all
pnpm test             # Run all tests
pnpm lint             # Biome lint check
```

## Configuration

Copy `apps/server/.env.example` and adjust as needed. Key variables:

| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `3000` | HTTP server port |
| `DATABASE_SQLITE_URL` | — | SQLite path (e.g. `file:./data/code-quest.db`) |
| `DATABASE_URL` | — | MySQL URL (optional) |
| `TRANSPORT` | `ws` | `ws` / `socketio` / `both` |
| `SUMMONER_MODE` | `local` | `local` or `remote` |
| `SUMMONER_TOKEN` | — | Auth token for remote summoner |
| `CLI_AUTO_MODE` | `true` | Pass `--auto-mode` to Claude Code |
| `CLI_BYPASS_PERMISSIONS` | `true` | Pass `--dangerously-skip-permissions` |
| `LOG_LEVEL` | `info` | Pino log level |
| `EXPLORER_ROOTS` | home dir | Comma-separated allowed root directories |
