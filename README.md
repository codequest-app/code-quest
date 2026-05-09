# Code Quest

Web-based Claude Code client with real-time collaboration.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Project Structure

```
apps/
├── server/      # Express + Socket.IO backend (tsup)
├── web/         # React frontend (Vite)
└── summoner/    # Remote CLI agent (bun compile)
packages/
├── shared/      # Shared types, schemas, socket events
└── db-schema/   # Drizzle ORM schemas (SQLite + MySQL)
deploy/          # Dockerfile + docker-compose
```

## Scripts

```bash
pnpm dev              # Start server + web (dev mode)
pnpm build            # Build all (no obfuscation)
pnpm build:release    # Build all (server obfuscated)
pnpm test             # Run all tests
```

## Architecture

- **Server**: Express + Socket.IO, Drizzle ORM (SQLite primary, MySQL optional), InversifyJS DI
- **Web**: React 19, Zustand, Tailwind CSS v4, React Compiler
- **Summoner**: Standalone CLI agent, connects via WebSocket, bun-compiled binary
- **Transport**: WebSocket (`/ws`) or Socket.IO (`/socket.io`)

## Configuration

See `apps/server/.env.example` for all environment variables.

## Release

Releases are published to [codequest-app/release](https://github.com/codequest-app/release).

- Push to `main` triggers CI (lint + typecheck + test)
- CI success triggers per-platform release build
- Artifacts: `code-quest-{platform}.tar.gz` with bundled Node.js 22
