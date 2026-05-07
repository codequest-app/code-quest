## Why

目前 server 端的 git 操作全部透過 `execFile('git', args)` 手動 shell out，需要自己 parse porcelain output、處理 error、管理 timeout。`simple-git` 是 Node.js 最熱門的 git wrapper（3.3k stars，活躍維護），提供 typed Promise API，可消除手動 parse 和重複的 error handling。

## What Changes

- 安裝 `simple-git` 作為 server dependency
- 將 `exec-git.ts` 的 `execGit` / `checkoutBranch` 替換為 `simple-git` API
- 將 `worktree-manager.ts` 的手動 `git` 函式替換為 `simple-git` API
- 將 `git.ts` handler 的 `execGit` / `spawnSync` 替換為 `simple-git` API
- 移除 `exec-git.ts`（功能由 `simple-git` 取代）

## Capabilities

### New Capabilities

（無新功能，純重構）

### Modified Capabilities

（無 spec-level 行為變更，純實作替換）

## Impact

- `apps/server/src/socket/utils/exec-git.ts` — 移除
- `apps/server/src/socket/handlers/git.ts` — 改用 simple-git
- `apps/server/src/services/worktree-manager.ts` — 改用 simple-git
- `apps/server/src/socket/handlers/session/fork.ts` — 若有用 exec-git 則更新 import
- 測試不改 expect，只改 production code
