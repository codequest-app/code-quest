## Why

`preferences-axes-refactor` 建好了多軸偏好架構（`usePreferencesStore` 已有 `colorTheme` / `density` 欄位，`<html>` 透過 `App.tsx` 套 data-attr），但目前只有 `colorTheme='dark'` 與 `density='comfortable'` 兩條「空軸」— 實際切換無視覺變化。本 change 填上 **light theme palette** 與 **compact density**，讓使用者真能切到不同外觀，同時驗證整套 data-attr 驅動機制在多值下正確運作。

## What Changes

- 新增 `:root[data-theme="light"]` palette（VS Code Light+ 取向）：高對比、背景近白、文字深色、accent 仍保留 Claude 橘（對比略調以符合 light 背景）
- `colorTheme` 型別擴充為 `'dark' | 'light'`；store `setColorTheme` 接受 'light'
- 新增 `:root[data-density="compact"]`，透過覆寫 Tailwind v4 `--spacing` base 值，讓所有 spacing utilities（`p-*` / `gap-*` / `m-*`）等比例縮小（約 0.875×），不需改任何元件 class
- `comfortable` 維持現值（`--spacing: 0.25rem`）
- 新增 Storybook decorator helper `withThemePreset(theme, density)` 供 stories 預覽不同組合
- 新增 Playwright 驗證 script `tools/dump-theme-variants.mjs`：逐一切換四種組合（dark/light × comfortable/compact）截圖 + dump CSS vars
- **不變**：`density='comfortable'` + `colorTheme='dark'` 的 CSS vars 與視覺必須與 `preferences-axes-refactor` 後狀態完全一致（以 dump diff 為證）

## Capabilities

### Modified Capabilities

- `user-preferences`: `colorTheme` 新增 `'light'` 取值；`density='compact'` 實際套用到 `--spacing` base；新增 CSS vars 數值需求

## Impact

- 修改：
  - `packages/client/src/App.css`（新增 `:root[data-theme="light"]` + `:root[data-density="compact"]` blocks）
  - `packages/client/src/stores/usePreferencesStore.ts`（`ColorTheme` 型別）
  - `packages/client/src/stores/__tests__/usePreferencesStore.test.ts`（light theme case）
- 新增：
  - `packages/client/src/test/story-decorator.tsx`（加 `withThemePreset`）
  - `tools/dump-theme-variants.mjs`（多組合驗證）
  - `tools/snapshots/theme-variants/`（基準截圖）
- 不改任何元件；所有視覺變化來自 CSS var 覆寫
- 風險：light theme 色票未經設計師審核 → 標記為 v1，開 follow-up issue 收集 UX 回饋；compact 可能在密集表格出現元素重疊 → 以 Storybook 視覺回歸涵蓋
