## Why

專案需要從本地開發環境部署到 production VPS。目前沒有任何部署流程，所有東西都只在本地跑。需要一套自動化的部署管線：push to main → 自動部署到 VPS。

## What Changes

- 新增 Dockerfile（server + web multi-stage build）
- 新增 docker-compose.yml（Caddy + server container）
- 新增 Caddyfile（反向代理 + 自動 SSL + WebSocket + 靜態檔）
- 新增 Ansible playbook（VPS provision + app deploy）
- 新增 GitHub Actions workflow（push to main → deploy）
- 新增 `.env.production.example`（production 環境變數範本）

## Capabilities

### New Capabilities
- `docker-deploy`: Docker Compose 部署配置（Caddy + server + web 靜態檔）
- `ci-deploy`: GitHub Actions workflow 自動部署到 VPS

### Modified Capabilities

## Impact

- 新增 `deploy/` 目錄（Dockerfile, docker-compose.yml, Caddyfile, ansible/）
- 新增 `.github/workflows/deploy.yml`
- server 需要能在 Docker 環境中運行（env vars, DB path）
- 需要 GitHub Secrets 設定（VPS SSH key, host, domain）
