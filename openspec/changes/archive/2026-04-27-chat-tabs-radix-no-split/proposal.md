## Why

`ChatPanel` 的 tab strip (`TabBar` + `TabContainer`) 是手刻 `<span role="tab">`，缺乏完整 a11y（無 roving tabindex、無 Arrow nav、aria-selected 手綁），跟 `RightPane` 已採用的 Radix `Tabs.Root` 模式不一致。同時 split mode（同時並排兩個 chat）增加了 `TabContainer` 的渲染分支複雜度但實際使用率不明，造成 Radix migration 困難（Radix 單 active value 模型不支援 multi-active）。

## What Changes

- **BREAKING**: 移除 split mode (`splitTabId` / `enterSplit` / `exitSplit` / `<SplitHalf>` / `PanelGroup` body 分支)；簡化 TabContainer 為單 active 模型
- 將 `TabBar` 的手刻 tab strip 改用 `@radix-ui/react-tabs`（已是 RightPane 的 dependency）
  - `Tabs.Root` 受控於 `useTabState().activeTabId` ↔ `useTabActions().setActiveTab`
  - `Tabs.Trigger` 用 `asChild` 渲染 `<div role="tab">`，避開 close `<button>` nested 在 trigger `<button>` 的 button-in-button 違規
  - `Tabs.Content forceMount + hidden` 保持「全部 tab 永遠 mount」invariant（reuse RightPane pattern）
- 視覺對齊 F.html (`docs/prototype/F.html` + `shared.css:148-162`)：
  - Active tab: `border-bottom: 2px accent` + `bg: var(--color-bg)`（當前是 `border-border-focus`）
  - Tab 之間 `border-right` 實線分隔（取代當前 gap）
  - `.scope-tag` 10px mono 在 title 旁
  - 預留 `.provider-pill` slot（actual feature 之後做）
  - `+` add tab 樣式對齊 `.chat-tab.add`
  - History `☰` icon 改 Recent `⏱`
- 保留多色 status dot（idle / processing / cancelling 各色）— functional 需求 > F.html 的 binary live/idle
- Keyboard: 升級到 ARIA APG 標準（Arrow / Home / End 切換相鄰 tab；Tab 鍵跳出 tablist）
- TabContainer 不再依賴 `cwd === undefined` sentinel — 上一個 PR 已切到 `launchOnMount` flag

## Capabilities

### New Capabilities
- `chat-tabs`: ChatPanel 的 tab strip 行為與視覺契約（含 a11y、F.html 視覺、tab state 保留 invariant）

### Modified Capabilities
（無 — split mode 沒有獨立 capability spec，砍除動作在新 capability 內描述）

## Impact

**Modified:**
- `apps/web/src/components/TabBar.tsx` — Radix-based 重寫，drop shift-click split
- `apps/web/src/components/TabContainer.tsx` — 砍 split 分支 + PanelGroup，body 用 `Tabs.Content forceMount + hidden`
- `apps/web/src/contexts/TabContext.tsx` — 移除 `splitTabId` / `enterSplit` / `exitSplit`
- `apps/web/src/components/__tests__/TabBar.test.tsx` — query 升級到 `getByRole('tab')` / `aria-selected`
- `apps/web/src/contexts/__tests__/TabContext/split.test.tsx` — 整檔刪除（split 砍掉）
- 任何呼叫 `enterSplit` / `exitSplit` 的元件（grep 確認）

**Dependencies:**
- 無新增（`@radix-ui/react-tabs ^1.1.13` 已存在）

**Out of scope:**
- Provider pill 真實作（先留 visual slot，actual switching 之後 feature）
- ✕ button hover overlay（保 F.html 永顯設計）
- Context menu「Open in split」替代（split 整個砍掉，不需要替代品）

**Risk:** 中。
- Split mode 移除是 BREAKING — 確認 prod 使用率
- `Tabs.Trigger asChild → <div role="tab">` 失去 native `<button>` semantics，但 Radix 補足 keyboard / role / aria-selected
- Focus management 從 manual tabindex=0 改 Radix roving — 程式驅動切 active 時要驗證不搶 textarea focus（spike `RightPane` 行為作 reference）
