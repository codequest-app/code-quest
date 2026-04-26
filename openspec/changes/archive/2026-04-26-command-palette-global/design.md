## Context

`CommandPalette.tsx` 第 41-47 行接收的 props：`onJumpTo` / `onToggleRawPanel` / `rawPanelActive` 全部來自 ChatPanel 的 active channel。第 48-49 行 call `useChannelMessages()` / `useMessageVisibility()` — 這兩個 hook 必須在 ChannelProvider 內 render。

提升到 workspace level 後 palette 可能 render 在沒有 ChannelProvider 的 context（empty state、剛載入）— 必須處理「無 channel」的 fallback。

`docs/prototype/F.html` 與 `redesign-d1.html` 都沒展開 palette 細節 — 這次設計沒 mockup 對照。

## Goals / Non-Goals

**Goals:**
- mobile/tablet 有 search 入口（`⌕` topbar 按鈕）
- empty state（無 active chat）palette 仍可開，提供 `Switch project` / `Add project` / `Open settings` 等全域動作
- `⌘K` / `⌘F` 鍵盤在 workspace 任何地方都可觸發
- 既有的 messages search / filter / raw panel toggle 在有 active chat 時行為不變

**Non-Goals:**
- 為 palette 新增 backend
- 改變 palette 視覺設計（沿用既有）

**Changed from original:**
- ~~messages 仍只搜當前 channel~~ → messages 搜尋所有已開啟 tab/channel 的訊息，選中後跨 tab 跳轉

## Decisions

### D1. Context-aware features，不分裂成兩個 palette

**Decision**: 維持單一 `<CommandPalette/>` 元件。內部根據 `useActiveChatContext()` 決定哪些 features 顯示：
- 有 active channel → 顯示所有既有 features (messages tab、filter、raw panel toggle、preferences)
- 無 active channel → 只顯示「無需 channel」的 features（preferences + 全域 actions）

**Why**:
- 用戶不會看到「兩種 palette」的概念混亂
- 一個 palette、一份視覺、一份鍵盤 a11y
- features 系統本來就有 `tabs?: PaletteTab[]` 欄位（CommandPalette.tsx line 21）— 擴成「依 context 啟用」是同類擴張

**Alt**: 拆 `WorkspaceCommandPalette` 與 `ChatCommandPalette` — 兩個元件、兩條 hotkey 路徑、兩份 a11y。否決，重複工。

### D2. Message Registry（跨 tab 訊息存取）

**Decision**: 新增 `useMessageRegistryStore`（Zustand），每個 ChannelMessagesProvider mount 時註冊 `{ channelId, projectCwd, messages }` reference，unmount 時移除。Palette 從 registry 讀所有 channel 的 messages。

**Why**:
- messages 已存在各 ChannelMessagesProvider 記憶體中，registry 只存 reference 不複製
- 零額外記憶體開銷
- 比 palette 自己 subscribe socket 簡單得多，不需同步邏輯

**Alt**: palette 持有 socket 收所有訊息 — 重複存資料、記憶體翻倍、需要自己管 message lifecycle。否決。

### D3. `useActiveChatContext()` soft hook（保留）

palette 仍需知道「當前 active channel」以決定 filter features 顯示。soft hook 在 ChannelProvider 外回 null。

### D2a. 跨 tab 跳轉機制

選中搜尋結果 → `TabContext.activateTab(channelId)` 切 tab → ChatPanel mount 後透過已註冊的 `jumpTo(messageId)` callback scroll 到訊息。

ChatPanel mount 時 `registerJumpTo(channelId, scrollToMessage)`，unmount 時移除。

**Why**: 既有 `useChannelMessages` 是 hard-bound（無 Provider 就 throw）。palette 升 workspace 後在 empty state 不會有 ChannelProvider，必須 soft fallback。

**Implementation**: hook 內 `useContext(ChannelMessagesContext)` 拿 raw context value；undefined 回 null。

### D3. CommandPaletteContext 控制 open/close

```ts
const { open, openPalette, closePalette } = useCommandPalette();
```

Provider mount 在 `WorkspaceLayout`，本身放一個 `<CommandPalette/>`。Topbar `⌕` 按鈕跟 ChatPanel 的 `⌘K` hotkey 都呼 `openPalette()`。

**Why**:
- 多個觸發來源（按鈕、hotkey from any context）共用 state
- 集中 state 才能在 ChatPanel mod+k 跟 topbar button 同步「palette 已打開」
- 比起 prop drilling 通往 WorkspaceLayout 更乾淨

### D4. `⌘K` hotkey 移到 workspace level；`mod+f` 在 chat 層保留 / 重定向

**Decision**:
- `mod+k` → `openPalette()` from workspace
- `mod+f` → 維持「在 active chat 內 ctrl-f 開 palette focused on messages」— ChatPanel 仍註冊 hotkey，但 callback 改呼 `openPalette({ tab: 'messages' })`
- 在 empty state（無 chat），mod+f 不註冊（沒有 ChatPanel），只剩 mod+k

**Why**: mod+f 是「找東西」，本來就是 chat-scoped 動作；保留它的 chat 慣例 + 自動切到 messages tab 才符合用戶肌肉記憶。

### D5. `openPalette(opts?: { tab?: TabId })` 接受預設 tab

支援「mod+f → 預設 messages tab」「topbar ⌕ → 預設 all tab」「設定深連結 → 預設 actions tab」。

### D6. Mobile palette UI 變 full-screen overlay

**Decision**: 用 Tailwind responsive class：
- `lg+`：palette 中央 modal（既有）
- `<lg`：palette 撐滿 viewport（input 在頂部、結果列表 1fr scroll）

**Why**: mobile 中央 modal + virtual keyboard = 卡死。Full-screen 只佔 input + 結果，沒 backdrop 浪費。

**Implementation**: palette root container className 加 `lg:max-w-2xl lg:rounded` 之類；mobile 默認 `inset-0`。

### D7. 全域 features：用既有 feature 系統實作

新增 `features/global-actions/`：
- `switch-project-feature.ts` — 列所有 projects，選後呼 setActiveProject
- `add-project-feature.ts` — 觸發 AddProjectDialog
- `switch-worktree-feature.ts` — 跨 project 列 worktrees，選後 set worktree
- `open-settings-feature.ts` — 觸發 SettingsDialog

每個 feature 都接 dependencies (projects list、callbacks) 透過 context 拿。

## Risks / Trade-offs

- **`useActiveChatContext` soft hook 違反目前 hard-binding 慣例** → 文件註明這是「跨 boundary 的 bridge」一致於 `ActiveChatTabCwdContext` 的 pattern
- **Palette mount 一份 vs 多份 channel 切換時的 state 重置** → 切 chat tab 時 palette 關閉，重開後 state（query / activeTab）清空 — 跟現在每 tab 各自一份 state 行為類似
- **既有 palette tests 重寫** → CommandPaletteAllTab.test.tsx 等需要重新包 provider，估 10 個 case
- **mobile virtual keyboard 蓋 input** → 用 `position: fixed` + viewport units 解；測 iOS Safari (worst case)

## Migration Plan

1. 加 `CommandPaletteContext` + `useActiveChatContext` soft hook（純加）
2. 把 CommandPalette props 改成內部 context-driven（破壞 ChatPanel call site）
3. WorkspaceLayout mount Provider + `<CommandPalette/>`
4. ChatPanel 移除 palette JSX，改 hotkey 呼 context.openPalette
5. WorkspaceTopbar 加 `⌕` button
6. 加全域 features
7. mobile responsive layout 調整
8. 修復破壞的測試

無 DB / wire / API 改動。

## Open Questions

- 全域 `Switch project` feature 跟 `TopScopeSwitcher` 的職責重疊？— 接受重疊；palette 是 keyboard-first，TopScopeSwitcher 是 click-first
- `⌘K` 在 input focused 時是否仍開 palette？— 維持既有行為（NO_FORM 跳過 form 元素）
- 全域 features 的 hotkey 是否要綁 secondary key (`gp` for switch project, vim-style)？— v1 不做
