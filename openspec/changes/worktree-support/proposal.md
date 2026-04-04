## Why

Extension 支援 git worktree 讓 Claude 在隔離環境中工作，避免影響主 branch。cc-office 目前沒有此功能。Agent subagent 的 `isolation: "worktree"` 需要底層 worktree 支援。

## What Changes

### Server 端
- **WorktreeService**：建立/列出/刪除 git worktree，路徑為 `<repo>/.claude/worktrees/<name>`
  - Name validation（字母、數字、`.`、`-`、`_`，禁止 `..` 和結尾 `.`/`.lock`）
  - `git worktree add -b worktree-<name> <path> origin/<default-branch>`
  - `git worktree prune` 清理
  - `git worktree list --porcelain` 列出
  - 偵測 session 是否在 worktree（regex: `.claude/worktrees/<name>` pattern）
- **Channel 整合**：session 可指定 worktree，CLI spawn 時 cwd 設為 worktree path
- **Socket handlers**：`worktree:create`、`worktree:list`、`worktree:delete`

### Client 端
- **WorktreeBanner**：session 在 worktree 中時顯示提示 banner
- **Session 建立時可選 worktree**：新 session dialog 加 worktree 選項
- **Modified files panel**：顯示 worktree 中被 Claude 修改的檔案（利用既有 modifiedFiles tracking）

### 不做的
- 完整 file browser / file manager（後續獨立 change）
- 在 web UI 中直接編輯 worktree 檔案
- Merge worktree 回 main（用戶自行用 git 操作）

## Capabilities

### New Capabilities
- `worktree`: Git worktree 管理（建立、列出、刪除、偵測、session 綁定）

### Modified Capabilities
（無）

## Impact

- `packages/server/src/services/` — 新增 WorktreeService
- `packages/server/src/socket/handlers/` — 新增 worktree handler
- `packages/server/src/socket/channel.ts` — worktree 綁定
- `packages/shared/src/schemas/` — worktree 相關 schema
- `packages/shared/src/socket-events.ts` — 新增 socket events
- `packages/client/src/components/` — WorktreeBanner
- `packages/client/src/contexts/` — worktree state
