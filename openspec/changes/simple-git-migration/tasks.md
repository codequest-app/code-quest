## 1. Setup

- [x] 1.1 安裝 simple-git
- [x] 1.2 建立 `packages/server/src/socket/utils/git.ts` — `createGit(cwd)` factory

## 2. git.ts handler 替換

- [x] 2.1 handleStatus: execGit → simpleGit.status()
- [x] 2.2 handleLog: execGit → simpleGit.log()
- [x] 2.3 handleDiff: execGit → simpleGit.diff()
- [x] 2.4 handleCheckout: checkoutBranch → simpleGit.checkout() with fallback
- [x] 2.5 handleUpdateSkippedBranch: 不用改（不含 git 操作）
- [x] 2.6 Run tests green

## 3. worktree-manager.ts 替換

- [x] 3.1 git() helper → rawGit() using createGit().raw()
- [x] 3.2 getRepoRoot → createGit().revparse()
- [x] 3.3 getDefaultBranch → rawGit()
- [x] 3.4 createWorktree → rawGit(['worktree', 'add', ...])
- [x] 3.5 listWorktrees → rawGit(['worktree', 'list', '--porcelain'])
- [x] 3.6 deleteWorktree → rawGit(['worktree', 'remove', ...])
- [x] 3.7 Run tests green

## 4. session/fork.ts 更新

- [x] 4.1 checkoutBranch → createGit().checkout() with fetch fallback
- [x] 4.2 Run tests green

## 5. Cleanup

- [x] 5.1 移除 exec-git.ts
- [x] 5.2 確認無殘留 import
- [x] 5.3 Run all tests green
- [x] 5.4 Commit + push

## 6. Channel.workspaceFolder → cwd rename

- [x] 6.1 Channel class: _workspaceFolder → _cwd, get/set workspaceFolder → get/set cwd
- [x] 6.2 更新所有 server consumer
- [x] 6.3 更新所有 server tests
- [x] 6.4 Run tests green

## 7. process.cwd() 清理

- [x] 7.1 worktree handler: withChannel + ch.cwd（移除 process.cwd()）
- [x] 7.2 createGit(cwd?) optional param with process.cwd() fallback
- [x] 7.3 fork.ts teleport: createGit(ch?.cwd)
- [x] 7.4 plugin.ts: pluginCache 從 Map<cwd, entry> 改為 entry | null（plugin 是 global）
- [x] 7.5 ��認僅剩 channel.ts getter 和 createGit 的 fallback 使用 process.cwd()
- [x] 7.6 Run tests green

## 8. FakeGit + 新增測試

- [x] 8.1 建立 FakeGit test helper
- [x] 8.2 git.test.ts: 用 FakeGit
- [x] 8.3 worktree-handler.test.ts: 用 FakeGit + FakeClaude 測 list/delete/error
- [x] 8.4 fork.ts test: 用 FakeGit
- [x] 8.5 Run all tests green (1381)
- [x] 8.6 Commit + push
