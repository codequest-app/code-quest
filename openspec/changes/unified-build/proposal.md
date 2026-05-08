## Why

目前 build 有幾個問題：

1. Web 和 server 產出分散在各自 `dist/`，部署需要知道 monorepo 結構
2. Server 的 obfuscate 和 sourcemap 是寫死的（永遠加密、永遠無 source map），Docker debug 困難
3. Dockerfile 有一個多餘的 `prod-deps` stage 重新 install dependencies，但 tsup onSuccess 已經在 `dist/` 裡產出 `package.json` + `npm install` 了
4. 沒有 per-platform release，使用者只能透過 Docker 或自行 clone build

目標：`server/dist` 成為單一自包含 artifact，支援 Docker build-arg 控制 profile，GitHub Actions 產出 per-platform release zip。

## What Changes

- `apps/web/vite.config.ts` — `build.outDir` 改為 `../server/dist/public`
- `apps/server/tsup.config.ts` — `sourcemap` 改讀 `BUILD_SOURCEMAP` env var
- `apps/server/package.json` — build script 拆成 `build`（不加密）和 `build:release`（加密）
- Root `package.json` — 加 `build:release` script
- `deploy/Dockerfile` — 移除 `prod-deps` stage、移除分開 COPY web、改用 build-arg 控制 profile
- `deploy.yml` — 移除 `docker cp` web assets 行
- 新增 `release.yml` — per-platform matrix build，產出 zip 到 GitHub Releases

## Capabilities

### New Capabilities

- `unified-build`: Vite 輸出到 server dist，build profile 控制 obfuscate/sourcemap，server/dist 為自包含 artifact
- `platform-release`: GitHub Actions matrix build 產出 per-platform release zip（linux-x64, linux-arm64, darwin-arm64, windows-x64）

### Modified Capabilities

- `docker-deploy`: 移除多餘 prod-deps stage，簡化 COPY，加 build-arg 支援
- `ci-deploy`: 移除 docker cp web assets 步驟

## Impact

- `apps/web/vite.config.ts` — build.outDir 變更
- `apps/server/tsup.config.ts` — sourcemap 改為可配置
- `apps/server/package.json` — build script 拆分
- Root `package.json` — 加 scripts
- `deploy/Dockerfile` — 大幅簡化
- `.github/workflows/deploy.yml` — 移除 docker cp
- `.github/workflows/release.yml` — 新增 per-platform release workflow
- 現有 `server.ts` 的 publicDir fallback 不需修改
