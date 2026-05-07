## Why

Git 操作分散在三處：`socket/utils/git.ts`（createGit、checkoutWithFallback、rawGit）、`socket/handlers/git.ts`（直接建 SimpleGit instance）、`services/worktree-manager.ts`（散落的 function）。職責不集中，且 handler 直接依賴 simple-git library，無法在測試中替換。

與 FilesystemService 同理——抽成 interface + 實作 + fake，server 透過 DI 注入。

## What Changes

- 新增 `GitService` interface 於 summoner package，統一 git + worktree 操作
- 新增 `LocalGitService` 實作（搬移現有 simple-git 邏輯）
- 新增 `FakeGitService` 測試替身
- Server handler（git.ts、worktree.ts）改用注入的 `GitService`
- 移除 `socket/utils/git.ts` 和 `services/worktree-manager.ts`（邏輯搬進 LocalGitService）
- DI container 新增 `GitService` binding

## Capabilities

### New Capabilities

- `git-service`: GitService interface 定義 git 與 worktree 操作，提供 LocalGitService 實作與 FakeGitService 測試替身

### Modified Capabilities

（無既有 spec 需修改）

## Impact

- `apps/summoner/src/git/` — 新增 types.ts、local.ts
- `apps/summoner/src/test/` — 新增 fake-git-service.ts
- `apps/summoner/src/index.ts` — export 新增
- `apps/server/src/socket/handlers/git.ts` — 改用 GitService
- `apps/server/src/socket/handlers/worktree.ts` — 改用 GitService
- `apps/server/src/services/worktree-manager.ts` — 移除
- `apps/server/src/socket/utils/git.ts` — 移除
- `apps/server/src/container.ts` — 新增 binding
- `apps/server/src/types.ts` — 新增 TYPES.GitService
