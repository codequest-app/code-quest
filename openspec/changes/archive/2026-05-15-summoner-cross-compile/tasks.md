## 1. Build Script 調整

- [x] 1.1 拆 build.ts 為 bundle+obfuscate 步驟，產出 dist/main.js
- [x] 1.2 新增 cross-compile 命令，從 dist/main.js 產出各平台執行檔
- [x] 1.3 更新 package.json 加入 build:release script

## 2. GitHub Actions Workflow

- [x] 2.1 新增 `.github/workflows/release-summoner.yml`
- [x] 2.2 設定 paths filter（apps/summoner/**, packages/shared/**）
- [x] 2.3 設定 bun + pnpm setup steps
- [x] 2.4 執行 bundle + obfuscate
- [x] 2.5 Cross-compile 5 個 target
- [x] 2.6 上傳到 GitHub Releases（tag: latest）

## 3. 驗證

- [x] 3.1 本地測試 cross-compile 產出 5 個執行檔
- [ ] 3.2 Push to main 驗證 workflow 觸發
