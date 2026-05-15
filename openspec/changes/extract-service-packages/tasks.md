## 1. 建立 packages/watch

- [x] 1.1 建立 `packages/watch/package.json`（`@code-quest/watch`），依賴 `chokidar`、`@code-quest/schemas`
- [x] 1.2 建立 `packages/watch/tsconfig.json`，參考 `packages/node-utils/tsconfig.json`
- [x] 1.3 將 `apps/summoner/src/fs-watch/types.ts` 內容移至 `packages/watch/src/types.ts`
- [x] 1.4 將 `apps/summoner/src/fs-watch/local.ts` 移至 `packages/watch/src/local.ts`，logger 改為 constructor 注入（`logger?: MinimalLogger`，預設 no-op），移除 `errorCode` 直接 inline
- [x] 1.5 建立 `packages/watch/src/remote.ts`，`RemoteWatchService` 骨架（subscribe 拋 `Error('Not implemented')`）
- [x] 1.6 建立 `packages/watch/src/index.ts`，export 所有 public API
- [x] 1.7 更新 `apps/summoner/src/fs-watch/` import 改為 `@code-quest/watch`，刪除舊檔案
- [x] 1.8 更新 `pnpm-workspace.yaml`（若需要），確認 workspace 識別到新 package

## 2. 建立 packages/filesystem

- [x] 2.1 建立 `packages/filesystem/package.json`（`@code-quest/filesystem`），依賴 `fuse.js`、`glob`、`@code-quest/schemas`、`@code-quest/node-utils`
- [x] 2.2 建立 `packages/filesystem/tsconfig.json`
- [x] 2.3 將 `apps/summoner/src/filesystem/local.ts` 移至 `packages/filesystem/src/local.ts`，logger 改為 constructor 注入，`mimeForPath` 改 import `@code-quest/node-utils`
- [x] 2.4 將 `apps/summoner/src/filesystem/mime-types.ts` 移至 `packages/node-utils/src/`（已有 `mimeForPath` export，確認不重複）
- [x] 2.5 將 `apps/server/src/remote/filesystem-service.ts` 移至 `packages/filesystem/src/remote.ts`
- [x] 2.6 建立 `packages/filesystem/src/index.ts`，export 所有 public API
- [x] 2.7 更新 `apps/summoner` import 改為 `@code-quest/filesystem`，刪除舊檔案
- [x] 2.8 更新 `apps/server/src/remote/filesystem-service.ts` import 改為 `@code-quest/filesystem`，刪除舊檔案

## 3. 建立 packages/git

- [x] 3.1 建立 `packages/git/package.json`（`@code-quest/git`），依賴 `@code-quest/schemas`
- [x] 3.2 建立 `packages/git/tsconfig.json`
- [x] 3.3 將 `apps/summoner/src/git/` 下所有檔案移至 `packages/git/src/`（commands.ts、errors.ts、git-runner.ts、local.ts、worktree.ts），logger 改為 constructor 注入
- [x] 3.4 將 `apps/server/src/remote/git-service.ts` 移至 `packages/git/src/remote.ts`
- [x] 3.5 建立 `packages/git/src/index.ts`，export 所有 public API
- [x] 3.6 更新 `apps/summoner` import 改為 `@code-quest/git`，刪除舊檔案
- [x] 3.7 更新 `apps/server/src/remote/git-service.ts` import 改為 `@code-quest/git`，刪除舊檔案

## 4. 收尾

- [x] 4.1 確認 `apps/summoner` 和 `apps/server` 的 `package.json` 依賴已加入三個新 package
- [x] 4.2 `pnpm install` 確認 workspace link 正確
- [x] 4.3 `pnpm -r build`（或 tsc）確認全部 compile 無錯誤
- [x] 4.4 執行所有測試確認無 regression
