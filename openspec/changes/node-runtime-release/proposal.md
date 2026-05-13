## Why

Release 目前依賴 GitHub Actions matrix 在各平台 build，需要 GitHub-hosted runner（收費）。改為在啟動時自動下載 Node.js runtime 和 better-sqlite3 prebuilt binary，讓 CI 只需一台 self-hosted runner 即可產出跨平台 release，並透過 git push 發布到 release repo。

## What Changes

- `apps/summoner/build.ts`：`target: 'bun'` 改為 `target: 'node'`，產出 node 可執行的 JS bundle
- `apps/summoner/package.json`：`build` script 拆成 `build`（bundle only）和 `compile`（bun cross-compile，本機進階用）
- `scripts/start.sh` 拆為兩個獨立 script：
  - `scripts/server.sh`：下載 node + better-sqlite3 prebuilt，啟動 server
  - `scripts/summoner.sh`：下載 node，啟動 summoner
- `scripts/start.bat` 同樣拆為 `scripts/server.bat` 和 `scripts/summoner.bat`
- `.github/workflows/release.yml`：移除，改用 CI build 完後 git push 到 release repo
- Release repo 結構改為 `server/` 和 `summoner/` 各自獨立，附各自的啟動 script

## Capabilities

### New Capabilities
- `node-auto-download`: 啟動時自動偵測平台、下載 Node.js binary 和 better-sqlite3 prebuilt，首次啟動後快取於 `runtime/` 目錄

### Modified Capabilities
- `platform-release`: release 不再打包 node binary 和 better-sqlite3，改為執行時自動下載；release 結構從單一壓縮包改為 git repo push
- `bun-build`: summoner build target 從 `bun` 改為 `node`；compile 步驟從 build:release 移出，保留為獨立 script

## Impact

- `apps/summoner/build.ts`、`apps/summoner/compile.ts`、`apps/summoner/package.json`
- `scripts/start.sh`、`scripts/start.bat`（改為 server/summoner 各自獨立）
- `.github/workflows/release.yml`（移除）
- Release repo `codequest-app/release` 結構與發布流程
