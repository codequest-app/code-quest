## Why

RightPane 的內容目前由 `useActiveCwd()` 隱式追蹤 active chat tab — 切 chat tab 右 pane 就跟著變。這導致一個常見工作流被打斷：**用戶在 worktree A 跟 Claude 對話，但想參考 worktree B 的檔案做對照** — 沒有方式可以「鎖定」右 pane 在 B 上。

`docs/prototype/F.html` 設計了 pane-bar 上的 `📌 pinned / ⇆ follow` toggle 但實作沒做。

## What Changes

新增 RightPane 上方 pane-bar 顯示 scope 並提供 follow/pin 切換：

- 新元件 `RightPanePaneBar`：
  - 顯示當前 scope label（`📁 project · ⎇ branch`）
  - radix `Switch` 切換 follow ↔ pinned
  - close 按鈕：桌面/平板 `—`（折疊 pane），mobile `✕`（回 chat）
- 新 context `RightPaneScopeContext`：
  - 兩種 mode：`follow`（跟 active chat tab）與 `pinned`（鎖定特定 cwd）
  - `togglePin()` action：在 follow 時鎖定當前 cwd；在 pinned 時還給 follow
  - sessionStorage 持久化（pin 是當下會話的工作流，重開 browser 回 follow）
- 新 hook `useRightPaneCwd()`：
  - mode=follow → 回 `useActiveCwd()`
  - mode=pinned → 回 `scope.cwd`
- `RightPane.tsx` 不再吃 `cwd` prop，改 call `useRightPaneCwd()`
- `WorkspaceLayout` mount `RightPaneScopeProvider`（同 ActiveChatTabCwdProvider 層級）
- `WorkspaceTopbar` 的 close 按鈕語意維持，但 mobile/tablet 模式由 pane-bar 補充提供 close 入口

**Out of scope（留給其他 change）：**
- ProjectRow / WorktreeRow click 衝突修復（`sidebar-redesign-d1`）
- ContextMenu / DropdownMenu DRY（`sidebar-redesign-d1`）
- mobile/tablet layout shell 重構

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `right-pane`: 新增 pane-bar + follow/pinned 模式

## Impact

- `packages/client/src/contexts/RightPaneScopeContext.tsx` — 新增（context + provider + hooks）
- `packages/client/src/components/RightPane.tsx` — 加 pane-bar 區塊；移除 `cwd` prop（內部 call hook）
- `packages/client/src/components/WorkspaceLayout.tsx` — mount Provider；移除傳 `cwd` 給 RightPane
- 新增 `@radix-ui/react-switch` 首次使用（已裝 `^1.2.6`）
- 不影響 server / shared / summoner package
