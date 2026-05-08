## Context

Monorepo 包含 web（React/Vite）、server（Express/WebSocket）、summoner（獨立執行檔，已有 release pipeline）。部署目標是單一 VPS，用 Docker Compose 管理服務。

## Goals / Non-Goals

**Goals:**
- VPS provision（安裝 Docker, Caddy）via Ansible
- App deploy（build images, docker compose up）via Ansible
- GitHub Actions 自動觸發 deploy on push to main
- Caddy 自動 SSL + 反向代理 WebSocket

**Non-Goals:**
- 不做 multi-server / load balancing
- 不做 Kubernetes
- 不做 summoner 部署（已有 GitHub Releases）
- 不做 CI test（lefthook pre-push 已處理）

## Decisions

### 1. 容器架構

```
┌─── VPS ────────────────────────────────────┐
│                                             │
│  Caddy (host, ports 80/443)                 │
│    ├─ / → web 靜態檔 (Caddy file_server)   │
│    ├─ /api/* → server:3000                  │
│    └─ /ws, /summoner → server:3000 (WS)     │
│                                             │
│  Docker: server                              │
│    ├─ Express + WebSocket on :3000           │
│    └─ SQLite volume mount                    │
│                                             │
│  web 靜態檔: /srv/code-quest/web/           │
│    └─ vite build output                      │
│                                             │
└─────────────────────────────────────────────┘
```

Caddy 跑在 host（不容器化）— 管理 SSL 證書更簡單，且是 Ansible provision 的一部分。Server 跑在 Docker container。Web 是靜態檔，由 Caddy 直接 serve。

### 2. Ansible 結構

```
deploy/
  ansible/
    inventory.yml          # VPS host 設定
    playbook-provision.yml # 一次性：安裝 Docker, Caddy
    playbook-deploy.yml    # 每次部署：build + deploy app
    templates/
      Caddyfile.j2         # Caddy 配置模板
      .env.j2
  docker-compose.yml         # 靜態檔，不需要模板化
```

### 3. Dockerfile（multi-stage）

```dockerfile
# Stage 1: install deps
FROM node:22-alpine AS deps
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# Stage 2: build web
FROM deps AS web-build
COPY . .
RUN pnpm --filter @code-quest/web build

# Stage 3: build server
FROM deps AS server-build
COPY . .
RUN pnpm --filter @code-quest/server build

# Stage 4: production
FROM node:22-alpine AS production
COPY --from=server-build /app/apps/server/dist ./server
COPY --from=web-build /app/apps/web/dist ./web
CMD ["node", "server/bin/server.js"]
```

### 4. GitHub Actions Deploy Workflow

```
push to main
  → SSH into VPS
  → git pull
  → docker compose build + up
```

使用 `appleboy/ssh-action` 直接 SSH 執行部署命令。簡單直接。

### 5. 環境變數

production 需要的 env vars：
- `DATABASE_SQLITE_URL` — SQLite DB path（Docker volume）
- `REMOTE_MODE` — remote/local
- `REMOTE_TOKEN` — summoner auth token
- `PORT` — server port（default 3000）
- `DOMAIN` — Caddy 自動 SSL 的域名

## Risks / Trade-offs

- **[Risk] SSH key 管理** → GitHub Secrets 存 SSH private key
- **[Risk] 零停機部署** → Docker Compose recreate 會短暫中斷 → 可接受，未來用 blue-green
- **[Trade-off] Caddy 在 host 而非 Docker** → SSL 管理更簡單但不是完全容器化
