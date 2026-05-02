## Why

使用者反映兩件事：
1. `colorTheme` 目前只有 `dark` / `light`，預設寫死 `dark`。合理期待是**還有第三個 `system` 選項並以 OS 偏好為預設**（macOS/Windows 晚上自動切深色，使用者不用每天手動切）。
2. SettingsDialog 的配色選項現在是**手刻的 radio pill**（`RadioGroup` wrapper），跟 CommandPalette 裡的 color-theme feature 視覺不一致。同一個選項，兩處 UI 長得不一樣，維護成本高且不一致。

本 change 解決兩件事：加 `system` 選項 + 讓 SettingsDialog 跟 CommandPalette 共用 `FeatureRow` + `ChoicePills` 的呈現。

## What Changes

### Preference enum
- `ColorTheme` 從 `'dark' | 'light'` 擴成 `'dark' | 'light' | 'system'`
- Store `DEFAULTS.colorTheme` 改成 `'system'`
- `DEFAULTS` 物件從 `as const` literal narrowing 改成顯式 type annotation（乾淨，不靠推斷）

### Effective theme resolution
- 新 hook `useEffectiveColorTheme()` 回傳 `'dark' | 'light'`：當 `colorTheme === 'system'` 時透過 `window.matchMedia('(prefers-color-scheme: dark)')` 解析，並用 `useSyncExternalStore` 訂閱 OS 偏好變化（使用者半夜切 OS 深色，App 即時跟上）
- 新 type alias `EffectiveColorTheme = 'dark' | 'light'` 放在 `@code-quest/shared`
- `App.tsx` 改用 effective 值寫 `data-theme`；CodeBlock 同步改讀 effective

### Feature factory
- `createColorThemeFeature` options 改成 3 個（Dark / Light / System）
- `createChoiceFeature` 的 `execute()` 循環 3 個值

### SettingsDialog 統一視覺
- 改用 `FeatureRow`（palette 那套）渲染 color-theme / density / font-size — 跟 CommandPalette actions tab 完全相同的呈現
- 移除 `RadioGroup` 這個 wrapper（dialog 內唯一 consumer）
- dialog 傳入跟 CommandPalette 一樣的 Feature[] 陣列，`FeatureRow` 負責 label + trailing `ChoicePills`

## Capabilities

### Modified Capabilities

- `user-preferences`: `colorTheme` enum 增加 `'system'`；新 derived value `EffectiveColorTheme` 作為 UI 層 ground truth
- `preferences-ui`: SettingsDialog 改用 FeatureRow 呈現（不再手刻 radio）

## Impact

- 新增：
  - `packages/client/src/hooks/useEffectiveColorTheme.ts` + test
  - `packages/shared/src/schemas/preferences.ts` 加 `EffectiveColorTheme` type
- 修改：
  - shared `colorThemeSchema` enum
  - `usePreferencesStore`：default `'system'`，`DEFAULTS` 改 explicit type
  - `App.tsx`：data-theme 寫入 effective 值
  - `CodeBlock.tsx`：subscribe effective 而非 preference
  - `createColorThemeFeature`：3 options
  - `SettingsDialog.tsx`：改用 FeatureRow，移除 RadioGroup
- 測試：
  - New hook unit test (mock matchMedia + store)
  - updated feature factory tests (3 options cycle)
  - updated SettingsDialog test (renders via FeatureRow)
  - CommandPalette existing tests must stay green
- 風險：
  - Storybook `withThemePreset` decorator 目前型別是 `ColorTheme`（含 system），但 stories 要 concrete preview → 改用 `EffectiveColorTheme` 避免意義不清
  - matchMedia mock 需在 test/setup.ts（已有）；確認能 dispatch change event
