## Why

cc-office 目前的版面是仿照 VS Code extension webview 設計，假設執行在桌機固定視窗內，沒有考慮 RWD。未來會脫離 extension 框架改成獨立 web app，因此需要讓版面在各種螢幕尺寸（手機、平板、桌機）下都能正常使用。

主要問題：
- `ActivityBar` + `Sidebar`（260px fixed）+ `RawEventPanel`（288px fixed）在小視窗下會擠壓或覆蓋主內容
- `TabBar` 在多 tab + 窄視窗下 tab 會溢出
- `MessageList` 無 max-width，超寬螢幕行長過長影響可讀性
- 沒有 breakpoint 策略，無法針對 mobile 隱藏/重排元件

## What Changes

- 定義三個 breakpoint：`sm`（≥640px）、`md`（≥768px）、`lg`（≥1024px）
- **Mobile（< 768px）**：Sidebar 和 ActivityBar 收合，改為底部 navigation bar 或 drawer
- **Tablet（768px–1023px）**：ActivityBar 顯示，Sidebar 預設收合可展開
- **Desktop（≥1024px）**：現有版面不變
- `MessageList` 加 `max-w-3xl mx-auto`，避免超寬螢幕行長過長
- `ChatInputArea` 維持 `max-w-[680px]`，與 MessageList 視覺對齊
- `RawEventPanel` 在 mobile 改為全螢幕 overlay 而非側邊 panel
- `CommandPalette` 已有 `maxWidth: calc(100vw - 48px)`，不需調整

## Capabilities

### New Capabilities
- `mobile-nav`: Mobile 底部導航列（取代 ActivityBar 在窄視窗下的功能）
- `sidebar-drawer`: Sidebar 在 tablet 以下改為 drawer（從左側滑入）

### Modified Capabilities
- `layout-shell`: WorkspaceLayout 加入 breakpoint-aware 版面切換邏輯
- `message-list-width`: MessageList 加 max-width 限制

## Impact

- `packages/client/src/components/WorkspaceLayout.tsx` — breakpoint 切換邏輯
- `packages/client/src/components/ActivityBar.tsx` — mobile 下隱藏
- `packages/client/src/components/TabBar.tsx` — mobile 下調整或隱藏
- `packages/client/src/components/MessageList.tsx` — 加 max-width
- `packages/client/src/components/ChatPanel.tsx` — RawEventPanel 改 overlay
- 新增 `packages/client/src/components/MobileNav.tsx`
- 新增 `packages/client/src/hooks/useBreakpoint.ts`
