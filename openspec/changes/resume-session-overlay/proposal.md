## Why

Extension 的 `/resume` 是在聊天區域內顯示 session list overlay，按 cwd 過濾，選了 session 後 spawn CLI with `--resume`。我們目前的 SessionHistory 是 WorkspaceLayout 層級的 sidebar，沒有 cwd 過濾，選了走 `session:join` 而非 resume。UI 也過於複雜（expand detail、import、remote tab）。需要對齊 extension 行為。

## What Changes

- `/resume` 指令（或 CommandMenu "Resume conversation"）在 ChatPanel 內顯示 session list overlay
- Session list 按當前 cwd 過濾，只顯示 title + 相對日期（如 `7d`），帶搜尋框
- 選了 session 後走 `session:launch` + `resume: sessionId`，由 CLI replay 歷史
- 簡化 `SessionRow`：只 title + 相對日期，hover 顯示 rename/delete
- 移除 WorkspaceLayout 的 history sidebar
- Server 端 `session:list` 支援 cwd 過濾參數

## Capabilities

### New Capabilities
- `resume-overlay`: ChatPanel 內的 session list overlay，由 `/resume` 觸發，含搜尋、cwd 過濾、選 session 後 resume

### Modified Capabilities
- `session-list`: server 端 `session:list` 新增 cwd 過濾參數

## Impact

- `packages/client/src/components/SessionHistory.tsx` — 簡化 UI
- `packages/client/src/components/SessionRow.tsx` — 簡化為 title + 相對日期
- `packages/client/src/components/ChatPanel.tsx` — 加入 overlay 狀態
- `packages/client/src/components/WorkspaceLayout.tsx` — 移除 history sidebar
- `packages/client/src/components/CommandMenu.tsx` — resume 觸發 overlay
- `packages/server/src/socket/handlers/session-handler.ts` — session:list 加 cwd filter
- `packages/server/src/services/session-store.ts` — query 加 cwd 條件
