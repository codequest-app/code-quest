## 1. Summoner build 改為 node target

- [ ] 1.1 `apps/summoner/build.ts`：`target: 'bun'` 改為 `target: 'node'`
- [ ] 1.2 `apps/summoner/package.json`：`build` script 移除 `--compile` 步驟，只保留 bundle
- [ ] 1.3 `apps/summoner/package.json`：新增 `compile` script（`bun build dist/main.js --compile --outfile dist/summoner`）
- [ ] 1.4 本機跑 `pnpm --filter @code-quest/summoner build` 確認 `dist/main.js` 產出
- [ ] 1.5 確認 `node dist/main.js --help` 或啟動不報錯

## 2. 拆分啟動 scripts

- [ ] 2.1 新增 `scripts/server.sh`：偵測平台、下載 node + better-sqlite3、啟動 server
- [ ] 2.2 新增 `scripts/summoner.sh`：偵測平台、下載 node、啟動 summoner
- [ ] 2.3 新增 `scripts/server.bat`：Windows 版 server 啟動 script
- [ ] 2.4 新增 `scripts/summoner.bat`：Windows 版 summoner 啟動 script
- [ ] 2.5 移除 `scripts/start.sh` 和 `scripts/start.bat`

## 3. 本機測試

- [ ] 3.1 `pnpm build:release` 確認整體 build 成功
- [ ] 3.2 模擬 release 目錄結構（`server/` + `summoner/`）
- [ ] 3.3 刪除 `runtime/node` 和 `better_sqlite3.node`，執行 `server.sh` 確認自動下載並啟動
- [ ] 3.4 刪除 `runtime/node`，執行 `summoner.sh` 確認自動下載並啟動

## 4. 移除 release.yml

- [ ] 4.1 刪除 `.github/workflows/release.yml`
