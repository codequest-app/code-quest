## 1. Build 遷移

- [x] 1.1 更新 package.json build script 為 `bun build src/main.ts --outdir dist --target bun --minify`
- [x] 1.2 刪除 `tsup.config.ts`
- [x] 1.3 驗證 `pnpm build` 產出 `dist/main.js` 且可用 `bun run dist/main.js` 執行

## 2. Dev / Runtime 遷移

- [x] 2.1 更新 package.json dev script 為 `bun run --env-file=.env src/main.ts`
- [x] 2.2 驗證 `pnpm dev` 正常啟動

## 3. 依賴清理

- [x] 3.1 從 devDependencies 移除 `tsup` 和 `tsx`
- [x] 3.2 執行 `pnpm install` 確認 lockfile 更新

## 4. 驗證

- [x] 4.1 執行 `pnpm test` 確認所有 vitest 測試通過
- [x] 4.2 執行 `pnpm build` 確認 bundle 產出正確
- [x] 4.3 確認 lefthook pre-commit/pre-push hooks 正常運作
