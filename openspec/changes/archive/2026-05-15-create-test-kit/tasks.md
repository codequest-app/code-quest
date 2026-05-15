## 1. 建立 package 骨架

- [x] 1.1 建立 `packages/test-kit/package.json`（name: `@code-quest/test-kit`，devDependency only，依賴 `@code-quest/schemas` 和 `@code-quest/node-utils`）
- [x] 1.2 建立 `packages/test-kit/tsconfig.json`（參考 summoner tsconfig）
- [x] 1.3 建立 `packages/test-kit/src/index.ts`（空 export）
- [x] 1.4 在根 `package.json` workspaces 加入 `packages/test-kit`
- [x] 1.5 在 `apps/summoner/package.json`、`apps/server/package.json`、`apps/web/package.json` 加入 devDependency `@code-quest/test-kit`

## 2. 搬移 fakes

- [x] 2.1 複製 `fake-socket.ts` 到 `packages/test-kit/src/`，修正 import（`node:events` 保留）
- [x] 2.2 複製 `fake-filesystem-service.ts`，將 `mimeForPath` import 改為 `@code-quest/node-utils`，`PathOutsideRootsError`/`RootGuard` 改為 `@code-quest/schemas`
- [x] 2.3 複製 `fake-git-service.ts`，修正 import
- [x] 2.4 複製 `fake-watch-service.ts`，修正 import
- [x] 2.5 複製 `fake-process-provider.ts`，將 `controlRequestSchema`/`userSchema` import 改為 `@code-quest/schemas`
- [x] 2.6 複製 `fake-claude.ts`，修正 import
- [x] 2.7 複製 `fake-summoner.ts`，修正 import（指向 test-kit 內部）
- [x] 2.8 複製 `segment-builders.ts`、`segments-node.ts`、`segments-browser.ts`、`index-browser.ts`，修正 import

## 3. 更新 index exports

- [x] 3.1 更新 `packages/test-kit/src/index.ts` 匯出所有 fakes 和 segment builders
- [x] 3.2 刪除 `apps/summoner/src/test/index.ts`

## 4. 更新 consumer import

- [x] 4.1 更新 `apps/server/src/test/fake-server.ts` import from `@code-quest/test-kit`
- [x] 4.2 更新 `apps/web/src/test/fake-summoner.ts` import from `@code-quest/test-kit`
- [x] 4.3 將所有 `from '@code-quest/summoner/test'` 替換為 `from '@code-quest/test-kit'`（server、web、summoner 自身）
- [x] 4.4 將所有 `from '*/test/fake-*'` 等直接路徑替換為 `from '@code-quest/test-kit'`

## 5. 移除 summoner 原始 fake 檔案

- [x] 5.1 刪除 summoner `src/test/` 中已移入 test-kit 的 fake 檔案
- [x] 5.2 確認 summoner 內部仍有需要的 fakes（`fake-openspec-service.ts`、`fake-plugin-cli-service.ts`、`fake-diff-file-service.ts`）保留不動

## 6. 驗證

- [x] 6.1 跑 TypeScript build，修正所有 type error
- [x] 6.2 跑全套測試，確認通過
