## Why

`buildMenuItems` 目前有 9 個 model 狀態參數（effort、effortLevels、isThinkingOn、isFastMode 等），是因為 effort-level、toggle-thinking、fast-mode 三個 MenuItem 是 inline 硬編在函式裡。將它們抽成 feature factory 並走 `localFeatures` 路徑，可以讓 `buildMenuItems` 成為純粹的 registry + features → MenuSections 轉換。

## What Changes

- `MenuItemFeature` 介面加 `trailing?: React.ReactNode`
- 新增三個 feature factory：`createEffortFeature`、`createThinkingFeature`、`createFastModeFeature`
- `BuildMenuItemsParams` 移除 9 個 model 狀態參數：`effort`、`effortLevels`、`isThinkingOn`、`isFastMode`、`fastModeState`、`onSetEffort`、`onSetThinkingLevel`、`setFastMode`、`supportsFastMode`
- `buildMenuItems` 移除 effort-level、toggle-thinking、fast-mode inline items，改由 `localFeatures` 提供
- `CommandMenu` 將三個 feature 加入 `localFeatures` 陣列

## Capabilities

### New Capabilities
- `menu-model-features`: effort-level、toggle-thinking、fast-mode 作為獨立 feature factory，支援 `trailing` UI

### Modified Capabilities
- （無 spec-level 行為變更，純 implementation 重構）

## Impact

- `apps/web/src/lib/feature.ts` — MenuItemFeature 加 trailing
- `apps/web/src/features/` — 新增三個 feature 檔案
- `apps/web/src/components/command-menu-items.tsx` — 移除 9 個 params
- `apps/web/src/components/CommandMenu.tsx` — localFeatures 加三個 feature
