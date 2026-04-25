## 1. RightPaneScopeContext (TDD)

- [ ] 1.1 寫 `contexts/__tests__/RightPaneScopeContext.test.tsx`：default `follow`、`togglePin` 進 pinned + 鎖 cwd、再 toggle 回 follow、pinned 期間 activeCwd 改變 useRightPaneCwd 不變、`activeCwd=null` 時 togglePin no-op、sessionStorage 持久化（remount 後仍 pinned）、corrupt JSON fallback follow
- [ ] 1.2 紅燈確認
- [ ] 1.3 實作 `contexts/RightPaneScopeContext.tsx`：
  - `RightPaneScope` discriminated union (`follow` | `pinned`)
  - `RightPaneScopeProvider({ activeCwd, children })` — 讀 sessionStorage 初始化
  - `useRightPaneScope()` / `useRightPaneScopeActions()` / `useRightPaneCwd()` hooks
  - `togglePin()` 內含「pin to nothing → no-op」邏輯
  - sessionStorage key `right-pane-scope`，try/catch wrap
- [ ] 1.4 綠燈

## 2. RightPanePaneBar 元件 (TDD)

- [ ] 2.1 寫 `components/__tests__/RightPanePaneBar.test.tsx`：
  - 顯示 scope label `📁 {project} · ⎇ {branch}`
  - 無 cwd 時顯示 "— no scope —" placeholder + toggle disabled
  - radix `Switch` 有 `role="switch"`、`aria-checked` 反應 mode、`data-state` 對應
  - 鍵盤 Space 觸發切換
  - close 按鈕：mode='collapse' 顯示 `—` 呼 `onCollapse`、mode='back' 顯示 `✕` 呼 `onBack`
- [ ] 2.2 紅燈確認
- [ ] 2.3 實作 `components/RightPanePaneBar.tsx`：
  - `import * as Switch from '@radix-ui/react-switch'`（D1 首次使用）
  - props: `closeMode: 'collapse' | 'back'`、`onCollapse?` / `onBack?`
  - 內部 call `useRightPaneScope()` / `useRightPaneScopeActions()` 讀寫
  - 顯示用 project name 從 `useProjectState()` 找；branch label 從 worktree listing 找
- [ ] 2.4 綠燈
- [ ] 2.5 加 `RightPanePaneBar.stories.tsx`：follow / pinned / no-scope 三 story

## 3. RightPane 整合 (TDD，破壞性 — 移除 cwd prop)

- [ ] 3.1 紅燈：改寫 `RightPane.test.tsx`：
  - 不再傳 `cwd` prop；render 在 RightPaneScopeProvider 內
  - 期望 pane-bar 出現在最上方
  - tabs (Files/Git/Spec) 仍照舊
- [ ] 3.2 紅燈確認
- [ ] 3.3 修 `RightPane.tsx`：移除 `cwd` prop；內部 call `useRightPaneCwd()`；render `<RightPanePaneBar/>` 在 tabs 上方；接收 `onCollapse` / `onBack` props 傳給 pane-bar
- [ ] 3.4 綠燈
- [ ] 3.5 更新 `RightPane.stories.tsx`：所有 story 包 RightPaneScopeProvider + ActiveChatTabCwdProvider

## 4. WorkspaceLayout 串接 (TDD)

- [ ] 4.1 紅燈：擴 `WorkspaceLayoutRWD.test.tsx`：
  - 點 pane-bar toggle → `data-state` 切換、`useRightPaneCwd` 回 pinned cwd
  - 切 chat tab → pinned 模式下右 pane 不變
  - 桌面 close → `setRightOpen(false)` 觸發
- [ ] 4.2 紅燈確認
- [ ] 4.3 修 `WorkspaceLayout.tsx`：
  - mount `RightPaneScopeProvider activeCwd={useActiveCwd 結果}`
  - 移除 `RightPaneWithCwd` 的 cwd 傳遞
  - 接 `onCollapse` / `onBack` props 給 RightPane
- [ ] 4.4 綠燈

## 5. Edge cases & cleanup

- [ ] 5.1 寫測試：pinned cwd 被刪除時（worktree archive） → useRightPaneCwd fallback 回 null + 顯示 toast
- [ ] 5.2 實作 fallback 邏輯
- [ ] 5.3 跑 `pnpm --filter client test` 全綠
- [ ] 5.4 跑 `pnpm exec biome check --write` + `tsc --noEmit`
- [ ] 5.5 視覺對照 `docs/prototype/redesign-d1.html` 的 pane-bar 互動
- [ ] 5.6 commit 分階段
