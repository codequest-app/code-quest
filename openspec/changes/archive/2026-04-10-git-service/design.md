## Context

目前 git 操作由 handler 直接呼叫 `createGit(ch.cwd)` 取得 SimpleGit instance，worktree 操作則是散落在 `services/worktree-manager.ts` 的獨立 function。兩者都依賴 `socket/utils/git.ts` 的 helper。測試需要真實 git repo 或用 FakeSummoner 走完整 socket 流程，無法單獨 mock git 行為。

## Goals / Non-Goals

**Goals:**
- 統一 git + worktree 操作到一個 `GitService` interface
- `LocalGitService` 封裝 simple-git，server handler 不直接碰 simple-git
- `FakeGitService` 讓測試能控制 git 回應（branch、status、worktree list 等）
- Server 透過 DI container 注入，與 FilesystemService 模式一致

**Non-Goals:**
- 不改 socket event schema（request/response format 不變）
- 不處理 `git:exec`（spawnSync 執行任意 git command，不屬於 GitService 抽象）
- 不處理 `git:update_skipped_branch`（只寫 rawEventStore，不碰 git）

## Decisions

### 1. GitService interface 方法

從現有 handler 抽取純 git 操作：

```ts
interface GitService {
  // git operations
  status(cwd: string): Promise<GitStatusResult>;
  checkout(cwd: string, branch: string): Promise<void>;
  log(cwd: string, limit?: number): Promise<GitLogResult>;
  diff(cwd: string): Promise<GitDiffResult>;

  // worktree operations
  getRepoRoot(cwd: string): Promise<string | null>;
  createWorktree(repoRoot: string, name?: string): Promise<WorktreeInfo>;
  listWorktrees(repoRoot: string): Promise<WorktreeInfo[]>;
  deleteWorktree(repoRoot: string, name: string): Promise<void>;
}
```

所有方法接收 `cwd` 或 `repoRoot` 參數，不持有狀態。

### 2. handler 保留 zod parse + error handling

Handler 仍負責：payload 解析（zod）、error → callback mapping、log。GitService 只做 git 操作，throw on failure。

### 3. `git:exec` 和 `git:update_skipped_branch` 留在 handler

`git:exec` 是 spawnSync 執行任意 command，不屬於 GitService 抽象。`git:update_skipped_branch` 只寫 rawEventStore，不碰 git。這兩個留在原處。

### 4. FakeGitService 用 in-memory state

類似 FakeFilesystemService，用 Map 存 branch、status、worktree list 等，測試透過 setup API 控制回應。

## Risks / Trade-offs

- [風險] worktree 操作需要 `repoRoot` 參數，handler 需先呼叫 `getRepoRoot(ch.cwd)` → 兩次 await，但語意清晰
- [風險] simple-git 的 `checkoutWithFallback` 有 3 策略 fallback → 搬進 LocalGitService 作為 private method，行為不變
