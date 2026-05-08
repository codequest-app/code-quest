## 1. Vite outDir 設定

- [x] 1.1 改 `apps/web/vite.config.ts` — 加 `build.outDir: '../server/dist/public'` 和 `emptyOutDir: true`

## 2. Server build profile

- [x] 2.1 改 `apps/server/tsup.config.ts` — `sourcemap` 改讀 `BUILD_SOURCEMAP` env var
- [x] 2.2 改 `apps/server/package.json` — `build` 拆成 `build`（不加密）和 `build:release`（加密）
- [x] 2.3 改 root `package.json` — 加 `build:release` script，確認 `build` 順序正確

## 3. Dockerfile 簡化

- [x] 3.1 移除 `prod-deps` stage
- [x] 3.2 加 `BUILD_TARGET` 和 `BUILD_SOURCEMAP` build-arg
- [x] 3.3 移除 `PUBLIC_DIR` env var
- [x] 3.4 改 production stage — 從 server-build COPY dist，從 web-build COPY 到 dist/public

## 4. deploy.yml 簡化

- [x] 4.1 移除 `docker cp` web assets 行
- [x] 4.2 移除 `sudo systemctl reload caddy`

## 5. Per-platform release workflow

- [x] 5.1 新增 `.github/workflows/release.yml` — matrix build（linux-x64, linux-arm64, darwin-arm64, windows-x64）
- [x] 5.2 每個 platform 執行 `pnpm build:release` + `pnpm --filter web build`
- [x] 5.3 複製 summoner compiled binary 到 release 目錄
- [x] 5.4 打包 zip 上傳 GitHub Release（`softprops/action-gh-release`）

## 6. 驗證

- [x] 6.1 本地 `pnpm build && node apps/server/dist/bin/server.js` 驗證 static files 正常 serve
- [x] 6.2 本地 `pnpm build:release` 驗證 obfuscation 正常
- [x] 6.3 `docker compose build` 驗證 image build 成功
- [x] 6.4 跑全部 tests 確認 green
