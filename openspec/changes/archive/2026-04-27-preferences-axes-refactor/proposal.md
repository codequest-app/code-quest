## Why

目前 client 端的視覺與版面完全寫死在 `App.css` 的 `@theme` 與單一 `WorkspaceLayout`，使用者無法切換色彩、字級、密度或版面樣式。我們希望未來能提供主題與版面切換（例如 light/dark、comfortable/compact、A/B 版面），但直接加 toggle 會導致關注點混在一起。本變更先把「使用者偏好」拆成多個正交軸，並為後續切換功能建立可驗證的基礎，同時把 Storybook 覆蓋率補齊成為視覺回歸防護網。

## What Changes

- 新增多軸使用者偏好系統，軸線：`colorTheme` / `fontSize` / `density` / `layout` / `hiddenItems`，彼此獨立可組合
- 以 `<html>` 上的 `data-theme` / `data-font` / `data-density` attribute 驅動 CSS 變數切換，避免 re-render
- `usePreferencesStore` 擴充，以 zustand `persist` 儲存偏好；提供 preset apply 機制
- **Phase 0（本變更前置）**：補齊 22 個 component + 4 個 feature 的 Storybook stories；導入 `@storybook/test-runner` 以 Playwright 跑 smoke + visual snapshot，建立 baseline
- **Phase 1（本變更核心）**：實作 `colorTheme` + `fontSize` 切換，預設值等於現有寫死值，確保 CSS vars dump diff 為空
- **Phase 2+（後續變更）**：`density` / `layout` / `hiddenItems` 另開 change 處理，不在此 change 範圍
- 不變動既有元件結構與行為，預設值維持現有視覺一致

## Capabilities

### New Capabilities

- `user-preferences`: 多軸使用者偏好系統（color theme / font size / density / layout / visibility），含 store、persist、preset apply、以 `<html>` data-attr 套用
- `storybook-coverage`: Storybook 覆蓋率與視覺回歸防護網（所有 component/feature 都有 stories，`@storybook/test-runner` + Playwright 跑 smoke/snapshot/a11y）

### Modified Capabilities

- `client`: 應用掛載時需從 `usePreferencesStore` 讀取偏好並套用到 `<html>` data-attr
- `layout-shell`: 未來 layout 切換會由 preferences 驅動；本變更僅暴露介面，不實作 B 版面

## Impact

- 新增/修改檔案：
  - `apps/web/src/stores/usePreferencesStore.ts`（擴充軸線）
  - `apps/web/src/App.tsx`（掛載時同步 data-attr）
  - `apps/web/src/App.css`（拆 `@theme` 成 `:root[data-theme="..."]` / `:root[data-font="..."]`）
  - 新增 `apps/web/src/components/**/*.stories.tsx`（22 個）
  - 新增 `apps/web/src/features/**/*.stories.tsx`（4 個）
  - 新增 `apps/web/.storybook/test-runner` 配置
  - `apps/web/package.json`（加 `@storybook/test-runner`、`test-storybook` script）
- 依賴：`@storybook/test-runner`（Playwright 已裝）
- 測試：既有 vitest + typecheck + lint 全綠；新增 Storybook smoke/snapshot
- 風險：CSS vars 拆 block 時若預設值寫錯會整頁變色 → 以 dump diff 驗證阻擋
