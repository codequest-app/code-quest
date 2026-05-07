## Why

`CommandPalette` 目前 mount 在 `ChatPanel` 內部 — 每個 chat tab 各自一份，由 `⌘K` / `⌘F` 鍵盤快捷觸發。三個問題：

1. **mobile/tablet 沒入口**：沒有實體鍵盤，topbar 也沒 ⌕ 按鈕，等同 search 在小螢幕完全消失
2. **無 active chat tab 時不可達**：empty state（剛加完 project 還沒選 worktree）也沒 palette
3. **「Switch project」這類全域動作無處可放**：palette 目前 features 都跟 channel 綁定（messages search、raw panel toggle、filter），缺少全域操作層

## What Changes

把 CommandPalette 從 per-tab 升為 **workspace-level 全域**，但保留它對「目前 active 的 chat context」的敏感度（context-aware，不是全砍 channel features）。

- **mount 位置**：從 `ChatPanel` 移到 `WorkspaceLayout`
- **多入口**：
  - `⌘K` / `⌘F` 鍵盤（既有，移到 workspace level）
  - Topbar 新增 `⌕` 按鈕（mobile/tablet 主要入口；desktop 也加）
- **Context-aware features**：
  - `messages` tab、`filters`、`raw panel toggle` 等 channel-bound features 在**有 active chat**時才出現
  - `actions` tab（preferences）永遠可用
  - 新增**全域 actions**：`Switch project…`、`Add project…`、`Open settings`、`Switch worktree…`（跨 project）
- **mobile-friendly UI**：
  - palette overlay 在 mobile 改 full-screen（不是中央 modal）
  - virtual keyboard 出現時不蓋住 input
- 砍 `ChatPanel` 內 `useState(commandPaletteOpen)` 跟 mount，改 call workspace context 提供的 `openPalette()`

**Out of scope：**
- mobile/tablet layout shell 重構（`mobile-tablet-layout-f-align`）
- sidebar 點擊衝突（`sidebar-redesign-d1`）
- RightPane pin/follow（`right-pane-pin-follow`）
- 為 palette 新增實際的 search backend（既有 features 重用即可）

## Capabilities

### New Capabilities
（無）

### Modified Capabilities
- `command-palette`: 從 per-tab 提升為 workspace 全域；新增 context-aware feature filtering 與全域 actions
- `header-bar`: topbar 新增 ⌕ search 按鈕

## Impact

- `apps/web/src/components/CommandPalette.tsx` — 移除 per-tab props (`onJumpTo` / `onToggleRawPanel` / `rawPanelActive`)，改用 context 取得；features 依 active chat 是否存在動態 filter
- `apps/web/src/contexts/CommandPaletteContext.tsx`（新）— `usePaletteOpen()` / `openPalette()` / `closePalette()`；mount 在 `WorkspaceLayout`
- `apps/web/src/components/ChatPanel.tsx` — 拔掉 `commandPaletteOpen` state；`mod+k` hotkey 改呼 context.openPalette()；`onOpenCommandPalette` prop 改傳 context callback；CommandPalette JSX 移除
- `apps/web/src/components/WorkspaceLayout.tsx` — mount `CommandPaletteProvider` + 一個 `<CommandPalette/>`；hotkey 在 workspace level 註冊
- `apps/web/src/components/WorkspaceTopbar.tsx` — 加 `⌕` 按鈕觸發 openPalette
- `apps/web/src/features/` — 新增全域 features：`switch-project`、`add-project`、`switch-worktree`
- 新 hook：`useActiveChatContext()` — soft 回傳 channel id / messages（無 active 時 null），讓 palette 內部判斷哪些 features 顯示
- 既有 `CommandPalette.test.tsx` / `CommandPaletteAllTab.test.tsx` 部分要重寫（不再 prop-driven）
- 不影響 server / shared / summoner package
