## Context

Extension 的 worktree 實作依賴 VS Code 的 `openFolder` 開新視窗。cc-office 是 web app，worktree 必須在同一個 UI 中操作。

Extension 完整流程（main.js:16300-16338）：
1. 路徑：`<repo>/.claude/worktrees/<name>`
2. Branch：`worktree-<name>`，基於 `origin/<default-branch>`
3. 建立前 `git worktree prune` + `git branch -D worktree-<name>`
4. `git worktree add -b worktree-<name> <path> origin/<default-branch>`
5. 建完開新 VS Code 視窗

## Goals / Non-Goals

**Goals:**
- 對齊 extension 的 worktree 建立邏輯（name validation、路徑、branch 命名、prune）
- Session 可綁定 worktree，CLI spawn 時 cwd 設為 worktree path
- Client 顯示 worktree banner 和 modified files

**Non-Goals:**
- File browser（後續 change）
- 在 UI 中編輯檔案
- 自動 merge 回 main
- JetBrains IDE 整合

## Decisions

### 1. WorktreeService 作為獨立 service

不放在 Channel 或 SessionStore 裡。WorktreeService 負責所有 git worktree 操作，透過 DI 注入。

理由：worktree 是 git 操作，跟 session/channel 管理是不同職責。

### 2. Session 建立時指定 worktree

兩種模式：
- `useWorktree: true, worktreeName?: string` — 建新 worktree（name 自動生成或指定）
- `existingWorktree: { name, path }` — 使用已存在的 worktree

跟 extension 一致（webview/index.js:159296-159312）。

### 3. Banner 而非獨立頁面

Worktree 狀態用 banner 顯示在 chat panel 上方，跟 extension 的 WorktreeBanner 一致。點擊 banner 不開新視窗（web app 做不到），而是顯示 worktree info。

### 4. 自動命名規則

未指定 name 時自動生成：`claude-session-<YYYYMMDDHHmmss>`，跟 extension 一致。

## Risks / Trade-offs

- [沒有 file browser] → 用戶只能看 modified files，不能瀏覽完整 worktree 目錄 → 後續 change 解決
- [worktree 清理] → 用戶需手動刪除或我們實作定期清理 → 先提供手動刪除
- [磁碟空間] → 每個 worktree 是完整 working copy → worktree 使用 hardlink，實際佔用不大
