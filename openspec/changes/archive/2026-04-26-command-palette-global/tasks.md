## 1. CommandPaletteContext + Message Registry (TDD, additive)

- [x] 1.1 寫 `stores/__tests__/useMessageRegistryStore.test.ts`：register/unregister/update/getAllMessages
- [x] 1.2 紅燈確認
- [x] 1.3 實作 `stores/useMessageRegistryStore.ts`：Zustand store，跨 channel messages registry
- [x] 1.4 整合 `ChannelMessagesContext.tsx`：mount 時 register，messages 變化時 update，unmount 時 unregister
- [x] 1.5 寫 `contexts/__tests__/CommandPaletteContext.test.tsx`：default closed、openPalette/closePalette、registerJumpTo、registerActions
- [x] 1.6 實作 `contexts/CommandPaletteContext.tsx`：state + openPalette(opts?) / closePalette() / jumpTo / registerActions / useCommandPalette()
- [x] 1.7 綠燈

## 2. CommandPalette 改 context-driven (TDD，破壞性)

- [x] 2.1 紅燈：改寫 `CommandPalette.test.tsx`：
  - 移除 `onJumpTo` / `onToggleRawPanel` / `rawPanelActive` props 的 expectation
  - palette 用 context 開/關
  - 從 message registry 讀所有 channel messages
  - 跨 channel 搜尋測試
- [x] 2.2 紅燈確認
- [x] 2.3 改 `CommandPalette.tsx`：
  - 移除 per-tab props，改用 useCommandPalette() + useMessageRegistryStore
  - features 依 context 動態組合（全域 + preferences）
  - mobile responsive className：`max-lg:` full-screen / `lg:` centered modal
- [x] 2.4 改寫 `CommandPaletteAllTab.test.tsx` 配合新 API
- [x] 2.5 綠燈

## 3. 全域 features (TDD)

- [x] 3.1 寫 `features/global-actions/__tests__/`：
  - switch-project-feature：列 projects、選後 callback
  - add-project-feature：選後觸發 dialog callback
  - open-settings-feature：選後觸發 dialog callback
- [x] 3.2 紅燈
- [x] 3.3 實作 3 個 feature（switch-worktree 延後）
- [x] 3.4 綠燈
- [x] 3.5 接入 CommandPalette.tsx（useProjectState + paletteActions）

## 4. WorkspaceLayout mount palette (TDD)

- [x] 4.1 修 `WorkspaceLayout.tsx`：
  - 拆 WorkspaceLayout → CommandPaletteProvider + WorkspaceLayoutInner
  - mount `<CommandPalette/>` 在 workspace shell
  - workspace level 註冊 `mod+k` hotkey
  - registerActions 傳入 onAddProject / onOpenSettings
- [x] 4.2 既有 WorkspaceLayoutRWD.test.tsx 25 tests 全綠

## 5. Topbar `⌕` 按鈕 (TDD)

- [x] 5.1 寫測試（`WorkspaceTopbar.test.tsx`）：topbar 含 `aria-label="Search"` 按鈕、click 呼 onOpenSearch
- [x] 5.2 紅燈
- [x] 5.3 加 `MagnifyingGlassIcon` 按鈕到 WorkspaceTopbar + onOpenSearch prop
- [x] 5.4 WorkspaceLayout 傳入 onOpenSearch={() => openPalette()}
- [x] 5.5 綠燈

## 6. ChatPanel 解耦 (破壞性)

- [x] 6.1 修 `ChatPanel.tsx`：
  - 移除 `commandPaletteOpen` state、移除 CommandPalette JSX
  - `mod+f` callback 改呼 `openPalette({ tab: 'messages' })`
  - `mod+k` 從 ChatPanel 拔（workspace level 處理）
  - 註冊 jumpTo callback（scrollToMessage）
- [x] 6.2 加 `CommandPaletteProvider` 到 `render-with-channel.tsx` test utility
- [x] 6.3 ChatPanel 26 tests + 全部 831 component tests 綠燈

## 7. Mobile responsive 視覺驗證

- [x] 7.1 storybook story：palette mobile (full-screen) / desktop (modal) 兩個 viewport
- [ ] 7.2 手動測試 iOS Safari virtual keyboard 蓋 input 行為
- [ ] 7.3 視覺對照（沒有 mockup，採當前實作 baseline）

## 8. Cleanup

- [x] 8.1 跑 `pnpm --filter client test` 全綠（1711 tests）
- [x] 8.2 biome / tsc 通過
- [ ] 8.3 commit 分多個（每 group 一個）

## 9. 統一鍵盤導航（TDD）

目前 `handleKey` 只操作 `messageResults`，導致 Projects / Actions tab 無法用 ↑↓ + Enter。
需建立 unified item list（messages + features），讓所有 tab 都能鍵盤導航。

- [x] 9.1 export `flatFilteredFeatures` from PaletteCommandList + 單元測試
- [x] 9.2 寫 CommandPalette 整合測試：Messages tab Enter 跳轉
- [x] 9.3 寫 CommandPalette 整合測試：Actions tab ↑↓ 導航 features
- [x] 9.4 寫 CommandPalette 整合測試：Projects tab ↑↓ 導航
- [x] 9.5 寫 CommandPalette 整合測試：All tab ↑↓ 跨 messages + features
- [x] 9.6 統一 activeIdx 跨 messages + features，移除 activeFeatureId state
- [x] 9.7 重構 handleKey：ArrowDown/Up 用 totalItems 限制，Enter 依 item type 分派
- [x] 9.8 PaletteMessageList 接收 messageActiveIdx、PaletteCommandList hover 映射到 unified idx
- [x] 9.9 GroupRow 支援 data-active + isActive prop
- [x] 9.10 全部 1744 tests 綠燈

## Deferred

- [ ] switch-worktree-feature：需要 async GitContext 取 worktree 列表，延後處理
- [ ] Filter features（per-channel visibility toggles）：跨 channel palette 下需重新設計 scope
