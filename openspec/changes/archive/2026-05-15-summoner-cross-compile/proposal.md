## Why

Summoner 已可透過 bun build --compile 編譯為獨立執行檔，但目前只能在本地手動 build macOS arm64。需要自動化 CI pipeline 產出 5 個平台的執行檔，讓使用者可以從 GitHub Releases 下載。

## What Changes

- 新增 GitHub Actions workflow：push to main 時自動 build summoner
- 修改 build.ts 支援 cross-compile target 參數
- Obfuscation 只做一次（JS 層），然後 cross-compile 5 個 target
- Build 產出上傳到 GitHub Releases
- 目標平台：darwin-arm64, darwin-x64, linux-x64, linux-arm64, windows-x64

## Capabilities

### New Capabilities
- `ci-release`: GitHub Actions workflow 自動 build 5 個平台的 summoner 執行檔並上傳到 GitHub Releases

### Modified Capabilities

## Impact

- 新增 `.github/workflows/release-summoner.yml`
- 修改 `apps/summoner/build.ts`（支援 target 參數）
- 修改 `apps/summoner/package.json`（新增 build:release script）
