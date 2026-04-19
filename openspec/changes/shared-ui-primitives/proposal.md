## Why

兩輪 component-library 盤點顯示 `packages/client/src/components/` 有大量重複 JSX/className。其中：
- `bg-accent text-white` 這組 primary button 樣式跨 **22 個檔案**出現 32 次
- `bg-black/20 rounded px-2 py-1 border` 這組 input chrome 在 **5+ 處**被 inline 重複
- CommandPalette / FilterPopover / SearchBar **三處完全相同的放大鏡 SVG + input** 各自複製
- 6+ 檔各自實作 `flex justify-between border-b` 的 panel 標題列
- 3 檔各自 inline 寫 `fixed inset-0 z-[1000]` 的 overlay chrome（忽略既有的 Radix `ui/Dialog`）

重複 className 的代價不是「行數多」— 是每次微調（token rename、a11y 補強、visual spec 變化）都要改 N 個地方並要記得改齊，容易漂移。而且新來的人學不到「這是該用的 primitive」。

本 change 一次抽出所有**高頻率重複** primitive，把他們集中到 `components/ui/`，並遷移所有 consumer。

## What Changes

### 新 primitive（全部放 `components/ui/`）
1. **`ui/Button`** — `variant="primary"|"secondary"|"danger"|"ghost"`, `size="sm"|"md"`，收納 22 個檔案裡面散落的 button className
2. **`ui/TextField`** — `as="input"|"textarea"`，收納 input/textarea 的共同 chrome
3. **`ui/SearchField`** — 內建放大鏡 icon + 可選 trailing slot（CommandPalette / FilterPopover / SearchBar 共用）
4. **`ui/PanelHeader`** — 標題列插槽（title + actions），panel 類元件共用
5. **`ui/SectionHeader`** — uppercase 小字分區標題，palette/menu 共用（附帶修復 palette 兩處 token 不一致的 bug）

### API 調整
6. **`EmptyState`**：`actionLabel` + `onAction` 改成 optional，吸收 MentionDropdown 和 InstalledPluginList 兩處「no results」inline 寫法

### Dialog 整合
7. **`ui/Dialog` 擴充 `size="md"|"lg"|"fullscreen"` prop**；遷移 3 個 holdouts：
   - `ContentPreviewPanel.tsx`（全螢幕 diff viewer）
   - `PluginsPanel.tsx`（overlay list）
   - `SideQuestionDialog.tsx`（backdrop + centered card）
   
   3 個 holdouts 目前各自有 `fixed inset-0 z-[1000]` 自幹 overlay — 統一後 a11y / keyboard / focus trap 由 Radix 負責。

### Popover 抽取（scoped）
8. **`ui/PopoverShell`** — 只抽 **floating chrome（border/shadow/bg）+ outside-click hook**，不抽定位。SessionDropdown / MentionDropdown / FilterPopover 三處共用；各自定位邏輯（`fixed` vs follow-trigger）保留在 consumer。這樣不用引入 `@floating-ui/react` 之類定位 library。

### 不做
- Banner 家族（domain 差異大）
- `@utility .floating-surface` CSS utility — 另開 change

## Capabilities

### New Capabilities
- `ui-primitives`: `components/ui/` 成為正式 primitive 層，所有 button / input / search / panel-header / section-header 都走 primitive，未來微調樣式只動一個檔案

### Modified Capabilities
- `client`: 22+ 個 consumer 檔案從 inline className 遷移到 primitive

## Impact

- 新增：
  - `ui/Button.tsx` + test + story
  - `ui/TextField.tsx` + test + story
  - `ui/SearchField.tsx` + test + story
  - `ui/PanelHeader.tsx` + test + story
  - `ui/SectionHeader.tsx` + test + story
  - `ui/PopoverShell.tsx` + test + story（floating chrome + outside-click hook）
- 修改：
  - `ui/Dialog.tsx`：加 size prop
  - `EmptyState.tsx`：actionLabel/onAction optional
  - 22+ consumer 檔案：inline className → import primitive
- 測試：
  - 每個新 primitive 有 unit test
  - 每個 consumer 原本的測試 `expect` 不動（純重構）
  - lint-hardcoded-colors 0 hits
  - test-storybook:ci 全綠
- 風險：
  - 大面積 consumer 改動 → 每一 phase 跑完整 test suite
  - 視覺差異可能 sub-pixel drift（border/padding 轉換）→ Storybook variant 視覺檢查
