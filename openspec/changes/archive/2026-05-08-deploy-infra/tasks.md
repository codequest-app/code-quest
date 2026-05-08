## 1. Docker 配置

- [x] 1.1 新增 Dockerfile（multi-stage: deps → web build → server build → production）
- [x] 1.2 新增 docker-compose.yml（server container + MySQL + volumes）
- [x] 1.3 新增 .dockerignore
- [x] 1.4 本地測試 docker compose build + up

## 2. Caddy 配置

- [x] 2.1 新增 Caddyfile 模板（reverse proxy + static files + WebSocket）
- [x] 2.2 驗證 Caddy 配置語法正確

## 3. Ansible Playbook

- [x] 3.1 新增 deploy/ansible/ 目錄結構
- [x] 3.2 新增 inventory.yml（VPS host 設定）
- [x] 3.3 新增 playbook-provision.yml（安裝 Docker + Caddy）
- [x] 3.4 新增 playbook-deploy.yml（pull + build + deploy）
- [x] 3.5 新增 templates/（Caddyfile.j2, .env.j2）

## 4. GitHub Actions Workflow

- [x] 4.1 新增 .github/workflows/deploy.yml
- [x] 4.2 設定 SSH action（appleboy/ssh-action）
- [x] 4.3 文件化需要的 GitHub Secrets

## 5. 環境配置

- [x] 5.1 新增 .env.production.example
- [x] 5.2 更新 README 加入部署說明

## 6. Server Build 調整

- [x] 6.1 新增 tsup.config.ts（bundle workspace deps, external native modules）
- [x] 6.2 新增 tsconfig.build.json for web（排除 test files）
- [x] 6.3 更新 server package.json build script
