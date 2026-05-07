## 1. Shared schema: 加 'system' + EffectiveColorTheme type

- [x] 1.1 更新 `packages/shared/src/schemas/__tests__/preferences.test.ts`：加測試「colorTheme 'system' 能通過 schema safeParse」
- [x] 1.2 `packages/shared/src/schemas/preferences.ts`：`colorThemeSchema` 加 'system'；export `EffectiveColorTheme` type
- [x] 1.3 Shared test 綠

## 2. Store: default 'system' + 移除 `as const`

- [x] 2.1 更新 `usePreferencesStore.test.ts`：加測試「fresh install 的 default colorTheme 是 'system'」
- [x] 2.2 `usePreferencesStore.ts`：`DEFAULTS` 改 explicit type annotation（移除 `as const`）；colorTheme 預設 'system'
- [x] 2.3 Client test 全綠

## 3. useEffectiveColorTheme hook

- [x] 3.1 寫 `hooks/__tests__/useEffectiveColorTheme.test.ts`（TDD）：
  - preference 'dark' → 'dark'
  - preference 'light' → 'light'
  - preference 'system' + prefers-color-scheme dark → 'dark'
  - preference 'system' + prefers-color-scheme light → 'light'
  - OS 改變時（dispatch matchMedia change event）hook 重渲並回傳新值
- [x] 3.2 實作 `hooks/useEffectiveColorTheme.ts`（useSyncExternalStore 訂閱 matchMedia）
- [ ] 3.3 test/setup.ts：若 matchMedia mock 不支援 dispatch event，擴充成支援

## 4. App.tsx: 寫 effective 到 data-theme

- [x] 4.1 更新 App.test.tsx：colorTheme='system' + matchMedia dark → data-theme='dark'；colorTheme='light' → data-theme='light'
- [x] 4.2 App.tsx：改用 useEffectiveColorTheme；data-theme 寫 effective 值

## 5. CodeBlock: 用 effective

- [x] 5.1 CodeBlock.test.tsx：加測試「colorTheme='system' + OS dark → vscDarkPlus」
- [x] 5.2 CodeBlock.tsx：改 useEffectiveColorTheme

## 6. createColorThemeFeature: 3 options

- [x] 6.1 更新 `features/color-theme/__tests__/color-theme-feature.test.ts`：
  - options 有 3 個 (dark, light, system)
  - execute 循環 dark → light → system → dark
- [x] 6.2 `features/color-theme/color-theme-feature.ts`：加 system option

## 7. SettingsDialog: 改用 FeatureRow

- [x] 7.1 更新 `components/__tests__/SettingsDialog.test.tsx`：
  - 移除舊的「radio group 有 Light/Dark/System」斷言
  - 新增「有 3 個 data-testid="feature-row-*"」
  - 新增「click color-theme 'System' pill → store colorTheme='system'」
  - 新增「color-theme 顯示 3 個 ChoicePills」
- [x] 7.2 改寫 `SettingsDialog.tsx`：
  - 移除 RadioGroup wrapper
  - import `createColorThemeFeature`, `createDensityFeature`, `createFontSizeFeature`, `FeatureRow`
  - 建三個 feature + 映射成 FeatureRow
  - 保留 live-save hint + Close button

## 8. Storybook variants

- [x] 8.1 `withThemePreset` decorator 型別：`theme?: EffectiveColorTheme`（排除 'system'）
- [x] 8.2 既有 stories 中用 `theme: 'dark'` / `'light'` 的仍通過（型別沒變窄以外）
- [ ] 8.3 新增 SettingsDialog Story：展示 3 options（理想的話 + ChoicePill 互動）

## 9. 驗證

- [x] 9.1 vitest + typecheck + biome clean
- [x] 9.2 lint-hardcoded-colors 0 hit
- [x] 9.3 test-storybook:ci 全綠
- [ ] 9.4 手動：dev server colorTheme='system' + OS 切換 → UI 跟著切；dev tools 修 matchMedia → UI 跟著切
- [x] 9.5 commit + archive
