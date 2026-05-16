# Code Quest

Web-based Claude Code client with real-time session management, file explorer, and multi-transport support.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Project Structure

```
apps/
├── server/       # Express + Socket.IO backend — session, file, git management
├── web/          # React 19 frontend (Vite) — terminal UI, file explorer, diffs
└── summoner/     # AI provider agent — stream parsing, EventEmitter API, bun-compiled binary

packages/
├── schemas/      # Shared Zod schemas, type contracts, service interfaces
├── db-schema/    # Drizzle ORM table definitions (SQLite + MySQL)
├── transport/    # Isomorphic network transport (WebSocket, resumable socket, pipeline)
├── broadcaster/  # DataSource / CachedDataSource / Broadcaster — push-to-agent infrastructure
├── watch/        # WatchService interface, LocalWatchService (chokidar), RemoteWatchService
├── filesystem/   # LocalFilesystemService and RemoteFilesystemService
├── git/          # LocalGitService and RemoteGitService
├── openspec/     # LocalOpenspecService and OpenspecService interface
├── diff-file/    # LocalDiffFileService and DiffFileService interface
├── utils/        # Shared utilities (mime types, log config, validators)
└── test-kit/     # Shared test fakes and segment builders

deploy/           # Dockerfile + docker-compose
release/          # Release notes and changelogs
```

## Scripts

```bash
pnpm dev              # Start server + web (dev mode)
pnpm build            # Build all (no obfuscation)
pnpm build:release    # Build all (server obfuscated)
pnpm test             # Run all tests
pnpm lint             # Biome lint check
```

## Architecture

### Server (`apps/server`)
Express + Socket.IO backend with InversifyJS DI and Drizzle ORM.
- **Session management**: spawn/resume Claude Code CLI sessions, stream raw events to DB
- **File explorer**: filesystem, git status, openspec browsing via service interfaces
- **Transport**: WebSocket (`/ws`) or Socket.IO (`/socket.io`) — configurable via `TRANSPORT`
- **Remote daemon**: optional Summoner remote mode via `SUMMONER_MODE=remote`

### Web (`apps/web`)
React 19 SPA with Vite, Zustand, Tailwind CSS v4, and React Compiler.
- Terminal UI, conversation history, tool-use display, thinking panel
- File explorer with diff viewer and openspec integration
- Real-time sync via query cache invalidated by server push events

### Summoner (`apps/summoner`)
Standalone CLI agent compiled to a single binary (`bun compile`).
- Wraps Claude Code CLI with stream parsing and EventEmitter API
- Connects to server via WebSocket; supports local and remote process modes
- Ships as `code-quest-{platform}.tar.gz` in releases

### Packages
- **schemas**: single source of truth for all wire types shared between server, web, and summoner
- **transport**: isomorphic WebSocket abstraction used by both server and summoner
- **broadcaster**: DataSource pattern for pushing file/git/openspec snapshots to summoner agents
- **watch**: chokidar-based file watcher with a remote RPC fallback for daemon mode

## Configuration

Copy `apps/server/.env.example` and adjust as needed. Key variables:

| Variable | Default | Description |
|---|---|---|
| `APP_PORT` | `3000` | HTTP server port |
| `DATABASE_SQLITE_URL` | — | SQLite path (e.g. `file:./data/code-quest.db`) |
| `DATABASE_URL` | — | MySQL URL (optional, in addition to SQLite) |
| `TRANSPORT` | `ws` | `ws` / `socketio` / `both` |
| `SUMMONER_MODE` | `local` | `local` or `remote` |
| `SUMMONER_TOKEN` | — | Auth token for remote summoner |
| `CLI_AUTO_MODE` | `true` | Pass `--auto-mode` to Claude Code |
| `CLI_BYPASS_PERMISSIONS` | `true` | Pass `--dangerously-skip-permissions` |
| `LOG_LEVEL` | `info` | Pino log level |
| `EXPLORER_ROOTS` | home dir | Comma-separated allowed root directories |

