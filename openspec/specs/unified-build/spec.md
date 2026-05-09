## ADDED Requirements

### Requirement: Vite SHALL output to server dist/public

`apps/web/vite.config.ts` 的 `build.outDir` SHALL 指向 `../server/dist/public`，讓 server dist 成為自包含的可部署 artifact。

#### Scenario: Production build produces unified artifact
- **WHEN** `pnpm build` 完成
- **THEN** `apps/server/dist/public/` SHALL 包含 Vite 產出的 `index.html` 和 `assets/`

#### Scenario: Server serves embedded static files
- **WHEN** `node apps/server/dist/bin/server.js` 啟動
- **THEN** Express SHALL 自動找到 `../public` 並 serve 靜態檔
- **AND** SPA fallback SHALL 正常運作

#### Scenario: Static files not present
- **WHEN** web 未 build 或 build 失敗
- **THEN** server SHALL 正常啟動，僅不 serve 靜態檔
- **AND** API 和 WebSocket 功能 SHALL 不受影響

### Requirement: Build order SHALL be summoner → server → web

Root `package.json` 的 build script SHALL 維持 `summoner → server → web` 順序，確保 server 的 `clean` 不會清掉 web 產出。

#### Scenario: Server clean runs before web output
- **WHEN** `pnpm build` 執行
- **THEN** server 的 `rimraf dist/*` SHALL 先執行
- **AND** web 的 vite build SHALL 在 server build 完成後執行

#### Scenario: Incremental web-only rebuild
- **WHEN** 只執行 `pnpm --filter web build`
- **THEN** `apps/server/dist/public/` SHALL 被更新
- **AND** server dist 的其他檔案 SHALL 不受影響

### Requirement: Server build SHALL support build and build:release profiles

Server package.json SHALL 提供 `build`（不加密）和 `build:release`（加密）兩個 script。

#### Scenario: Default build (no obfuscation)
- **WHEN** `pnpm --filter server build` 執行
- **THEN** dist/ 的 JS 檔 SHALL 未加密，可讀

#### Scenario: Release build (obfuscated)
- **WHEN** `pnpm --filter server build:release` 執行
- **THEN** dist/ 的 JS 檔 SHALL 經過 javascript-obfuscator 加密

#### Scenario: Sourcemap controlled by env var
- **WHEN** `BUILD_SOURCEMAP=true pnpm --filter server build` 執行
- **THEN** tsup SHALL 產出 `.js.map` source map 檔案

### Requirement: Root package.json SHALL provide build scripts

Root package.json SHALL 提供 `build` 和 `build:release` scripts。

#### Scenario: Root build
- **WHEN** `pnpm build` 執行
- **THEN** SHALL 依序執行 summoner build → server build → web build

#### Scenario: Root build:release
- **WHEN** `pnpm build:release` 執行
- **THEN** SHALL 依序執行 summoner build → server build:release → web build
