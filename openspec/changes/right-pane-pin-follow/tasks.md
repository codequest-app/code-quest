## 1. RightPaneScopeContext (TDD)

- [x] 1.1 寫 `contexts/__tests__/RightPaneScopeContext.test.tsx`：default `follow`、`togglePin` 進 pinned + 鎖 cwd、再 toggle 回 follow、pinned 期間 activeCwd 改變 useRightPaneCwd 不變、`activeCwd=null` 時 togglePin no-op、sessionStorage 持久化（remount 後仍 pinned）、corrupt JSON fallback follow
- [x] 1.2 紅燈確認
- [x] 1.3 實作 `contexts/RightPaneScopeContext.tsx`：
  - `RightPaneScope` discriminated union (`follow` | `pinned`)
  - `RightPaneScopeProvider({ activeCwd, children })` — 讀 sessionStorage 初始化
  - `useRightPaneScope()` / `useRightPaneScopeActions()` / `useRightPaneCwd()` hooks
  - `togglePin()` 內含「pin to nothing → no-op」邏輯
  - sessionStorage key `right-pane-scope`，try/catch wrap
- [x] 1.4 綠燈

## 2. RightPanePaneBar 元件 (TDD)

- [x] 2.1 寫 `components/__tests__/RightPanePaneBar.test.tsx`：
  - 顯示 scope label `📁 {project} · ⎇ {branch}`
  - 無 cwd 時顯示 "— no scope —" placeholder + toggle disabled
  - radix `Switch` 有 `role="switch"`、`aria-checked` 反應 mode、`data-state` 對應
  - 鍵盤 Space 觸發切換
  - close 按鈕：mode='collapse' 顯示 `—` 呼 `onCollapse`、mode='back' 顯示 `✕` 呼 `onBack`
- [x] 2.2 紅燈確認
- [x] 2.3 實作 `components/RightPanePaneBar.tsx`：
  - `import * as Switch from '@radix-ui/react-switch'`（D1 首次使用）
  - props: `closeMode: 'collapse' | 'back'`、`onCollapse?` / `onBack?`
  - 內部 call `useRightPaneScope()` / `useRightPaneScopeActions()` 讀寫
  - 顯示用 project name 從 `useProjectState()` 找；branch label 從 worktree listing 找
- [x] 2.4 綠燈
- [x] 2.5 加 `RightPanePaneBar.stories.tsx`：follow / pinned / no-scope 三 story

## 3. RightPane 整合 (TDD，破壞性 — 移除 cwd prop)

- [x] 3.1 紅燈：改寫 `RightPane.test.tsx`：
  - 不再傳 `cwd` prop；render 在 RightPaneScopeProvider 內
  - 期望 pane-bar 出現在最上方
  - tabs (Files/Git/Spec) 仍照舊
- [x] 3.2 紅燈確認
- [x] 3.3 修 `RightPane.tsx`：移除 `cwd` prop；內部 call `useRightPaneCwd()`；render `<RightPanePaneBar/>` 在 tabs 上方；接收 `onCollapse` / `onBack` props 傳給 pane-bar
- [x] 3.4 綠燈
- [x] 3.5 更新 `RightPane.stories.tsx`：所有 story 包 RightPaneScopeProvider + ActiveChatTabCwdProvider

## 4. WorkspaceLayout 串接 (TDD)

- [x] 4.1 紅燈：擴 `WorkspaceLayoutRWD.test.tsx`：
  - 點 pane-bar toggle → `data-state` 切換、`useRightPaneCwd` 回 pinned cwd
  - 切 chat tab → pinned 模式下右 pane 不變
  - 桌面 close → `setRightOpen(false)` 觸發
- [x] 4.2 紅燈確認
- [x] 4.3 修 `WorkspaceLayout.tsx`：
  - mount `RightPaneScopeProvider activeCwd={useActiveCwd 結果}`
  - 移除 `RightPaneWithCwd` 的 cwd 傳遞
  - 接 `onCollapse` / `onBack` props 給 RightPane
- [x] 4.4 綠燈

## 5. Edge cases & cleanup

- [x] 5.1 寫測試：pinned cwd 被刪除時（worktree archive） → useRightPaneCwd fallback 回 null + 顯示 toast
- [x] 5.2 實作 fallback 邏輯
- [x] 5.3 跑 `pnpm --filter client test` 全綠
- [x] 5.4 跑 `pnpm exec biome check --write` + `tsc --noEmit`
- [x] 5.5 視覺對照 `docs/prototype/F.html` 的 pane-bar — 已調整 scope chip + pin 按鈕樣式

## 6. Scope Popover — 直接選目標 worktree pin（對照 prototype `openScopePop`）

- [x] 6.1 Context 擴充：加 `pinTo(cwd)` / `unpin()` actions + 測試
- [ ] 6.2 寫 `ScopePicker` popover 測試：
  - 列出所有 project × worktree（project name · ⎇ branch）
  - 當前 pinned cwd 有 ✓ mark
  - 底部「⇆ Follow active chat tab」選項
  - 點 worktree → pinTo 該 cwd + popover 關閉
  - 點 follow → unpin + popover 關閉
  - 無 worktree 時顯示 placeholder
- [ ] 6.3 紅燈確認
- [ ] 6.4 實作 `ScopePicker.tsx`（radix Popover，參考 TopScopeSwitcher 結構）
- [ ] 6.5 綠燈
- [ ] 6.6 整合到 `RightPanePaneBar`：scope label 改為 Popover trigger
- [ ] 6.7 scope label 顯示真實 branch（從 `useGitState().listing` 查）
- [ ] 6.8 跑 `pnpm --filter client test` 全綠 + `tsc --noEmit`
- [ ] 6.9 commit
