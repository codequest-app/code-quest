# Deployment

## Prerequisites

- VPS with Ubuntu 22.04+
- Domain pointing to VPS IP
- SSH access to VPS

## GitHub Secrets

Set these in your repository settings → Secrets → Actions:

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | VPS IP or hostname |
| `DEPLOY_USER` | SSH username (default: `deploy`) |
| `DEPLOY_SSH_KEY` | SSH private key for authentication |

## First-time Setup

```bash
# 1. Set environment variables
export DEPLOY_HOST=your-vps-ip
export DEPLOY_USER=deploy
export DEPLOY_DOMAIN=your-domain.com

# 2. Provision VPS (installs Docker + Caddy)
cd deploy/ansible
ansible-playbook -i inventory.yml playbook-provision.yml

# 3. Copy .env to VPS
cp .env.example .env
# Edit .env with production values
scp .env deploy@your-vps-ip:/srv/code-quest/deploy/.env

# 4. Deploy
ansible-playbook -i inventory.yml playbook-deploy.yml
```

## Automatic Deployment

Push to `main` triggers GitHub Actions → SSH into VPS → pull + build + deploy.

## Manual Deployment

```bash
cd deploy/ansible
ansible-playbook -i inventory.yml playbook-deploy.yml
```

## Architecture

```
Caddy (host, :80/:443)
  ├─ / → /srv/code-quest/web/ (static files)
  ├─ /ws → localhost:3000 (WebSocket)
  └─ /summoner → localhost:3000 (WebSocket)

Docker: server (:3000)
  └─ Express + WebSocket + SQLite
```
