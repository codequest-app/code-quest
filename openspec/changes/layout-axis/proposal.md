## Why

`preferences-axes-refactor` Phase 1 預留了 `layout: 'a' | 'b'` store 欄位但沒實作，設計文件標記為「Phase 2 另開 change 處理」。目前 `App.tsx` 仍固定 render `WorkspaceLayout`，`<html>` 沒有 `data-layout` attr，SettingsDialog 沒有 layout 選項，CommandPalette 也沒有入口。本 change 把這條預留軸線補齊。

## What Changes

- **App.tsx**：同步 `layout` 到 `<html>` `data-layout` attr（比照現有 `data-theme` / `data-density`）
- **App.css**：新增 `:root[data-layout="a"]` 和 `:root[data-layout="b"]` blocks（a 保持現狀；b 可以是不同 sidebar/messagelist/toolbar 位置）
- **Layout B 實作**：目前保持「a = 現狀」，**b 為 scaffold**（CSS class 切換 sidebar 寬度 + activity bar 位置）作為概念驗證。完整 B layout component 變體留給後續 change
- **`features/layout/layout-feature.ts`**：choice feature（a/b），透過 `createChoiceFeature` 建立，section 放 Settings
- **CommandPalette**：註冊 layout feature（actions tab）
- **SettingsDialog**：新增 Layout radio group（a/b）
- **Storybook**：layout feature story + WorkspaceLayout 四個 variant（theme × layout）

不變動既有 `WorkspaceLayout` 元件結構；b layout 用 CSS class override 實作。

## Capabilities

### Modified Capabilities

- `user-preferences`: `layout: 'a' | 'b'` 實際套用（之前只儲存）
- `preferences-ui`: SettingsDialog + CommandPalette 新增 layout 選項
- `layout-shell`: 新增 b layout CSS override block

## Impact

- 新增：
  - `packages/client/src/features/layout/layout-feature.ts` + test + story
- 修改：
  - `packages/client/src/App.tsx`（同步 `data-layout`）
  - `packages/client/src/App.css`（新增 `:root[data-layout="b"]` block）
  - `packages/client/src/components/SettingsDialog.tsx`（radio group）
  - `packages/client/src/components/CommandPalette.tsx`（register feature）
- 測試：vitest + typecheck + test-storybook 全綠
- 風險：B layout 視覺設計未定 → 先用明顯 class 切換（如 sidebar 寬度、accent color）作為 scaffold，視覺細節 follow-up
