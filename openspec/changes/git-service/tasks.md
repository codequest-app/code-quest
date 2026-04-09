## 1. Interface & Types

- [ ] 1.1 建立 `summoner/src/git/types.ts` — GitService interface + 相關 types
- [ ] 1.2 更新 `summoner/src/index.ts` — export GitService types

## 2. FakeGitService

- [ ] 2.1 建立 `summoner/src/test/fake-git-service.ts` — in-memory 測試替身
- [ ] 2.2 建立 `summoner/src/test/__tests__/fake-git-service.test.ts` — fake 基本行為測試
- [ ] 2.3 更新 `summoner/src/test/index.ts` — export FakeGitService

## 3. LocalGitService

- [ ] 3.1 建立 `summoner/src/git/local.ts` — 搬移 simple-git 邏輯（status/checkout/log/diff）
- [ ] 3.2 搬移 worktree 邏輯（getRepoRoot/createWorktree/listWorktrees/deleteWorktree）到 LocalGitService
- [ ] 3.3 搬移 `checkoutWithFallback` 和 `rawGit` 為 private method
- [ ] 3.4 建立 `summoner/src/__tests__/local-git-service.test.ts` — 基本測試（需要真實 git repo）

## 4. Server DI 整合

- [ ] 4.1 `types.ts` 新增 `TYPES.GitService`
- [ ] 4.2 `container.ts` 新增 `GitService` binding（LocalGitService）
- [ ] 4.3 `HandlerContext` 新增 `gitService` 欄位

## 5. Handler 重構

- [ ] 5.1 `git.ts` handler 改用 `gitService.status/checkout/log/diff`
- [ ] 5.2 `worktree.ts` handler 改用 `gitService.getRepoRoot/createWorktree/listWorktrees/deleteWorktree`

## 6. 清理

- [ ] 6.1 移除 `socket/utils/git.ts`（如無其他消費者）
- [ ] 6.2 移除 `services/worktree-manager.ts`（邏輯已搬進 LocalGitService）
- [ ] 6.3 確認無 dead import

## 7. FakeSummoner 整合

- [ ] 7.1 FakeSummoner 加 `git()` 方法回傳 FakeGitService
- [ ] 7.2 `createTestContainer` / `FakeServer` 注入 FakeGitService
