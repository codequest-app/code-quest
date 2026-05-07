## Why

`feature-adapter-refactor` 建好了純資料 `Feature` + adapter 基礎，但**原始目標**（讓使用者從 Cmd+K 切 theme / density / 開 preferences）尚未完成——CommandPalette 的 Messages/Actions tab 仍是寫死的 inline 元件，沒吃 feature registry。本 change 把 CommandPalette 收斂為 feature-driven 容器，同時把 theme/density/open-settings 從 CommandMenu 搬到 palette 專屬。

## What Changes

- 新增 `components/palette/PaletteMessageList.tsx`——從 `CommandPalette` 內聯的 `MessageResultList` 抽出，獨立元件
- 新增 `components/palette/PaletteCommandList.tsx`——palette 專屬的 feature list（吃 `Feature[]`、支援 search filter + 高亮）
- `utils/message-preview.ts`——從 `CommandPalette` 搬出的 pure helpers（`highlight` / `typeColor` / `typeLabel`）
- `CommandPalette.tsx`：
  - Messages tab 渲染 `<PaletteMessageList>`
  - Actions tab 渲染 `<PaletteCommandList features={...}>`
  - All tab 兩者合併
  - 檔案從 ~600 行縮為 ~150 行 orchestrator
- `CommandMenu.tsx`：**移除** `createColorThemeFeature` / `createDensityFeature` / `createOpenSettingsFeature` 三個 feature 的註冊（這三個改由 palette 獨佔呈現）
- palette 側：CommandPalette 自己 instantiate 這三個 feature（讀 `usePreferencesStore`），與 registry 的 filters/raw-panel 合併丟給 `<PaletteCommandList>`
- TDD：PaletteMessageList → PaletteCommandList → CommandPalette 整合 → CommandMenu 移除，每步 RED → GREEN

## Capabilities

### New Capabilities

- `palette-components`: PaletteMessageList + PaletteCommandList，可獨立測試與使用；未來加檔案搜尋 / sessions 切換可依樣擴充

### Modified Capabilities

- `command-menu-structure`: CommandPalette 容器改為 feature-driven；CommandMenu 移除 palette-歸屬的三 feature

## Impact

### 新增

- `apps/web/src/components/palette/PaletteMessageList.tsx` + test + story
- `apps/web/src/components/palette/PaletteCommandList.tsx` + test + story
- `apps/web/src/utils/message-preview.ts` + test
- `openspec/specs/palette-components/` 新 capability

### 修改

- `apps/web/src/components/CommandPalette.tsx`：大幅瘦身
- `apps/web/src/components/CommandMenu.tsx`：刪除三個 feature 註冊
- 既有 `CommandPalette.test.tsx` / `CommandPaletteAllTab.test.tsx`：selector 可調整但 scenario 不變
- 既有 `CommandMenu.test.tsx`：刪除 color-theme / density / open-settings 的 3 個 click-through 測試（因對應 feature 已移除；scenario 語意 vacuously 仍持有）

### 不動

- FakeSummoner 27 測試（0 diff）
- `Feature` type、`lib/adapters`、`FeatureRegistry`（本 change 的地基，穩）
- CommandMenu 的 btw / thinking / model / effort / fast-mode / clear / compact / resume / rewind / usage 等 feature
- SettingsDialog（從 palette 點 open preferences 仍打開同一個 dialog）

## 風險 / 緩解

- **CommandPalette 內聯邏輯搬家後行為漂移** → 先抽純元件並單元測試（PaletteMessageList/PaletteCommandList），驗過再換 CommandPalette
- **Messages tab 的 keyboard nav + 搜尋高亮被破壞** → 搬到 PaletteMessageList 時保留原 state 邏輯（activeIdx / arrow nav）；既有 palette 測試守著
- **CommandMenu 刪除 3 feature 後既有 click-through test 失效** → 同步刪除對應 3 個測試（scenario 還在 SettingsDialog test 裡有覆蓋）
- **使用者習慣改變**：原本 `/` 能切 theme，現在只能從 Cmd+K → 記錄在 change summary；若 feedback 強烈可再開 change 允許雙 surface（`ui.surfaces`）
