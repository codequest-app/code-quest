## Context

Server 有 3 個檔案直接 shell out git：
- `exec-git.ts` — `execGit(args)` + `checkoutBranch(branch)`
- `worktree-manager.ts` — `git(args, cwd)` 內部 helper + worktree CRUD + parse porcelain
- `git.ts` handler — `execGit` + `spawnSync` 處理 status/log/diff/checkout/exec

全部用 `child_process.execFile('git', args)` + 手動 parse stdout。

## Goals / Non-Goals

**Goals:**
- 用 `simple-git` 取代所有手動 `execFile('git', ...)` 呼叫
- 消除手動 porcelain parse（status、worktree list）
- 統一 error handling（simple-git 的 GitError）
- 保持所有現有測試 expect 不變

**Non-Goals:**
- 不改 socket event 介面（git:status, git:log 等回傳格式不變）
- 不改 worktree 的檔案路徑邏輯
- 不改 git.ts handler 的 `spawnSync` exec（安全邊界，保留 spawnSync）

## Decisions

### 1. simple-git instance 建立方式

建立 factory function `createGit(cwd: string)` 回傳 `simpleGit(cwd)`。每次操作用 channel 的 cwd 建立 instance。

理由：simple-git instance 是 lightweight（只存 cwd config），不需要 singleton。每次傳 cwd 比 shared instance + `cwd()` override 更安全。

### 2. worktree-manager 保留獨立模組

不把 worktree 邏��合併到 git handler。worktree-manager 是 service 層（被 handler + fork 共用），git handler 是 socket handler 層。

### 3. exec-git.ts 移除

`execGit` 和 `checkoutBranch` 的功能完全由 `simple-git` 的 `.raw()` 和 `.checkout()` 取代。直接移除檔案。

### 4. git:exec handler 保留 spawnSync

`git:exec` 讓 client 執行任意 git command（有 schema 限制），使用 `spawnSync` 取得 exitCode + stdout + stderr。simple-git 的 `.raw()` 只回傳 stdout，不提供 exitCode。保留 `spawnSync`。

## Risks / Trade-offs

- [Risk] simple-git 版本更新可能改 API → 用 `^3.x` pin major version
- [Risk] simple-git 的 status parse 格式可能和我們的手動 parse 略有差異 → 測試驗證
- [Trade-off] 新增一個 dependency → 但消除 ~100 行手動 parse code，值得
